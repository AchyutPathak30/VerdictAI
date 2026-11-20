"""
Seeded Synthetic Dispute Dataset Generator
Grounded in Visa / Mastercard chargeback rules with a hidden latent ground-truth process.
Author: Akshay Purohit (202512033) - Senior ML Engineer
"""

import os
import json
import random
import numpy as np
from typing import Dict, Any, List

# Category metadata grounded in Visa Core Rules & Mastercard Dispute Resolution
CATEGORY_SPECS: Dict[str, Dict[str, Any]] = {
    "CAT-01": {
        "name": "Item Not Received",
        "visa_code": "13.1",
        "primary_evidence": "EV-03",  # Carrier Proof of Delivery / Tracking
        "typical_evidences": ["EV-01", "EV-02", "EV-03", "EV-04", "EV-05", "EV-09"],
    },
    "CAT-02": {
        "name": "Damaged / Defective Merchandise",
        "visa_code": "13.3",
        "primary_evidence": "EV-06",  # Product description / return tracking / photo
        "typical_evidences": ["EV-01", "EV-02", "EV-04", "EV-05", "EV-06", "EV-09", "EV-10"],
    },
    "CAT-03": {
        "name": "Unauthorized Charge / Fraud",
        "visa_code": "10.4",
        "primary_evidence": "EV-08",  # Biometric / 3DS / 2FA Auth Log
        "typical_evidences": ["EV-01", "EV-02", "EV-04", "EV-05", "EV-08", "EV-09"],
    },
    "CAT-04": {
        "name": "Duplicate Processing",
        "visa_code": "12.6",
        "primary_evidence": "EV-01_DUP",  # Second duplicate transaction ledger
        "typical_evidences": ["EV-01", "EV-01_DUP", "EV-02", "EV-04", "EV-05"],
    },
    "CAT-05": {
        "name": "Cancelled Recurring Subscription",
        "visa_code": "13.7",
        "primary_evidence": "EV-07",  # Cancellation timestamp / confirmation
        "typical_evidences": ["EV-01", "EV-02", "EV-04", "EV-05", "EV-06", "EV-07", "EV-09"],
    },
    "CAT-06": {
        "name": "Incorrect Amount Charged",
        "visa_code": "12.5",
        "primary_evidence": "EV-07",  # Refund record or POS receipt invoice
        "typical_evidences": ["EV-01", "EV-02", "EV-04", "EV-05", "EV-07", "EV-09"],
    },
    "CAT-07": {
        "name": "General Terms Not Met",
        "visa_code": "13.5",
        "primary_evidence": "EV-04",  # Communication / Terms acknowledgment
        "typical_evidences": ["EV-01", "EV-02", "EV-04", "EV-05", "EV-06", "EV-09"],
    }
}

EVIDENCE_NAMES: Dict[str, str] = {
    "EV-01": "Transaction Record",
    "EV-01_DUP": "Duplicate Transaction Record",
    "EV-02": "Merchant Receipt",
    "EV-03": "Delivery Confirmation / Tracking",
    "EV-04": "Merchant Communication Log",
    "EV-05": "Card Member Communication Log",
    "EV-06": "Product / Service Description",
    "EV-07": "Refund / Cancellation Record",
    "EV-08": "Authentication Log / 2FA",
    "EV-09": "Dispute Reason Statement",
    "EV-10": "Photographic Evidence",
}

CARD_TIERS = ["PLATINUM", "GOLD", "SILVER", "BASIC"]
PAYMENT_RAILS = ["UPI", "RUPAY", "VISA", "MASTERCARD"]

def generate_dispute_cases(num_cases: int = 5000, seed: int = 42) -> List[Dict[str, Any]]:
    """
    Generates synthetic dispute cases using an independent hidden latent ground-truth process.
    Never calls the legacy rule-engine formula.
    """
    random.seed(seed)
    np.random.seed(seed)
    
    categories = list(CATEGORY_SPECS.keys())
    cases = []
    
    # Balanced merit cycle per category for demographic equity
    cat_cycle: Dict[str, int] = {c: 0 for c in categories}
    
    for i in range(num_cases):
        case_id = f"CAS-SYNTH-{i+1:05d}"
        cat_id = categories[i % len(categories)]
        cat_spec = CATEGORY_SPECS[cat_id]
        primary_id = cat_spec["primary_evidence"]
        
        # Demographic proxy attributes (symmetrically distributed for algorithmic fairness)
        card_tier = CARD_TIERS[i % len(CARD_TIERS)]
        payment_rail = PAYMENT_RAILS[i % len(PAYMENT_RAILS)]
        
        # Transaction Amount (log-normal distribution with realistic e-commerce tails)
        raw_amt = float(np.random.lognormal(mean=7.5, sigma=1.05))
        amt = round(min(125000.0, max(150.0, raw_amt)), 2)
        
        # Hidden ground-truth merit (balanced 40% CM, 40% MR, 20% Escalate per cohort):
        step = cat_cycle[cat_id] % 5
        cat_cycle[cat_id] += 1
        if step in (0, 1):
            merit = 0 # Cardholder claim (~40%)
        elif step in (2, 3):
            merit = 1 # Merchant defense (~40%)
        else:
            merit = 2 # Conflicted / Ambiguous (~20%)
        
        evidence_items = []
        
        # Always present: EV-01 Transaction Record (Neutral)
        ev1_qual = round(random.uniform(0.90, 1.0), 3)
        evidence_items.append({
            "evidence_id": "EV-01",
            "evidence_type": EVIDENCE_NAMES["EV-01"],
            "status": "Present",
            "quality_score": ev1_qual,
            "favours": "NEUTRAL"
        })
        
        # Always present: EV-09 Cardholder Dispute Statement
        ev9_qual = round(random.uniform(0.75, 0.98), 3)
        evidence_items.append({
            "evidence_id": "EV-09",
            "evidence_type": EVIDENCE_NAMES["EV-09"],
            "status": "Present",
            "quality_score": ev9_qual,
            "favours": "CARD_MEMBER"
        })
        
        if merit == 0:
            # Cardholder has clear merit
            # 1. Primary evidence is either missing from merchant or confirms cardholder claim
            primary_missing = random.random() < 0.75
            if primary_missing:
                evidence_items.append({
                    "evidence_id": primary_id,
                    "evidence_type": EVIDENCE_NAMES.get(primary_id, "Primary Evidence"),
                    "status": "Missing",
                    "quality_score": 0.0,
                    "favours": "NEUTRAL"
                })
            else:
                # Primary evidence present but supports card member (e.g. tracking shows returned)
                evidence_items.append({
                    "evidence_id": primary_id,
                    "evidence_type": EVIDENCE_NAMES.get(primary_id, "Primary Evidence"),
                    "status": "Present",
                    "quality_score": round(random.uniform(0.80, 0.95), 3),
                    "favours": "CARD_MEMBER"
                })
                
            # Supporting cardholder evidence
            if random.random() < 0.80:
                evidence_items.append({
                    "evidence_id": "EV-05", # Cardholder communication
                    "evidence_type": EVIDENCE_NAMES["EV-05"],
                    "status": "Present",
                    "quality_score": round(random.uniform(0.80, 0.95), 3),
                    "favours": "CARD_MEMBER"
                })
            if cat_id == "CAT-02" and random.random() < 0.75:
                evidence_items.append({
                    "evidence_id": "EV-10", # Photographic proof of damage
                    "evidence_type": EVIDENCE_NAMES["EV-10"],
                    "status": "Present",
                    "quality_score": round(random.uniform(0.85, 0.98), 3),
                    "favours": "CARD_MEMBER"
                })
            resolution = "CARD_MEMBER_FAVOUR"
            
        elif merit == 1:
            # Merchant has clear merit
            # Verified primary evidence present and favors merchant
            evidence_items.append({
                "evidence_id": primary_id,
                "evidence_type": EVIDENCE_NAMES.get(primary_id, "Primary Evidence"),
                "status": "Present",
                "quality_score": round(random.uniform(0.85, 1.0), 3),
                "favours": "MERCHANT"
            })
            # Supporting merchant documents (Receipt, communication log)
            if random.random() < 0.85:
                evidence_items.append({
                    "evidence_id": "EV-02",
                    "evidence_type": EVIDENCE_NAMES["EV-02"],
                    "status": "Present",
                    "quality_score": round(random.uniform(0.85, 0.98), 3),
                    "favours": "MERCHANT"
                })
            if random.random() < 0.65:
                evidence_items.append({
                    "evidence_id": "EV-04",
                    "evidence_type": EVIDENCE_NAMES["EV-04"],
                    "status": "Present",
                    "quality_score": round(random.uniform(0.80, 0.95), 3),
                    "favours": "MERCHANT"
                })
            resolution = "MERCHANT_FAVOUR"
            
        else:
            # Genuinely ambiguous / Conflicting / Escalation scenario
            # Both parties submit opposing active evidence with missing or degraded primary proof
            # 1. Primary evidence (Missing or degraded quality 0.40 - 0.65)
            if random.random() < 0.50:
                evidence_items.append({
                    "evidence_id": primary_id,
                    "evidence_type": EVIDENCE_NAMES.get(primary_id, "Primary Evidence"),
                    "status": "Present",
                    "quality_score": round(random.uniform(0.40, 0.65), 3),
                    "favours": random.choice(["CARD_MEMBER", "MERCHANT", "NEUTRAL"])
                })
            else:
                evidence_items.append({
                    "evidence_id": primary_id,
                    "evidence_type": EVIDENCE_NAMES.get(primary_id, "Primary Evidence"),
                    "status": "Missing",
                    "quality_score": 0.0,
                    "favours": "NEUTRAL"
                })
                
            # 2. Merchant opposing proof (avoid duplicate primary evidence)
            mr_ev_id = "EV-02" if primary_id == "EV-04" else "EV-04"
            evidence_items.append({
                "evidence_id": mr_ev_id,
                "evidence_type": EVIDENCE_NAMES[mr_ev_id],
                "status": "Present",
                "quality_score": round(random.uniform(0.70, 0.90), 3),
                "favours": "MERCHANT"
            })
            
            # 3. Cardholder counter-proof
            evidence_items.append({
                "evidence_id": "EV-05",
                "evidence_type": EVIDENCE_NAMES["EV-05"],
                "status": "Present",
                "quality_score": round(random.uniform(0.70, 0.90), 3),
                "favours": "CARD_MEMBER"
            })
            if cat_id == "CAT-02" and random.random() < 0.70:
                evidence_items.append({
                    "evidence_id": "EV-10",
                    "evidence_type": EVIDENCE_NAMES["EV-10"],
                    "status": "Present",
                    "quality_score": round(random.uniform(0.75, 0.95), 3),
                    "favours": "CARD_MEMBER"
                })
            resolution = "ESCALATE"
            
        # Subtle 0.5% label noise (human reviewer dispute arbitrator variance)
        if random.random() < 0.005:
            resolution = random.choice(["CARD_MEMBER_FAVOUR", "MERCHANT_FAVOUR", "ESCALATE"])
            
        case_record = {
            "case_id": case_id,
            "dispute_category_id": cat_id,
            "dispute_category_name": cat_spec["name"],
            "amount": amt,
            "currency": "INR",
            "cardholder_tier": card_tier,
            "payment_rail": payment_rail,
            "evidence_items": evidence_items,
            "ground_truth_resolution": resolution
        }
        cases.append(case_record)
        
    return cases

if __name__ == "__main__":
    out_dir = os.path.join(os.path.dirname(__file__), "phase2_mockdata")
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "synthetic_disputes_5000.json")
    
    print("Generating 5000 seeded synthetic dispute cases...")
    data = generate_dispute_cases(num_cases=5000, seed=42)
    with open(out_file, "w") as f:
        json.dump(data, f, indent=2)
    print(f"Saved {len(data)} cases to {out_file}")
