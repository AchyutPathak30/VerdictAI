"""
Test Suite for Cryptographic Audit Logging Engine
Author: Nirav Kachhiya (Project Lead / Backend Engineer)
"""

import pytest
from backend.app.services.audit_engine.audit import AuditEngine


def test_audit_log_hash_chain_integrity():
    audit = AuditEngine()
    dispute_id = "disp_chain_test_001"

    e1 = audit.log_event(
        dispute_id=dispute_id,
        performed_by="USER:cardholder_1",
        action_type="SUBMIT_DISPUTE",
        new_state={"status": "SUBMITTED"}
    )
    assert e1.previous_log_hash == "GENESIS_ROOT_HASH"
    assert len(e1.cryptographic_hash) == 64

    e2 = audit.log_event(
        dispute_id=dispute_id,
        performed_by="MERCHANT:merchant_1",
        action_type="ATTACH_EVIDENCE",
        previous_state={"evidence_count": 0},
        new_state={"evidence_count": 1}
    )
    assert e2.previous_log_hash == e1.cryptographic_hash

    e3 = audit.log_event(
        dispute_id=dispute_id,
        performed_by="SYSTEM:fair_weighing_engine",
        action_type="AUTO_RESOLVE",
        previous_state={"status": "EVIDENCE_INGESTED"},
        new_state={"status": "AUTO_RESOLVED"}
    )
    assert e3.previous_log_hash == e2.cryptographic_hash

    assert audit.verify_integrity(dispute_id) is True


def test_audit_tamper_detection():
    audit = AuditEngine()
    dispute_id = "disp_tamper_test_002"

    audit.log_event(
        dispute_id=dispute_id,
        performed_by="USER:alice",
        action_type="SUBMIT",
        new_state={"amount": 100}
    )
    audit.log_event(
        dispute_id=dispute_id,
        performed_by="SYSTEM:scoring",
        action_type="SCORE",
        new_state={"score": 0.95}
    )

    trail = audit.get_audit_trail(dispute_id)
    trail[0].new_state["amount"] = 99999

    assert audit.verify_integrity(dispute_id) is False
