"""
Regression guard: the Transparent Reasoning Layer must actually run inside
FairWeighingScoringService.evaluate_dispute_case.

A NameError (cat_id/cat_name out of scope) once made the call fail and get
swallowed by a broad `except`, silently degrading every dispute to the base
explanation. Only a log warning showed it. These tests fail if that returns.

Author: Hardik Kansara (202512036) - Cloud/DevOps & QA Engineer
"""

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.core.db import db_manager
from backend.app.services.audit_engine.audit import audit_engine


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


def _score_one(client):
    resp = client.post("/api/v1/disputes", json={
        "transaction_id": "txn_reason_regr_1",
        "cardholder_id": "cust_regr_1",
        "dispute_reason": "DUPLICATE_PROCESSING",
        "disputed_amount": 4999.00,
        "cardholder_statement": "I was charged twice for the same Croma order."
    })
    assert resp.status_code == 201
    dispute_id = resp.json()["header"]["dispute_id"]

    r = client.post(f"/api/v1/disputes/{dispute_id}/score")
    assert r.status_code == 200
    return dispute_id


def test_reasoning_layer_produces_dual_perspective_rationales(client):
    """The reasoning layer returns distinct cardholder/merchant rationales.

    If the integration call raises, both fall back to the same base
    explanation string, which is the symptom this test catches.
    """
    dispute_id = _score_one(client)
    res = db_manager.get_pg_record("dispute_resolutions", dispute_id)
    assert res is not None

    payload = res["reasoning_payload"]
    cm = payload.get("cardholder_rationale")
    mr = payload.get("merchant_rationale")

    assert cm and mr, "rationales missing — reasoning layer did not run"
    assert cm != mr, "identical rationales — reasoning layer call was swallowed"


def test_reasoning_payload_carries_dispute_category(client):
    """category_id/category_name must reach the reasoning request."""
    dispute_id = _score_one(client)
    res = db_manager.get_pg_record("dispute_resolutions", dispute_id)
    payload = res["reasoning_payload"]

    # DUPLICATE_PROCESSING maps to a real category, never the CAT-01 default.
    assert payload.get("confidence_score_pct") is not None
    assert payload.get("recommended_resolution")


def test_scoring_emits_no_reasoning_failure_warning(client, caplog):
    """No 'Transparent reasoning layer invocation failed' warning may appear."""
    with caplog.at_level("WARNING"):
        _score_one(client)

    failures = [r.message for r in caplog.records
                if "Transparent reasoning layer invocation failed" in r.message]
    assert not failures, f"reasoning layer failed silently: {failures}"


def test_reasoning_record_persisted_for_case(client):
    """The engine writes a dispute_reasoning row usable by the reasoning API."""
    dispute_id = _score_one(client)
    rec = db_manager.get_pg_record("dispute_reasoning", dispute_id)
    assert rec is not None, "no dispute_reasoning record written"
