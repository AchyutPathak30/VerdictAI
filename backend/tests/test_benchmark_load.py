"""
VerdictAI Load & Latency Benchmark Suite
Author: Hardik Kansara (202512036) - Cloud/DevOps & QA Engineer

Validates NFR-02 (sub-50ms scoring latency) and simulates concurrent dispute
processing to benchmark system throughput under load.
"""

import json
import os
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.core.db import db_manager
from backend.app.services.audit_engine.audit import audit_engine

FIXTURE = os.path.join(os.path.dirname(__file__), "fixtures", "synthetic_disputes.json")
with open(FIXTURE) as f:
    ALL_SCENARIOS = json.load(f)["cases"]

SAMPLE = ALL_SCENARIOS[:50]


@pytest.fixture(autouse=True)
def clean_stores():
    db_manager.reset_in_memory_stores()
    audit_engine._chain_store.clear()
    yield
    db_manager.reset_in_memory_stores()
    audit_engine._chain_store.clear()


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


def _run_dispute(client, scenario):
    """Submit, attach evidence, score. Returns scoring latency in ms."""
    resp = client.post("/api/v1/disputes", json={
        k: scenario[k] for k in ("transaction_id", "cardholder_id", "dispute_reason",
                                  "disputed_amount", "cardholder_statement")
    })
    assert resp.status_code == 201
    dispute_id = resp.json()["header"]["dispute_id"]

    for ev in scenario["evidence"]:
        r = client.post("/api/v1/evidence/payload", json={"dispute_id": dispute_id, **ev})
        assert r.status_code == 201

    start = time.perf_counter()
    r = client.post(f"/api/v1/disputes/{dispute_id}/score")
    latency_ms = (time.perf_counter() - start) * 1000
    assert r.status_code == 200
    return latency_ms


def test_scoring_latency_under_50ms(client):
    """NFR-02: each individual scoring call must complete in under 50ms."""
    latencies = []
    for s in SAMPLE:
        db_manager.reset_in_memory_stores()
        audit_engine._chain_store.clear()
        ms = _run_dispute(client, s)
        latencies.append(ms)

    avg = sum(latencies) / len(latencies)
    p95 = sorted(latencies)[int(len(latencies) * 0.95)]
    max_lat = max(latencies)

    assert max_lat < 50.0, f"max scoring latency {max_lat:.1f}ms exceeds 50ms"
    assert p95 < 40.0, f"p95 scoring latency {p95:.1f}ms exceeds 40ms"
    print(f"\nScoring latency — avg: {avg:.1f}ms, p95: {p95:.1f}ms, max: {max_lat:.1f}ms")


def test_concurrent_dispute_throughput(client):
    """Simulate 500+ concurrent dispute evaluations and verify no failures."""
    completed = 0
    errors = []
    latencies = []

    # We cycle SAMPLE to reach 500+ submissions
    scenarios_500 = (SAMPLE * 11)[:500]

    def process_one(idx, scenario):
        c = TestClient(app)
        try:
            ms = _run_dispute(c, scenario)
            return ("ok", ms)
        except Exception as e:
            return ("err", str(e))

    with ThreadPoolExecutor(max_workers=20) as pool:
        futures = {
            pool.submit(process_one, i, s): i
            for i, s in enumerate(scenarios_500)
        }
        for f in as_completed(futures):
            status, val = f.result()
            if status == "ok":
                completed += 1
                latencies.append(val)
            else:
                errors.append(val)

    success_rate = completed / len(scenarios_500) * 100
    avg_lat = sum(latencies) / len(latencies) if latencies else 0

    assert success_rate == 100.0, f"success rate {success_rate:.1f}% — errors: {errors[:5]}"
    assert completed >= 500
    print(f"\nLoad test — {completed} disputes, 100% success, avg latency: {avg_lat:.1f}ms")


def test_full_pipeline_latency_with_reasoning(client):
    """End-to-end latency: file → score → explain must complete under 200ms per dispute."""
    latencies = []
    for s in SAMPLE[:20]:
        db_manager.reset_in_memory_stores()
        audit_engine._chain_store.clear()

        start = time.perf_counter()

        resp = client.post("/api/v1/disputes", json={
            k: s[k] for k in ("transaction_id", "cardholder_id", "dispute_reason",
                              "disputed_amount", "cardholder_statement")
        })
        dispute_id = resp.json()["header"]["dispute_id"]

        for ev in s["evidence"]:
            client.post("/api/v1/evidence/payload", json={"dispute_id": dispute_id, **ev})

        client.post(f"/api/v1/disputes/{dispute_id}/score")
        client.post(f"/api/v1/reasoning/case/{dispute_id}/generate")

        total_ms = (time.perf_counter() - start) * 1000
        latencies.append(total_ms)

    avg = sum(latencies) / len(latencies)
    p95 = sorted(latencies)[int(len(latencies) * 0.95)]

    assert p95 < 200.0, f"p95 full-pipeline latency {p95:.1f}ms exceeds 200ms"
    print(f"\nFull pipeline — avg: {avg:.1f}ms, p95: {p95:.1f}ms")
