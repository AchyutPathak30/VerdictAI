"""
VerdictAI Transparent Reasoning & Hallucination Guardrail Schemas
Project: Frictionless Dispute & Chargeback Resolution
Author: Akshay Purohit (202512033) - ML Engineer (Fair-Weighing Model)
Collaborators: Darshan Prajapati (Reasoning APIs), Nirav Kachhiya (Policy & Audits)
Phase: Phase 3 / Cycle 4 - Transparent Reasoning Engine & Guardrails
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class ReasoningRequest(BaseModel):
    """Input payload passed to TransparentReasoningEngine."""
    case_id: str = Field(..., description="Unique case reference identifier")
    category_id: str = Field(..., description="Dispute category identifier (e.g. CAT-01)")
    category_name: str = Field(..., description="Human-readable dispute category name")
    recommended_resolution: str = Field(..., description="CARD_MEMBER_FAVOUR | MERCHANT_FAVOUR | ESCALATE")
    confidence_score: float = Field(..., description="Calculated model confidence percentage (0.0 - 100.0)")
    card_member_score: float = Field(..., description="Normalized card member score (0.0 - 100.0)")
    merchant_score: float = Field(..., description="Normalized merchant score (0.0 - 100.0)")
    disputed_amount: Optional[float] = Field(None, description="Disputed financial transaction amount")
    currency: str = Field("INR", description="Transaction currency code")
    factor_breakdown: List[Dict[str, Any]] = Field(default_factory=list, description="Detailed item-level score contributions")
    raw_statement: Optional[str] = Field(None, description="Cardholder dispute statement")


class GuardrailValidationResult(BaseModel):
    """Result of deterministic policy enforcer and hallucination audit."""
    passed: bool = Field(..., description="True if text complies with all hallucination and policy rules")
    violations: List[str] = Field(default_factory=list, description="List of detected policy or hallucination violations")
    sanitized_text: str = Field(..., description="Text after scrubbing/sanitization or replacement")
    checked_rules: List[str] = Field(default_factory=list, description="Rules applied during evaluation")


class ReasoningOutput(BaseModel):
    """Structured, policy-verified plain-language reasoning output."""
    summary: str = Field(..., description="Objective, neutral plain-language justification for both parties")
    cardholder_rationale: str = Field(..., description="Cardholder-facing plain-language rationale")
    merchant_rationale: str = Field(..., description="Merchant-facing evidence evaluation rationale")
    contributing_factors: List[str] = Field(..., min_length=3, description="At least 3 factors cited per SRS AC-10")
    generator_source: str = Field("DETERMINISTIC_SAFE_FALLBACK", description="GEMINI_XAI | DETERMINISTIC_SAFE_FALLBACK")
    guardrails_applied: bool = Field(True, description="Indicates whether deterministic policy guardrails ran")
    guardrail_violations: List[str] = Field(default_factory=list, description="Any caught and mitigated violations")
    confidence_score_pct: float = Field(..., description="Confidence score associated with this reasoning")
    recommended_resolution: str = Field(..., description="Recommended resolution string")
