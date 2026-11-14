"""
VerdictAI Machine Learning Unit & Integration Test Suite — Report #7 Final Evaluation Deliverables
Project: Frictionless Dispute & Chargeback Resolution (VerdictAI)
Author: Akshay Purohit (202512033) - Senior ML Engineer (Fair-Weighing Model)
Course: IT644 – Application Development Group Project
Evaluator: Prof. JayPrakash Lalchandani & Project Examination Board
Phase: Phase 6 & Phase 7 - Final System Evaluation & Course Presentation Dossier
Deliverable: Bi-Weekly Status Report #7 Primary Deliverable
Coverage: SRS FR-15, FR-16, FR-17, FR-18, FR-19, SIR-07, AC-08, AC-10, NFR-02, NFR-13, NFR-14,
          US EEOC 4/5ths Rule (29 CFR 1607), RBI Fair Lending Directive
"""

import os
import json
import statistics
import pytest

from akshay_ml_fairweighing.phase3_model.fair_weighing_model import (
    FairWeighingModel,
    CATEGORY_CALIBRATION_ANCHORS,
)
from akshay_ml_fairweighing.phase4_fairness_audit.fairness_audit_engine import (
    FairnessAuditEngine,
)
from akshay_ml_fairweighing.phase5_diagnostics.model_diagnostics import (
    ModelDiagnosticsEngine,
)
from akshay_ml_fairweighing.phase6_benchmarks.scoring_load_benchmark import (
    ScoringLoadBenchmark,
)
from akshay_ml_fairweighing.phase6_presentation.jury_evaluation_packager import (
    JuryEvaluationPackager,
    JuryEvaluationDossier,
    ConfusionMatrixMetrics,
)


@pytest.fixture
def packager():
    return JuryEvaluationPackager()


# ─── 1. Final Jury Presentation Dossier Export & Structural Integrity ─────────

def test_jury_evaluation_packager_export_and_integrity(packager, tmp_path):
    """
    Bi-Weekly Report #7 Primary Deliverable:
    Verifies that the jury evaluation package exports both valid Markdown
    (JURY_EVALUATION_DOSSIER.md) and structured JSON (jury_evaluation_dossier.json)
    ready for inspection by Prof. JayPrakash Lalchandani.
    """
    md_path, json_path = packager.export_dossier(output_dir=str(tmp_path))

    assert os.path.exists(md_path)
    assert os.path.exists(json_path)

    with open(md_path, "r", encoding="utf-8") as f:
        md_text = f.read()

    with open(json_path, "r", encoding="utf-8") as f:
        json_data = json.load(f)

    # Verify key metadata and structural headings
    assert "Akshay Purohit" in md_text
    assert "202512033" in md_text
    assert "Prof. JayPrakash Lalchandani" in md_text
    assert "US EEOC 4/5ths Rule" in md_text
    assert "NFR-14" in md_text
    assert "NFR-02" in md_text
    assert "JURY EVALUATION SIGN-OFF" in md_text

    # JSON structure verification
    assert json_data["student_id"] == "202512033"
    assert json_data["confusion_matrix"]["accuracy"] >= 0.95
    assert json_data["calibration_report"]["brier_score"] <= 0.05
    assert len(json_data["eeoc_tier_fairness"]) == 4
    assert len(json_data["rail_neutrality_fairness"]) == 4
    assert len(json_data["category_anchors"]) == 6


# ─── 2. NFR-14 Error Bounds & Multi-Class Confusion Matrix ────────────────────

def test_nfr14_false_positive_rate_regulatory_bound(packager):
    """
    SRS NFR-14 & FR-15:
    Validates that the multi-class classification engine achieves >= 95% overall
    accuracy and that the False Positive Rate (FPR) is strictly below 5.0%.
    """
    cm: ConfusionMatrixMetrics = packager.evaluate_confusion_matrix()

    assert cm.accuracy >= 0.95, f"Accuracy {cm.accuracy} below 95% target"
    assert cm.precision_macro >= 0.90, f"Macro precision {cm.precision_macro} below 0.90"
    assert cm.recall_macro >= 0.90, f"Macro recall {cm.recall_macro} below 0.90"
    assert cm.f1_macro >= 0.90, f"Macro F1 {cm.f1_macro} below 0.90"

    # Strict regulatory verification: NFR-14 FPR < 5.0%
    assert cm.false_positive_rate_nfr14 <= 0.05, (
        f"NFR-14 violation: Measured FPR is {cm.false_positive_rate_nfr14 * 100:.2f}% (limit: 5.0%)"
    )
    assert cm.fpr_compliant_nfr14 is True

    # Per-class diagonal dominance
    for cls_name in cm.classes:
        metrics = cm.per_class_metrics[cls_name]
        assert metrics["true_positives"] > 0
        assert metrics["precision"] >= 0.90
        assert metrics["recall"] >= 0.90


# ─── 3. US EEOC 4/5ths Rule Verification (Customer Tiers & Payment Rails) ───────

def test_eeoc_four_fifths_rule_customer_tiers(packager):
    """
    US EEOC 29 CFR 1607 & RBI Fair Lending Code:
    Verifies Disparate Impact Ratio (DIR) >= 0.80 across all cardholder tiers:
    PLATINUM, GOLD, SILVER, BASIC.
    """
    tier_rows = packager.evaluate_eeoc_tier_fairness()
    assert len(tier_rows) == 4

    for row in tier_rows:
        dir_val = row["disparate_impact_ratio"]
        assert dir_val >= 0.80, (
            f"EEOC 4/5ths violation in tier {row['tier']}: DIR is {dir_val:.4f} (must be >= 0.80)"
        )
        assert abs(row["statistical_parity_diff"]) <= 0.10, (
            f"Statistical parity difference exceeded 0.10 in tier {row['tier']}: {row['statistical_parity_diff']}"
        )
        assert row["eeoc_4_5ths_passed"] is True
        assert "PASSED" in row["audit_certificate"]


def test_payment_rail_algorithmic_neutrality(packager):
    """
    Indian Domestic Financial Rail Neutrality:
    Validates that domestic Indian payment rails (UPI, RuPay) experience equal
    treatment relative to international schemes (Visa, Mastercard), with DIR >= 0.80.
    """
    rail_rows = packager.evaluate_payment_rail_neutrality()
    assert len(rail_rows) == 4

    for row in rail_rows:
        dir_val = row["disparate_impact_ratio"]
        assert dir_val >= 0.80, (
            f"Disparate impact on rail {row['payment_rail']}: DIR is {dir_val:.4f} (must be >= 0.80)"
        )
        assert abs(row["statistical_parity_diff"]) <= 0.10
        assert row["eeoc_compliant"] is True
        assert row["neutrality_status"] == "EQUIVALENT & UNBIASED"


# ─── 4. Category-Anchored Deterministic Scoring Rubric ─────────────────────────

def test_category_anchored_confidence_rubric_zero_fluctuation(packager):
    """
    Bi-Weekly Report #7 Deliverable:
    Validates calibrated deterministic category confidence scores:
    - CAT-04 Duplicate Processing: 97.0%
    - CAT-03 Fraud / Unauthorized: 91.0%
    - CAT-01 Item Not Received: 87.0%
    - CAT-02 Damaged Merchandise: 85.0%
    - CAT-05 Cancelled Subscription: 88.0%
    - CAT-06 Incorrect Amount: 89.0%
    Confirms zero variance across 100 repeated runs (eliminating UI gauge jitter).
    """
    anchor_rows = packager.evaluate_category_anchors()
    assert len(anchor_rows) == 6

    expected_anchors = {
        "CAT-04": 97.0,
        "CAT-03": 91.0,
        "CAT-01": 87.0,
        "CAT-02": 85.0,
        "CAT-05": 88.0,
        "CAT-06": 89.0,
    }

    for row in anchor_rows:
        cat_id = row["category_id"]
        target = expected_anchors[cat_id]
        assert row["target_rubric_anchor"] == target
        assert row["empirical_confidence"] == target
        assert row["score_delta"] == 0.0
        assert row["score_variance"] == 0.0, f"Variance detected in deterministic rubric for {cat_id}"
        assert "DETERMINISTIC" in row["determinism"]


# ─── 5. Probabilistic Calibration & Brier Score Reliability ───────────────────

def test_brier_score_and_expected_calibration_error(packager):
    """
    Model Diagnostics & Calibration:
    Verifies that the Brier score satisfies the statutory target (<= 0.05),
    confirming that the model's confidence scores accurately reflect empirical accuracy.
    """
    cal = packager.evaluate_calibration_metrics()

    assert cal["brier_score"] <= 0.05, f"Brier score {cal['brier_score']} exceeded 0.05 target"
    assert cal["expected_calibration_error"] <= 0.20
    assert cal["brier_score_target_met"] is True
    assert cal["is_well_calibrated"] is True
    assert len(cal["bins"]) > 0


# ─── 6. High-Throughput Concurrency & Sub-50ms SLA Benchmark ─────────────────

def test_concurrent_load_sub50ms_sla_under_500_disputes(packager):
    """
    SRS SIR-07 & NFR-02:
    Simulates peak concurrent dispute traffic (500 disputes across 10 worker threads),
    validating that P95 inference latency remains strictly sub-50ms with 0 errors.
    """
    bench = packager.evaluate_concurrency_profile(num_cases=500, max_workers=10)

    assert bench["total_disputes_simulated"] == 500
    assert bench["concurrency_threads"] == 10
    assert bench["throughput_disputes_per_sec"] >= 100.0
    assert bench["latency_p95_ms"] < 50.0, f"P95 latency {bench['latency_p95_ms']} ms exceeded 50ms SLA"
    assert bench["latency_p99_ms"] < 50.0, f"P99 latency {bench['latency_p99_ms']} ms exceeded 50ms SLA"
    assert bench["sub_50ms_sla_met"] is True
    assert bench["error_rate"] == "0.00%"
    assert bench["lru_cache_warm_latency_ms"] < 1.0


# ─── 7. Blue Dart GPS Telematics Discrepancy Protection ───────────────────────

def test_blue_dart_telematics_misdelivery_protection(packager):
    """
    SRS FR-16 & FR-17 Edge Case Verification:
    Confirms carrier Proof-of-Delivery is mathematically penalized when GPS offset
    exceeds 1.0 km (e.g. 3.2 km or 5.1 km offset), resolving in favor of Card Member.
    """
    scenarios = packager.evaluate_telematics_scenarios()
    assert len(scenarios) == 4

    # Scenario 1: Delivery at residence (<0.5km) -> Merchant favour
    s1 = scenarios[0]
    assert s1["gps_offset_km"] == 0.05
    assert s1["model_outcome"] == "MERCHANT_FAVOUR"
    assert s1["protection_active"] is True

    # Scenario 2: Blue Dart 3.2 km offset -> Card Member favour
    s2 = scenarios[1]
    assert s2["gps_offset_km"] == 3.20
    assert s2["model_outcome"] == "CARD_MEMBER_FAVOUR"
    assert s2["protection_active"] is True

    # Scenario 3: Lost in transit -> Card Member favour
    s3 = scenarios[2]
    assert s3["model_outcome"] == "CARD_MEMBER_FAVOUR"
    assert s3["protection_active"] is True

    # Scenario 4: Warehouse drop (5.1km) -> Card Member favour
    s4 = scenarios[3]
    assert s4["gps_offset_km"] == 5.10
    assert s4["model_outcome"] == "CARD_MEMBER_FAVOUR"
    assert s4["protection_active"] is True
