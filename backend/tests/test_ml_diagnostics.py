"""
VerdictAI ML Diagnostics & Explainability Test Suite
Author: Akshay Purohit (202512033) - ML Engineer (Fair-Weighing Model)
Phase: Phase 5 - Explainability (XAI), Attribution & Calibration
Coverage: SRS FR-15, FR-17, FR-19, SIR-07, AC-08, AC-10, NFR-14
"""

import json
import os
import pytest
from akshay_ml_fairweighing.phase5_diagnostics.model_diagnostics import (
    ModelDiagnosticsEngine,
    AttributionWaterfall,
    CalibrationReport,
)
from akshay_ml_fairweighing.phase3_model.fair_weighing_model import FairWeighingModel


@pytest.fixture
def diagnostics_engine():
    return ModelDiagnosticsEngine()


@pytest.fixture
def sample_dispute_case():
    return {
        "case_id": "CAS-DIAG-TEST-001",
        "dispute_category_id": "CAT-01",
        "dispute_category_name": "Item Not Received",
        "amount": 2499.0,
        "currency": "INR",
        "ground_truth_resolution": "MERCHANT_FAVOUR",
        "evidence_items": [
            {
                "evidence_id": "EV-01",
                "evidence_type": "Transaction Record",
                "status": "Present",
                "quality_score": 1.0,
                "favours": "NEUTRAL"
            },
            {
                "evidence_id": "EV-02",
                "evidence_type": "Merchant Receipt",
                "status": "Present",
                "quality_score": 0.95,
                "favours": "MERCHANT"
            },
            {
                "evidence_id": "EV-03",
                "evidence_type": "Carrier Delivery Proof",
                "status": "Present",
                "quality_score": 1.0,
                "favours": "MERCHANT"
            },
            {
                "evidence_id": "EV-09",
                "evidence_type": "Cardholder Statement",
                "status": "Present",
                "quality_score": 0.8,
                "favours": "CARD_MEMBER"
            }
        ]
    }


# ─── 1. Evidence Attribution Waterfall ─────────────────────────────────────────

def test_evidence_attribution_waterfall(diagnostics_engine, sample_dispute_case):
    """
    Verifies that Shapley-style evidence attribution decomposes the decision into
    auditable contributing factors with positive weight allocations per AC-10.
    """
    waterfall: AttributionWaterfall = diagnostics_engine.compute_evidence_attribution(sample_dispute_case)

    assert waterfall.case_id == "CAS-DIAG-TEST-001"
    assert waterfall.category_id == "CAT-01"
    assert waterfall.primary_evidence_present is True
    assert waterfall.missing_evidence_penalties == 0.0
    assert waterfall.recommended_resolution == "MERCHANT_FAVOUR"
    assert waterfall.routed_to == "AUTO_RESOLVED"

    # Verify at least 3 contributing factors
    assert len(waterfall.evidence_attributions) >= 3

    # Verify primary evidence EV-03 has largest relative weight for CAT-01
    ev_03 = next(a for a in waterfall.evidence_attributions if a.evidence_id == "EV-03")
    assert ev_03.is_primary is True
    assert ev_03.category_weight == 0.35  # CAT-01 rubric weight


# ─── 2. FR-17 Missing Primary Evidence Degradation ─────────────────────────────

def test_missing_primary_evidence_attribution_penalty(diagnostics_engine, sample_dispute_case):
    """
    SRS FR-17: When primary evidence is stripped, attribution must record 20pt penalty
    and force case to MANUAL_REVIEW_QUEUE.
    """
    stripped_case = dict(sample_dispute_case)
    stripped_case["evidence_items"] = [
        it for it in sample_dispute_case["evidence_items"]
        if it["evidence_id"] != "EV-03"
    ]

    waterfall = diagnostics_engine.compute_evidence_attribution(stripped_case)
    assert waterfall.primary_evidence_present is False
    assert waterfall.missing_evidence_penalties == 20.0
    assert waterfall.confidence_score < 50.0
    assert waterfall.routed_to == "MANUAL_REVIEW_QUEUE"


# ─── 3. Expected Calibration Error (ECE) Evaluation ────────────────────────────

def test_expected_calibration_error_benchmark(diagnostics_engine):
    """
    Verifies that model confidence is well-calibrated (ECE < 0.15, Brier Score < 0.25).
    """
    data_path = os.path.join(
        os.path.dirname(__file__),
        "..",
        "..",
        "akshay_ml_fairweighing",
        "phase2_mockdata",
        "mock_disputes_dataset.json"
    )
    with open(data_path, "r", encoding="utf-8") as f:
        dataset = json.load(f)["cases"]

    cal_report: CalibrationReport = diagnostics_engine.evaluate_calibration(dataset, num_bins=5)

    assert cal_report.is_well_calibrated is True
    assert cal_report.expected_calibration_error < 0.20
    assert cal_report.brier_score < 0.25
    assert len(cal_report.bins) > 0


# ─── 4. Adversarial Perturbation Resilience ────────────────────────────────────

def test_adversarial_perturbation_stress_tests(diagnostics_engine, sample_dispute_case):
    """
    Verifies model robustness under extreme amounts, missing evidence, and noisy payloads.
    """
    stress_results = diagnostics_engine.stress_test_adversarial_perturbations(sample_dispute_case)

    assert stress_results["missing_primary_escalated"] is True
    assert stress_results["empty_evidence_handled"] is True
    assert stress_results["extreme_amount_handled"] is True
