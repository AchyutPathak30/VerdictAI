"""
VerdictAI System Metrics & SLA Compliance Tests
Author: Hardik Kansara (202512036) - Cloud/DevOps & QA Engineer

Validates the /system/metrics operational dashboard endpoint and SLA breach
detection logic.
"""

import json
import os
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.core.db import db_manager
from backend.app.services.audit_engine.audit import audit_engine
from backend.app.services.state_machine.state_machine import DisputeStateMachine

FIXTURE = os.path.join(os.path.dirname(__file__), "fixtures", "synthetic_disputes.json")
with open(FIXTURE) as f:
    SCENARIOS = json.load(f)["cases"]


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


def _file_and_score(client, scenario):
    resp = client.post("/api/v1/disputes", json={
        k: scenario[k] for k in ("transaction_id", "cardholder_id", "dispute_reason",
                                  "disputed_amount", "cardholder_statement")
    })
    assert resp.status_code == 201
    dispute_id = resp.json()["header"]["dispute_id"]
    for ev in scenario["evidence"]:
        client.post("/api/v1/evidence/payload", json={"dispute_id": dispute_id, **ev})
    client.post(f"/api/v1/disputes/{dispute_id}/score")
    return dispute_id


# ── /system/metrics endpoint ──


def test_metrics_empty_state(client):
    resp = client.get("/api/v1/system/metrics")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_disputes"] == 0
    assert data["sla_compliance_pct"] == 100.0
    assert data["total_evidence_items"] == 0


def test_metrics_after_disputes(client):
    for s in SCENARIOS[:5]:
        _file_and_score(client, s)

    resp = client.get("/api/v1/system/metrics")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_disputes"] == 5
    assert data["total_resolutions"] >= 1
    assert sum(data["disputes_by_status"].values()) == 5
    assert "outcomes" in data
    assert data["sla_compliance_pct"] <= 100.0


def test_metrics_counts_overrides(client):
    _file_and_score(client, SCENARIOS[0])
    dispute_id = list(db_manager.pg_tables["disputes"].keys())[0]

    db_manager.pg_tables["disputes"][dispute_id]["current_status"] = "MANUAL_REVIEW_QUEUE"
    client.post(f"/api/v1/admin/disputes/{dispute_id}/override", json={
        "override_decision": "FAVOR_CARDHOLDER",
        "mandatory_reason": "Evidence clearly supports the cardholder claim.",
        "admin_id": "adm_test_01",
        "admin_name": "Test Admin"
    })

    data = client.get("/api/v1/system/metrics").json()
    assert data["admin_overrides"] >= 1


# ── SLA breach detection ──


def test_sla_not_breached_fresh_dispute(client):
    now = datetime.now(timezone.utc)
    deadline = DisputeStateMachine.calculate_sla_deadline(now, sla_hours=48)
    assert not DisputeStateMachine.is_sla_breached(deadline, now)
    assert not DisputeStateMachine.is_sla_breached(deadline, now + timedelta(hours=47))


def test_sla_breached_after_deadline():
    now = datetime.now(timezone.utc)
    deadline = DisputeStateMachine.calculate_sla_deadline(now, sla_hours=48)
    assert DisputeStateMachine.is_sla_breached(deadline, now + timedelta(hours=49))


def test_metrics_reports_sla_breaches(client):
    client.post("/api/v1/disputes", json={
        "transaction_id": "txn_sla_breach",
        "cardholder_id": "usr_sla_test",
        "dispute_reason": "PRODUCT_NOT_RECEIVED",
        "disputed_amount": 100.0,
        "cardholder_statement": "SLA test"
    })

    dispute_id = list(db_manager.pg_tables["disputes"].keys())[0]
    rec = db_manager.pg_tables["disputes"][dispute_id]
    # Force the SLA deadline into the past
    past = (datetime.now(timezone.utc) - timedelta(hours=72)).isoformat()
    rec["sla_deadline"] = past

    data = client.get("/api/v1/system/metrics").json()
    assert data["sla_breached_active"] >= 1
    assert data["sla_compliance_pct"] < 100.0
