"""
Exhaustive lifecycle coverage for DisputeStateMachine.

Walks the whole ALLOWED_TRANSITIONS table instead of spot-checking a few edges,
so adding or removing a transition cannot silently open an illegal path.

Author: Hardik Kansara (202512036) - Cloud/DevOps & QA Engineer
"""

from datetime import datetime, timedelta, timezone

import pytest

from backend.app.models.schemas import DisputeStatus
from backend.app.services.audit_engine.audit import audit_engine
from backend.app.services.state_machine.state_machine import (
    DisputeStateMachine,
    InvalidStateTransitionError,
)

ALL_STATES = list(DisputeStatus)
TABLE = DisputeStateMachine.ALLOWED_TRANSITIONS
ALLOWED_PAIRS = [(s, t) for s, targets in TABLE.items() for t in targets]
FORBIDDEN_PAIRS = [
    (s, t) for s in ALL_STATES for t in ALL_STATES
    if t not in TABLE.get(s, set())
]


@pytest.fixture(autouse=True)
def clean_audit():
    audit_engine._chain_store.clear()
    yield
    audit_engine._chain_store.clear()


# ── Transition table ──

@pytest.mark.parametrize("state", ALL_STATES)
def test_every_status_is_in_the_transition_table(state):
    """A status missing from the table silently becomes a dead end."""
    assert state in TABLE, f"{state.value} has no transition entry"


@pytest.mark.parametrize("src,dst", ALLOWED_PAIRS, ids=lambda v: getattr(v, "value", v))
def test_allowed_transition_is_permitted_and_executes(src, dst):
    assert DisputeStateMachine.can_transition(src, dst)
    result = DisputeStateMachine.execute_transition(
        dispute_id=f"disp_{src.value}_{dst.value}",
        current_status=src,
        target_status=dst,
        actor="SYSTEM:test",
        reason="exhaustive table walk",
    )
    assert result == dst


@pytest.mark.parametrize("src,dst", FORBIDDEN_PAIRS, ids=lambda v: getattr(v, "value", v))
def test_forbidden_transition_is_rejected(src, dst):
    assert not DisputeStateMachine.can_transition(src, dst)
    with pytest.raises(InvalidStateTransitionError):
        DisputeStateMachine.execute_transition(
            dispute_id=f"disp_bad_{src.value}_{dst.value}",
            current_status=src,
            target_status=dst,
            actor="USER:attacker",
            reason="illegal",
        )


@pytest.mark.parametrize("terminal", [DisputeStatus.CLOSED, DisputeStatus.REJECTED])
def test_terminal_states_allow_no_exit(terminal):
    assert TABLE[terminal] == set()
    for target in ALL_STATES:
        assert not DisputeStateMachine.can_transition(terminal, target)


def test_no_state_transitions_to_itself():
    for state in ALL_STATES:
        assert state not in TABLE.get(state, set()), f"{state.value} self-loops"


def test_closed_is_reachable_from_submitted():
    """The happy path must stay connected end to end."""
    path = [
        DisputeStatus.SUBMITTED,
        DisputeStatus.EVIDENCE_INGESTED,
        DisputeStatus.IN_ANALYSIS,
        DisputeStatus.SCORING_EVALUATED,
        DisputeStatus.AUTO_RESOLVED,
        DisputeStatus.RESOLUTION_NOTIFIED,
        DisputeStatus.CLOSED,
    ]
    for src, dst in zip(path, path[1:]):
        assert DisputeStateMachine.can_transition(src, dst), f"{src.value} -> {dst.value} broken"


def test_manual_review_path_reaches_closed():
    path = [
        DisputeStatus.SCORING_EVALUATED,
        DisputeStatus.MANUAL_REVIEW_QUEUE,
        DisputeStatus.ADMIN_OVERRIDDEN,
        DisputeStatus.RESOLUTION_NOTIFIED,
        DisputeStatus.CLOSED,
    ]
    for src, dst in zip(path, path[1:]):
        assert DisputeStateMachine.can_transition(src, dst), f"{src.value} -> {dst.value} broken"


# ── Audit side effects ──

def test_transition_writes_one_audit_event():
    dispute_id = "disp_audit_transition"
    DisputeStateMachine.execute_transition(
        dispute_id=dispute_id,
        current_status=DisputeStatus.SUBMITTED,
        target_status=DisputeStatus.EVIDENCE_INGESTED,
        actor="USER:cardholder_1",
        reason="evidence attached",
    )
    trail = audit_engine.get_audit_trail(dispute_id)
    assert len(trail) == 1
    assert trail[0].action_type == "STATE_TRANSITION_EVIDENCE_INGESTED"
    assert trail[0].previous_state == {"status": "SUBMITTED"}
    assert trail[0].new_state == {"status": "EVIDENCE_INGESTED"}
    assert trail[0].state_delta == {"reason": "evidence attached"}


def test_rejected_transition_writes_no_audit_event():
    """A refused transition must not leave a trace implying it happened."""
    dispute_id = "disp_audit_rejected"
    with pytest.raises(InvalidStateTransitionError):
        DisputeStateMachine.execute_transition(
            dispute_id=dispute_id,
            current_status=DisputeStatus.CLOSED,
            target_status=DisputeStatus.SUBMITTED,
            actor="USER:attacker",
            reason="reopen",
        )
    assert audit_engine.get_audit_trail(dispute_id) == []


def test_transition_audit_chain_stays_verifiable():
    dispute_id = "disp_audit_chain_walk"
    path = [
        (DisputeStatus.SUBMITTED, DisputeStatus.EVIDENCE_INGESTED),
        (DisputeStatus.EVIDENCE_INGESTED, DisputeStatus.IN_ANALYSIS),
        (DisputeStatus.IN_ANALYSIS, DisputeStatus.SCORING_EVALUATED),
    ]
    for src, dst in path:
        DisputeStateMachine.execute_transition(
            dispute_id=dispute_id, current_status=src, target_status=dst,
            actor="SYSTEM:pipeline", reason="advance",
        )
    assert len(audit_engine.get_audit_trail(dispute_id)) == 3
    assert audit_engine.verify_integrity(dispute_id) is True


# ── SLA ──

@pytest.mark.parametrize("hours", [0, 1, 24, 48, 72, 168])
def test_sla_deadline_is_created_at_plus_hours(hours):
    created = datetime(2026, 11, 14, 9, 30, 0)
    assert DisputeStateMachine.calculate_sla_deadline(created, sla_hours=hours) == \
        created + timedelta(hours=hours)


def test_sla_default_window_is_48_hours():
    created = datetime(2026, 11, 14, 9, 30, 0)
    assert DisputeStateMachine.calculate_sla_deadline(created) == created + timedelta(hours=48)


def test_sla_not_breached_before_deadline():
    deadline = datetime(2026, 11, 16, 12, 0, 0)
    assert not DisputeStateMachine.is_sla_breached(
        deadline, current_time=deadline - timedelta(seconds=1))


def test_sla_breached_after_deadline():
    deadline = datetime(2026, 11, 16, 12, 0, 0)
    assert DisputeStateMachine.is_sla_breached(
        deadline, current_time=deadline + timedelta(seconds=1))


def test_sla_exactly_at_deadline_is_not_a_breach():
    """Boundary: strictly-after, so an on-time resolution is not penalised."""
    deadline = datetime(2026, 11, 16, 12, 0, 0)
    assert not DisputeStateMachine.is_sla_breached(deadline, current_time=deadline)


def test_sla_breach_handles_timezone_aware_deadline():
    deadline = datetime(2026, 11, 16, 12, 0, 0, tzinfo=timezone.utc)
    assert DisputeStateMachine.is_sla_breached(
        deadline, current_time=deadline + timedelta(hours=1))
    assert not DisputeStateMachine.is_sla_breached(
        deadline, current_time=deadline - timedelta(hours=1))
