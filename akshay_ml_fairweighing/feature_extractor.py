"""
VerdictAI Dispute Feature Extractor
Extracts fixed-length numerical feature vectors from polymorphic dispute case JSONs.
Author: Akshay Purohit (202512033) - Senior ML Engineer
"""

import math
from typing import Dict, Any, List
import numpy as np

ALL_CATEGORIES: List[str] = [
    "CAT-01",  # Item Not Received
    "CAT-02",  # Damaged / Defective Merchandise
    "CAT-03",  # Unauthorized Transaction / Fraud
    "CAT-04",  # Duplicate Charge
    "CAT-05",  # Cancelled Recurring Subscription
    "CAT-06",  # Incorrect Amount Charged
    "CAT-07",  # General Chargeback / Terms Not Met
]

ALL_EVIDENCES: List[str] = [
    "EV-01",      # Transaction Record
    "EV-01_DUP",  # Duplicate Transaction Record
    "EV-02",      # Merchant Receipt
    "EV-03",      # Delivery Confirmation / Tracking
    "EV-04",      # Merchant Communication Log
    "EV-05",      # Card Member Communication Log
    "EV-06",      # Product / Service Description
    "EV-07",      # Refund / Cancellation Record
    "EV-08",      # Authentication Log / 2FA
    "EV-09",      # Dispute Reason Statement
    "EV-10",      # Photographic Evidence
]

PRIMARY_EVIDENCE_MAP: Dict[str, str] = {
    "CAT-01": "EV-03",      # Delivery tracking is primary for INR
    "CAT-02": "EV-06",      # Product description / photographic
    "CAT-03": "EV-08",      # 2FA / Biometric log is primary for fraud
    "CAT-04": "EV-01_DUP",  # Second transaction record for duplicate
    "CAT-05": "EV-07",      # Cancellation record for recurring
    "CAT-06": "EV-07",      # Refund or invoice for incorrect amount
    "CAT-07": "EV-04",      # Communication log for general
}

def _build_feature_names() -> List[str]:
    names = []
    # 1. Category one-hot
    for cat in ALL_CATEGORIES:
        names.append(f"cat_{cat}")
    
    # 2. Amount feature
    names.append("log1p_amount")
    
    # 3. Evidence items (11 * 3 = 33)
    for ev in ALL_EVIDENCES:
        names.append(f"ev_{ev}_present")
        names.append(f"ev_{ev}_quality")
        names.append(f"ev_{ev}_direction")
        
    # 4. Domain & Interaction features (9)
    names.append("has_primary_evidence")
    names.append("primary_evidence_quality")
    names.append("primary_evidence_favours_cm")
    names.append("primary_evidence_favours_mr")
    names.append("net_direction_score")
    names.append("total_evidence_present")
    names.append("cm_evidence_count")
    names.append("mr_evidence_count")
    names.append("evidence_conflict_score")
    
    return names

FEATURE_NAMES: List[str] = _build_feature_names()
NUM_FEATURES: int = len(FEATURE_NAMES)  # 7 + 1 + 33 + 9 = 50 features


def extract_features_from_case(case: Dict[str, Any]) -> np.ndarray:
    """
    Transforms arbitrary dispute case dict into a fixed-length np.float32 vector.
    Guaranteed never to crash on missing keys or malformed data.
    """
    vec = np.zeros(NUM_FEATURES, dtype=np.float32)
    idx = 0
    
    # 1. Category One-Hot Encoding (7 features)
    cat_id = str(case.get("dispute_category_id", "CAT-01")).upper().strip()
    for cat in ALL_CATEGORIES:
        if cat_id == cat:
            vec[idx] = 1.0
        idx += 1
        
    # 2. Amount Feature (1 feature)
    try:
        raw_amt = float(case.get("amount", 1000.0) or 0.0)
        amt = max(0.0, raw_amt)
    except (ValueError, TypeError):
        amt = 1000.0
    vec[idx] = float(np.log1p(amt))
    idx += 1
    
    # 3. Evidence Items (33 features)
    raw_items = case.get("evidence_items", []) or []
    ev_dict: Dict[str, Dict[str, Any]] = {}
    if isinstance(raw_items, list):
        for item in raw_items:
            if isinstance(item, dict):
                eid = str(item.get("evidence_id", "")).strip()
                if eid:
                    ev_dict[eid] = item

    cm_count = 0.0
    mr_count = 0.0
    net_direction = 0.0
    present_count = 0.0
    
    for ev_id in ALL_EVIDENCES:
        item = ev_dict.get(ev_id)
        if item and str(item.get("status", "")).strip().lower() == "present":
            is_present = 1.0
            present_count += 1.0
            
            # Quality
            try:
                quality = float(item.get("quality_score", 0.9) or 0.0)
                quality = max(0.0, min(1.0, quality))
            except (ValueError, TypeError):
                quality = 0.8
                
            # Direction: CARD_MEMBER = +1.0, MERCHANT = -1.0, NEUTRAL = 0.0
            fav = str(item.get("favours", "")).strip().upper()
            if "CARD" in fav or fav == "CARD_MEMBER" or fav == "CARDHOLDER":
                direction = 1.0
                cm_count += 1.0
            elif "MERCH" in fav or fav == "MERCHANT":
                direction = -1.0
                mr_count += 1.0
            else:
                direction = 0.0
                
            net_direction += direction * quality
        else:
            is_present = 0.0
            quality = 0.0
            direction = 0.0
            
        vec[idx] = is_present
        vec[idx + 1] = quality
        vec[idx + 2] = direction
        idx += 3
        
    # 4. Domain & Interaction Features (9 features)
    primary_ev_id = PRIMARY_EVIDENCE_MAP.get(cat_id, "EV-03")
    primary_item = ev_dict.get(primary_ev_id)
    has_primary = 0.0
    primary_qual = 0.0
    primary_cm = 0.0
    primary_mr = 0.0
    
    if primary_item and str(primary_item.get("status", "")).strip().lower() == "present":
        has_primary = 1.0
        try:
            primary_qual = float(primary_item.get("quality_score", 0.9) or 0.0)
            primary_qual = max(0.0, min(1.0, primary_qual))
        except (ValueError, TypeError):
            primary_qual = 0.8
        fav = str(primary_item.get("favours", "")).strip().upper()
        if "CARD" in fav:
            primary_cm = 1.0
        elif "MERCH" in fav:
            primary_mr = 1.0
            
    vec[idx] = has_primary
    vec[idx + 1] = primary_qual
    vec[idx + 2] = primary_cm
    vec[idx + 3] = primary_mr
    vec[idx + 4] = net_direction
    vec[idx + 5] = present_count
    vec[idx + 6] = cm_count
    vec[idx + 7] = mr_count
    # Conflict score: min(cm_count, mr_count) measures how many opposing signals exist
    vec[idx + 8] = min(cm_count, mr_count)
    idx += 9
    
    assert idx == NUM_FEATURES, f"Vector length {idx} does not match NUM_FEATURES {NUM_FEATURES}"
    return vec
