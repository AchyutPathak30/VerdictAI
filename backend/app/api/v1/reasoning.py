"""
VerdictAI Transparent Reasoning Layer & Hallucination Guardrails REST Endpoints
Author: Darshan Prajapati (Backend Engineer - Reasoning & APIs)
Phase: Phase 3 Deliverables (Reasoning-Layer API Endpoints + API Tests)
Coverage: SRS FR-19, FR-20, SIR-07, AC-10, NFR-02, NFR-13, NFR-14
"""

import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status

from backend.app.models.api_schemas import (
    ReasoningGenerateRequest,
    ReasoningResponse,
    GuardrailAuditRequest,
    GuardrailAuditResponse,
    ReasoningCapabilitiesResponse,
    utc_now,
)
from backend.app.services.reasoning_layer import (
    transparent_reasoning_engine,
    hallucination_guardrail,
    ReasoningRequest,
    ReasoningOutput,
    GuardrailValidationResult,
)
from backend.app.services.case_builder.service import case_service
from backend.app.core.db import db_manager

logger = logging.getLogger("ReasoningApiRouter")

router = APIRouter(prefix="/reasoning", tags=["Reasoning & XAI"])


@router.get(
    "/capabilities",
    response_model=ReasoningCapabilitiesResponse,
    summary="Get Reasoning Engine status and guardrail capabilities"
)
async def get_reasoning_capabilities():
    """
    Returns runtime operational capabilities, active model provider (Google Gemini 2.0 Flash XAI
    vs Deterministic Safe Fallback), and configured hallucination guardrail verification rules.
    """
    is_gemini = transparent_reasoning_engine.gemini_available
    active_engine = "GEMINI_XAI" if is_gemini else "DETERMINISTIC_SAFE_FALLBACK"

    return ReasoningCapabilitiesResponse(
        service="VerdictAI Transparent Reasoning & XAI Explanation Layer",
        owner="Darshan Prajapati (Backend Engineer - Reasoning & APIs)",
        version="1.0.0",
        gemini_xai_available=is_gemini,
        active_engine=active_engine,
        guardrails_active=True,
        enforced_rules=[
            "PII_SCRUBBING",
            "SETTLEMENT_COMMITMENT_CHECK",
            "ADVERSARIAL_BIAS_CHECK",
            "FORMULA_SECRECY_CHECK",
            "MONETARY_AMOUNT_CONSISTENCY",
            "AC10_FACTOR_GROUNDING"
        ],
        srs_requirements_covered=[
            "FR-19 (Plain-Language Explanations)",
            "FR-20 (Transparent Resolution Justification)",
            "SIR-07 (Synchronous ML Inference Integration)",
            "AC-10 (At least 3 Contributing Factors Citing Verified Evidence)",
            "NFR-02 (Role-Neutral Impartial Explanations)",
            "NFR-13 (Zero Hallucinated Financial Commitments)",
            "NFR-14 (PII Scrubbing & Regulatory Transparency)"
        ]
    )


@router.post(
    "/generate",
    response_model=ReasoningResponse,
    summary="Generate explainable reasoning from scoring factors"
)
async def generate_reasoning(payload: ReasoningGenerateRequest):
    """
    Direct inference endpoint generating transparent plain-language rationales
    (cardholder, merchant, and objective summary) for arbitrary dispute scoring payloads.
    All outputs are deterministically audited by HallucinationGuardrail before dispatch.
    """
    try:
        req = ReasoningRequest(
            case_id=payload.case_id,
            category_id=payload.category_id,
            category_name=payload.category_name,
            recommended_resolution=payload.recommended_resolution,
            confidence_score=payload.confidence_score,
            card_member_score=payload.card_member_score,
            merchant_score=payload.merchant_score,
            disputed_amount=payload.disputed_amount,
            currency=payload.currency,
            factor_breakdown=payload.factor_breakdown,
            raw_statement=payload.raw_statement
        )
        out: ReasoningOutput = transparent_reasoning_engine.generate_reasoning(req)

        return ReasoningResponse(
            summary=out.summary,
            cardholder_rationale=out.cardholder_rationale,
            merchant_rationale=out.merchant_rationale,
            contributing_factors=out.contributing_factors,
            generator_source=out.generator_source,
            guardrails_applied=out.guardrails_applied,
            guardrail_violations=out.guardrail_violations,
            confidence_score_pct=out.confidence_score_pct,
            recommended_resolution=out.recommended_resolution,
            case_id=payload.case_id,
            generated_at=utc_now()
        )
    except Exception as e:
        logger.error(f"Reasoning generation failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Reasoning generation failed: {str(e)}"
        )


@router.post(
    "/case/{dispute_id}/generate",
    response_model=ReasoningResponse,
    summary="Generate and persist reasoning for an existing dispute case"
)
async def generate_case_reasoning(
    dispute_id: str,
    actor: str = Query("SYSTEM:reasoning_api", description="Actor identity triggering the explanation generation")
):
    """
    Generates, audits, and persists explainable reasoning for an existing dispute case.
    Coordinates between CaseService, FairWeighingScoringService, and PostgreSQL audit chain.
    """
    case_file = case_service.get_unified_case_file(dispute_id)
    if not case_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dispute case '{dispute_id}' not found."
        )

    try:
        out: ReasoningOutput = transparent_reasoning_engine.generate_for_case(
            dispute_id=dispute_id,
            actor=actor
        )

        return ReasoningResponse(
            summary=out.summary,
            cardholder_rationale=out.cardholder_rationale,
            merchant_rationale=out.merchant_rationale,
            contributing_factors=out.contributing_factors,
            generator_source=out.generator_source,
            guardrails_applied=out.guardrails_applied,
            guardrail_violations=out.guardrail_violations,
            confidence_score_pct=out.confidence_score_pct,
            recommended_resolution=out.recommended_resolution,
            case_id=dispute_id,
            generated_at=utc_now()
        )
    except Exception as e:
        logger.error(f"Error generating reasoning for case {dispute_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate reasoning for case '{dispute_id}': {str(e)}"
        )


@router.get(
    "/case/{dispute_id}",
    response_model=ReasoningResponse,
    summary="Retrieve stored reasoning for a dispute case"
)
async def get_case_reasoning(dispute_id: str):
    """
    Retrieves previously evaluated explainable reasoning, factor breakdown, and
    guardrail verification status for an existing dispute case.
    """
    case_file = case_service.get_unified_case_file(dispute_id)
    if not case_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dispute case '{dispute_id}' not found."
        )

    stored_reasoning: Optional[ReasoningOutput] = transparent_reasoning_engine.get_stored_reasoning(dispute_id)
    if not stored_reasoning:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reasoning explanation has not been generated yet for dispute '{dispute_id}'. Call /generate first."
        )

    return ReasoningResponse(
        summary=stored_reasoning.summary,
        cardholder_rationale=stored_reasoning.cardholder_rationale,
        merchant_rationale=stored_reasoning.merchant_rationale,
        contributing_factors=stored_reasoning.contributing_factors,
        generator_source=stored_reasoning.generator_source,
        guardrails_applied=stored_reasoning.guardrails_applied,
        guardrail_violations=stored_reasoning.guardrail_violations,
        confidence_score_pct=stored_reasoning.confidence_score_pct,
        recommended_resolution=stored_reasoning.recommended_resolution,
        case_id=dispute_id,
        generated_at=utc_now()
    )


@router.post(
    "/audit-guardrails",
    response_model=GuardrailAuditResponse,
    summary="Audit plain-language text against policy guardrails (PII, settlement promises, bias)"
)
async def audit_text_guardrails(payload: GuardrailAuditRequest):
    """
    Pre-submission audit endpoint enabling web (e.g. Admin override textarea) and mobile clients
    to audit narrative justification text against strict policy rules prior to persistent storage.
    Enforces PII redaction, prohibits unauthorized settlement promises, and detects adversarial bias.
    """
    result: GuardrailValidationResult = hallucination_guardrail.audit_reasoning(
        text=payload.text,
        expected_amount=payload.expected_amount,
        currency=payload.currency,
        contributing_factors=payload.contributing_factors
    )

    return GuardrailAuditResponse(
        passed=result.passed,
        violations=result.violations,
        sanitized_text=result.sanitized_text,
        checked_rules=result.checked_rules,
        audited_at=utc_now()
    )
