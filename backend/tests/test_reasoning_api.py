"""
VerdictAI Transparent Reasoning Layer & Hallucination Guardrails API Test Suite
Author: Darshan Prajapati (Backend Engineer - Reasoning & APIs)
Phase: Phase 3 Deliverables (Reasoning-Layer API Endpoints + API Tests)
Coverage: SRS FR-19, FR-20, SIR-07, AC-10, NFR-02, NFR-13, NFR-14
"""

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.core.db import db_manager
from backend.app.models.schemas import DisputeStatus, DisputeReason
from database.mongodb.models import EvidenceType, EvidenceSource


@pytest.fixture(autouse=True)
def setup_test_database():
    """Reset test database stores and seed baseline transactions before each test."""
    db_manager.pg_tables = {
        "users": {
            "usr_alice_01": {
                "id": "usr_alice_01",
                "name": "Alice Smith",
                "email": "alice@example.com",
                "role": "CARD_MEMBER"
            }
        },
        "merchants": {
            "mch_acme_01": {
                "id": "mch_acme_01",
                "name": "Acme Electronics",
                "category": "Retail"
            }
        },
        "transactions": {
            "txn_test_r01": {
                "transaction_id": "txn_test_r01",
                "user_id": "usr_alice_01",
                "merchant_id": "mch_acme_01",
                "amount": 1500.00,
                "currency": "INR",
                "timestamp": "2026-09-15T12:00:00Z",
                "status": "SETTLED",
                "merchant_name": "Acme Electronics",
                "cardholder_name": "Alice Smith",
                "payment_method": "CARD"
            }
        },
        "disputes": {},
        "case_files": {},
        "audit_logs": {},
        "dispute_resolutions": {},
        "dispute_reasoning": {}
    }
    db_manager.mongo_collections = {
        "evidence_payloads": {},
        "case_documents": {}
    }
    yield


@pytest.fixture
def client():
    return TestClient(app)


# ─── 1. Capabilities & Health Endpoint (GET /api/v1/reasoning/capabilities) ─────

def test_reasoning_capabilities(client):
    """
    SRS FR-19 & NFR-14:
    Verifies that the capabilities endpoint returns system metadata, engine owner,
    active guardrails, and SRS coverage list.
    """
    response = client.get("/api/v1/reasoning/capabilities")
    assert response.status_code == 200

    data = response.json()
    assert data["owner"] == "Darshan Prajapati (Backend Engineer - Reasoning & APIs)"
    assert data["version"] == "1.0.0"
    assert data["guardrails_active"] is True
    assert "PII_SCRUBBING" in data["enforced_rules"]
    assert "SETTLEMENT_COMMITMENT_CHECK" in data["enforced_rules"]
    assert "FORMULA_SECRECY_CHECK" in data["enforced_rules"]
    assert any("FR-19" in req for req in data["srs_requirements_covered"])
    assert any("AC-10" in req for req in data["srs_requirements_covered"])


# ─── 2. Direct Reasoning Generation (POST /api/v1/reasoning/generate) ───────────

def test_generate_reasoning_card_member_favour(client):
    """
    SRS FR-19, FR-20 & AC-10:
    Direct inference producing dual-sided explanations and at least 3 contributing factors
    for a Card Member win scenario.
    """
    payload = {
        "case_id": "CASE-2026-0001",
        "category_id": "CAT-01",
        "category_name": "Item Not Received",
        "recommended_resolution": "CARD_MEMBER_FAVOUR",
        "confidence_score": 88.5,
        "card_member_score": 85.0,
        "merchant_score": 20.0,
        "disputed_amount": 1500.00,
        "currency": "INR",
        "factor_breakdown": [
            {
                "evidence_type": "Cardholder Statement",
                "status": "Present",
                "quality_score": 0.90,
                "favours": "CARD_MEMBER"
            },
            {
                "evidence_type": "Carrier Delivery Proof",
                "status": "Missing",
                "quality_score": 0.0,
                "favours": "CARD_MEMBER"
            }
        ],
        "raw_statement": "Item never arrived at delivery address."
    }

    response = client.post("/api/v1/reasoning/generate", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["recommended_resolution"] == "CARD_MEMBER_FAVOUR"
    assert data["confidence_score_pct"] == 88.5

    # Plain language explanations exist for all parties
    assert "Card Member" in data["summary"] or "resolved" in data["summary"].lower()
    assert len(data["cardholder_rationale"]) > 20
    assert len(data["merchant_rationale"]) > 20

    # SRS AC-10: Guarantee at least 3 contributing factors citing case facts
    assert len(data["contributing_factors"]) >= 3
    assert data["guardrails_applied"] is True


def test_generate_reasoning_merchant_favour(client):
    """
    SRS FR-19 & FR-20:
    Direct inference producing transparent justifications for a Merchant win scenario.
    """
    payload = {
        "case_id": "CASE-2026-0002",
        "category_id": "CAT-01",
        "category_name": "Item Not Received",
        "recommended_resolution": "MERCHANT_FAVOUR",
        "confidence_score": 92.0,
        "card_member_score": 15.0,
        "merchant_score": 90.0,
        "disputed_amount": 2500.00,
        "currency": "INR",
        "factor_breakdown": [
            {
                "evidence_type": "Courier Tracking Record",
                "status": "Present",
                "quality_score": 0.95,
                "favours": "MERCHANT"
            }
        ]
    }

    response = client.post("/api/v1/reasoning/generate", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["recommended_resolution"] == "MERCHANT_FAVOUR"
    assert "Merchant" in data["summary"]
    assert len(data["contributing_factors"]) >= 3


def test_generate_reasoning_escalate(client):
    """
    SRS FR-17 & FR-19:
    Direct inference producing manual review guidance when case escalates.
    """
    payload = {
        "case_id": "CASE-2026-0003",
        "category_id": "CAT-02",
        "category_name": "Item Not as Described",
        "recommended_resolution": "ESCALATE",
        "confidence_score": 44.0,
        "card_member_score": 45.0,
        "merchant_score": 40.0,
        "disputed_amount": 999.00,
        "currency": "INR",
        "factor_breakdown": []
    }

    response = client.post("/api/v1/reasoning/generate", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["recommended_resolution"] == "ESCALATE"
    assert "Manual Review Queue" in data["summary"] or "manual review" in data["summary"].lower()
    assert len(data["contributing_factors"]) >= 3


def test_generate_reasoning_validation_error(client):
    """
    Verifies HTTP 422 for malformed payloads (confidence score out of 0-100 bounds).
    """
    response = client.post("/api/v1/reasoning/generate", json={
        "case_id": "CASE-2026-0001",
        "recommended_resolution": "CARD_MEMBER_FAVOUR",
        "confidence_score": 150.0  # Invalid > 100
    })
    assert response.status_code == 422


# ─── 3. Case-Linked Reasoning (POST & GET /api/v1/reasoning/case/{id}) ──────────

def test_generate_and_retrieve_case_reasoning(client):
    """
    Tests end-to-end generation and retrieval of transparent reasoning linked to a live dispute case.
    """
    # 1. Create a dispute case
    create_resp = client.post("/api/v1/disputes", json={
        "transaction_id": "txn_test_r01",
        "cardholder_id": "usr_alice_01",
        "dispute_reason": DisputeReason.PRODUCT_NOT_RECEIVED.value,
        "disputed_amount": 1500.00,
        "cardholder_statement": "Package was never received at my address."
    })
    assert create_resp.status_code == 201
    dispute_id = create_resp.json()["header"]["dispute_id"]

    # 2. Before generation, GET /case/{id} returns 404
    get_before = client.get(f"/api/v1/reasoning/case/{dispute_id}")
    assert get_before.status_code == 404

    # 3. Generate case reasoning
    gen_resp = client.post(f"/api/v1/reasoning/case/{dispute_id}/generate?actor=ANALYST:alex")
    assert gen_resp.status_code == 200
    gen_data = gen_resp.json()

    assert gen_data["case_id"] == dispute_id
    assert len(gen_data["summary"]) > 20
    assert len(gen_data["contributing_factors"]) >= 3

    # 4. Retrieve stored reasoning
    get_after = client.get(f"/api/v1/reasoning/case/{dispute_id}")
    assert get_after.status_code == 200
    stored_data = get_after.json()

    assert stored_data["case_id"] == dispute_id
    assert stored_data["summary"] == gen_data["summary"]
    assert stored_data["cardholder_rationale"] == gen_data["cardholder_rationale"]
    assert stored_data["merchant_rationale"] == gen_data["merchant_rationale"]


def test_case_reasoning_nonexistent_dispute(client):
    """
    Verifies 404 response when querying or generating reasoning for unknown dispute IDs.
    """
    resp_gen = client.post("/api/v1/reasoning/case/disp_nonexistent_99/generate")
    assert resp_gen.status_code == 404

    resp_get = client.get("/api/v1/reasoning/case/disp_nonexistent_99")
    assert resp_get.status_code == 404


# ─── 4. Hallucination Guardrail Audits (POST /api/v1/reasoning/audit-guardrails) ─

def test_audit_guardrails_clean_text(client):
    """
    SRS NFR-02 & NFR-14:
    Verifies that clean, policy-compliant plain-language justification passes guardrail audit.
    """
    payload = {
        "text": "The transaction was verified through official payment gateway logs and courier delivery confirmation.",
        "expected_amount": 1500.00,
        "currency": "INR"
    }

    response = client.post("/api/v1/reasoning/audit-guardrails", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["passed"] is True
    assert data["violations"] == []
    assert data["sanitized_text"] == payload["text"]
    assert "PII_SCRUBBING" in data["checked_rules"]


def test_audit_guardrails_pii_redaction(client):
    """
    SRS NFR-14:
    Verifies automatic scrubbing/redaction of credit card PANs and phone numbers.
    """
    payload = {
        "text": "Cardholder with card 4111 2222 3333 4444 called from 9876543210 to contest the charge.",
        "expected_amount": 1500.00
    }

    response = client.post("/api/v1/reasoning/audit-guardrails", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert "[REDACTED_CARD_NUMBER]" in data["sanitized_text"]
    assert "[REDACTED_PHONE]" in data["sanitized_text"]
    assert "4111 2222 3333 4444" not in data["sanitized_text"]
    assert "9876543210" not in data["sanitized_text"]


def test_audit_guardrails_detects_prohibited_commitments(client):
    """
    SRS NFR-13:
    Rejects automated reasoning containing legally binding guarantees or instant refund promises.
    """
    payload = {
        "text": "We guarantee a full refund immediately within 2 hours to your bank account."
    }

    response = client.post("/api/v1/reasoning/audit-guardrails", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["passed"] is False
    assert any("settlement promise" in v.lower() for v in data["violations"])


def test_audit_guardrails_detects_formula_leaks(client):
    """
    SRS FR-20:
    Prevents leakage of internal algorithmic scoring formulas or weight matrices.
    """
    payload = {
        "text": "Score was derived from raw_score and internal category_weights table."
    }

    response = client.post("/api/v1/reasoning/audit-guardrails", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["passed"] is False
    assert any("formula" in v.lower() for v in data["violations"])


def test_audit_guardrails_detects_adversarial_bias(client):
    """
    SRS NFR-02:
    Prevents derogatory, biased, or adversarial language in generated explanations.
    """
    payload = {
        "text": "The cardholder is a scammer and liar attempting fraud."
    }

    response = client.post("/api/v1/reasoning/audit-guardrails", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["passed"] is False
    assert any("adversarial" in v.lower() or "derogatory" in v.lower() for v in data["violations"])
