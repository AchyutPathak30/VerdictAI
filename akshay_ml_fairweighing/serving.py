"""
VerdictAI Dispute Resolution ML Serving Module
Loads trained calibrated XGBoost artifact and provides robust inference with SHAP explanations and shadow mode.
Author: Akshay Purohit (202512033) - Senior ML Engineer
"""

import os
import sys
# Ensure workspace root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import joblib
import numpy as np
from typing import Dict, Any, List, Optional
import shap

from akshay_ml_fairweighing.feature_extractor import extract_features_from_case, FEATURE_NAMES
from akshay_ml_fairweighing.phase3_model.fair_weighing_model import FairWeighingModel

DEFAULT_ARTIFACT_PATH = os.path.join(os.path.dirname(__file__), "artifacts", "verdictai_xgb_model.joblib")

REV_LABEL_MAP: Dict[int, str] = {
    0: "CARD_MEMBER_FAVOUR",
    1: "MERCHANT_FAVOUR",
    2: "ESCALATE"
}

HUMAN_READABLE_FEATURE_NAMES: Dict[str, str] = {
    "has_primary_evidence": "Primary Evidence Present",
    "primary_evidence_quality": "Primary Evidence Extraction Quality",
    "primary_evidence_favours_cm": "Primary Evidence Favours Card Member",
    "primary_evidence_favours_mr": "Primary Evidence Favours Merchant",
    "net_direction_score": "Net Evidence Directional Weight",
    "total_evidence_present": "Total Supporting Documents Uploaded",
    "cm_evidence_count": "Count of Evidence Supporting Cardholder",
    "mr_evidence_count": "Count of Evidence Supporting Merchant",
    "evidence_conflict_score": "Contradictory Evidence Conflict Score",
    "log1p_amount": "Transaction Disputed Amount",
    "ev_EV-01_present": "Bank Transaction Record Verified",
    "ev_EV-01_DUP_present": "Duplicate Bank Record Verified",
    "ev_EV-02_present": "Merchant POS Receipt Uploaded",
    "ev_EV-03_present": "Carrier Proof of Delivery / Tracking",
    "ev_EV-04_present": "Merchant Customer Service Transcript",
    "ev_EV-05_present": "Cardholder Communication Log",
    "ev_EV-06_present": "Product Description / Return Policy",
    "ev_EV-07_present": "Cancellation / Refund Timestamp Log",
    "ev_EV-08_present": "2FA / Biometric Authentication Log",
    "ev_EV-09_present": "Cardholder Dispute Narrative Statement",
    "ev_EV-10_present": "Photographic Condition Evidence"
}


class TrainedFairWeighingModel:
    """
    Production-grade ML serving adapter replacing rule-based heuristics with calibrated XGBoost.
    """
    def __init__(self, artifact_path: Optional[str] = None):
        self.artifact_path = artifact_path or DEFAULT_ARTIFACT_PATH
        if not os.path.exists(self.artifact_path):
            raise FileNotFoundError(f"Model artifact not found at: {self.artifact_path}. Please run train_dispute_model.py first.")
            
        data = joblib.load(self.artifact_path)
        self.model = data["model"]
        self.base_model = data.get("base_model", self.model)
        self.feature_names = data.get("feature_names", FEATURE_NAMES)
        self.legacy_model = FairWeighingModel()
        
        # Initialize SHAP explainer for uncalibrated base tree model
        self.explainer = None
        try:
            self.explainer = shap.TreeExplainer(self.base_model)
        except Exception as e:
            # Explainer fallback if SHAP tree explainer fails
            self.explainer = None

    def _extract_top_reasons(self, x_vec: np.ndarray, pred_class_idx: int) -> List[Dict[str, Any]]:
        """Computes top SHAP feature reasons or feature contribution impacts for the predicted class."""
        top_reasons = []
        try:
            if self.explainer is not None:
                shap_vals = self.explainer.shap_values(x_vec)
                # shap_vals for class pred_class_idx
                if isinstance(shap_vals, list) and len(shap_vals) == 3:
                    class_shap = shap_vals[pred_class_idx][0]
                elif isinstance(shap_vals, np.ndarray) and len(shap_vals.shape) == 3:
                    class_shap = shap_vals[0, :, pred_class_idx]
                else:
                    class_shap = shap_vals[0]
                    
                sorted_indices = np.argsort(np.abs(class_shap))[::-1]
                
                for idx in sorted_indices[:4]:
                    val = float(class_shap[idx])
                    feat_raw = self.feature_names[idx]
                    readable = HUMAN_READABLE_FEATURE_NAMES.get(feat_raw, feat_raw)
                    direction = "Positive Support" if val > 0 else "Dampening Effect"
                    top_reasons.append({
                        "feature": readable,
                        "raw_feature_name": feat_raw,
                        "impact_value": round(val, 4),
                        "effect": direction
                    })
                return top_reasons
        except Exception:
            pass
            
        # Fallback to feature importance weighting
        importances = getattr(self.base_model, "feature_importances_", None)
        if importances is not None:
            active_indices = np.where(x_vec[0] > 0)[0]
            if len(active_indices) > 0:
                ranked = sorted(active_indices, key=lambda i: importances[i] * x_vec[0, i], reverse=True)
                for idx in ranked[:4]:
                    feat_raw = self.feature_names[idx]
                    readable = HUMAN_READABLE_FEATURE_NAMES.get(feat_raw, feat_raw)
                    top_reasons.append({
                        "feature": readable,
                        "raw_feature_name": feat_raw,
                        "impact_value": round(float(importances[idx]), 4),
                        "effect": "Positive Support"
                    })
        return top_reasons

    def evaluate_case(self, case_data: Dict[str, Any], shadow_mode: bool = False) -> Dict[str, Any]:
        """
        Main evaluation entrypoint.
        Extracts features, runs calibrated inference, enforces safety guards, and extracts SHAP reasons.
        """
        # Validate input schema gracefully
        if not isinstance(case_data, dict):
            case_data = {}
            
        case_id = case_data.get("case_id", "UNKNOWN_CASE")
        cat_id = case_data.get("dispute_category_id", "CAT-01")
        
        # Feature extraction
        x_vec = extract_features_from_case(case_data).reshape(1, -1)
        
        # Calibrated class probabilities: [p_cm, p_mr, p_esc]
        probs = self.model.predict_proba(x_vec)[0]
        p_cm, p_mr, p_esc = float(probs[0]), float(probs[1]), float(probs[2])
        
        raw_pred_idx = int(np.argmax(probs))
        max_prob = float(np.max(probs))
        confidence = max_prob * 100.0
        
        # Safety Guard 1: If max probability is below 0.50, force ESCALATE
        if max_prob < 0.50:
            resolution = "ESCALATE"
            guard_triggered = True
        else:
            resolution = REV_LABEL_MAP.get(raw_pred_idx, "ESCALATE")
            guard_triggered = False

        # Safety Guard 2: Contradictory evidence deadlock without compelling primary proof
        try:
            has_primary = float(x_vec[0, self.feature_names.index("has_primary_evidence")])
            conflict_score = float(x_vec[0, self.feature_names.index("evidence_conflict_score")])
            net_dir = float(x_vec[0, self.feature_names.index("net_direction_score")])
            
            if conflict_score >= 1.0 and has_primary < 0.5 and abs(net_dir) < 0.35:
                resolution = "ESCALATE"
                guard_triggered = True
                if p_esc < 0.50:
                    p_esc = 0.65
                    rem = 1.0 - p_esc
                    tot = p_cm + p_mr if (p_cm + p_mr) > 0 else 1.0
                    p_cm = (p_cm / tot) * rem
                    p_mr = (p_mr / tot) * rem
                    confidence = p_esc * 100.0
        except Exception:
            pass
            
        # Extract SHAP top contributing reasons
        top_reasons = self._extract_top_reasons(x_vec, raw_pred_idx)
        
        # Normalize probabilities and guarantee exact sum to 1.0 without float rounding error
        p_tot = p_cm + p_mr + p_esc
        if p_tot > 0:
            p_cm /= p_tot
            p_mr /= p_tot
            p_esc /= p_tot
            
        r_cm = round(p_cm, 5)
        r_mr = round(p_mr, 5)
        r_esc = round(1.0 - r_cm - r_mr, 5)
        
        # Build human-readable explanations and audit payloads for backend compatibility
        contributing_factors = [
            f"{r['feature']} ({r['effect']}, impact {r['impact_value']:+.2f})" for r in top_reasons
        ]
        factors_summary = "; ".join([f"{r['feature']} ({r['effect']})" for r in top_reasons[:2]]) or "Evidence weights evaluated"
        plain_language_explanation = (
            f"The dispute has been resolved as {resolution.replace('_', ' ').title()} with {confidence:.1f}% confidence "
            f"based on calibrated machine learning analysis. Key driving factors: {factors_summary}."
        )
        
        factor_breakdown = []
        for r in top_reasons:
            factor_breakdown.append({
                "evidence_id": r.get("raw_feature_name", ""),
                "evidence_type": r.get("feature", ""),
                "status": "Evaluated",
                "contribution": r.get("impact_value", 0.0),
                "favours": "MERCHANT" if ("Merchant" in r.get("feature", "") or r.get("impact_value", 0) < 0) else "CARD_MEMBER"
            })
            
        audit_trail = {
            "model_version": "verdictai_xgb_v1.0",
            "model_type": "CalibratedClassifierCV(XGBClassifier)",
            "safety_guard_triggered": guard_triggered,
            "has_primary_evidence": bool(has_primary > 0.5) if "has_primary" in locals() else True,
            "calibrated_probabilities": {
                "CARD_MEMBER_FAVOUR": r_cm,
                "MERCHANT_FAVOUR": r_mr,
                "ESCALATE": r_esc
            }
        }
        
        result = {
            "case_id": case_id,
            "dispute_category_id": cat_id,
            "recommended_resolution": resolution,
            "confidence_score": round(confidence, 1),
            "card_member_score": round(r_cm * 100.0, 1),
            "merchant_score": round(r_mr * 100.0, 1),
            "escalation_probability": round(r_esc * 100.0, 1),
            "calibrated_probabilities": {
                "CARD_MEMBER_FAVOUR": r_cm,
                "MERCHANT_FAVOUR": r_mr,
                "ESCALATE": r_esc
            },
            "top_reasons": top_reasons,
            "contributing_factors": contributing_factors,
            "factor_breakdown": factor_breakdown,
            "plain_language_explanation": plain_language_explanation,
            "audit_trail": audit_trail,
            "safety_guard_triggered": guard_triggered,
            "model_architecture": "Calibrated XGBoost (Multi-Class 3-Way Classifier)",
            "model_version": "v1.0-trained"
        }
        
        # Shadow mode comparison with legacy rule engine
        if shadow_mode:
            try:
                legacy_res = self.legacy_model.evaluate_case(case_data)
                result["shadow_comparison"] = {
                    "legacy_resolution": legacy_res.get("recommended_resolution"),
                    "legacy_confidence": legacy_res.get("confidence_score"),
                    "legacy_cm_score": legacy_res.get("card_member_score"),
                    "legacy_mr_score": legacy_res.get("merchant_score"),
                    "agreement": (resolution == legacy_res.get("recommended_resolution"))
                }
            except Exception as e:
                result["shadow_comparison"] = {"error": str(e)}
                
        return result
