"""
Deployment configuration validation.

Catches drift between docker-compose.yml / render.yaml / Dockerfiles and what
the application actually needs, so a broken deploy fails in CI instead of on a
staging VM minutes before a demo.

Author: Hardik Kansara (202512036) - Cloud/DevOps & QA Engineer
"""

import os
import re

import pytest

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


def _read(rel):
    path = os.path.join(ROOT, rel)
    assert os.path.exists(path), f"missing deploy file: {rel}"
    with open(path, encoding="utf-8") as f:
        return f.read()


# ── Compose ──

def test_compose_declares_api_and_web_services():
    c = _read("docker-compose.yml")
    assert re.search(r"^\s{2}api:", c, re.M), "no api service"
    assert re.search(r"^\s{2}web:", c, re.M), "no web service"


def test_compose_api_has_healthcheck_and_restart_policy():
    c = _read("docker-compose.yml")
    assert "healthcheck:" in c, "api healthcheck missing"
    assert "/health" in c, "healthcheck must probe /health"
    assert "restart: unless-stopped" in c


def test_compose_persists_store_on_named_volume():
    """R-05: case data must survive container restarts."""
    c = _read("docker-compose.yml")
    assert "DB_PERSIST_PATH" in c, "DB_PERSIST_PATH not set on api"
    assert re.search(r"^volumes:", c, re.M), "no top-level volumes block"
    assert "pg_data" in c, "named volume pg_data not declared"

    # The mount path must be the parent of the persisted file, or the snapshot
    # lands on the container filesystem and is lost on restart.
    persist = re.search(r"DB_PERSIST_PATH:\s*(\S+)", c).group(1)
    mounts = re.findall(r"-\s*pg_data:(\S+)", c)
    assert mounts, "pg_data is declared but never mounted"
    assert any(persist.startswith(m.rstrip("/") + "/") for m in mounts), \
        f"DB_PERSIST_PATH {persist} is not inside a mounted volume {mounts}"


def test_compose_web_waits_for_healthy_api():
    c = _read("docker-compose.yml")
    assert "condition: service_healthy" in c


# ── Render blueprint ──

def test_render_defines_api_and_web_with_docker_runtime():
    r = _read("render.yaml")
    assert r.count("runtime: docker") >= 2
    assert "verdictai-api" in r and "verdictai-web" in r


def test_render_api_persists_store_on_disk():
    """R-05 in the cloud: a Render disk, not ephemeral container storage."""
    r = _read("render.yaml")
    assert "DB_PERSIST_PATH" in r
    assert "disk:" in r, "no persistent disk attached to the API service"

    persist = re.search(r"DB_PERSIST_PATH\s*\n\s*value:\s*(\S+)", r).group(1)
    mount = re.search(r"mountPath:\s*(\S+)", r).group(1)
    assert persist.startswith(mount.rstrip("/") + "/"), \
        f"DB_PERSIST_PATH {persist} is outside the mounted disk {mount}"


def test_render_api_has_healthcheck_path():
    r = _read("render.yaml")
    assert "healthCheckPath: /health" in r


def test_render_never_hardcodes_a_secret():
    """JWT_SECRET must be generated and GEMINI_API_KEY left unsynced."""
    r = _read("render.yaml")
    assert "generateValue: true" in r, "JWT_SECRET must not be a literal"
    assert "sync: false" in r, "GEMINI_API_KEY must not be committed"
    assert "change-me" not in r


def test_render_web_points_at_deployed_api_not_localhost():
    r = _read("render.yaml")
    build_arg = re.search(r"VITE_API_BASE_URL:\s*(\S+)", r).group(1)
    assert "localhost" not in build_arg, "web build would call localhost in cloud"
    assert build_arg.startswith("https://"), "cloud API URL must use https"


# ── Dockerfiles ──

def test_api_dockerfile_runs_as_non_root():
    d = _read("backend/Dockerfile")
    assert re.search(r"^USER\s+(?!root)", d, re.M), "API container runs as root"


def test_api_dockerfile_honours_injected_port():
    """Render/Railway assign $PORT; a hardcoded port fails to bind."""
    d = _read("backend/Dockerfile")
    assert "PORT" in d and "CMD" in d


def test_web_dockerfile_builds_then_serves_static_bundle():
    d = _read("web-app/Dockerfile")
    assert "AS build" in d, "expected multi-stage build"
    assert "nginx" in d, "built bundle should be served by nginx"
    assert "ARG VITE_API_BASE_URL" in d, "API URL must be injectable at build"


# ── Env templates ──

@pytest.mark.parametrize("rel", [".env.example", "web-app/.env.example"])
def test_env_templates_exist(rel):
    assert _read(rel).strip(), f"{rel} is empty"


def test_root_env_example_documents_every_required_key():
    e = _read(".env.example")
    for key in ("ENVIRONMENT", "JWT_SECRET", "GEMINI_API_KEY", "DB_PERSIST_PATH"):
        assert key in e, f"{key} undocumented in .env.example"


def test_env_example_ships_no_real_credentials():
    e = _read(".env.example")
    assert re.search(r"^GEMINI_API_KEY=\s*$", e, re.M), "GEMINI_API_KEY must be blank"
    assert "change-me" in e, "JWT_SECRET should be an obvious placeholder"


def test_web_env_example_matches_dockerfile_build_arg():
    """The documented var and the Dockerfile ARG must not drift apart."""
    assert "VITE_API_BASE_URL" in _read("web-app/.env.example")
    assert "VITE_API_BASE_URL" in _read("web-app/Dockerfile")


# ── CI workflow ──

def test_ci_covers_every_deliverable_surface():
    ci = _read(".github/workflows/ci.yml")
    for job in ("pytest", "web-app-build", "mobile-app-typecheck",
                "benchmark", "docker-build"):
        assert job in ci, f"CI job '{job}' missing"


def test_ci_runs_on_pull_requests():
    ci = _read(".github/workflows/ci.yml")
    assert "pull_request:" in ci


def test_ci_builds_containers_from_compose():
    ci = _read(".github/workflows/ci.yml")
    assert "docker compose build" in ci
