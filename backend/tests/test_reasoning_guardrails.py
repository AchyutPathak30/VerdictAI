"""
VerdictAI Transparent Reasoning & Hallucination Guardrails Test Suite
Author: Akshay Purohit (202512033) - ML Engineer (Fair-Weighing Model)
Coverage: SRS FR-19, FR-20, AC-10, NFR-13, NFR-14, Bias Mitigation Guidelines
"""

import pytest
from backend.app.services.reasoning_layer.schemas import (
    ReasoningRequest,
    ReasoningOutput,
    GuardrailValidationResult,
)
from backend.app.services.reasoning_layer.guardrails import (
    HallucinationGuardrail,
    PolicyEnforcer,
    hallucination_guardrail,
    policy_enforcer,
)
from backend.app.services.reasoning_layer.engine import (
    TransparentReasoningEngine,
    transparent_reasoning_engine,
)


@pytest.fixture
def guardrail():
    return HallucinationGuardrail()


@pytest.fixture
def engine():
    return TransparentReasoningEngine()


# ─── 1. Hallucination Guardrail: PII Scrubbing ─────────────────────────────────

def test_guardrail_pii_scrubbing(guardrail):
    raw_statement = "My card 4532-1234-5678-9012 was charged without permission. Call me at 9876543210."
    sanitized = guardrail.scrub_pii(raw_statement)
    assert "4532-1234-5678-9012" not in sanitized
    assert "[REDACTED_CARD_NUMBER]" in sanitized
    assert "9876543210" not in sanitized
    assert "[REDACTED_PHONE]" in sanitized


# ─── 2. Hallucination Guardrail: Settlement Terms Policy ───────────────────────

def test_guardrail_catches_unauthorized_settlement_promises(guardrail):
    bad_text = "We promise a full refund to your account within 2 hours. This is an irreversible verdict."
    result = guardrail.audit_reasoning(
        text=bad_text,
        expected_amount=500.0,
        currency="INR",
        contributing_factors=["Factor 1", "Factor 2", "Factor 3"]
    )
    assert result.passed is False
    assert any("Prohibited settlement promise" in v for v in result.violations)


# ─── 3. Hallucination Guardrail: Bias & Adversarial Language ──────────────────

def test_guardrail_catches_adversarial_and_biased_language(guardrail):
    bad_text = "The merchant is a scammer and liar who submitted fabricated claims in bad faith."
    result = guardrail.audit_reasoning(
        text=bad_text,
        expected_amount=100.0,
        currency="USD",
        contributing_factors=["Factor 1", "Factor 2", "Factor 3"]
    )
    assert result.passed is False
    assert any("Adversarial or biased language" in v for v in result.violations)


# ─── 4. Hallucination Guardrail: Internal Formula Leaks ───────────────────────

def test_guardrail_prevents_internal_formula_leakage(guardrail):
    bad_text = "The case scored cm_norm of 66.07% using w(e_i) category weights matrix."
    result = guardrail.audit_reasoning(
        text=bad_text,
        expected_amount=250.0,
        currency="INR",
        contributing_factors=["Factor 1", "Factor 2", "Factor 3"]
    )
    assert result.passed is False
    assert any("Internal formula term leaked" in v for v in result.violations)


# ─── 5. Hallucination Guardrail: Monetary Amount Consistency ──────────────────

def test_guardrail_catches_hallucinated_monetary_amounts(guardrail):
    hallucinated_text = "A refund of $4,500.00 will be credited back for this transaction."
    result = guardrail.audit_reasoning(
        text=hallucinated_text,
        expected_amount=49.99,
        currency="USD",
        contributing_factors=["Factor 1", "Factor 2", "Factor 3"]
    )
    assert result.passed is False
    assert any("Hallucinated monetary amount" in v for v in result.violations)


def test_guardrail_allows_matching_disputed_amount(guardrail):
    valid_text = "The disputed charge of $49.99 has been reviewed and resolved based on delivery records."
    result = guardrail.audit_reasoning(
        text=valid_text,
        expected_amount=49.99,
        currency="USD",
        contributing_factors=["Factor 1", "Factor 2", "Factor 3"]
    )
    assert result.passed is True
    assert len(result.violations) == 0


# ─── 6. SRS AC-10: Citing at least 3 Contributing Factors ─────────────────────

def test_guardrail_enforces_minimum_three_contributing_factors(guardrail):
    text = "The dispute was resolved based on transaction evidence."
    result = guardrail.audit_reasoning(
        text=text,
        expected_amount=100.0,
        contributing_factors=["Only One Factor"]
    )
    assert result.passed is False
    assert any("AC-10 violation" in v for v in result.violations)


# ─── 7. Policy Enforcer: FR-17 Escalation Boundary ────────────────────────────

def test_policy_enforcer_escalation_boundary():
    # Confidence < 50% must be ESCALATE
    assert PolicyEnforcer.verify_escalation_boundary(46.1, "ESCALATE") is True
    assert PolicyEnforcer.verify_escalation_boundary(46.1, "CARD_MEMBER_FAVOUR") is False

    # Confidence >= 50% can be resolved
    assert PolicyEnforcer.verify_escalation_boundary(75.0, "CARD_MEMBER_FAVOUR") is True
    assert PolicyEnforcer.verify_escalation_boundary(80.0, "MERCHANT_FAVOUR") is True


# ─── 8. Transparent Reasoning Engine: End-to-End Generation ───────────────────

def test_reasoning_engine_deterministic_fallback(engine):
    req = ReasoningRequest(
        case_id="CAS-TEST-REASONING-01",
        category_id="CAT-01",
        category_name="Item Not Received",
        recommended_resolution="CARD_MEMBER_FAVOUR",
        confidence_score=78.5,
        card_member_score=78.5,
        merchant_score=21.5,
        disputed_amount=1250.00,
        currency="INR",
        factor_breakdown=[
            {"evidence_type": "Carrier Tracking", "status": "Missing", "favours": "CARD_MEMBER", "quality_score": 0.0},
            {"evidence_type": "Transaction Record", "status": "Present", "favours": "NEUTRAL", "quality_score": 0.95},
            {"evidence_type": "Cardholder Statement", "status": "Present", "favours": "CARD_MEMBER", "quality_score": 0.90}
        ]
    )

    out: ReasoningOutput = engine.generate_reasoning(req)

    # Asserts
    assert out.confidence_score_pct == 78.5
    assert out.recommended_resolution == "CARD_MEMBER_FAVOUR"
    assert len(out.summary) > 20
    assert len(out.cardholder_rationale) > 20
    assert len(out.merchant_rationale) > 20
    assert len(out.contributing_factors) >= 3  # AC-10
    assert out.guardrails_applied is True
    assert len(out.guardrail_violations) == 0
    assert "Item Not Received" in out.summary


def test_reasoning_engine_escalate_outcome(engine):
    req = ReasoningRequest(
        case_id="CAS-TEST-REASONING-02",
        category_id="CAT-02",
        category_name="Defective Product",
        recommended_resolution="ESCALATE",
        confidence_score=46.1,
        card_member_score=66.1,
        merchant_score=33.9,
        disputed_amount=499.00,
        currency="INR",
        factor_breakdown=[
            {"evidence_type": "Transaction Record", "status": "Present", "favours": "NEUTRAL", "quality_score": 0.95},
            {"evidence_type": "Product Description", "status": "Missing", "favours": "CARD_MEMBER", "quality_score": 0.0}
        ]
    )

    out: ReasoningOutput = engine.generate_reasoning(req)

    assert out.recommended_resolution == "ESCALATE"
    assert "Manual Review Queue" in out.summary or "manual review" in out.summary.lower()
    assert len(out.contributing_factors) >= 3
    assert out.guardrails_applied is True
