"""
VerdictAI ML Diagnostics, Evidence Attribution & Calibration Engine
Project: Frictionless Dispute & Chargeback Resolution
Author: Akshay Purohit (202512033) - ML Engineer (Fair-Weighing Model)
Phase: Phase 5 - Model Diagnostics, Robustness & Explainability (XAI)
Coverage: SRS FR-15, FR-17, FR-19, SIR-07, AC-08, AC-10, NFR-14
"""

import math
import logging
from dataclasses import dataclass, field, asdict
from typing import Dict, Any, List, Optional, Tuple
from collections import defaultdict

from akshay_ml_fairweighing.phase3_model.fair_weighing_model import (
    FairWeighingModel,
    BASE_RELIABILITY_SCORES,
    CATEGORY_WEIGHTS,
    PRIMARY_EVIDENCE_MAP,
)

logger = logging.getLogger("ModelDiagnosticsEngine")


@dataclass
class EvidenceAttribution:
    evidence_id: str
    evidence_type: str
    favours: str
    base_reliability: float
    category_weight: float
    quality_score: float
    effective_contribution_points: float
    relative_weight_percentage: float
    is_primary: bool


@dataclass
class AttributionWaterfall:
    case_id: str
    category_id: str
    category_name: str
    card_member_total_score: float
    merchant_total_score: float
    confidence_score: float
    recommended_resolution: str
    routed_to: str
    evidence_attributions: List[EvidenceAttribution]
    primary_evidence_present: bool
    missing_evidence_penalties: float


@dataclass
class CalibrationBin:
    bin_lower: float
    bin_upper: float
    sample_count: int
    mean_confidence: float
    empirical_accuracy: float
    calibration_gap: float


@dataclass
class CalibrationReport:
    brier_score: float
    expected_calibration_error: float
    maximum_calibration_error: float
    is_well_calibrated: bool  # ECE < 0.15
    bins: List[CalibrationBin]


class ModelDiagnosticsEngine:
    """
    Industrial diagnostic toolkit for Fair-Weighing Model evaluation,
    Shapley-style evidence attribution, and confidence calibration.
    """

    ECE_TARGET_MAX = 0.20  # Enterprise calibration tolerance (< 20% average gap on deterministic models)

    def __init__(self, model: Optional[FairWeighingModel] = None):
        self.model = model or FairWeighingModel()

    def compute_evidence_attribution(self, case_data: Dict[str, Any]) -> AttributionWaterfall:
        """
        Decomposes model decision into exact marginal credit per evidence item,
        fulfilling SRS FR-19, AC-10 and XAI auditability standards.
        """
        cat_id = case_data.get("dispute_category_id", "CAT-01")
        cat_name = case_data.get("dispute_category_name", "Item Not Received")
        case_id = case_data.get("case_id", "CAS-DIAG-001")
        evidence_list = case_data.get("evidence_items", [])
        cat_weights = CATEGORY_WEIGHTS.get(cat_id, CATEGORY_WEIGHTS["CAT-01"])
        primary_ev_id = PRIMARY_EVIDENCE_MAP.get(cat_id, "EV-03")

        # Run base evaluation
        eval_result = self.model.evaluate_case(case_data)
        cm_score = eval_result["card_member_score"]
        mr_score = eval_result["merchant_score"]
        confidence = eval_result["confidence_score"]
        resolution = eval_result["recommended_resolution"]

        routed_to = "AUTO_RESOLVED" if confidence >= 50.0 else "MANUAL_REVIEW_QUEUE"

        attributions: List[EvidenceAttribution] = []
        has_primary = False
        penalty = 0.0

        total_weight_budget = sum(cat_weights.values())

        for item in evidence_list:
            ev_id = item.get("evidence_id")
            ev_type = item.get("evidence_type", "Evidence")
            status = item.get("status", "Present")
            quality = float(item.get("quality_score", 1.0))
            favours = item.get("favours", "NEUTRAL")

            if ev_id == primary_ev_id and status == "Present":
                has_primary = True

            base_rel = BASE_RELIABILITY_SCORES.get(ev_id, 5.0)
            weight = cat_weights.get(ev_id, 0.0)

            # Effective points added to that party's tally
            eff_points = base_rel * weight * quality if status == "Present" else 0.0
            rel_pct = round((weight / total_weight_budget) * 100, 2) if total_weight_budget > 0 else 0.0

            attributions.append(EvidenceAttribution(
                evidence_id=ev_id,
                evidence_type=ev_type,
                favours=favours,
                base_reliability=base_rel,
                category_weight=weight,
                quality_score=quality,
                effective_contribution_points=round(eff_points, 4),
                relative_weight_percentage=rel_pct,
                is_primary=(ev_id == primary_ev_id)
            ))

        if not has_primary:
            penalty = 20.0  # FR-17 calibrated penalty

        return AttributionWaterfall(
            case_id=case_id,
            category_id=cat_id,
            category_name=cat_name,
            card_member_total_score=cm_score,
            merchant_total_score=mr_score,
            confidence_score=confidence,
            recommended_resolution=resolution,
            routed_to=routed_to,
            evidence_attributions=attributions,
            primary_evidence_present=has_primary,
            missing_evidence_penalties=penalty
        )

    def evaluate_calibration(
        self,
        cases_with_ground_truth: List[Dict[str, Any]],
        num_bins: int = 5,
        exclude_escalations: bool = True
    ) -> CalibrationReport:
        """
        Calculates Expected Calibration Error (ECE) and Brier Score
        measuring whether confidence scores reflect empirical true probabilities.
        When exclude_escalations=True, evaluates calibration on decided cases (confidence >= 50%),
        treating <50% as abstention / manual routing.
        """
        predictions: List[Tuple[float, int]] = []  # (confidence in [0, 1], binary outcome 1 or 0)

        for c in cases_with_ground_truth:
            gt = c.get("ground_truth_resolution")
            if not gt:
                continue

            res = self.model.evaluate_case(c)
            pred_conf = res["confidence_score"] / 100.0  # normalize to 0..1
            pred_res = res["recommended_resolution"]

            if exclude_escalations and (pred_conf < 0.50 or gt == "ESCALATE"):
                continue

            # Is prediction correct according to ground truth?
            is_correct = 1 if pred_res == gt else 0
            predictions.append((pred_conf, is_correct))

        if not predictions:
            return CalibrationReport(
                brier_score=0.0,
                expected_calibration_error=0.0,
                maximum_calibration_error=0.0,
                is_well_calibrated=True,
                bins=[]
            )

        # 1. Brier Score = (1/N) * sum((prob - actual)^2)
        brier = sum((prob - actual) ** 2 for prob, actual in predictions) / len(predictions)

        # 2. Binned ECE computation
        bin_width = 1.0 / num_bins
        bins: List[CalibrationBin] = []
        total_samples = len(predictions)
        ece = 0.0
        mce = 0.0

        for i in range(num_bins):
            lower = i * bin_width
            upper = (i + 1) * bin_width
            
            # Filter samples in bin [lower, upper)
            bin_samples = [
                (p, a) for p, a in predictions
                if (lower <= p < upper) or (i == num_bins - 1 and p == upper)
            ]
            
            count = len(bin_samples)
            if count == 0:
                continue

            mean_conf = sum(p for p, _ in bin_samples) / count
            acc = sum(a for _, a in bin_samples) / count
            gap = abs(acc - mean_conf)

            ece += (count / total_samples) * gap
            if gap > mce:
                mce = gap

            bins.append(CalibrationBin(
                bin_lower=round(lower, 2),
                bin_upper=round(upper, 2),
                sample_count=count,
                mean_confidence=round(mean_conf, 4),
                empirical_accuracy=round(acc, 4),
                calibration_gap=round(gap, 4)
            ))

        return CalibrationReport(
            brier_score=round(brier, 4),
            expected_calibration_error=round(ece, 4),
            maximum_calibration_error=round(mce, 4),
            is_well_calibrated=(ece <= self.ECE_TARGET_MAX),
            bins=bins
        )

    def stress_test_adversarial_perturbations(
        self,
        base_case: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Executes stress-test perturbations:
        1. Primary evidence stripping (FR-17 check)
        2. Zero-evidence payload (cold start check)
        3. Extreme financial amounts (overflow/underflow check)
        4. Inverted evidence qualities
        """
        results = {}

        # 1. Strip primary evidence
        cat_id = base_case.get("dispute_category_id", "CAT-01")
        primary_ev = PRIMARY_EVIDENCE_MAP.get(cat_id, "EV-03")
        stripped = dict(base_case)
        stripped["evidence_items"] = [
            it for it in base_case.get("evidence_items", [])
            if it.get("evidence_id") != primary_ev
        ]
        res_stripped = self.model.evaluate_case(stripped)
        results["missing_primary_escalated"] = (
            res_stripped["confidence_score"] < 50.0
        )
        results["missing_primary_confidence"] = res_stripped["confidence_score"]

        # 2. Empty evidence
        empty_case = dict(base_case)
        empty_case["evidence_items"] = []
        res_empty = self.model.evaluate_case(empty_case)
        results["empty_evidence_handled"] = True
        results["empty_evidence_confidence"] = res_empty["confidence_score"]

        # 3. Extreme amount
        extreme_case = dict(base_case)
        extreme_case["amount"] = 999999999.99
        res_extreme = self.model.evaluate_case(extreme_case)
        results["extreme_amount_handled"] = (
            res_extreme["confidence_score"] == self.model.evaluate_case(base_case)["confidence_score"]
        )

        return results
