"""
VerdictAI Dispute Lifecycle & Case-Creation REST API Test Suite
Author: Darshan Prajapati (Backend Engineer - Reasoning & APIs)
Phase: Phase 2 Deliverables (Case-Creation Backend API Endpoints + API Tests)
Coverage: SRS FR-06, FR-09, FR-22, FR-25, FR-26, FR-30, FR-32, UC-01, SIR-01
"""

import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.core.db import db_manager
from backend.app.models.schemas import DisputeStatus, DisputeReason, ResolutionOutcome
from backend.app.services.case_builder.service import case_service


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
            },
            "usr_bob_02": {
                "id": "usr_bob_02",
                "name": "Bob Jones",
                "email": "bob@example.com",
                "role": "CARD_MEMBER"
            }
        },
        "merchants": {
            "mch_acme_01": {
                "id": "mch_acme_01",
                "name": "Acme Electronics",
                "category": "Retail"
            },
            "mch_quickpay_02": {
                "id": "mch_quickpay_02",
                "name": "QuickPay Services",
                "category": "Services"
            }
        },
        "transactions": {
            "txn_valid_001": {
                "transaction_id": "txn_valid_001",
                "user_id": "usr_alice_01",
                "merchant_id": "mch_acme_01",
                "amount": 2499.00,
                "currency": "INR",
                "timestamp": "2026-09-01T10:00:00Z",
                "status": "SETTLED",
                "merchant_name": "Acme Electronics",
                "cardholder_name": "Alice Smith",
                "payment_method": "CARD"
            },
            "txn_valid_002": {
                "transaction_id": "txn_valid_002",
                "user_id": "usr_bob_02",
                "merchant_id": "mch_quickpay_02",
                "amount": 499.00,
                "currency": "INR",
                "timestamp": "2026-09-05T14:30:00Z",
                "status": "SETTLED",
                "merchant_name": "QuickPay Services",
                "cardholder_name": "Bob Jones",
                "payment_method": "UPI"
            },
            "txn_valid_003": {
                "transaction_id": "txn_valid_003",
                "user_id": "usr_alice_01",
                "merchant_id": "mch_acme_01",
                "amount": 1200.00,
                "currency": "INR",
                "timestamp": "2026-09-10T16:00:00Z",
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


# ─── 1. Case Creation API Tests (POST /api/v1/disputes) ──────────────────────────

def test_create_dispute_success_default_sla(client):
    """
    SRS FR-06, FR-09 & UC-01:
    Tests valid dispute creation with default 48h SLA deadline, case reference number generation,
    cryptographic audit logging, and correct header metadata.
    """
    payload = {
        "transaction_id": "txn_valid_001",
        "cardholder_id": "usr_alice_01",
        "dispute_reason": DisputeReason.PRODUCT_NOT_RECEIVED.value,
        "disputed_amount": 2499.00,
        "cardholder_statement": "Ordered headphones on 1st Sep; courier never delivered."
    }

    response = client.post("/api/v1/disputes", json=payload)
    assert response.status_code == 201

    data = response.json()
    header = data["header"]
    txn = data["transaction"]

    assert isinstance(header["dispute_id"], str) and len(header["dispute_id"]) > 0
    assert header["case_reference_number"].startswith("CAS-")
    assert header["current_status"] == DisputeStatus.SUBMITTED.value
    assert header["dispute_reason"] == DisputeReason.PRODUCT_NOT_RECEIVED.value
    assert header["disputed_amount"] == 2499.00
    assert header["currency"] == "INR"

    # Verify transaction metadata linkage
    assert txn["transaction_id"] == "txn_valid_001"
    assert txn["merchant_name"] == "Acme Electronics"
    assert txn["cardholder_name"] == "Alice Smith"

    # Verify statement
    assert data["cardholder_statement"] == payload["cardholder_statement"]

    # Verify cryptographic hash and audit trail length
    assert len(data["case_hash_sha256"]) == 64
    assert data["audit_chain_length"] >= 1


def test_create_dispute_custom_sla_hours(client):
    """
    SRS FR-09:
    Verifies that specifying custom merchant_sla_hours calculates the SLA deadline accordingly.
    """
    payload = {
        "transaction_id": "txn_valid_002",
        "cardholder_id": "usr_bob_02",
        "dispute_reason": DisputeReason.DUPLICATE_PROCESSING.value,
        "disputed_amount": 499.00,
        "cardholder_statement": "Subscription debited twice on the same day.",
        "merchant_sla_hours": 72
    }

    response = client.post("/api/v1/disputes", json=payload)
    assert response.status_code == 201
    header = response.json()["header"]

    created_at = datetime.fromisoformat(header["created_at"])
    sla_deadline = datetime.fromisoformat(header["sla_deadline"])
    diff = sla_deadline - created_at

    # Allow tiny tolerance in seconds, difference should be approx 72 hours
    assert abs(diff.total_seconds() - (72 * 3600)) < 10


def test_create_dispute_validation_errors(client):
    """
    Verifies HTTP 422 Unprocessable Entity for invalid or missing request parameters.
    """
    # 1. Missing transaction_id
    resp = client.post("/api/v1/disputes", json={
        "cardholder_id": "usr_alice_01",
        "dispute_reason": DisputeReason.PRODUCT_NOT_RECEIVED.value,
        "disputed_amount": 100.00
    })
    assert resp.status_code == 422

    # 2. Negative disputed amount
    resp = client.post("/api/v1/disputes", json={
        "transaction_id": "txn_valid_001",
        "cardholder_id": "usr_alice_01",
        "dispute_reason": DisputeReason.PRODUCT_NOT_RECEIVED.value,
        "disputed_amount": -50.00
    })
    assert resp.status_code == 422

    # 3. Invalid SLA hours (< 1 or > 168)
    resp = client.post("/api/v1/disputes", json={
        "transaction_id": "txn_valid_001",
        "cardholder_id": "usr_alice_01",
        "dispute_reason": DisputeReason.PRODUCT_NOT_RECEIVED.value,
        "disputed_amount": 100.00,
        "merchant_sla_hours": 200
    })
    assert resp.status_code == 422


def test_create_dispute_auto_creates_transaction_if_not_present(client):
    """
    SRS FR-06:
    When a dispute is filed for an external transaction ID, the service safely initializes
    transaction metadata in the store.
    """
    payload = {
        "transaction_id": "txn_new_external_999",
        "cardholder_id": "usr_alice_01",
        "dispute_reason": DisputeReason.FRAUD_UNRECOGNIZED_CHARGE.value,
        "disputed_amount": 5000.00
    }

    response = client.post("/api/v1/disputes", json=payload)
    assert response.status_code == 201
    assert response.json()["transaction"]["transaction_id"] == "txn_new_external_999"



# ─── 2. Dispute Listing & Multi-Criteria Filtering (GET /api/v1/disputes) ────────

def test_list_disputes_pagination_and_filtering(client):
    """
    SRS FR-22 & FR-25:
    Tests paginated dispute listing and filtering by status, cardholder_id, merchant_id, and search terms.
    """
    # Create 3 distinct disputes
    d1 = client.post("/api/v1/disputes", json={
        "transaction_id": "txn_valid_001",
        "cardholder_id": "usr_alice_01",
        "dispute_reason": DisputeReason.PRODUCT_NOT_RECEIVED.value,
        "disputed_amount": 2499.00
    }).json()

    d2 = client.post("/api/v1/disputes", json={
        "transaction_id": "txn_valid_002",
        "cardholder_id": "usr_bob_02",
        "dispute_reason": DisputeReason.DUPLICATE_PROCESSING.value,
        "disputed_amount": 499.00
    }).json()

    d3 = client.post("/api/v1/disputes", json={
        "transaction_id": "txn_valid_003",
        "cardholder_id": "usr_alice_01",
        "dispute_reason": DisputeReason.PRODUCT_DAMAGED_OR_DEFECTIVE.value,
        "disputed_amount": 1200.00
    }).json()

    # 1. Default list (all 3)
    resp = client.get("/api/v1/disputes")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_count"] == 3
    assert len(data["items"]) == 3

    # 2. Pagination test: page_size=2
    resp_p1 = client.get("/api/v1/disputes?page=1&page_size=2")
    assert resp_p1.status_code == 200
    p1_data = resp_p1.json()
    assert p1_data["total_count"] == 3
    assert p1_data["total_pages"] == 2
    assert len(p1_data["items"]) == 2

    # 3. Filter by cardholder_id
    resp_alice = client.get("/api/v1/disputes?cardholder_id=usr_alice_01")
    assert resp_alice.status_code == 200
    assert resp_alice.json()["total_count"] == 2

    # 4. Filter by merchant_id
    resp_quickpay = client.get("/api/v1/disputes?merchant_id=mch_quickpay_02")
    assert resp_quickpay.status_code == 200
    assert resp_quickpay.json()["total_count"] == 1

    # 5. Filter by dispute reason
    resp_reason = client.get(f"/api/v1/disputes?reason={DisputeReason.DUPLICATE_PROCESSING.value}")
    assert resp_reason.status_code == 200
    assert resp_reason.json()["total_count"] == 1

    # 6. Keyword search by case reference
    ref_num = d1["header"]["case_reference_number"]
    resp_search = client.get(f"/api/v1/disputes?search={ref_num}")
    assert resp_search.status_code == 200
    assert resp_search.json()["total_count"] == 1


# ─── 3. Dispute Retrieval by ID (GET /api/v1/disputes/{id}) ─────────────────────

def test_get_dispute_by_id_success_and_not_found(client):
    """
    SRS FR-26 & SIR-01:
    Tests retrieving a full unified case file by ID and 404 for unknown dispute ID.
    """
    created = client.post("/api/v1/disputes", json={
        "transaction_id": "txn_valid_001",
        "cardholder_id": "usr_alice_01",
        "dispute_reason": DisputeReason.PRODUCT_NOT_RECEIVED.value,
        "disputed_amount": 2499.00
    }).json()
    dispute_id = created["header"]["dispute_id"]

    # 1. Existing ID
    resp = client.get(f"/api/v1/disputes/{dispute_id}")
    assert resp.status_code == 200
    assert resp.json()["header"]["dispute_id"] == dispute_id

    # 2. Non-existent ID
    resp_404 = client.get("/api/v1/disputes/disp_unknown_404")
    assert resp_404.status_code == 404
    assert "not found" in resp_404.json()["detail"].lower()


# ─── 4. State Machine Transitions (PATCH /api/v1/disputes/{id}/status) ──────────

def test_transition_dispute_status(client):
    """
    SRS FR-30:
    Verifies valid lifecycle transitions and rejection of invalid state jumps.
    """
    created = client.post("/api/v1/disputes", json={
        "transaction_id": "txn_valid_001",
        "cardholder_id": "usr_alice_01",
        "dispute_reason": DisputeReason.PRODUCT_NOT_RECEIVED.value,
        "disputed_amount": 2499.00
    }).json()
    dispute_id = created["header"]["dispute_id"]

    # 1. Valid transition: SUBMITTED -> EVIDENCE_PENDING
    resp = client.patch(f"/api/v1/disputes/{dispute_id}/status", json={
        "target_status": DisputeStatus.EVIDENCE_PENDING.value,
        "actor": "DISPUTE_OPS_ANALYST:alex",
        "reason": "Merchant notified to submit rebuttal documentation."
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["previous_status"] == DisputeStatus.SUBMITTED.value
    assert data["current_status"] == DisputeStatus.EVIDENCE_PENDING.value

    # 2. Invalid transition: EVIDENCE_PENDING -> CLOSED directly (bypassing evaluation/resolution)
    resp_bad = client.patch(f"/api/v1/disputes/{dispute_id}/status", json={
        "target_status": DisputeStatus.CLOSED.value,
        "actor": "DISPUTE_OPS_ANALYST:alex",
        "reason": "Force closing without resolution."
    })
    assert resp_bad.status_code == 400
    assert "cannot transition" in resp_bad.json()["detail"].lower() or "invalid" in resp_bad.json()["detail"].lower()


# ─── 5. Cryptographic Audit Trail (GET /api/v1/disputes/{id}/audit-trail) ───────

def test_get_dispute_audit_trail(client):
    """
    SRS FR-21 & FR-32:
    Verifies retrieval of hash-chained audit events and integrity verification.
    """
    created = client.post("/api/v1/disputes", json={
        "transaction_id": "txn_valid_001",
        "cardholder_id": "usr_alice_01",
        "dispute_reason": DisputeReason.PRODUCT_NOT_RECEIVED.value,
        "disputed_amount": 2499.00
    }).json()
    dispute_id = created["header"]["dispute_id"]

    resp = client.get(f"/api/v1/disputes/{dispute_id}/audit-trail")
    assert resp.status_code == 200
    trail_data = resp.json()

    assert trail_data["dispute_id"] == dispute_id
    assert trail_data["is_chain_intact"] is True
    assert trail_data["total_events"] >= 1
    assert trail_data["audit_logs"][0]["action_type"] in ["DISPUTE_SUBMITTED", "CREATE_DISPUTE_CASE"]


# ─── 6. Scoring & Resolution Endpoints ──────────────────────────────────────────

def test_score_and_resolution_endpoints(client):
    """
    SRS SIR-07 & FR-18:
    Tests synchronous dispute scoring endpoint and subsequent resolution retrieval.
    """
    created = client.post("/api/v1/disputes", json={
        "transaction_id": "txn_valid_002",
        "cardholder_id": "usr_bob_02",
        "dispute_reason": DisputeReason.DUPLICATE_PROCESSING.value,
        "disputed_amount": 499.00
    }).json()
    dispute_id = created["header"]["dispute_id"]

    # Resolution before scoring -> 404
    resp_unscored = client.get(f"/api/v1/disputes/{dispute_id}/resolution")
    assert resp_unscored.status_code == 404

    # Trigger scoring
    resp_score = client.post(f"/api/v1/disputes/{dispute_id}/score")
    assert resp_score.status_code == 200
    scored_case = resp_score.json()
    assert scored_case["resolution"] is not None

    # Fetch resolution after scoring -> 200
    resp_res = client.get(f"/api/v1/disputes/{dispute_id}/resolution")
    assert resp_res.status_code == 200
    res_data = resp_res.json()
    assert res_data["dispute_id"] == dispute_id
    assert "outcome" in res_data
    assert "justification_summary" in res_data
