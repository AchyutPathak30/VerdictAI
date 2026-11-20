"""
Automated PyTest Test Suite for Trained Fair-Weighing ML Pipeline
Author: Akshay Purohit (202512033) - Senior ML Engineer
"""

import os
import sys
# Ensure workspace root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
import pytest
import numpy as np

from akshay_ml_fairweighing.feature_extractor import (
    extract_features_from_case,
    FEATURE_NAMES,
    NUM_FEATURES
)
from akshay_ml_fairweighing.serving import TrainedFairWeighingModel


@pytest.fixture(scope="module")
def trained_model():
    """Returns initialized TrainedFairWeighingModel instance."""
    return TrainedFairWeighingModel()


def test_feature_vector_length_fixed():
    """Verify feature vector length is fixed and exactly equals len(FEATURE_NAMES)."""
    case = {
        "case_id": "TEST-001",
        "dispute_category_id": "CAT-01",
        "amount": 2500.0,
        "evidence_items": [
            {"evidence_id": "EV-01", "status": "Present", "quality_score": 0.95, "favours": "NEUTRAL"},
            {"evidence_id": "EV-03", "status": "Present", "quality_score": 0.88, "favours": "MERCHANT"}
        ]
    }
    vec = extract_features_from_case(case)
    assert isinstance(vec, np.ndarray)
    assert vec.dtype == np.float32
    assert len(vec) == len(FEATURE_NAMES)
    assert len(vec) == NUM_FEATURES


def test_missing_evidence_does_not_crash():
    """Verify that empty, malformed, or missing evidence fields never crash the pipeline."""
    # Empty case
    vec_empty = extract_features_from_case({})
    assert len(vec_empty) == NUM_FEATURES
    
    # Case with None and invalid values
    malformed_case = {
        "case_id": None,
        "dispute_category_id": "INVALID_CAT",
        "amount": "NOT_A_NUMBER",
        "evidence_items": None
    }
    vec_malformed = extract_features_from_case(malformed_case)
    assert len(vec_malformed) == NUM_FEATURES
    assert not np.isnan(vec_malformed).any()


def test_probabilities_sum_to_one(trained_model):
    """Verify predicted calibrated probabilities sum to 1.0 (+/- 1e-6)."""
    sample_case = {
        "case_id": "TEST-PROB-001",
        "dispute_category_id": "CAT-01",
        "amount": 1500.0,
        "evidence_items": [
            {"evidence_id": "EV-01", "status": "Present", "quality_score": 0.95, "favours": "NEUTRAL"},
            {"evidence_id": "EV-09", "status": "Present", "quality_score": 0.90, "favours": "CARD_MEMBER"}
        ]
    }
    res = trained_model.evaluate_case(sample_case)
    probs = res["calibrated_probabilities"]
    total_prob = probs["CARD_MEMBER_FAVOUR"] + probs["MERCHANT_FAVOUR"] + probs["ESCALATE"]
    assert pytest.approx(total_prob, abs=1e-5) == 1.0


def test_determinism(trained_model):
    """Verify the exact same case input produces identical probabilities and resolution."""
    sample_case = {
        "case_id": "TEST-DET-001",
        "dispute_category_id": "CAT-03",
        "amount": 4200.0,
        "evidence_items": [
            {"evidence_id": "EV-01", "status": "Present", "quality_score": 0.95, "favours": "NEUTRAL"},
            {"evidence_id": "EV-08", "status": "Present", "quality_score": 0.98, "favours": "MERCHANT"},
            {"evidence_id": "EV-09", "status": "Present", "quality_score": 0.85, "favours": "CARD_MEMBER"}
        ]
    }
    res1 = trained_model.evaluate_case(sample_case)
    res2 = trained_model.evaluate_case(sample_case)
    
    assert res1["recommended_resolution"] == res2["recommended_resolution"]
    assert res1["confidence_score"] == res2["confidence_score"]
    assert res1["calibrated_probabilities"] == res2["calibrated_probabilities"]


def test_strong_cardholder_evidence_favours_card_member(trained_model):
    """Verify strong cardholder evidence with missing primary carrier tracking resolves in favor of cardholder."""
    cardholder_case = {
        "case_id": "TEST-STRONG-CM",
        "dispute_category_id": "CAT-01", # Item Not Received
        "amount": 3500.0,
        "evidence_items": [
            {"evidence_id": "EV-01", "status": "Present", "quality_score": 0.95, "favours": "NEUTRAL"},
            {"evidence_id": "EV-09", "status": "Present", "quality_score": 0.95, "favours": "CARD_MEMBER"},
            {"evidence_id": "EV-05", "status": "Present", "quality_score": 0.90, "favours": "CARD_MEMBER"},
            {"evidence_id": "EV-03", "status": "Missing", "quality_score": 0.0, "favours": "NEUTRAL"} # Missing delivery proof
        ]
    }
    res = trained_model.evaluate_case(cardholder_case)
    assert res["recommended_resolution"] == "CARD_MEMBER_FAVOUR"
    assert res["card_member_score"] > res["merchant_score"]
    assert res["confidence_score"] >= 50.0


def test_strong_merchant_evidence_favours_merchant(trained_model):
    """Verify strong merchant proof (delivery POD, biometric 2FA, POS invoice) resolves in favor of merchant."""
    merchant_case = {
        "case_id": "TEST-STRONG-MR",
        "dispute_category_id": "CAT-03", # Unauthorized charge claimed
        "amount": 9500.0,
        "evidence_items": [
            {"evidence_id": "EV-01", "status": "Present", "quality_score": 1.0, "favours": "NEUTRAL"},
            {"evidence_id": "EV-08", "status": "Present", "quality_score": 0.98, "favours": "MERCHANT"}, # Verified 2FA OTP/Biometric
            {"evidence_id": "EV-02", "status": "Present", "quality_score": 0.95, "favours": "MERCHANT"}, # Signed POS invoice
            {"evidence_id": "EV-04", "status": "Present", "quality_score": 0.90, "favours": "MERCHANT"},
            {"evidence_id": "EV-09", "status": "Present", "quality_score": 0.75, "favours": "CARD_MEMBER"}
        ]
    }
    res = trained_model.evaluate_case(merchant_case)
    assert res["recommended_resolution"] == "MERCHANT_FAVOUR"
    assert res["merchant_score"] > res["card_member_score"]
    assert res["confidence_score"] >= 50.0


def test_empty_or_conflicting_evidence_escalates(trained_model):
    """Verify conflicting or heavily ambiguous evidence results in low confidence or ESCALATE."""
    conflicting_case = {
        "case_id": "TEST-CONFLICT-001",
        "dispute_category_id": "CAT-02",
        "amount": 18000.0,
        "evidence_items": [
            {"evidence_id": "EV-01", "status": "Present", "quality_score": 0.95, "favours": "NEUTRAL"},
            {"evidence_id": "EV-09", "status": "Present", "quality_score": 0.85, "favours": "CARD_MEMBER"},
            {"evidence_id": "EV-04", "status": "Present", "quality_score": 0.85, "favours": "MERCHANT"},
            {"evidence_id": "EV-06", "status": "Missing", "quality_score": 0.0, "favours": "NEUTRAL"}
        ]
    }
    res = trained_model.evaluate_case(conflicting_case)
    # Must either be ESCALATE or low confidence
    assert (res["recommended_resolution"] == "ESCALATE") or (res["escalation_probability"] > 30.0)


def test_shadow_mode(trained_model):
    """Verify shadow mode executes legacy rule engine side-by-side without error."""
    case = {
        "case_id": "TEST-SHADOW-001",
        "dispute_category_id": "CAT-01",
        "amount": 2000.0,
        "evidence_items": [
            {"evidence_id": "EV-01", "status": "Present", "quality_score": 0.95, "favours": "NEUTRAL"},
            {"evidence_id": "EV-03", "status": "Present", "quality_score": 0.90, "favours": "MERCHANT"},
            {"evidence_id": "EV-09", "status": "Present", "quality_score": 0.85, "favours": "CARD_MEMBER"}
        ]
    }
    res = trained_model.evaluate_case(case, shadow_mode=True)
    assert "shadow_comparison" in res
    assert "legacy_resolution" in res["shadow_comparison"]
    assert "legacy_confidence" in res["shadow_comparison"]
    assert "agreement" in res["shadow_comparison"]
