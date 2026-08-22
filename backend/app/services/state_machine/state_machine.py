"""
VerdictAI Dispute Case Lifecycle State Machine & SLA Management
Author: Nirav Kachhiya (Project Lead / Backend Engineer)
"""

from datetime import datetime, timedelta, timezone
from typing import Dict, List, Set, Tuple
from backend.app.models.schemas import DisputeStatus
from backend.app.services.audit_engine.audit import audit_engine


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class InvalidStateTransitionError(Exception):
    pass


class DisputeStateMachine:
    """
    Guarantees deterministic, valid lifecycle state transitions
    and tracks SLA countdowns/breaches.
    """
    
    ALLOWED_TRANSITIONS: Dict[DisputeStatus, Set[DisputeStatus]] = {
        DisputeStatus.SUBMITTED: {
            DisputeStatus.EVIDENCE_PENDING,
            DisputeStatus.EVIDENCE_INGESTED,
            DisputeStatus.REJECTED
        },
        DisputeStatus.EVIDENCE_PENDING: {
            DisputeStatus.EVIDENCE_INGESTED,
            DisputeStatus.IN_ANALYSIS,
            DisputeStatus.AUTO_RESOLVED
        },
        DisputeStatus.EVIDENCE_INGESTED: {
            DisputeStatus.IN_ANALYSIS,
            DisputeStatus.REJECTED
        },
        DisputeStatus.IN_ANALYSIS: {
            DisputeStatus.SCORING_EVALUATED
        },
        DisputeStatus.SCORING_EVALUATED: {
            DisputeStatus.AUTO_RESOLVED,
            DisputeStatus.MANUAL_REVIEW_QUEUE
        },
        DisputeStatus.MANUAL_REVIEW_QUEUE: {
            DisputeStatus.ADMIN_OVERRIDDEN,
            DisputeStatus.AUTO_RESOLVED
        },
        DisputeStatus.AUTO_RESOLVED: {
            DisputeStatus.RESOLUTION_NOTIFIED
        },
        DisputeStatus.ADMIN_OVERRIDDEN: {
            DisputeStatus.RESOLUTION_NOTIFIED
        },
        DisputeStatus.RESOLUTION_NOTIFIED: {
            DisputeStatus.CLOSED
        },
        DisputeStatus.CLOSED: set(),
        DisputeStatus.REJECTED: set()
    }

    @classmethod
    def can_transition(cls, current_status: DisputeStatus, target_status: DisputeStatus) -> bool:
        return target_status in cls.ALLOWED_TRANSITIONS.get(current_status, set())

    @classmethod
    def execute_transition(
        cls,
        dispute_id: str,
        current_status: DisputeStatus,
        target_status: DisputeStatus,
        actor: str,
        reason: str
    ) -> DisputeStatus:
        if not cls.can_transition(current_status, target_status):
            raise InvalidStateTransitionError(
                f"Invalid transition for dispute {dispute_id}: {current_status.value} -> {target_status.value}"
            )

        audit_engine.log_event(
            dispute_id=dispute_id,
            performed_by=actor,
            action_type=f"STATE_TRANSITION_{target_status.value}",
            previous_state={"status": current_status.value},
            new_state={"status": target_status.value},
            state_delta={"reason": reason}
        )

        return target_status

    @classmethod
    def calculate_sla_deadline(cls, created_at: datetime, sla_hours: int = 48) -> datetime:
        return created_at + timedelta(hours=sla_hours)

    @classmethod
    def is_sla_breached(cls, sla_deadline: datetime, current_time: datetime = None) -> bool:
        now = current_time or (utc_now() if sla_deadline.tzinfo else datetime.utcnow())
        return now > sla_deadline
