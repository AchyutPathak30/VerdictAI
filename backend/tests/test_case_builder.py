"""
Test Suite for Structured Case-File Service & Evidence Aggregation
Author: Nirav Kachhiya (Project Lead / Backend Engineer)
"""

import pytest
from datetime import datetime
from backend.app.services.case_builder.service import case_service
from backend.app.models.schemas import DisputeReason, DisputeStatus
from backend.app.services.case_builder.builder import CaseFileBuilder
from database.mongodb.models import EvidenceType, EvidenceSource
from backend.app.core.db import db_manager


@pytest.fixture(autouse=True)
def reset_db():
    db_manager.reset_in_memory_stores()


def test_create_dispute_case():
    case_file = case_service.create_dispute_case(
        transaction_id="txn_test_001",
        cardholder_id="usr_alice_123",
        dispute_reason=DisputeReason.PRODUCT_NOT_RECEIVED,
        disputed_amount=249.50,
        cardholder_statement="Product was never delivered to my doorstep."
    )

    assert case_file is not None
    assert case_file.header.disputed_amount == 249.50
    assert case_file.header.current_status == DisputeStatus.SUBMITTED
    assert case_file.transaction.transaction_id == "txn_test_001"
    assert case_file.evidence_items == []
    assert len(case_file.case_hash_sha256) == 64


def test_attach_evidence_and_aggregate():
    case_file = case_service.create_dispute_case(
        transaction_id="txn_test_002",
        cardholder_id="usr_bob_456",
        dispute_reason=DisputeReason.FRAUD_UNRECOGNIZED_CHARGE,
        disputed_amount=120.00,
        cardholder_statement="Unrecognized charge on my statement."
    )
    dispute_id = case_file.header.dispute_id

    courier_payload = {
        "carrier": "FedEx",
        "tracking_number": "789123456780",
        "status": "DELIVERED",
        "signed_by": "B. JOHNSON"
    }
    evidence = case_service.attach_evidence(
        dispute_id=dispute_id,
        evidence_type=EvidenceType.COURIER_TRACKING,
        source=EvidenceSource.MERCHANT,
        raw_payload=courier_payload,
        actor="MERCHANT:m001",
        file_name="fedex_proof.json"
    )

    assert evidence is not None
    assert evidence.sha256_checksum is not None

    updated_file = case_service.get_unified_case_file(dispute_id)
    assert updated_file is not None
    assert updated_file.header.current_status == DisputeStatus.EVIDENCE_INGESTED
    assert len(updated_file.evidence_items) == 1
    assert updated_file.evidence_items[0].evidence_type == EvidenceType.COURIER_TRACKING


def test_seal_case_file():
    case_file = case_service.create_dispute_case(
        transaction_id="txn_test_003",
        cardholder_id="usr_carol_789",
        dispute_reason=DisputeReason.DUPLICATE_PROCESSING,
        disputed_amount=85.00
    )

    sealed = CaseFileBuilder.seal_case_file(case_file, actor="ADMIN:nirav")
    assert sealed.header.is_sealed is True
    assert sealed.header.sealed_at is not None
