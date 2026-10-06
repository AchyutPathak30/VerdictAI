"""
VerdictAI Fair-Weighing Dispute Scoring Service & Pipeline Adapter
Project: Frictionless Dispute & Chargeback Resolution
Author: Akshay Purohit (202512033) - ML Engineer (Fair-Weighing Model)
Phase: Phase 5 - Evidence Pipeline to Scoring Model Integration
"""

import uuid
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

from backend.app.models.schemas import (
    UnifiedCaseFile,
    DisputeStatus,
    DisputeReason,
    ResolutionOutcome,
)
from backend.app.services.case_builder.service import case_service
from backend.app.services.state_machine.state_machine import DisputeStateMachine
from backend.app.services.audit_engine.audit import audit_engine
from backend.app.core.db import db_manager
from database.mongodb.models import EvidencePayloadModel, EvidenceType, EvidenceSource
from akshay_ml_fairweighing.phase3_model.fair_weighing_model import (
    FairWeighingModel,
    PRIMARY_EVIDENCE_MAP,
)

logger = logging.getLogger("FairWeighingScoringService")


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


DISPUTE_REASON_TO_CATEGORY: Dict[DisputeReason, Dict[str, str]] = {
    DisputeReason.PRODUCT_NOT_RECEIVED: {
        "id": "CAT-01",
        "name": "Item Not Received"
    },
    DisputeReason.PRODUCT_DAMAGED_OR_DEFECTIVE: {
        "id": "CAT-02",
        "name": "Item Not as Described / Defective"
    },
    DisputeReason.FRAUD_UNRECOGNIZED_CHARGE: {
        "id": "CAT-03",
        "name": "Unauthorized Transaction"
    },
    DisputeReason.DUPLICATE_PROCESSING: {
        "id": "CAT-04",
        "name": "Duplicate Charge"
    },
    DisputeReason.SUBSCRIPTION_CANCELLED_CHARGED: {
        "id": "CAT-05",
        "name": "Cancelled Subscription"
    },
    DisputeReason.INCORRECT_AMOUNT_CHARGED: {
        "id": "CAT-06",
        "name": "Incorrect Amount / Refund Not Processed"
    },
}


class FairWeighingScoringService:
    """
    Adapter and orchestrator bridging live backend dispute case files,
    polymorphic MongoDB evidence items, and Akshay's Fair-Weighing ML Model.
    Fulfills SRS FR-15 to FR-21, SIR-07, and AC-08 to AC-11.
    """

    def __init__(self, model: Optional[FairWeighingModel] = None):
        self.model = model or FairWeighingModel()

    def build_scoring_payload(self, case_file: UnifiedCaseFile) -> Dict[str, Any]:
        """
        Transforms UnifiedCaseFile and polymorphic MongoDB evidence into
        the standardized input schema expected by FairWeighingModel.
        """
        dispute_reason = case_file.header.dispute_reason
        cat_info = DISPUTE_REASON_TO_CATEGORY.get(
            dispute_reason,
            {"id": "CAT-01", "name": "Dispute"}
        )
        cat_id = cat_info["id"]
        cat_name = cat_info["name"]

        evidence_items_dict: Dict[str, Dict[str, Any]] = {}

        # 1. Base official transaction record (EV-01)
        evidence_items_dict["EV-01"] = {
            "evidence_id": "EV-01",
            "evidence_type": "Transaction Record",
            "status": "Present",
            "quality_score": 0.95,
            "favours": "NEUTRAL",
            "details": {
                "transaction_id": case_file.transaction.transaction_id,
                "amount": case_file.transaction.amount,
                "currency": case_file.transaction.currency,
                "payment_method": case_file.transaction.payment_method,
            }
        }

        # 2. Cardholder dispute narrative statement (EV-09)
        if case_file.cardholder_statement and len(case_file.cardholder_statement.strip()) > 0:
            evidence_items_dict["EV-09"] = {
                "evidence_id": "EV-09",
                "evidence_type": "Dispute Reason Statement",
                "status": "Present",
                "quality_score": 0.90,
                "favours": "CARD_MEMBER",
                "details": {
                    "statement": case_file.cardholder_statement
                }
            }

        # 3. Map polymorphic evidence payloads from MongoDB
        for ev in case_file.evidence_items:
            ev_type = ev.evidence_type
            source = ev.source
            quality = float(ev.confidence_rating) if ev.confidence_rating is not None else 0.90
            raw = ev.raw_payload or {}
            entities = ev.nlp_extracted_entities or {}

            if ev_type == EvidenceType.RECEIPT_INVOICE:
                favours = "MERCHANT" if source == EvidenceSource.MERCHANT else "CARD_MEMBER"
                evidence_items_dict["EV-02"] = {
                    "evidence_id": "EV-02",
                    "evidence_type": "Merchant Receipt",
                    "status": "Present",
                    "quality_score": quality,
                    "favours": favours,
                    "details": raw
                }

            elif ev_type == EvidenceType.COURIER_TRACKING:
                # Inspect carrier delivery status
                status_str = str(
                    entities.get("delivery_status") or
                    raw.get("delivery_status") or
                    raw.get("status") or
                    ""
                ).upper()

                if any(kw in status_str for kw in ["DELIVERED", "SIGNED", "COMPLETED"]):
                    favours = "MERCHANT"
                elif any(kw in status_str for kw in ["LOST", "FAILED", "RETURNED", "EXCEPTION", "TRANSIT"]):
                    favours = "CARD_MEMBER"
                else:
                    favours = "MERCHANT" if source == EvidenceSource.MERCHANT else "CARD_MEMBER"

                evidence_items_dict["EV-03"] = {
                    "evidence_id": "EV-03",
                    "evidence_type": "Delivery Confirmation",
                    "status": "Present",
                    "quality_score": quality,
                    "favours": favours,
                    "details": raw
                }

            elif ev_type == EvidenceType.COMMUNICATION_LOG:
                if source == EvidenceSource.MERCHANT:
                    evidence_items_dict["EV-04"] = {
                        "evidence_id": "EV-04",
                        "evidence_type": "Merchant Communication Log",
                        "status": "Present",
                        "quality_score": quality,
                        "favours": "MERCHANT",
                        "details": raw
                    }
                else:
                    evidence_items_dict["EV-05"] = {
                        "evidence_id": "EV-05",
                        "evidence_type": "Card Member Communication Log",
                        "status": "Present",
                        "quality_score": quality,
                        "favours": "CARD_MEMBER",
                        "details": raw
                    }

            elif ev_type == EvidenceType.REFUND_POLICY_TERMS:
                evidence_items_dict["EV-06"] = {
                    "evidence_id": "EV-06",
                    "evidence_type": "Product/Service Description",
                    "status": "Present",
                    "quality_score": quality,
                    "favours": "MERCHANT",
                    "details": raw
                }

            elif ev_type == EvidenceType.IDENTITY_VERIFICATION:
                # 2FA / biometric authentication log
                auth_success = raw.get("auth_success", True)
                favours = "MERCHANT" if auth_success else "CARD_MEMBER"
                evidence_items_dict["EV-08"] = {
                    "evidence_id": "EV-08",
                    "evidence_type": "Authentication Log",
                    "status": "Present",
                    "quality_score": quality,
                    "favours": favours,
                    "details": raw
                }

            elif ev_type == EvidenceType.BANK_STATEMENT:
                if cat_id == "CAT-04":
                    evidence_items_dict["EV-01_DUP"] = {
                        "evidence_id": "EV-01_DUP",
                        "evidence_type": "Duplicate Transaction Record",
                        "status": "Present",
                        "quality_score": quality,
                        "favours": "CARD_MEMBER",
                        "details": raw
                    }
                else:
                    evidence_items_dict["EV-07"] = {
                        "evidence_id": "EV-07",
                        "evidence_type": "Refund/Cancellation Record",
                        "status": "Present",
                        "quality_score": quality,
                        "favours": "CARD_MEMBER",
                        "details": raw
                    }

        # 4. Check primary evidence requirement per category (FR-15 / AC-08)
        primary_ev = PRIMARY_EVIDENCE_MAP.get(cat_id)
        if primary_ev and primary_ev not in evidence_items_dict:
            # Primary evidence is missing — inject Missing record so penalty and escalation apply
            type_names = {
                "EV-03": "Delivery Confirmation",
                "EV-06": "Product/Service Description",
                "EV-08": "Authentication Log",
                "EV-01_DUP": "Duplicate Transaction Record",
                "EV-07": "Refund/Cancellation Record",
                "EV-04": "Merchant Communication Log",
            }
            evidence_items_dict[primary_ev] = {
                "evidence_id": primary_ev,
                "evidence_type": type_names.get(primary_ev, "Primary Evidence"),
                "status": "Missing",
                "quality_score": 0.0,
                "favours": "CARD_MEMBER" if cat_id in ["CAT-01", "CAT-04"] else "MERCHANT",
                "details": {"note": "Required primary evidence was not submitted before evaluation"}
            }

        return {
            "case_id": case_file.header.case_reference_number,
            "dispute_id": case_file.header.dispute_id,
            "dispute_category_id": cat_id,
            "dispute_category_name": cat_name,
            "amount": case_file.header.disputed_amount,
            "currency": case_file.header.currency,
            "evidence_items": list(evidence_items_dict.values())
        }

    def evaluate_dispute_case(
        self,
        dispute_id: str,
        actor: str = "SYSTEM:fair_weighing_engine"
    ) -> UnifiedCaseFile:
        """
        Main end-to-end evaluation pipeline:
        1. Compiles current UnifiedCaseFile.
        2. Adapts evidence into FairWeighingModel input.
        3. Executes ML scoring and explanation generation (SIR-07, FR-15, FR-16, FR-19).
        4. Saves resolution into PostgreSQL dispute_resolutions table.
        5. Automatically transitions dispute lifecycle state (FR-17, AC-09, UC-03).
        6. Logs cryptographic audit event with model version and factor weights (FR-18, AC-11).
        7. Returns updated UnifiedCaseFile with resolution data attached.
        """
        case_file = case_service.get_unified_case_file(dispute_id)
        if not case_file:
            raise ValueError(f"Dispute case '{dispute_id}' not found.")

        dispute_rec = db_manager.get_pg_record("disputes", dispute_id)
        if not dispute_rec:
            raise ValueError(f"Dispute record '{dispute_id}' not found in PostgreSQL.")

        # Compile scoring payload
        scoring_payload = self.build_scoring_payload(case_file)

        # Execute scoring via Akshay's FairWeighingModel
        eval_result = self.model.evaluate_case(scoring_payload)

        confidence = eval_result["confidence_score"]
        resolution_str = eval_result["recommended_resolution"]
        explanation = eval_result["plain_language_explanation"]

        # Map recommendation to ResolutionOutcome enum
        if resolution_str == "CARD_MEMBER_FAVOUR":
            outcome = ResolutionOutcome.FAVOR_CARDHOLDER
        elif resolution_str == "MERCHANT_FAVOUR":
            outcome = ResolutionOutcome.FAVOR_MERCHANT
        else:
            outcome = ResolutionOutcome.SPLIT_LIABILITY

        # Generate transparent dual-perspective rationales and enforce guardrails (Phase 3 Integration)
        cardholder_rationale = explanation
        merchant_rationale = explanation
        generator_source = "DETERMINISTIC_SAFE_FALLBACK"
        guardrails_applied = True
        guardrail_violations: List[str] = []
        try:
            from backend.app.services.reasoning_layer import transparent_reasoning_engine, ReasoningRequest
            reasoning_req = ReasoningRequest(
                case_id=dispute_id,
                category_id=cat_id,
                category_name=cat_name,
                recommended_resolution=resolution_str,
                confidence_score=confidence,
                card_member_score=eval_result["card_member_score"],
                merchant_score=eval_result["merchant_score"],
                disputed_amount=case_file.header.disputed_amount,
                currency=case_file.header.currency,
                factor_breakdown=eval_result.get("factor_breakdown", []),
                raw_statement=case_file.cardholder_statement
            )
            reasoning_out = transparent_reasoning_engine.generate_reasoning(reasoning_req)
            explanation = reasoning_out.summary
            cardholder_rationale = reasoning_out.cardholder_rationale
            merchant_rationale = reasoning_out.merchant_rationale
            generator_source = reasoning_out.generator_source
            guardrails_applied = reasoning_out.guardrails_applied
            guardrail_violations = reasoning_out.guardrail_violations
        except Exception as e:
            logger.warning(f"Transparent reasoning layer invocation failed: {e}. Defaulting to base explanation.")

        resolution_id = str(uuid.uuid4())
        resolution_data = {
            "id": resolution_id,
            "dispute_id": dispute_id,
            "outcome": outcome.value,
            "confidence_score": round(confidence / 100.0, 4),
            "fairness_index": 1.0000,
            "justification_summary": explanation,
            "reasoning_payload": {
                "recommended_resolution": resolution_str,
                "confidence_score_pct": confidence,
                "card_member_score": eval_result["card_member_score"],
                "merchant_score": eval_result["merchant_score"],
                "contributing_factors": eval_result["contributing_factors"],
                "factor_breakdown": eval_result["factor_breakdown"],
                "audit_trail": eval_result["audit_trail"],
                "summary": explanation,
                "cardholder_rationale": cardholder_rationale,
                "merchant_rationale": merchant_rationale,
                "generator_source": generator_source,
                "guardrails_applied": guardrails_applied,
                "guardrail_violations": guardrail_violations
            },
            "resolved_by_type": "SYSTEM_AUTOMATION",
            "resolved_by_user_id": None,
            "created_at": utc_now().isoformat()
        }

        # Store in dispute_resolutions table
        db_manager.insert_pg_record("dispute_resolutions", dispute_id, resolution_data)

        # Cache in dispute_reasoning table
        db_manager.insert_pg_record("dispute_reasoning", dispute_id, {
            "dispute_id": dispute_id,
            "summary": explanation,
            "cardholder_rationale": cardholder_rationale,
            "merchant_rationale": merchant_rationale,
            "contributing_factors": eval_result["contributing_factors"],
            "generator_source": generator_source,
            "guardrails_applied": guardrails_applied,
            "guardrail_violations": guardrail_violations,
            "confidence_score_pct": confidence,
            "recommended_resolution": resolution_str
        })


        # Advance Lifecycle State Machine
        curr_status = DisputeStatus(dispute_rec["current_status"])

        # Progress to IN_ANALYSIS if needed
        if curr_status in [DisputeStatus.SUBMITTED, DisputeStatus.EVIDENCE_PENDING]:
            if DisputeStateMachine.can_transition(curr_status, DisputeStatus.EVIDENCE_INGESTED):
                curr_status = DisputeStateMachine.execute_transition(
                    dispute_id=dispute_id,
                    current_status=curr_status,
                    target_status=DisputeStatus.EVIDENCE_INGESTED,
                    actor=actor,
                    reason="Evidence collection finalized for AI scoring"
                )

        if curr_status == DisputeStatus.EVIDENCE_INGESTED:
            curr_status = DisputeStateMachine.execute_transition(
                dispute_id=dispute_id,
                current_status=curr_status,
                target_status=DisputeStatus.IN_ANALYSIS,
                actor=actor,
                reason="Starting Fair-Weighing ML scoring analysis"
            )

        if curr_status == DisputeStatus.IN_ANALYSIS:
            curr_status = DisputeStateMachine.execute_transition(
                dispute_id=dispute_id,
                current_status=curr_status,
                target_status=DisputeStatus.SCORING_EVALUATED,
                actor=actor,
                reason=f"Model scoring evaluated: {resolution_str} ({confidence}%)"
            )

        # Final decision routing per FR-17 / AC-09:
        # If confidence >= 50%: transition to AUTO_RESOLVED
        # If confidence < 50%: route to MANUAL_REVIEW_QUEUE
        final_status = curr_status
        if curr_status == DisputeStatus.SCORING_EVALUATED:
            if confidence >= 50.0 and resolution_str != "ESCALATE":
                final_status = DisputeStateMachine.execute_transition(
                    dispute_id=dispute_id,
                    current_status=curr_status,
                    target_status=DisputeStatus.AUTO_RESOLVED,
                    actor=actor,
                    reason=f"Auto-resolved: {resolution_str} with {confidence}% confidence"
                )
            else:
                final_status = DisputeStateMachine.execute_transition(
                    dispute_id=dispute_id,
                    current_status=curr_status,
                    target_status=DisputeStatus.MANUAL_REVIEW_QUEUE,
                    actor=actor,
                    reason=f"Confidence {confidence}% below threshold or flagged; routed to Dispute-Ops queue (FR-17, AC-09)"
                )

        # Update dispute record in PostgreSQL
        dispute_rec["current_status"] = final_status.value
        dispute_rec["updated_at"] = utc_now().isoformat()
        db_manager.update_pg_record("disputes", dispute_id, dispute_rec)

        # Log audit event with factor weights and model version (FR-18, AC-11)
        score_delta = round(abs(eval_result["card_member_score"] - eval_result["merchant_score"]), 2)
        audit_engine.log_event(
            dispute_id=dispute_id,
            performed_by=actor,
            action_type="AI_SCORING_EVALUATED",
            previous_state={"status": curr_status.value},
            new_state={
                "status": final_status.value,
                "recommended_resolution": resolution_str,
                "confidence_score": confidence
            },
            state_delta={
                "model_version": eval_result["audit_trail"]["model_version"],
                "score_delta": score_delta,
                "factor_breakdown": eval_result["factor_breakdown"],
                "contributing_factors": eval_result["contributing_factors"],
                "plain_language_explanation": explanation
            }
        )

        logger.info(
            f"Dispute {dispute_id} evaluated: {resolution_str} (Confidence: {confidence}%, Final Status: {final_status.value})"
        )

        return case_service.get_unified_case_file(dispute_id)


# Global singleton instance
fair_weighing_service = FairWeighingScoringService()
