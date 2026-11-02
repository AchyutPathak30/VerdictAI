"""
VerdictAI Phase 6 Continuous Model Evaluation & Governance Package
Author: Akshay Purohit (202512033) - ML Engineer
"""

from .model_drift_monitor import (
    ModelDriftMonitor,
    DriftReport,
)

__all__ = [
    "ModelDriftMonitor",
    "DriftReport",
]

