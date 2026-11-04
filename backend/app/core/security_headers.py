"""
VerdictAI Production Security Headers Middleware
Author: Darshan Prajapati (Backend Engineer - Reasoning & APIs)
Phase: Phase 5 - Production Hardening & Security
Coverage: SRS NFR-08, NFR-14 (OWASP Secure Headers & Defensive Hardening)
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from backend.app.core.config import settings


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Enforces strict production security headers per OWASP guidelines and SRS NFR-14.
    Protects against MIME sniffing, clickjacking, XSS, and unauthorized framing.
    """

    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)

        # Apply security headers if enabled
        if getattr(settings, "SECURITY_HEADERS_ENABLED", True):
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["X-Frame-Options"] = "DENY"
            response.headers["X-XSS-Protection"] = "1; mode=block"
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; "
                "img-src 'self' data: https:; "
                "style-src 'self' 'unsafe-inline'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                "font-src 'self' data:; "
                "connect-src 'self' https: http: ws: wss:;"
            )
            response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
            response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"

        return response
