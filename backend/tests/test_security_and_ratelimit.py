"""
VerdictAI API Security Headers & Rate Limiting Test Suite
Author: Darshan Prajapati (Backend Engineer - Reasoning & APIs)
Phase: Phase 5 - Production Hardening & Security (Deliverable as of 31/10/2026)
Coverage: SRS NFR-08 (API Resilience & Abuse Prevention), NFR-14 (OWASP Defensive Hardening)
"""

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.core.rate_limiter import rate_limiter
from backend.app.core.config import settings


@pytest.fixture(autouse=True)
def reset_limiter():
    """Reset rate limiter state before each test."""
    rate_limiter.reset()
    rate_limiter.set_limit(requests_per_minute=5000)
    yield
    rate_limiter.reset()
    rate_limiter.set_limit(requests_per_minute=5000)


@pytest.fixture
def client():
    return TestClient(app)


# ─── 1. Production Security Headers Tests (SRS NFR-14) ─────────────────────────

def test_security_headers_on_health_endpoint(client):
    """
    SRS NFR-14:
    Verifies that all OWASP production security headers are present on API responses.
    """
    response = client.get("/health")
    assert response.status_code == 200

    headers = response.headers
    assert headers.get("X-Content-Type-Options") == "nosniff"
    assert headers.get("X-Frame-Options") == "DENY"
    assert headers.get("X-XSS-Protection") == "1; mode=block"
    assert "max-age=31536000" in headers.get("Strict-Transport-Security", "")
    assert "default-src 'self'" in headers.get("Content-Security-Policy", "")
    assert headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert "geolocation=()" in headers.get("Permissions-Policy", "")


def test_security_headers_on_api_v1_endpoints(client):
    """
    SRS NFR-14:
    Verifies that security headers are applied to Version 1 API endpoints as well.
    """
    response = client.get("/api/v1/system/status")
    assert response.status_code == 200

    headers = response.headers
    assert headers.get("X-Content-Type-Options") == "nosniff"
    assert headers.get("X-Frame-Options") == "DENY"
    assert headers.get("Strict-Transport-Security") is not None
    assert headers.get("Content-Security-Policy") is not None


# ─── 2. Rate Limiting Headers & Enforcement Tests (SRS NFR-08) ──────────────────

def test_rate_limit_headers_on_normal_requests(client):
    """
    SRS NFR-08:
    Verifies that compliant requests receive standard RFC-draft X-RateLimit-* headers.
    """
    rate_limiter.set_limit(requests_per_minute=100)
    response = client.get("/api/v1/system/status")
    assert response.status_code == 200

    assert response.headers.get("X-RateLimit-Limit") == "100"
    remaining = int(response.headers.get("X-RateLimit-Remaining", "-1"))
    assert 0 <= remaining < 100
    assert response.headers.get("X-RateLimit-Reset") is not None


def test_rate_limit_exceeded_returns_http_429(client):
    """
    SRS NFR-08:
    Verifies that exceeding the per-client rate limit returns HTTP 429 Too Many Requests,
    a valid Retry-After header, and informative error payload.
    """
    # Set tight limit for testing
    rate_limiter.set_limit(requests_per_minute=3)

    # 1. First 3 requests succeed
    for i in range(3):
        res = client.get("/api/v1/system/status")
        assert res.status_code == 200, f"Request {i+1} failed"

    # 2. 4th request must be blocked with HTTP 429
    blocked = client.get("/api/v1/system/status")
    assert blocked.status_code == 429

    data = blocked.json()
    assert data["error_code"] == "RATE_LIMIT_EXCEEDED"
    assert "Rate limit exceeded" in data["detail"]
    assert "retry_after_seconds" in data
    assert int(blocked.headers.get("Retry-After", "0")) > 0
    assert blocked.headers.get("X-RateLimit-Remaining") == "0"


def test_rate_limit_exempt_routes(client):
    """
    SRS NFR-08:
    Verifies that system health-check and documentation endpoints are exempt from rate limiting
    so monitoring probes and container orchestrators never get throttled.
    """
    rate_limiter.set_limit(requests_per_minute=2)

    # Exhaust limit with /api/v1/system/status
    client.get("/api/v1/system/status")
    client.get("/api/v1/system/status")
    assert client.get("/api/v1/system/status").status_code == 429

    # /health must still succeed (exempt)
    health_resp = client.get("/health")
    assert health_resp.status_code == 200


def test_rate_limit_reset_allows_subsequent_requests(client):
    """
    SRS NFR-08:
    Verifies that resetting rate limiter state immediately clears throttled clients.
    """
    rate_limiter.set_limit(requests_per_minute=2)

    # Exhaust limit
    client.get("/api/v1/system/status")
    client.get("/api/v1/system/status")
    assert client.get("/api/v1/system/status").status_code == 429

    # Reset
    rate_limiter.reset()

    # Now request must succeed
    res = client.get("/api/v1/system/status")
    assert res.status_code == 200
