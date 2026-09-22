"""
VerdictAI Synthetic Chargeback Dataset Generator (Milestone 3 E2E fixtures)
Author: Hardik Kansara (202512036) - Cloud/DevOps & QA Engineer

Builds raw, API-level dispute scenarios (dispute + evidence payloads exactly as a
client would POST them) so the whole pipeline is exercised: parsers -> case file ->
Fair-Weighing scoring -> lifecycle routing -> audit chain.

Every (category, evidence profile) pair is repeated across a spread of amounts, so
the E2E suite can also assert the outcome does not depend on transaction size.

Run from the repo root to regenerate:
    python backend/tests/fixtures/generate_synthetic_disputes.py
"""

import json
import os
import random

AMOUNTS = [49.99, 199.00, 899.00, 2499.50, 7800.00, 15250.00]
CARRIERS = ["FedEx", "UPS", "DHL", "BlueDart", "USPS"]
MERCHANTS = ["Apex Electronics Direct", "Nimbus Streaming Co", "UrbanCart Retail", "Helix Fitness Club"]


# ── evidence payload builders ───────────────────────────────────────────────

def receipt(rng, amount):
    return {
        "evidence_type": "RECEIPT_INVOICE", "source": "MERCHANT", "actor": "MERCHANT:m_synthetic",
        "raw_payload": {
            "merchant_name": rng.choice(MERCHANTS), "total": amount, "currency": "USD",
            "receipt_number": f"INV-2026-{rng.randint(1000, 9999)}", "receipt_date": "2026-09-01T10:00:00Z",
            "line_items": [{"description": "Order item", "quantity": 1, "unit_price": amount}],
            "transaction_amount": amount,
        },
    }


def courier(rng, status):
    payload = {
        "carrier": rng.choice(CARRIERS), "tracking_number": str(rng.randint(10**11, 10**12 - 1)),
        "status": status, "shipped_date": "2026-09-02T09:00:00Z",
    }
    if status == "DELIVERED":
        payload.update({"delivery_date": "2026-09-05T15:30:00Z", "signed_by": "A. RESIDENT",
                        "delivery_address_match": True})
    return {"evidence_type": "COURIER_TRACKING", "source": "COURIER_CARRIER", "actor": "CARRIER:synthetic",
            "raw_payload": payload}


def chat(source, text):
    role = "MERCHANT" if source == "MERCHANT" else "CARDHOLDER"
    return {
        "evidence_type": "COMMUNICATION_LOG", "source": source, "actor": f"{role}:synthetic",
        "raw_payload": {"channel": "EMAIL", "messages": [
            {"sender": role.title(), "role": role, "content": text, "timestamp": "2026-09-06T11:00:00Z"},
        ]},
    }


def bank_statement(rng, amount):
    return {
        "evidence_type": "BANK_STATEMENT", "source": "CARDHOLDER", "actor": "USER:synthetic",
        "raw_payload": {
            "merchant_name": rng.choice(MERCHANTS), "amount": amount, "currency": "USD",
            "transaction_date": "2026-09-01T10:05:00Z", "card_last_four": f"{rng.randint(0, 9999):04d}",
        },
    }


def auth_log(success):
    return {"evidence_type": "IDENTITY_VERIFICATION", "source": "PAYMENT_GATEWAY", "actor": "SYSTEM:issuer_bank",
            "raw_payload": {"auth_success": success, "auth_type": "BIOMETRIC_3DS" if success else "NONE"}}


def policy_terms():
    return {"evidence_type": "REFUND_POLICY_TERMS", "source": "MERCHANT", "actor": "MERCHANT:m_synthetic",
            "raw_payload": {"policy": "Item sold as described; 30-day return window, not exercised."}}


# ── scenario matrix: reason -> profile -> (statement, evidence builder, expected) ──

PROFILES = {
    "PRODUCT_NOT_RECEIVED": {
        "merchant_proof": ("I never received my order.",
                           lambda r, a: [receipt(r, a), courier(r, "DELIVERED")], "MERCHANT_FAVOUR"),
        "cardholder_proof": ("Package never arrived; carrier says it was returned.",
                             lambda r, a: [courier(r, "RETURNED"),
                                           chat("CARDHOLDER", "My parcel was returned to sender and I still have no refund.")],
                             "CARD_MEMBER_FAVOUR"),
        "missing_primary": ("I never received my order.", lambda r, a: [], "ESCALATE"),
    },
    "PRODUCT_DAMAGED_OR_DEFECTIVE": {
        "merchant_proof": ("The item looks different from the listing.",
                           lambda r, a: [receipt(r, a), policy_terms()], "MERCHANT_FAVOUR"),
        "cardholder_proof": ("Product arrived broken and the seller ignores me.",
                             lambda r, a: [chat("CARDHOLDER", "The screen was cracked on arrival, I sent photos and asked for a refund.")],
                             "CARD_MEMBER_FAVOUR"),
        "missing_primary": ("Product arrived broken.", lambda r, a: [], "ESCALATE"),
    },
    "FRAUD_UNRECOGNIZED_CHARGE": {
        "merchant_proof": ("I do not recognise this charge.", lambda r, a: [auth_log(True)], "MERCHANT_FAVOUR"),
        "cardholder_proof": ("I do not recognise this charge.",
                             lambda r, a: [auth_log(False), bank_statement(r, a)], "CARD_MEMBER_FAVOUR"),
        "missing_primary": ("I do not recognise this charge.", lambda r, a: [], "ESCALATE"),
    },
    "DUPLICATE_PROCESSING": {
        "cardholder_proof": ("I was charged twice for one order.",
                             lambda r, a: [bank_statement(r, a)], "CARD_MEMBER_FAVOUR"),
        "missing_primary": ("I was charged twice for one order.", lambda r, a: [receipt(r, a)], "ESCALATE"),
    },
    "SUBSCRIPTION_CANCELLED_CHARGED": {
        "cardholder_proof": ("I cancelled my subscription but was billed again.",
                             lambda r, a: [bank_statement(r, a),
                                           chat("CARDHOLDER", "I cancelled on 2026-08-15 and was still billed.")],
                             "CARD_MEMBER_FAVOUR"),
        "merchant_proof": (None,
                           lambda r, a: [receipt(r, a), policy_terms(),
                                         chat("MERCHANT", "No cancellation request was ever received; the renewal is valid.")],
                           "MERCHANT_FAVOUR"),
        "missing_primary": ("I cancelled my subscription but was billed again.", lambda r, a: [], "ESCALATE"),
    },
    "INCORRECT_AMOUNT_CHARGED": {
        "cardholder_proof": ("I was charged more than the agreed price.",
                             lambda r, a: [bank_statement(r, a)], "CARD_MEMBER_FAVOUR"),
        "merchant_proof": (None,
                           lambda r, a: [receipt(r, a),
                                         chat("MERCHANT", "The invoiced total matches the order you confirmed.")],
                           "MERCHANT_FAVOUR"),
        "missing_primary": ("I was charged more than the agreed price.", lambda r, a: [], "ESCALATE"),
    },
}


def build_scenarios(seed: int = 644):
    rng = random.Random(seed)
    scenarios = []
    for reason, profiles in PROFILES.items():
        for profile, (statement, evidence_fn, expected) in profiles.items():
            for amount in AMOUNTS:
                n = len(scenarios) + 1
                scenarios.append({
                    "scenario_id": f"SYN-{n:03d}",
                    "dispute_reason": reason,
                    "profile": profile,
                    "disputed_amount": amount,
                    "transaction_id": f"txn_syn_{n:03d}",
                    "cardholder_id": f"usr_syn_{n:03d}",
                    "cardholder_statement": statement,
                    "evidence": evidence_fn(rng, amount),
                    "expected_resolution": expected,
                })
    return scenarios


if __name__ == "__main__":
    scenarios = build_scenarios()
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "synthetic_disputes.json")
    with open(out, "w") as f:
        json.dump({"dataset_name": "VerdictAI Synthetic Chargeback Scenarios (E2E)",
                   "author": "Hardik Kansara", "total_cases": len(scenarios), "cases": scenarios}, f, indent=2)
    print(f"Wrote {len(scenarios)} scenarios to {out}")
