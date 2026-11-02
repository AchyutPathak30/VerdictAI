"""
VerdictAI Algorithmic Fairness & Bias Audit Unit & Integration Test Suite
Author: Akshay Purohit (202512033) - ML Engineer (Fair-Weighing Model)
Phase: Phase 4 & Phase 5 - Algorithmic Fairness Audit & Statutory Compliance
Standards: US EEOC Uniform Guidelines (4/5ths Rule), RBI Fair Practices Code, ISO/IEC 24027
Coverage: SRS FR-15, FR-16, AC-08, NFR-14, Bias Mitigation Guidelines
"""

import json
import os
import pytest
from akshay_ml_fairweighing.phase4_fairness_audit.fairness_audit_engine import (
    FairnessAuditEngine,
    FairnessAuditSummary,
    CounterfactualAuditResult,
)
from akshay_ml_fairweighing.phase3_model.fair_weighing_model import FairWeighingModel


@pytest.fixture
def fairness_engine():
    return FairnessAuditEngine()


@pytest.fixture
def benchmark_dataset():
    """Loads the 56 synthetic dispute benchmark cases."""
    data_path = os.path.join(
        os.path.dirname(__file__),
        "..",
        "..",
        "akshay_ml_fairweighing",
        "phase2_mockdata",
        "mock_disputes_dataset.json"
    )
    with open(data_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data["cases"]


# ─── 1. Statutory 4/5ths Rule (EEOC Disparate Impact Ratio >= 0.80) ────────────

def test_four_fifths_rule_across_cardholder_tiers(fairness_engine, benchmark_dataset):
    """
    Verifies that Disparate Impact Ratio (DIR) for unprivileged tiers (Silver, Basic, Standard)
    relative to privileged tiers (Platinum, Gold) is strictly >= 0.80.
    """
    tiers = ["PLATINUM", "GOLD", "SILVER", "BASIC"]
    annotated_cases = FairnessAuditEngine.stratify_cohorts(
        cases=benchmark_dataset,
        attribute_key="cardholder_tier",
        values=tiers
    )

    summary = fairness_engine.audit_group_fairness(
        cases=annotated_cases,
        protected_attribute_key="cardholder_tier",
        privileged_group="PLATINUM"
    )

    assert summary.four_fifths_rule_passed is True
    for unpriv_group, ratio in summary.disparate_impact_ratios.items():
        assert 0.80 <= ratio <= 1.25, f"DIR violation in {unpriv_group}: {ratio}"


# ─── 2. Statistical Parity Difference (|SPD| <= 0.10) ──────────────────────────

def test_statistical_parity_bounds(fairness_engine, benchmark_dataset):
    """
    Verifies that the absolute difference in favorable resolution rate between
    any cardholder tier and the baseline tier does not exceed 0.10 (10 percentage points).
    """
    tiers = ["PLATINUM", "GOLD", "SILVER", "BASIC"]
    annotated = FairnessAuditEngine.stratify_cohorts(
        cases=benchmark_dataset,
        attribute_key="cardholder_tier",
        values=tiers
    )

    summary = fairness_engine.audit_group_fairness(
        cases=annotated,
        protected_attribute_key="cardholder_tier",
        privileged_group="PLATINUM"
    )

    assert summary.statistical_parity_passed is True
    for unpriv, spd in summary.statistical_parity_differences.items():
        assert abs(spd) <= 0.10, f"SPD violation for {unpriv}: {spd}"


# ─── 3. Equal Opportunity Difference (|EOD| <= 0.05) ───────────────────────────

def test_equal_opportunity_bounds(fairness_engine, benchmark_dataset):
    """
    Verifies that True Positive Rates across demographic cohorts differ by <= 0.05.
    """
    tiers = ["PLATINUM", "GOLD", "SILVER", "BASIC"]
    annotated = FairnessAuditEngine.stratify_cohorts(
        cases=benchmark_dataset,
        attribute_key="cardholder_tier",
        values=tiers
    )

    summary = fairness_engine.audit_group_fairness(
        cases=annotated,
        protected_attribute_key="cardholder_tier",
        privileged_group="PLATINUM"
    )

    assert summary.equal_opportunity_passed is True
    for unpriv, eod in summary.equal_opportunity_differences.items():
        assert abs(eod) <= 0.05, f"EOD violation for {unpriv}: {eod}"


# ─── 4. Counterfactual Fairness & Demographic Invariance ───────────────────────

def test_counterfactual_fairness_invariance(fairness_engine, benchmark_dataset):
    """
    Tests that mutating cardholder account tier while keeping dispute evidence identical
    results in 100% identical calculated scores and outcomes (Zero Disparate Treatment).
    """
    res: CounterfactualAuditResult = fairness_engine.audit_counterfactual_fairness(
        cases=benchmark_dataset[:20],  # Test on representative cohort
        protected_attribute_key="cardholder_tier",
        test_attributes=["PLATINUM", "GOLD", "SILVER", "BASIC"]
    )

    assert res.counterfactual_fairness_passed is True
    assert res.invariance_rate == 1.0
    assert res.max_score_discrepancy == 0.0
    assert len(res.violations) == 0


# ─── 5. Disputed Amount Bracket Neutrality ─────────────────────────────────────

def test_disputed_amount_bracket_neutrality(fairness_engine, benchmark_dataset):
    """
    Verifies that micro-transactions (< INR 1,000) receive fair, non-discriminatory
    treatment compared to high-value transactions (> INR 10,000).
    """
    annotated = []
    for c in benchmark_dataset:
        case_copy = dict(c)
        case_copy["amount_bracket"] = FairnessAuditEngine.categorize_amount(case_copy.get("amount", 500.0))
        annotated.append(case_copy)

    summary = fairness_engine.audit_group_fairness(
        cases=annotated,
        protected_attribute_key="amount_bracket",
        privileged_group="HIGH_VALUE (> INR 10,000)"
    )

    assert summary.four_fifths_rule_passed is True


# ─── 6. Compliance Certificate Generation ──────────────────────────────────────

def test_compliance_certificate_generation(fairness_engine, benchmark_dataset):
    """
    Verifies markdown compliance certificate generation contains required regulatory clauses.
    """
    tiers = ["PLATINUM", "GOLD", "SILVER", "BASIC"]
    annotated = FairnessAuditEngine.stratify_cohorts(
        cases=benchmark_dataset,
        attribute_key="cardholder_tier",
        values=tiers
    )
    for c in annotated:
        c["amount_bracket"] = FairnessAuditEngine.categorize_amount(c.get("amount", 500.0))

    tier_audit = fairness_engine.audit_group_fairness(annotated, "cardholder_tier", "PLATINUM")
    amount_audit = fairness_engine.audit_group_fairness(annotated, "amount_bracket", "MICRO (< INR 1,000)")
    cf_audit = fairness_engine.audit_counterfactual_fairness(benchmark_dataset[:10])

    cert_md = fairness_engine.generate_fairness_certificate_markdown(
        tier_audit=tier_audit,
        amount_audit=amount_audit,
        counterfactual_audit=cf_audit
    )

    assert "COMPLIANT ✅" in cert_md
    assert "4/5ths Rule" in cert_md
    assert "Counterfactual Invariance" in cert_md
    assert "Disparate Impact Ratio" in cert_md
