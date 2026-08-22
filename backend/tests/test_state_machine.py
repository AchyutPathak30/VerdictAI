"""
Test Suite for Case State Machine & SLA Management
Author: Nirav Kachhiya (Project Lead / Backend Engineer)
"""

import pytest
from datetime import datetime, timedelta
from backend.app.services.state_machine.state_machine import DisputeStateMachine, InvalidStateTransitionError
from backend.app.models.schemas import DisputeStatus


def test_valid_state_transitions():
    assert DisputeStateMachine.can_transition(DisputeStatus.SUBMITTED, DisputeStatus.EVIDENCE_INGESTED)
    assert DisputeStateMachine.can_transition(DisputeStatus.EVIDENCE_INGESTED, DisputeStatus.IN_ANALYSIS)
    assert DisputeStateMachine.can_transition(DisputeStatus.IN_ANALYSIS, DisputeStatus.SCORING_EVALUATED)
    assert DisputeStateMachine.can_transition(DisputeStatus.SCORING_EVALUATED, DisputeStatus.AUTO_RESOLVED)
    assert DisputeStateMachine.can_transition(DisputeStatus.AUTO_RESOLVED, DisputeStatus.RESOLUTION_NOTIFIED)
    assert DisputeStateMachine.can_transition(DisputeStatus.RESOLUTION_NOTIFIED, DisputeStatus.CLOSED)


def test_invalid_state_transition():
    assert not DisputeStateMachine.can_transition(DisputeStatus.CLOSED, DisputeStatus.SUBMITTED)

    with pytest.raises(InvalidStateTransitionError):
        DisputeStateMachine.execute_transition(
            dispute_id="disp_123",
            current_status=DisputeStatus.CLOSED,
            target_status=DisputeStatus.SUBMITTED,
            actor="USER:attacker",
            reason="Illegal attempt"
        )


def test_sla_calculation_and_breach():
    base_time = datetime(2026, 8, 10, 12, 0, 0)
    deadline = DisputeStateMachine.calculate_sla_deadline(base_time, sla_hours=48)
    
    assert deadline == datetime(2026, 8, 12, 12, 0, 0)
    
    # Not breached before deadline
    assert not DisputeStateMachine.is_sla_breached(deadline, current_time=datetime(2026, 8, 11, 10, 0, 0))
    # Breached after deadline
    assert DisputeStateMachine.is_sla_breached(deadline, current_time=datetime(2026, 8, 13, 10, 0, 0))
