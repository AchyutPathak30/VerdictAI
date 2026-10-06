"""
VerdictAI Milestone 3 End-to-End System Integration Suite
Author: Hardik Kansara (202512036) - Cloud/DevOps & QA Engineer

Drives every synthetic scenario in fixtures/synthetic_disputes.json through the
public REST API only: file dispute -> attach evidence (parsers) -> synchronous
Fair-Weighing scoring -> lifecycle routing -> resolution + Merkle audit trail.
Coverage: SIR-07, FR-15 to FR-21, AC-08 to AC-11, NFR-08.
"""

import json
import os
import time
from collections import defaultdict

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.core.db import db_manager
from backend.app.services.audit_engine.audit import audit_engine

FIXTURE = os.path.join(os.path.dirname(__file__), "fixtures", "synthetic_disputes.json")
with open(FIXTURE) as f:
    SCENARIOS = json.load(f)["cases"]

# Model defect previously found by this suite has been resolved:
# Missing-primary penalty calibrated to -20 points; statement-only CAT-02 and CAT-05 cases
# now correctly drop below 50% confidence and escalate to MANUAL_REVIEW_QUEUE (FR-17, AC-09).
KNOWN_MODEL_GAPS = set()

OUTCOME_FOR = {
    "CARD_MEMBER_FAVOUR": "FAVOR_CARDHOLDER",
    "MERCHANT_FAVOUR": "FAVOR_MERCHANT",
    "ESCALATE": "SPLIT_LIABILITY",
}


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


def run_scenario(client, s):
    """Runs one scenario through the API; returns (scored case file, scoring seconds)."""
    resp = client.post("/api/v1/disputes", json={
        k: s[k] for k in ("transaction_id", "cardholder_id", "dispute_reason",
                          "disputed_amount", "cardholder_statement")
    })
    assert resp.status_code == 201, resp.text
    dispute_id = resp.json()["header"]["dispute_id"]
    assert resp.json()["header"]["current_status"] == "SUBMITTED"

    for ev in s["evidence"]:
        resp = client.post("/api/v1/evidence/payload", json={"dispute_id": dispute_id, **ev})
        assert resp.status_code == 201, resp.text
        assert resp.json()["sha256_checksum"]

    start = time.perf_counter()
    resp = client.post(f"/api/v1/disputes/{dispute_id}/score")
    elapsed = time.perf_counter() - start
    assert resp.status_code == 200, resp.text
    return resp.json(), elapsed


def _param(s):
    marks = []
    if (s["dispute_reason"], s["profile"]) in KNOWN_MODEL_GAPS:
        marks.append(pytest.mark.xfail(strict=True, reason="Model auto-resolves statement-only case (FR-17)"))
    return pytest.param(s, id=s["scenario_id"], marks=marks)


def test_dataset_has_100_plus_scenarios():
    assert len(SCENARIOS) >= 100
    assert len({s["dispute_reason"] for s in SCENARIOS}) == 6


@pytest.mark.parametrize("scenario", [_param(s) for s in SCENARIOS])
def test_end_to_end_pipeline(client, scenario):
    case, elapsed = run_scenario(client, scenario)
    dispute_id = case["header"]["dispute_id"]
    res = case["resolution"]
    rp = res["reasoning_payload"]

    # SIR-07: synchronous scoring inside the 30s SLA
    assert elapsed < 30.0

    # FR-15/16: expected recommendation and consistent outcome mapping
    assert rp["recommended_resolution"] == scenario["expected_resolution"]
    assert res["outcome"] == OUTCOME_FOR[rp["recommended_resolution"]]
    assert 0.0 <= rp["confidence_score_pct"] <= 100.0

    # FR-17 / AC-09: routing follows the 50% confidence threshold
    auto = rp["confidence_score_pct"] >= 50.0 and rp["recommended_resolution"] != "ESCALATE"
    expected_status = "AUTO_RESOLVED" if auto else "MANUAL_REVIEW_QUEUE"
    assert case["header"]["current_status"] == expected_status

    # FR-19/20 / AC-10: plain-language explanation citing >= 3 factors
    assert len(res["justification_summary"]) > 20
    assert len(rp["contributing_factors"]) >= 3

    # FR-18/21 / AC-11 / NFR-08: intact Merkle chain with every pipeline step recorded
    trail = client.get(f"/api/v1/disputes/{dispute_id}/audit-trail").json()
    assert trail["is_chain_intact"] is True
    actions = [e["action_type"] for e in trail["audit_logs"]]
    assert actions[0] == "DISPUTE_SUBMITTED"
    assert actions.count("EVIDENCE_ATTACHED") == len(scenario["evidence"])
    assert actions.count("AI_SCORING_EVALUATED") == 1
    scoring = next(e for e in trail["audit_logs"] if e["action_type"] == "AI_SCORING_EVALUATED")
    assert scoring["state_delta"]["model_version"] == "fair_weighing_v1.0"

    assert client.get(f"/api/v1/disputes/{dispute_id}/resolution").status_code == 200

    if expected_status == "MANUAL_REVIEW_QUEUE":
        queue = client.get("/api/v1/admin/queue").json()["items"]
        assert any(item["header"]["dispute_id"] == dispute_id for item in queue)


GROUPS = defaultdict(list)
for _s in SCENARIOS:
    GROUPS[(_s["dispute_reason"], _s["profile"])].append(_s)


@pytest.mark.parametrize("group", sorted(GROUPS), ids=lambda g: f"{g[0]}-{g[1]}")
def test_outcome_is_amount_invariant(client, group):
    """Fairness: identical evidence must yield the same recommendation at any transaction size."""
    outcomes = set()
    for s in GROUPS[group]:
        case, _ = run_scenario(client, s)
        outcomes.add(case["resolution"]["reasoning_payload"]["recommended_resolution"])
    assert len(outcomes) == 1, f"{group}: outcome varies with amount -> {outcomes}"
