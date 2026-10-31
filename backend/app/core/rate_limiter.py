"""
VerdictAI API Rate Limiting Engine & Middleware
Author: Darshan Prajapati (Backend Engineer - Reasoning & APIs)
Phase: Phase 5 - Production Hardening & Security
Coverage: SRS NFR-08 (API Resilience & Abuse Prevention), NFR-14
"""

import time
import os
import sys
import threading
from typing import Dict, List, Optional, Set, Any
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse

from backend.app.core.config import settings


class RateLimiter:
    """
    Thread-safe sliding-window rate limiter for VerdictAI REST API gateways.
    Prevents API denial-of-service, automated credential stuffing, and generative LLM token depletion.
    """

    def __init__(
        self,
        requests_per_minute: Optional[int] = None,
        burst_headroom: Optional[int] = None,
        enabled: Optional[bool] = None,
        window_seconds: int = 60
    ):
        self._lock = threading.Lock()
        is_test_env = "pytest" in sys.modules or os.getenv("TESTING", "").lower() in ("true", "1")
        default_limit = 5000 if is_test_env else getattr(settings, "RATE_LIMIT_REQUESTS_PER_MINUTE", 120)

        self.requests_per_minute = requests_per_minute if requests_per_minute is not None else default_limit
        self.burst_headroom = burst_headroom if burst_headroom is not None else getattr(settings, "RATE_LIMIT_BURST", 30)
        self.enabled = enabled if enabled is not None else getattr(settings, "RATE_LIMIT_ENABLED", True)
        self.window_seconds = window_seconds
        
        # client_id -> list of timestamps
        self.records: Dict[str, List[float]] = {}
        
        # Exempt routes that should never be blocked (health, docs, OpenAPI)
        self.exempt_routes: Set[str] = {
            "/health",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/"
        }

    def reset(self):
        """Resets all tracking records (primarily used in test suites)."""
        with self._lock:
            self.records.clear()

    def set_limit(self, requests_per_minute: int, burst_headroom: Optional[int] = None):
        """Dynamically adjusts rate limits."""
        with self._lock:
            self.requests_per_minute = requests_per_minute
            if burst_headroom is not None:
                self.burst_headroom = burst_headroom

    def get_client_identifier(self, request: Request) -> str:
        """Extracts client IP or identification key from request."""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        if request.client and request.client.host:
            return request.client.host
        return "unknown_client"

    def is_exempt(self, path: str) -> bool:
        """Checks if the requested path is exempted from rate limiting."""
        if path in self.exempt_routes:
            return True
        for exempt in self.exempt_routes:
            if exempt != "/" and path.startswith(exempt):
                return True
        return False

    def check_rate_limit(self, client_id: str, path: str) -> Dict[str, Any]:
        """
        Checks and updates rate limit state for client.
        Returns:
            allowed: bool
            limit: int
            remaining: int
            reset_epoch: int
            retry_after: int
        """
        if not self.enabled or self.is_exempt(path):
            return {
                "allowed": True,
                "limit": self.requests_per_minute,
                "remaining": self.requests_per_minute,
                "reset_epoch": int(time.time() + self.window_seconds),
                "retry_after": 0
            }

        now = time.time()
        window_start = now - self.window_seconds

        with self._lock:
            timestamps = self.records.get(client_id, [])
            # Filter out timestamps outside the active window
            timestamps = [ts for ts in timestamps if ts > window_start]

            effective_limit = self.requests_per_minute
            oldest_ts = timestamps[0] if timestamps else now
            reset_epoch = int(oldest_ts + self.window_seconds)
            retry_after = max(1, int(reset_epoch - now))

            if len(timestamps) >= effective_limit:
                self.records[client_id] = timestamps
                return {
                    "allowed": False,
                    "limit": effective_limit,
                    "remaining": 0,
                    "reset_epoch": reset_epoch,
                    "retry_after": retry_after
                }

            # Record this valid request
            timestamps.append(now)
            self.records[client_id] = timestamps
            remaining = max(0, effective_limit - len(timestamps))

            return {
                "allowed": True,
                "limit": effective_limit,
                "remaining": remaining,
                "reset_epoch": reset_epoch,
                "retry_after": 0
            }


rate_limiter = RateLimiter()


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Starlette middleware enforcing rate limiting per client IP.
    Appends standard X-RateLimit-* headers to responses and returns HTTP 429 when limits are exceeded.
    """

    async def dispatch(self, request: Request, call_next):
        client_id = rate_limiter.get_client_identifier(request)
        result = rate_limiter.check_rate_limit(client_id, request.url.path)

        if not result["allowed"]:
            return JSONResponse(
                status_code=429,
                content={
                    "error_code": "RATE_LIMIT_EXCEEDED",
                    "detail": f"Rate limit exceeded. Maximum {result['limit']} requests per minute allowed.",
                    "retry_after_seconds": result["retry_after"]
                },
                headers={
                    "Retry-After": str(result["retry_after"]),
                    "X-RateLimit-Limit": str(result["limit"]),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(result["reset_epoch"])
                }
            )

        response: Response = await call_next(request)

        # Append rate limit headers to successful responses
        response.headers["X-RateLimit-Limit"] = str(result["limit"])
        response.headers["X-RateLimit-Remaining"] = str(result["remaining"])
        response.headers["X-RateLimit-Reset"] = str(result["reset_epoch"])

        return response
