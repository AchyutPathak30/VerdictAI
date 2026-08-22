"""
VerdictAI Core Case Service Orchestrator
Author: Nirav Kachhiya (Project Lead / Backend Engineer)
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid

from backend.app.models.schemas import (
    UnifiedCaseFile,
    DisputeStatus,
    DisputeReason
)
from backend.app.services.case_builder.builder import CaseFileBuilder
from backend.app.services.state_machine.state_machine import DisputeStateMachine
from backend.app.services.audit_engine.audit import audit_engine
from backend.app.core.db import db_manager
from database.mongodb.models import EvidencePayloadModel, EvidenceType, EvidenceSource, MongoCaseDocument


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class CaseService:
    """
    Central orchestration service for dispute case lifecycle, evidence compilation,
    and cross-database synchronizations.
    """

    def create_dispute_case(
        self,
        transaction_id: str,
        cardholder_id: str,
        dispute_reason: DisputeReason,
        disputed_amount: float,
        cardholder_statement: Optional[str] = None,
        merchant_sla_hours: int = 48
    ) -> UnifiedCaseFile:
        dispute_id = str(uuid.uuid4())
        created_at = utc_now()
        sla_deadline = DisputeStateMachine.calculate_sla_deadline(created_at, merchant_sla_hours)

        txn_data = db_manager.get_pg_record("transactions", transaction_id)
        if not txn_data:
            txn_data = {
                "id": transaction_id,
                "user_id": cardholder_id,
                "merchant_id": "m0000000-0000-0000-0000-000000000001",
                "merchant_name": "Apex Electronics Direct",
                "amount": disputed_amount,
                "currency": "USD",
                "cardholder_name": "Alice Smith",
                "payment_method": "VISA_CREDIT",
                "transaction_timestamp": created_at
            }
            db_manager.insert_pg_record("transactions", transaction_id, txn_data)

        dispute_record = {
            "id": dispute_id,
            "transaction_id": transaction_id,
            "cardholder_id": cardholder_id,
            "dispute_reason": dispute_reason.value,
            "disputed_amount": disputed_amount,
            "current_status": DisputeStatus.SUBMITTED.value,
            "merchant_sla_hours": merchant_sla_hours,
            "sla_deadline": sla_deadline,
            "cardholder_statement": cardholder_statement,
            "created_at": created_at,
            "updated_at": created_at
        }
        db_manager.insert_pg_record("disputes", dispute_id, dispute_record)

        mongo_doc = MongoCaseDocument(
            dispute_id=dispute_id,
            case_reference_number=f"CAS-{dispute_id[:8].upper()}"
        )
        db_manager.insert_mongo_doc("case_documents", dispute_id, mongo_doc.model_dump())

        audit_engine.log_event(
            dispute_id=dispute_id,
            performed_by=f"USER:{cardholder_id}",
            action_type="DISPUTE_SUBMITTED",
            previous_state=None,
            new_state={"status": DisputeStatus.SUBMITTED.value, "amount": disputed_amount},
            state_delta={"reason": dispute_reason.value}
        )

        return CaseFileBuilder.compile_case_file(
            dispute_id=dispute_id,
            dispute_data=dispute_record,
            transaction_data=txn_data,
            evidence_items=[]
        )

    def attach_evidence(
        self,
        dispute_id: str,
        evidence_type: EvidenceType,
        source: EvidenceSource,
        raw_payload: Dict[str, Any],
        actor: str,
        file_name: Optional[str] = None
    ) -> EvidencePayloadModel:
        dispute_record = db_manager.get_pg_record("disputes", dispute_id)
        if not dispute_record:
            raise ValueError(f"Dispute {dispute_id} not found.")

        evidence_id = f"evi_{uuid.uuid4().hex[:12]}"
        evidence = EvidencePayloadModel.create_with_hash(
            evidence_id=evidence_id,
            dispute_id=dispute_id,
            evidence_type=evidence_type,
            source=source,
            raw_payload=raw_payload,
            file_name=file_name
        )

        mongo_data = db_manager.get_mongo_doc("case_documents", dispute_id) or {
            "dispute_id": dispute_id,
            "case_reference_number": f"CAS-{dispute_id[:8].upper()}",
            "evidence_items": [],
            "total_evidence_count": 0
        }
        mongo_case = MongoCaseDocument(**mongo_data)
        mongo_case.add_evidence(evidence)
        db_manager.insert_mongo_doc("case_documents", dispute_id, mongo_case.model_dump())

        current_st = DisputeStatus(dispute_record["current_status"])
        if current_st in [DisputeStatus.SUBMITTED, DisputeStatus.EVIDENCE_PENDING]:
            new_st = DisputeStateMachine.execute_transition(
                dispute_id=dispute_id,
                current_status=current_st,
                target_status=DisputeStatus.EVIDENCE_INGESTED,
                actor=actor,
                reason=f"Attached evidence {evidence_id} ({evidence_type.value})"
            )
            dispute_record["current_status"] = new_st.value
            db_manager.update_pg_record("disputes", dispute_id, dispute_record)

        audit_engine.log_event(
            dispute_id=dispute_id,
            performed_by=actor,
            action_type="EVIDENCE_ATTACHED",
            previous_state=None,
            new_state={"evidence_id": evidence_id, "type": evidence_type.value},
            state_delta={"checksum": evidence.sha256_checksum}
        )

        return evidence

    def get_unified_case_file(self, dispute_id: str) -> Optional[UnifiedCaseFile]:
        dispute_record = db_manager.get_pg_record("disputes", dispute_id)
        if not dispute_record:
            return None

        txn_id = dispute_record.get("transaction_id")
        txn_data = db_manager.get_pg_record("transactions", txn_id) or {}

        mongo_data = db_manager.get_mongo_doc("case_documents", dispute_id) or {}
        evidence_items = [
            EvidencePayloadModel(**item) for item in mongo_data.get("evidence_items", [])
        ]
        res_data = db_manager.get_pg_record("dispute_resolutions", dispute_id)

        return CaseFileBuilder.compile_case_file(
            dispute_id=dispute_id,
            dispute_data=dispute_record,
            transaction_data=txn_data,
            evidence_items=evidence_items,
            resolution_data=res_data
        )


case_service = CaseService()
