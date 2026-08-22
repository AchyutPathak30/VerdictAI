"""
VerdictAI Structured Case-File Generation Service
Author: Nirav Kachhiya (Project Lead / Backend Engineer)
"""

import hashlib
import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from backend.app.models.schemas import (
    UnifiedCaseFile,
    CaseFileHeader,
    TransactionSummary,
    DisputeStatus,
    DisputeReason
)
from database.mongodb.models import EvidencePayloadModel, MongoCaseDocument
from backend.app.core.db import db_manager
from backend.app.services.audit_engine.audit import audit_engine


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class CaseFileBuilder:
    """
    Assembles unified, immutable case files across PostgreSQL metadata
    and MongoDB polymorphic evidence documents.
    """

    @classmethod
    def compile_case_file(
        cls,
        dispute_id: str,
        dispute_data: Dict[str, Any],
        transaction_data: Dict[str, Any],
        evidence_items: List[EvidencePayloadModel],
        resolution_data: Optional[Dict[str, Any]] = None
    ) -> UnifiedCaseFile:
        ref_num = f"CAS-{dispute_id[:8].upper()}"
        sla_deadline = dispute_data.get("sla_deadline")
        if isinstance(sla_deadline, str):
            sla_deadline = datetime.fromisoformat(sla_deadline)
        elif not sla_deadline:
            sla_deadline = utc_now()

        header = CaseFileHeader(
            case_file_id=f"CF-{dispute_id[:8]}",
            dispute_id=dispute_id,
            case_reference_number=ref_num,
            current_status=DisputeStatus(dispute_data.get("current_status", "SUBMITTED")),
            dispute_reason=DisputeReason(dispute_data.get("dispute_reason", "PRODUCT_NOT_RECEIVED")),
            disputed_amount=float(dispute_data.get("disputed_amount", transaction_data.get("amount", 0.0))),
            currency=transaction_data.get("currency", "USD"),
            created_at=dispute_data.get("created_at") or utc_now(),
            sla_deadline=sla_deadline,
            is_sealed=dispute_data.get("is_sealed", False)
        )

        txn_timestamp = transaction_data.get("transaction_timestamp")
        if isinstance(txn_timestamp, str):
            txn_timestamp = datetime.fromisoformat(txn_timestamp)
        elif not txn_timestamp:
            txn_timestamp = utc_now()

        transaction = TransactionSummary(
            transaction_id=str(transaction_data.get("id", "")),
            amount=float(transaction_data.get("amount", 0.0)),
            currency=transaction_data.get("currency", "USD"),
            merchant_id=str(transaction_data.get("merchant_id", "")),
            merchant_name=transaction_data.get("merchant_name", "Merchant"),
            cardholder_id=str(transaction_data.get("user_id", "")),
            cardholder_name=transaction_data.get("cardholder_name", "Cardholder"),
            payment_method=transaction_data.get("payment_method", "CARD"),
            transaction_timestamp=txn_timestamp
        )

        # Compute case root content hash
        evidence_hashes = sorted([e.sha256_checksum for e in evidence_items])
        combined_payload = {
            "dispute_id": dispute_id,
            "transaction_id": transaction.transaction_id,
            "evidence_hashes": evidence_hashes,
            "disputed_amount": header.disputed_amount,
            "status": header.current_status.value
        }
        serialized = json.dumps(combined_payload, sort_keys=True, default=str).encode("utf-8")
        case_hash = hashlib.sha256(serialized).hexdigest()

        audit_history = audit_engine.get_audit_trail(dispute_id)

        return UnifiedCaseFile(
            header=header,
            transaction=transaction,
            cardholder_statement=dispute_data.get("cardholder_statement"),
            merchant_response_statement=dispute_data.get("merchant_response_statement"),
            evidence_items=evidence_items,
            case_hash_sha256=case_hash,
            audit_chain_length=len(audit_history),
            resolution=resolution_data
        )

    @classmethod
    def seal_case_file(cls, case_file: UnifiedCaseFile, actor: str) -> UnifiedCaseFile:
        case_file.header.is_sealed = True
        case_file.header.sealed_at = utc_now()
        
        audit_engine.log_event(
            dispute_id=case_file.header.dispute_id,
            performed_by=actor,
            action_type="SEAL_CASE_FILE",
            previous_state={"is_sealed": False},
            new_state={"is_sealed": True, "sealed_at": str(case_file.header.sealed_at)},
            state_delta={"case_hash": case_file.case_hash_sha256}
        )
        return case_file
