"""
VerdictAI Dispute Model Training & Cross-Validation Engine
Trains and calibrates XGBoost multi-class classifier and baseline models.
Author: Akshay Purohit (202512033) - Senior ML Engineer
"""

import os
import sys
# Ensure workspace root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import json
import joblib
import numpy as np
from typing import Dict, Any, Tuple, Optional, List
from sklearn.model_selection import StratifiedKFold, cross_validate, train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, log_loss
from xgboost import XGBClassifier

from akshay_ml_fairweighing.feature_extractor import extract_features_from_case, FEATURE_NAMES
from akshay_ml_fairweighing.evaluate_model import (
    LABEL_MAP,
    REV_LABEL_MAP,
    compute_multiclass_brier_score,
    compute_ece,
    plot_confusion_matrix,
    plot_calibration_curve,
    generate_shap_plots,
    audit_fairness_proxy_groups
)
from akshay_ml_fairweighing.phase3_model.fair_weighing_model import FairWeighingModel


def load_dataset(dataset_path: str) -> List[Dict[str, Any]]:
    with open(dataset_path, "r") as f:
        data = json.load(f)
    if isinstance(data, dict):
        return data.get("cases", [])
    return data


def evaluate_rule_engine_baseline(test_cases: List[Dict[str, Any]], y_test: np.ndarray) -> Dict[str, Any]:
    """Evaluates the legacy rule-based FairWeighingModel on the held-out test set."""
    rule_model = FairWeighingModel()
    y_pred = []
    
    for case in test_cases:
        res = rule_model.evaluate_case(case)
        rec = res.get("recommended_resolution", "ESCALATE")
        if rec in LABEL_MAP:
            y_pred.append(LABEL_MAP[rec])
        else:
            y_pred.append(2) # Default ESCALATE
            
    y_pred = np.array(y_pred)
    acc = accuracy_score(y_test, y_pred)
    macro_f1 = f1_score(y_test, y_pred, average="macro")
    prec_per_class = precision_score(y_test, y_pred, average=None, zero_division=0)
    rec_per_class = recall_score(y_test, y_pred, average=None, zero_division=0)
    f1_per_class = f1_score(y_test, y_pred, average=None, zero_division=0)
    
    return {
        "model_name": "Legacy Rule-Engine Baseline",
        "accuracy": round(float(acc), 4),
        "macro_f1": round(float(macro_f1), 4),
        "escalate_recall": round(float(rec_per_class[2]), 4),
        "precision_per_class": [round(float(p), 4) for p in prec_per_class],
        "recall_per_class": [round(float(r), 4) for r in rec_per_class],
        "f1_per_class": [round(float(f), 4) for f in f1_per_class],
        "predictions": y_pred
    }


def train_and_evaluate(
    dataset_path: str,
    xgb_params: Optional[Dict[str, Any]] = None,
    calibration_method: str = "sigmoid",
    artifacts_dir: Optional[str] = None
) -> Dict[str, Any]:
    """
    Complete train, CV, calibration, and test evaluation pipeline.
    """
    if artifacts_dir is None:
        artifacts_dir = os.path.join(os.path.dirname(__file__), "artifacts")
    os.makedirs(artifacts_dir, exist_ok=True)
    
    cases = load_dataset(dataset_path)
    X = np.array([extract_features_from_case(c) for c in cases], dtype=np.float32)
    y = np.array([LABEL_MAP[c["ground_truth_resolution"]] for c in cases], dtype=np.int64)
    
    # Stratified 80/20 train/test split (fixed seed=42)
    case_indices = np.arange(len(cases))
    train_idx, test_idx = train_test_split(
        case_indices,
        test_size=0.20,
        random_state=42,
        stratify=y
    )
    
    X_train, X_test = X[train_idx], X[test_idx]
    y_train, y_test = y[train_idx], y[test_idx]
    test_cases = [cases[i] for i in test_idx]
    
    # -------------------------------------------------------------
    # 1. Evaluate Rule-Engine Baseline on Test Set
    # -------------------------------------------------------------
    rule_baseline_results = evaluate_rule_engine_baseline(test_cases, y_test)
    
    # -------------------------------------------------------------
    # 2. Train Multinomial Logistic Regression Baseline
    # -------------------------------------------------------------
    lr_baseline = LogisticRegression(
        penalty='l2',
        C=1.0,
        max_iter=1000,
        random_state=42
    )
    # 5-fold CV on train set
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    lr_cv = cross_validate(lr_baseline, X_train, y_train, cv=skf, scoring=["accuracy", "f1_macro"])
    lr_baseline.fit(X_train, y_train)
    lr_preds = lr_baseline.predict(X_test)
    lr_probs = lr_baseline.predict_proba(X_test)
    
    lr_results = {
        "model_name": "Multinomial Logistic Regression Baseline",
        "cv_accuracy_mean": round(float(np.mean(lr_cv["test_accuracy"])), 4),
        "cv_accuracy_std": round(float(np.std(lr_cv["test_accuracy"])), 4),
        "cv_f1_macro_mean": round(float(np.mean(lr_cv["test_f1_macro"])), 4),
        "test_accuracy": round(float(accuracy_score(y_test, lr_preds)), 4),
        "test_macro_f1": round(float(f1_score(y_test, lr_preds, average="macro")), 4),
        "escalate_recall": round(float(recall_score(y_test, lr_preds, average=None, zero_division=0)[2]), 4),
        "brier_score": round(compute_multiclass_brier_score(y_test, lr_probs), 4),
        "ece": round(compute_ece(y_test, lr_probs), 4)
    }
    
    # -------------------------------------------------------------
    # 3. Train Primary XGBoost Model + Calibration
    # -------------------------------------------------------------
    default_xgb_params = {
        "n_estimators": 160,
        "max_depth": 4,
        "learning_rate": 0.07,
        "subsample": 0.85,
        "colsample_bytree": 0.85,
        "objective": "multi:softprob",
        "num_class": 3,
        "random_state": 42,
        "eval_metric": "mlogloss"
    }
    if xgb_params:
        default_xgb_params.update(xgb_params)
        
    base_xgb = XGBClassifier(**default_xgb_params)
    
    # 5-Fold Stratified Cross-Validation on Train Set
    xgb_cv = cross_validate(base_xgb, X_train, y_train, cv=skf, scoring=["accuracy", "f1_macro"])
    cv_acc_mean = float(np.mean(xgb_cv["test_accuracy"]))
    cv_acc_std = float(np.std(xgb_cv["test_accuracy"]))
    cv_f1_mean = float(np.mean(xgb_cv["test_f1_macro"]))
    
    # Fit base model on train set for SHAP and feature inspection
    base_xgb.fit(X_train, y_train)
    train_acc = float(accuracy_score(y_train, base_xgb.predict(X_train)))
    
    # Wrap in CalibratedClassifierCV
    calibrated_xgb = CalibratedClassifierCV(
        estimator=base_xgb,
        method=calibration_method,
        cv=5
    )
    calibrated_xgb.fit(X_train, y_train)
    
    # Evaluate on held-out test set
    y_test_pred = calibrated_xgb.predict(X_test)
    y_test_prob = calibrated_xgb.predict_proba(X_test)
    
    test_acc = float(accuracy_score(y_test, y_test_pred))
    test_macro_f1 = float(f1_score(y_test, y_test_pred, average="macro"))
    prec_per_class = precision_score(y_test, y_test_pred, average=None, zero_division=0)
    rec_per_class = recall_score(y_test, y_test_pred, average=None, zero_division=0)
    f1_per_class = f1_score(y_test, y_test_pred, average=None, zero_division=0)
    
    brier = compute_multiclass_brier_score(y_test, y_test_prob)
    ece = compute_ece(y_test, y_test_prob)
    logloss = float(log_loss(y_test, y_test_prob))
    train_test_gap = float(abs(train_acc - test_acc))
    
    # -------------------------------------------------------------
    # 4. Generate Visual Plots & Artifacts
    # -------------------------------------------------------------
    cm_path = os.path.join(artifacts_dir, "confusion_matrix.png")
    calib_path = os.path.join(artifacts_dir, "calibration_curve.png")
    shap_path = os.path.join(artifacts_dir, "shap_summary.png")
    
    plot_confusion_matrix(y_test, y_test_pred, cm_path)
    plot_calibration_curve(y_test, y_test_prob, calib_path)
    generate_shap_plots(base_xgb, X_test[:200], shap_path)
    
    # -------------------------------------------------------------
    # 5. Fairness Audit across Proxy Demographic Cohorts
    # -------------------------------------------------------------
    fairness_results = audit_fairness_proxy_groups(test_cases, y_test_pred, y_test)
    
    # -------------------------------------------------------------
    # 6. Top Feature Importances & Leakage Check
    # -------------------------------------------------------------
    importances = base_xgb.feature_importances_
    sorted_idx = np.argsort(importances)[::-1]
    top_features = [{"feature": FEATURE_NAMES[i], "importance": round(float(importances[i]), 4)} for i in sorted_idx[:10]]
    
    # -------------------------------------------------------------
    # 7. Save Best Calibrated Model Artifact
    # -------------------------------------------------------------
    model_artifact_path = os.path.join(artifacts_dir, "verdictai_xgb_model.joblib")
    artifact_payload = {
        "model": calibrated_xgb,
        "base_model": base_xgb,
        "feature_names": FEATURE_NAMES,
        "label_map": LABEL_MAP,
        "rev_label_map": REV_LABEL_MAP,
        "calibration_method": calibration_method,
        "xgb_params": default_xgb_params
    }
    joblib.dump(artifact_payload, model_artifact_path)
    
    # Target checks
    beats_rule = (test_macro_f1 - rule_baseline_results["macro_f1"]) >= 0.03
    targets_status = {
        "macro_f1_target": (test_macro_f1 >= 0.85, test_macro_f1, ">= 0.85"),
        "accuracy_target": (test_acc >= 0.88, test_acc, ">= 0.88"),
        "ece_target": (ece <= 0.05, ece, "<= 0.05"),
        "escalate_recall_target": (rec_per_class[2] >= 0.80, rec_per_class[2], ">= 0.80"),
        "cv_std_target": (cv_acc_std <= 0.02, cv_acc_std, "<= 0.02"),
        "train_test_gap_target": (train_test_gap <= 0.05, train_test_gap, "<= 0.05"),
        "beats_rule_engine": (beats_rule, test_macro_f1 - rule_baseline_results["macro_f1"], ">= +0.03"),
        "fairness_dir_passed": (fairness_results["overall_dir_passed"], None, "DIR >= 0.80"),
        "fairness_fpr_passed": (fairness_results["overall_fpr_passed"], None, "FPR < 0.05"),
    }
    all_targets_passed = all(v[0] for v in targets_status.values())
    
    results = {
        "all_targets_passed": all_targets_passed,
        "targets_status": targets_status,
        "metrics": {
            "test_accuracy": round(test_acc, 4),
            "test_macro_f1": round(test_macro_f1, 4),
            "train_accuracy": round(train_acc, 4),
            "train_test_gap": round(train_test_gap, 4),
            "cv_accuracy_mean": round(cv_acc_mean, 4),
            "cv_accuracy_std": round(cv_acc_std, 4),
            "cv_macro_f1_mean": round(cv_f1_mean, 4),
            "brier_score": round(brier, 4),
            "ece": round(ece, 4),
            "log_loss": round(logloss, 4),
            "precision_per_class": [round(float(p), 4) for p in prec_per_class],
            "recall_per_class": [round(float(r), 4) for r in rec_per_class],
            "f1_per_class": [round(float(f), 4) for f in f1_per_class],
        },
        "baselines": {
            "rule_engine": rule_baseline_results,
            "logistic_regression": lr_results
        },
        "top_features": top_features,
        "fairness": fairness_results,
        "artifact_path": model_artifact_path
    }
    
    return results

if __name__ == "__main__":
    dataset_file = os.path.join(os.path.dirname(__file__), "phase2_mockdata", "synthetic_disputes_5000.json")
    print(f"Training on dataset: {dataset_file}")
    res = train_and_evaluate(dataset_file)
    print("Training Complete. Targets status:")
    for k, v in res["targets_status"].items():
        print(f"  {k}: {'PASS' if v[0] else 'FAIL'} (Val: {v[1]}, Target: {v[2]})")
