"""
VerdictAI Milestone 3 End-to-End System Integration Suite
Author: Hardik Kansara (202512036) - Cloud/DevOps & QA Engineer

Drives every synthetic scenario in fixtures/synthetic_disputes.json through the
public REST API only: file dispute -> attach evidence (parsers) -> synchronous
Fair-Weighing scoring -> lifecycle routing -> transparent reasoning (explain) ->
resolution + Merkle audit trail.
Coverage: SIR-07, FR-15 to FR-21, AC-08 to AC-11, NFR-02, NFR-08, NFR-13.
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


def test_dataset_has_100_plus_scenarios():
    assert len(SCENARIOS) >= 100
    assert len({s["dispute_reason"] for s in SCENARIOS}) == 6


SCENARIO_IDS = [s["scenario_id"] for s in SCENARIOS]


@pytest.mark.parametrize("scenario", SCENARIOS, ids=SCENARIO_IDS)
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


@pytest.mark.parametrize("scenario", SCENARIOS, ids=SCENARIO_IDS)
def test_explain_step_reasoning_layer(client, scenario):
    """Phase 5 "Explain" step: reasoning must agree with the scorer and pass every guardrail."""
    case, _ = run_scenario(client, scenario)
    dispute_id = case["header"]["dispute_id"]
    scored = case["resolution"]["reasoning_payload"]

    resp = client.post(f"/api/v1/reasoning/case/{dispute_id}/generate")
    assert resp.status_code == 200, resp.text
    reasoning = resp.json()

    # Explanation must describe the verdict the model actually produced
    assert reasoning["recommended_resolution"] == scored["recommended_resolution"]
    assert reasoning["confidence_score_pct"] == scored["confidence_score_pct"]

    # FR-19/20 / NFR-02: neutral summary plus a rationale for each party
    for field in ("summary", "cardholder_rationale", "merchant_rationale"):
        assert len(reasoning[field]) > 20

    # AC-10: at least three cited factors
    assert len(reasoning["contributing_factors"]) >= 3

    # NFR-13: guardrails ran and nothing slipped through; re-auditing the text independently agrees
    assert reasoning["guardrails_applied"] is True
    assert reasoning["guardrail_violations"] == []
    for field in ("summary", "cardholder_rationale", "merchant_rationale"):
        audit = client.post("/api/v1/reasoning/audit-guardrails", json={
            "text": reasoning[field],
            "expected_amount": scenario["disputed_amount"],
            "currency": "USD",
            "contributing_factors": reasoning["contributing_factors"],
        }).json()
        assert audit["passed"] is True, f"{field}: {audit['violations']}"

    # Stored copy is what clients will fetch later
    stored = client.get(f"/api/v1/reasoning/case/{dispute_id}")
    assert stored.status_code == 200
    assert stored.json()["summary"] == reasoning["summary"]

    # Explain step is on the tamper-evident chain, after scoring
    trail = client.get(f"/api/v1/disputes/{dispute_id}/audit-trail").json()
    assert trail["is_chain_intact"] is True
    actions = [e["action_type"] for e in trail["audit_logs"]]
    assert actions.count("GENERATE_TRANSPARENT_REASONING") == 1
    assert actions.index("GENERATE_TRANSPARENT_REASONING") > actions.index("AI_SCORING_EVALUATED")


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
