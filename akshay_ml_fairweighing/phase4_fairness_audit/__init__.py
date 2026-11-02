"""
VerdictAI Phase 4 Algorithmic Fairness & Bias Audit Package
Author: Akshay Purohit (202512033) - ML Engineer
"""

from .fairness_audit_engine import (
    FairnessAuditEngine,
    FairnessAuditSummary,
    GroupFairnessMetrics,
    CounterfactualAuditResult,
)

__all__ = [
    "FairnessAuditEngine",
    "FairnessAuditSummary",
    "GroupFairnessMetrics",
    "CounterfactualAuditResult",
]

