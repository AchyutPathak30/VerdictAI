"""
VerdictAI System Status, Health & Operational Metrics Endpoints
Author: Darshan Prajapati (Backend Engineer - Reasoning & APIs)
"""

from collections import Counter
from fastapi import APIRouter
from backend.app.models.api_schemas import SystemStatusResponse, utc_now
from backend.app.core.db import db_manager
from backend.app.services.state_machine.state_machine import DisputeStateMachine

router = APIRouter(prefix="/system", tags=["System"])


@router.get("/status", response_model=SystemStatusResponse)
async def get_system_status():
    """
    Returns real-time system operational metrics and active case counts.
    """
    disputes_table = db_manager.pg_tables.get("disputes", {})
    return SystemStatusResponse(
        status="operational",
        service="VerdictAI REST API Gateway",
        version="1.0.0",
        active_disputes_count=len(disputes_table),
        uptime_status="99.5%+",
        timestamp=utc_now()
    )


@router.get("/metrics", summary="Operational metrics dashboard data")
async def get_system_metrics():
    """
    Returns aggregated operational metrics: dispute counts by status,
    resolution outcome breakdown, SLA compliance rate, and evidence volume.
    Used by the web console Reports & Analytics screen.
    """
    now = utc_now()
    disputes = list(db_manager.pg_tables.get("disputes", {}).values())
    resolutions = list(db_manager.pg_tables.get("dispute_resolutions", {}).values())
    evidence_store = db_manager.mongo_collections.get("evidence_payloads", {})

    status_counts = Counter(d.get("current_status", "UNKNOWN") for d in disputes)

    sla_breached = 0
    for d in disputes:
        deadline_str = d.get("sla_deadline")
        if not deadline_str:
            continue
        terminal = d.get("current_status") in ("CLOSED", "REJECTED", "AUTO_RESOLVED", "ADMIN_OVERRIDDEN", "RESOLUTION_NOTIFIED")
        if not terminal and DisputeStateMachine.is_sla_breached(
            _parse_datetime(deadline_str), now
        ):
            sla_breached += 1

    outcome_counts = Counter(r.get("outcome", "UNKNOWN") for r in resolutions)
    override_count = sum(1 for r in resolutions if r.get("is_override"))

    total = len(disputes)
    return {
        "timestamp": now,
        "total_disputes": total,
        "disputes_by_status": dict(status_counts),
        "total_resolutions": len(resolutions),
        "outcomes": dict(outcome_counts),
        "admin_overrides": override_count,
        "sla_breached_active": sla_breached,
        "sla_compliance_pct": round((1 - sla_breached / total) * 100, 1) if total else 100.0,
        "total_evidence_items": len(evidence_store),
    }


def _parse_datetime(val):
    """Parse an ISO datetime string or pass through a datetime object."""
    if isinstance(val, str):
        from datetime import datetime, timezone
        s = val.replace("Z", "+00:00")
        return datetime.fromisoformat(s)
    return val
