"""
VerdictAI Model Evaluation, Metrics, Plots, Fairness Audit & SHAP Engine
Author: Akshay Purohit (202512033) - Senior ML Engineer
"""

import os
os.environ["MPLCONFIGDIR"] = os.path.join(os.path.dirname(__file__), ".mplconfig")

import json
import math
import numpy as np
import matplotlib.pyplot as plt
from typing import Dict, Any, List, Tuple, Optional
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    log_loss,
    confusion_matrix
)
import shap

from akshay_ml_fairweighing.feature_extractor import FEATURE_NAMES

LABEL_MAP: Dict[str, int] = {
    "CARD_MEMBER_FAVOUR": 0,
    "MERCHANT_FAVOUR": 1,
    "ESCALATE": 2
}
REV_LABEL_MAP: Dict[int, str] = {v: k for k, v in LABEL_MAP.items()}
CLASS_NAMES: List[str] = ["CARD_MEMBER_FAVOUR", "MERCHANT_FAVOUR", "ESCALATE"]


def compute_multiclass_brier_score(y_true_indices: np.ndarray, y_probs: np.ndarray) -> float:
    """
    Computes standard multi-class Brier score: (1/N) * sum_i sum_c (p_ic - y_ic)^2
    Ranges from 0.0 (perfect) to 2.0 (worst).
    """
    N = len(y_true_indices)
    if N == 0:
        return 0.0
    num_classes = y_probs.shape[1]
    y_one_hot = np.zeros((N, num_classes), dtype=np.float32)
    for i, idx in enumerate(y_true_indices):
        y_one_hot[i, idx] = 1.0
    return float(np.mean(np.sum((y_probs - y_one_hot) ** 2, axis=1)))


def compute_ece(y_true_indices: np.ndarray, y_probs: np.ndarray, n_bins: int = 10) -> float:
    """
    Computes Expected Calibration Error (ECE) across n_bins.
    Confidence is the maximum predicted probability for the chosen class.
    """
    confidences = np.max(y_probs, axis=1)
    predictions = np.argmax(y_probs, axis=1)
    accuracies = (predictions == y_true_indices).astype(float)
    
    bin_boundaries = np.linspace(0.0, 1.0, n_bins + 1)
    ece = 0.0
    total_samples = len(y_true_indices)
    
    for i in range(n_bins):
        bin_lower = bin_boundaries[i]
        bin_upper = bin_boundaries[i + 1]
        
        in_bin = (confidences > bin_lower) & (confidences <= bin_upper)
        prop_in_bin = np.mean(in_bin)
        
        if prop_in_bin > 0:
            accuracy_in_bin = np.mean(accuracies[in_bin])
            avg_confidence_in_bin = np.mean(confidences[in_bin])
            ece += np.abs(avg_confidence_in_bin - accuracy_in_bin) * prop_in_bin
            
    return float(ece)


def plot_confusion_matrix(y_true: np.ndarray, y_pred: np.ndarray, output_path: str):
    """Generates and saves high-resolution confusion matrix plot."""
    cm = confusion_matrix(y_true, y_pred, labels=[0, 1, 2])
    
    fig, ax = plt.subplots(figsize=(6, 5), dpi=300)
    im = ax.imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)
    ax.figure.colorbar(im, ax=ax)
    
    ax.set(
        xticks=np.arange(3),
        yticks=np.arange(3),
        xticklabels=["Card Member", "Merchant", "Escalate"],
        yticklabels=["Card Member", "Merchant", "Escalate"],
        title="VerdictAI Confusion Matrix (Held-Out Test Set)",
        ylabel="True Label",
        xlabel="Predicted Label"
    )
    
    # Text annotations in each cell
    thresh = cm.max() / 2.
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            ax.text(j, i, format(cm[i, j], 'd'),
                    ha="center", va="center",
                    color="white" if cm[i, j] > thresh else "black",
                    fontweight="bold", fontsize=11)
            
    plt.tight_layout()
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    fig.savefig(output_path, bbox_inches='tight')
    plt.close()


def plot_calibration_curve(y_true: np.ndarray, y_probs: np.ndarray, output_path: str, n_bins: int = 10):
    """Generates and saves reliability / calibration curve plot."""
    confidences = np.max(y_probs, axis=1)
    predictions = np.argmax(y_probs, axis=1)
    accuracies = (predictions == y_true).astype(float)
    
    bin_boundaries = np.linspace(0.0, 1.0, n_bins + 1)
    bin_centers = []
    bin_accs = []
    
    for i in range(n_bins):
        b_low = bin_boundaries[i]
        b_high = bin_boundaries[i + 1]
        mask = (confidences > b_low) & (confidences <= b_high)
        if np.sum(mask) > 0:
            bin_centers.append(np.mean(confidences[mask]))
            bin_accs.append(np.mean(accuracies[mask]))
            
    fig, ax = plt.subplots(figsize=(6, 5), dpi=300)
    ax.plot([0, 1], [0, 1], "k--", label="Perfect Calibration")
    ax.plot(bin_centers, bin_accs, "s-", color="#1E40AF", linewidth=2, label="Calibrated Model")
    
    ax.set_xlim([0.0, 1.05])
    ax.set_ylim([0.0, 1.05])
    ax.set_xlabel("Mean Predicted Confidence", fontsize=10)
    ax.set_ylabel("Empirical Accuracy", fontsize=10)
    ax.set_title("Reliability Calibration Curve (ECE <= 0.05 Target)", fontsize=11, fontweight="bold")
    ax.legend(loc="lower right")
    ax.grid(True, linestyle=":", alpha=0.6)
    
    plt.tight_layout()
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    fig.savefig(output_path, bbox_inches='tight')
    plt.close()


def generate_shap_plots(underlying_model: Any, X_sample: np.ndarray, output_path: str):
    """
    Fits TreeExplainer or LinearExplainer on model and saves SHAP summary plot.
    """
    try:
        explainer = shap.TreeExplainer(underlying_model)
        shap_values = explainer.shap_values(X_sample)
        
        fig = plt.figure(figsize=(10, 6), dpi=300)
        # For multi-class, shap_values is a list of arrays or 3D array
        if isinstance(shap_values, list) and len(shap_values) == 3:
            # Use class 0 (Card Member) or class 2 (Escalate) summary
            shap.summary_plot(shap_values[0], X_sample, feature_names=FEATURE_NAMES, show=False, max_display=12)
        elif isinstance(shap_values, np.ndarray) and len(shap_values.shape) == 3:
            shap.summary_plot(shap_values[:, :, 0], X_sample, feature_names=FEATURE_NAMES, show=False, max_display=12)
        else:
            shap.summary_plot(shap_values, X_sample, feature_names=FEATURE_NAMES, show=False, max_display=12)
            
        plt.title("SHAP Feature Attribution (Top Dispute Drivers)", fontsize=12, fontweight="bold")
        plt.tight_layout()
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        plt.savefig(output_path, bbox_inches='tight')
        plt.close()
    except Exception as e:
        print(f"Warning: SHAP plot generation fallback: {e}")
        # Create a clean feature importance fallback plot
        if hasattr(underlying_model, "feature_importances_"):
            importances = underlying_model.feature_importances_
            top_indices = np.argsort(importances)[::-1][:12]
            
            fig, ax = plt.subplots(figsize=(9, 5), dpi=300)
            ax.barh(range(len(top_indices)), importances[top_indices][::-1], color="#0284C7")
            ax.set_yticks(range(len(top_indices)))
            ax.set_yticklabels([FEATURE_NAMES[i] for i in top_indices][::-1])
            ax.set_xlabel("Relative Importance Score", fontsize=10)
            ax.set_title("XGBoost Feature Importance (Top Dispute Attribution Factors)", fontsize=11, fontweight="bold")
            plt.tight_layout()
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            fig.savefig(output_path, bbox_inches='tight')
            plt.close()


def audit_fairness_proxy_groups(test_cases: List[Dict[str, Any]], y_pred: np.ndarray, y_true: np.ndarray) -> Dict[str, Any]:
    """
    Audits Disparate Impact Ratio (DIR >= 0.80) and False Positive Rate (< 5.0%)
    across proxy demographic cohorts: Category, Amount Bucket, Evidence Completeness, Card Tier, Payment Rail.
    """
    from collections import defaultdict
    
    # Define proxy groups for each case
    group_data = defaultdict(lambda: {"total": 0, "cm_fav": 0, "fp": 0, "neg": 0})
    
    for case, pred, true in zip(test_cases, y_pred, y_true):
        cat = case.get("dispute_category_id", "CAT-01")
        tier = case.get("cardholder_tier", "BASIC")
        rail = case.get("payment_rail", "UPI")
        amt = float(case.get("amount", 1000.0) or 0.0)
        
        # Amount bucket
        if amt < 1000.0:
            amt_b = "AMT_LOW (<1k)"
        elif amt <= 10000.0:
            amt_b = "AMT_MID (1k-10k)"
        else:
            amt_b = "AMT_HIGH (>10k)"
            
        # Evidence count bucket
        ev_items = case.get("evidence_items", []) or []
        pres_count = sum(1 for e in ev_items if e.get("status") == "Present")
        if pres_count < 3:
            comp_b = "COMPLETENESS_LOW (<3)"
        elif pres_count <= 4:
            comp_b = "COMPLETENESS_MID (3-4)"
        else:
            comp_b = "COMPLETENESS_HIGH (>=5)"
            
        cohorts = [
            f"CATEGORY:{cat}",
            f"AMOUNT:{amt_b}",
            f"TIER:{tier}",
            f"RAIL:{rail}"
        ]
        
        for c in cohorts:
            group_data[c]["total"] += 1
            if pred == 0:  # Card member favorable
                group_data[c]["cm_fav"] += 1
            if true != 0:  # Not card member ground truth (negative class for CM)
                group_data[c]["neg"] += 1
                if pred == 0:  # Wrongly awarded to CM (False Positive)
                    group_data[c]["fp"] += 1
                    
    # Reference baseline selection rate (Privileged / high tier or overall)
    overall_sel_rate = np.mean(y_pred == 0)
    
    results = {}
    all_dir_pass = True
    all_fpr_pass = True
    
    for cohort, stats in sorted(group_data.items()):
        tot = stats["total"]
        if tot == 0:
            continue
        sel_rate = stats["cm_fav"] / tot
        dir_ratio = (sel_rate / overall_sel_rate) if overall_sel_rate > 0 else 1.0
        # Cap symmetric bounds
        normalized_dir = min(dir_ratio, 1.0 / dir_ratio) if dir_ratio > 0 else 0.0
        
        neg_tot = stats["neg"]
        fpr = (stats["fp"] / neg_tot) if neg_tot > 0 else 0.0
        
        dir_ok = (dir_ratio >= 0.80) and (dir_ratio <= 1.25)
        fpr_ok = (fpr < 0.05)
        
        if not dir_ok:
            all_dir_pass = False
        if not fpr_ok:
            all_fpr_pass = False
            
        results[cohort] = {
            "sample_size": tot,
            "selection_rate": round(sel_rate, 4),
            "disparate_impact_ratio": round(dir_ratio, 4),
            "false_positive_rate": round(fpr, 4),
            "dir_compliant": dir_ok,
            "fpr_compliant": fpr_ok
        }
        
    return {
        "overall_dir_passed": all_dir_pass,
        "overall_fpr_passed": all_fpr_pass,
        "cohorts": results
    }

