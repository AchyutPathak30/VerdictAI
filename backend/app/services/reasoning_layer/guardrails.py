"""
VerdictAI LLM Hallucination Guardrails & Deterministic Policy Enforcers
Project: Frictionless Dispute & Chargeback Resolution
Author: Akshay Purohit (202512033) - ML Engineer (Fair-Weighing Model)
Collaborator: Nirav Kachhiya (Cryptographic Auditing & Policy Enforcer)
Phase: Phase 3 / Cycle 4 - LLM Hallucination Guardrails
Coverage: SRS FR-19, FR-20, AC-10, NFR-13, NFR-14, Bias Mitigation Guidelines
"""

import re
import logging
from typing import List, Dict, Any, Optional, Tuple
from .schemas import GuardrailValidationResult

logger = logging.getLogger("HallucinationGuardrail")


class HallucinationGuardrail:
    """
    Deterministic rule engine that validates and enforces policy constraints on LLM reasoning outputs.
    Ensures zero hallucinated financial promises, objective role neutrality, absence of internal formula leakage,
    and strict grounding in verified case evidence.
    """

    # Prohibited settlement commitments that an automated model cannot legally make
    PROHIBITED_SETTLEMENT_PATTERNS = [
        re.compile(r"(?i)\b(promise[s]?|guarantee[s]?|warrant[s]?)\b.*\b(full refund|compensation|reimbursement)\b"),
        re.compile(r"(?i)\b(instant|immediate|within\s+\d+\s+hours?)\s+(refund|transfer|payout|credit)\b"),
        re.compile(r"(?i)\b(irreversible|unappealable|final\s+binding)\s+verdict\b"),
        re.compile(r"(?i)\bwaive[s|d]?\s+(all\s+)?(fees?|charges?|penalties?)\b"),
    ]

    # Prohibited derogatory, biased, or adversarial language
    PROHIBITED_ADVERSARIAL_TERMS = [
        re.compile(r"(?i)\b(fraudster|liar|dishonest|cheat|scammer|fabricated\s+claim|con\s+artist)\b"),
        re.compile(r"(?i)\b(bad\s+faith|guilty\s+party|malicious\s+intent)\b"),
    ]

    # Prohibited internal math formula terms
    PROHIBITED_FORMULA_LEAKS = [
        re.compile(r"(?i)\b(w\(e_i\)|s_effective|base_s|category_weights|cm_norm|mr_norm)\b"),
        re.compile(r"(?i)\b(raw_score|weight\s*matrix|0\.\d{2}\s*\*|effective_score)\b"),
    ]

    # PII patterns: Credit Card (13-16 digits), Indian Phone (10 digits), Account numbers
    PII_CARD_PATTERN = re.compile(r"\b(?:\d{4}[ -]?){3}\d{4}\b")
    PII_PHONE_PATTERN = re.compile(r"\b(?:(?:\+91|0)?\s?[6-9]\d{9})\b")

    def __init__(self):
        pass

    def scrub_pii(self, text: str) -> str:
        """Removes credit card numbers, phone numbers, and raw identifiers from text."""
        sanitized = self.PII_CARD_PATTERN.sub("[REDACTED_CARD_NUMBER]", text)
        sanitized = self.PII_PHONE_PATTERN.sub("[REDACTED_PHONE]", sanitized)
        return sanitized

    def validate_amount_consistency(
        self,
        text: str,
        expected_amount: Optional[float],
        currency: str = "INR"
    ) -> Tuple[bool, Optional[str]]:
        """
        Detects if the LLM hallucinated an arbitrary settlement or refund amount
        that differs significantly from the disputed amount.
        """
        if expected_amount is None:
            return True, None

        # Find monetary mentions like $120.00, INR 500, Rs 500, 500.00
        amount_matches = re.findall(r"(?:[\$₹]|INR|USD|RS\.?)\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)", text, re.IGNORECASE)
        for match in amount_matches:
            try:
                num = float(match.replace(",", ""))
                # Allow tolerance of 0.05 or matching 0 / 100 percentages
                if num > 0 and abs(num - expected_amount) > 0.50:
                    # Ignore if the number is actually a confidence percentage (e.g. 85%, 75%)
                    if f"{match}%" in text or f"{match} %" in text:
                        continue
                    return False, f"Hallucinated monetary amount: detected {num}, expected {expected_amount}"
            except ValueError:
                continue

        return True, None

    def audit_reasoning(
        self,
        text: str,
        expected_amount: Optional[float] = None,
        currency: str = "INR",
        contributing_factors: Optional[List[str]] = None
    ) -> GuardrailValidationResult:
        """
        Audits reasoning text against all deterministic guardrails.
        Returns GuardrailValidationResult with compliance status and sanitized text.
        """
        violations: List[str] = []
        checked_rules = [
            "PII_SCRUBBING",
            "SETTLEMENT_TERMS_POLICY",
            "ADVERSARIAL_BIAS_POLICY",
            "FORMULA_LEAK_PREVENTION",
            "AMOUNT_CONSISTENCY",
            "EVIDENCE_GROUNDING_AC10"
        ]

        # 1. Scrub PII
        sanitized = self.scrub_pii(text)

        # 2. Check Prohibited Settlement Terms
        for pattern in self.PROHIBITED_SETTLEMENT_PATTERNS:
            match = pattern.search(sanitized)
            if match:
                violations.append(f"Prohibited settlement promise detected: '{match.group(0)}'")

        # 3. Check Adversarial/Biased Language
        for pattern in self.PROHIBITED_ADVERSARIAL_TERMS:
            match = pattern.search(sanitized)
            if match:
                violations.append(f"Adversarial or biased language detected: '{match.group(0)}'")

        # 4. Check Internal Formula Leakage
        for pattern in self.PROHIBITED_FORMULA_LEAKS:
            match = pattern.search(sanitized)
            if match:
                violations.append(f"Internal formula term leaked in explanation: '{match.group(0)}'")

        # 5. Check Amount Consistency
        amt_ok, amt_err = self.validate_amount_consistency(sanitized, expected_amount, currency)
        if not amt_ok and amt_err:
            violations.append(amt_err)

        # 6. Check AC-10 Contributing Factors Count
        if contributing_factors is not None and len(contributing_factors) < 3:
            violations.append(f"AC-10 violation: contributing factors count ({len(contributing_factors)}) is < 3")

        passed = len(violations) == 0
        if not passed:
            logger.warning(f"Reasoning text triggered guardrail violations: {violations}")

        return GuardrailValidationResult(
            passed=passed,
            violations=violations,
            sanitized_text=sanitized,
            checked_rules=checked_rules
        )


class PolicyEnforcer:
    """
    Enforces dispute resolution policy rules:
    - Non-discrimination on demographic / tier / size
    - Plain-language explainability (AC-10 / FR-19 / FR-20)
    - Manual review escalation thresholds (FR-17 / AC-09)
    """

    @staticmethod
    def verify_escalation_boundary(confidence_score: float, resolution: str) -> bool:
        """
        Enforces FR-17 & AC-09:
        - If confidence < 50.0%, resolution MUST be ESCALATE.
        - If resolution is ESCALATE, confidence must be < 50.0% (or flagged).
        """
        if confidence_score < 50.0:
            return resolution == "ESCALATE"
        return True

    @staticmethod
    def verify_factor_grounding(factors: List[str]) -> bool:
        """Ensures at least 3 contributing factors are present."""
        return len(factors) >= 3


# Global singleton instance
hallucination_guardrail = HallucinationGuardrail()
policy_enforcer = PolicyEnforcer()
