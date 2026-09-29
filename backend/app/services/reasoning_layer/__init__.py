"""
VerdictAI Reasoning Layer Services & Hallucination Guardrails Package
Project: Frictionless Dispute & Chargeback Resolution
Author: Akshay Purohit (202512033) - ML Engineer (Fair-Weighing Model)
Collaborators: Darshan Prajapati (Reasoning APIs), Nirav Kachhiya (Policy Enforcer)
"""

from .schemas import ReasoningRequest, ReasoningOutput, GuardrailValidationResult
from .guardrails import (
    HallucinationGuardrail,
    PolicyEnforcer,
    hallucination_guardrail,
    policy_enforcer,
)
from .engine import TransparentReasoningEngine, transparent_reasoning_engine

__all__ = [
    "ReasoningRequest",
    "ReasoningOutput",
    "GuardrailValidationResult",
    "HallucinationGuardrail",
    "PolicyEnforcer",
    "hallucination_guardrail",
    "policy_enforcer",
    "TransparentReasoningEngine",
    "transparent_reasoning_engine",
]
