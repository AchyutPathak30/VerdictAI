"""
VerdictAI Continuous Model Evaluation & Distribution Drift Monitor
Project: Frictionless Dispute & Chargeback Resolution (VerdictAI)
Author: Akshay Purohit (202512033) - ML Engineer (Fair-Weighing Model)
Phase: Phase 6 - Continuous Testing, Optimization & Model Governance
Coverage: SRS FR-15, NFR-14 (FPR < 5%, Distribution Stability)
"""

import math
import logging
from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional, Tuple
from collections import Counter

from akshay_ml_fairweighing.phase3_model.fair_weighing_model import FairWeighingModel

logger = logging.getLogger("ModelDriftMonitor")


@dataclass
class DriftReport:
    total_evaluations: int
    baseline_distribution: Dict[str, float]
    current_distribution: Dict[str, float]
    population_stability_index: float
    drift_status: str  # "STABLE", "MODERATE_DRIFT", "SIGNIFICANT_DRIFT"
    drift_alert_triggered: bool
    false_positive_rate: float
    fpr_compliant_nfr14: bool  # FPR < 5% per NFR-14
    category_win_rates: Dict[str, Dict[str, float]]


class ModelDriftMonitor:
    """
    Continuous evaluation engine tracking concept drift, prediction distribution stability,
    and statutory error rate bounds (NFR-14 FPR < 5%) across operational dispute batches.
    """

    PSI_THRESHOLD_STABLE = 0.10
    PSI_THRESHOLD_ACTION = 0.25
    FPR_CEILING_NFR14 = 0.05  # NFR-14: False Positive Rate < 5%

    def __init__(self, model: Optional[FairWeighingModel] = None):
        self.model = model or FairWeighingModel()

    @staticmethod
    def calculate_psi(expected_dist: Dict[str, float], actual_dist: Dict[str, float]) -> float:
        """
        Calculates Population Stability Index (PSI) between baseline and observed prediction distributions.
        """
        all_keys = set(expected_dist.keys()).union(set(actual_dist.keys()))
        psi = 0.0
        eps = 1e-4  # Smoothing epsilon

        for k in all_keys:
            exp_p = expected_dist.get(k, eps)
            act_p = actual_dist.get(k, eps)
            # Ensure non-zero
            exp_p = max(exp_p, eps)
            act_p = max(act_p, eps)
            psi += (act_p - exp_p) * math.log(act_p / exp_p)

        return round(psi, 4)

    def evaluate_batch_drift(
        self,
        current_cases: List[Dict[str, Any]],
        baseline_distribution: Optional[Dict[str, float]] = None
    ) -> DriftReport:
        """
        Evaluates current operational batch against expected baseline distribution.
        """
        if baseline_distribution is None:
            # Calibrated baseline distribution: ~45% Card Member, ~40% Merchant, ~15% Escalation
            baseline_distribution = {
                "CARD_MEMBER_FAVOUR": 0.45,
                "MERCHANT_FAVOUR": 0.40,
                "ESCALATE": 0.15
            }

        outcomes = []
        cat_outcomes: Dict[str, List[str]] = {}
        false_positives = 0
        true_negatives = 0

        for c in current_cases:
            res = self.model.evaluate_case(c)
            conf = res["confidence_score"]
            raw_res = res["recommended_resolution"]
            cat_id = c.get("dispute_category_id", "CAT-01")

            outcome = raw_res if conf >= 50.0 else "ESCALATE"
            outcomes.append(outcome)

            if cat_id not in cat_outcomes:
                cat_outcomes[cat_id] = []
            cat_outcomes[cat_id].append(outcome)

            # Check ground truth for FPR calculation (Card Member wrongful denial)
            gt = c.get("ground_truth_resolution")
            if gt:
                if gt != "CARD_MEMBER_FAVOUR" and outcome == "CARD_MEMBER_FAVOUR":
                    false_positives += 1
                elif gt != "CARD_MEMBER_FAVOUR" and outcome != "CARD_MEMBER_FAVOUR":
                    true_negatives += 1

        total = len(outcomes)
        counts = Counter(outcomes)
        curr_dist = {k: round(v / total, 4) for k, v in counts.items()} if total > 0 else {}

        psi = self.calculate_psi(baseline_distribution, curr_dist)

        if psi < self.PSI_THRESHOLD_STABLE:
            status = "STABLE"
            alert = False
        elif psi < self.PSI_THRESHOLD_ACTION:
            status = "MODERATE_DRIFT"
            alert = False
        else:
            status = "SIGNIFICANT_DRIFT"
            alert = True

        fpr_denominator = false_positives + true_negatives
        fpr = (false_positives / fpr_denominator) if fpr_denominator > 0 else 0.0
        fpr_compliant = fpr <= self.FPR_CEILING_NFR14

        # Category win-rate breakdown
        cat_win_rates = {}
        for cat, c_outs in cat_outcomes.items():
            c_total = len(c_outs)
            c_counts = Counter(c_outs)
            cat_win_rates[cat] = {
                k: round(v / c_total, 3) for k, v in c_counts.items()
            }

        return DriftReport(
            total_evaluations=total,
            baseline_distribution=baseline_distribution,
            current_distribution=curr_dist,
            population_stability_index=psi,
            drift_status=status,
            drift_alert_triggered=alert,
            false_positive_rate=round(fpr, 4),
            fpr_compliant_nfr14=fpr_compliant,
            category_win_rates=cat_win_rates
        )
