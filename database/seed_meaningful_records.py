"""
VerdictAI: Frictionless Dispute & Chargeback Resolution
Database Seeding Script: Meaningful Domestic Indian Financial Records
Populates both PostgreSQL relational store and MongoDB polymorphic evidence store
Author: Nirav Kachhiya (Project Lead / Backend Engineer)
"""

import sys
import os
import json
import uuid
from datetime import datetime, timedelta, timezone

# Ensure workspace root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.core.db import db_manager
from backend.app.services.case_builder.service import case_service
from backend.app.models.schemas import DisputeReason
from database.mongodb.models import EvidenceType, EvidenceSource

def seed_database():
    print("=" * 70)
    print(" VerdictAI: Populating Database with Meaningful Financial Records")
    print("=" * 70)
    
    # 1. Seed Users (4 Enterprise Personas)
    users = [
        {
            "id": "usr_pooja_iyer",
            "email": "pooja.iyer@gmail.com",
            "full_name": "Pooja Iyer",
            "phone_number": "+91-98765-43210",
            "role": "CARDHOLDER",
            "city": "Bengaluru",
            "state": "Karnataka",
            "kyc_verified": True
        },
        {
            "id": "usr_rajesh_kumar",
            "email": "rajesh.k@croma.infiniti.com",
            "full_name": "Rajesh Kumar (Croma Ops)",
            "phone_number": "+91-98200-11223",
            "role": "MERCHANT",
            "city": "Mumbai",
            "state": "Maharashtra",
            "merchant_org": "Infiniti Retail Ltd"
        },
        {
            "id": "usr_rajesh_verma",
            "email": "rajesh.verma@verdictai-bank.com",
            "full_name": "Rajesh Verma (Senior Analyst)",
            "phone_number": "+91-99887-76655",
            "role": "DISPUTE_ANALYST",
            "department": "Card Fraud & Risk Operations",
            "level": "Senior Tier-3 Specialist"
        },
        {
            "id": "usr_priya_sharma",
            "email": "priya.sharma@verdictai-bank.com",
            "full_name": "Priya Sharma (Admin Lead)",
            "phone_number": "+91-99112-23344",
            "role": "ADMIN",
            "department": "Dispute Governance & Compliance",
            "override_authority": True
        }
    ]
    
    for u in users:
        db_manager.insert_pg_record("users", u["id"], u)
    print(f"[OK] Seeded {len(users)} Enterprise User Personas into PostgreSQL 'users'")

    # 2. Seed Merchants (Domestic Indian Retailers)
    merchants = [
        {
            "id": "mer_croma_001",
            "merchant_name": "Croma Electronics (Infiniti Retail Ltd)",
            "merchant_category_code": "5732",
            "contact_email": "disputes@croma.com",
            "risk_tier": "LOW",
            "historical_dispute_rate": 0.0028,
            "city": "Mumbai",
            "platform": "Omnichannel"
        },
        {
            "id": "mer_swiggy_002",
            "merchant_name": "Swiggy Instamart India (Bundl Tech)",
            "merchant_category_code": "5814",
            "contact_email": "merchant-care@swiggy.in",
            "risk_tier": "LOW",
            "historical_dispute_rate": 0.0019,
            "city": "Bengaluru",
            "platform": "Quick Commerce"
        },
        {
            "id": "mer_tatacliq_003",
            "merchant_name": "Tata CLiQ Luxury",
            "merchant_category_code": "5651",
            "contact_email": "legal-disputes@tatacliq.com",
            "risk_tier": "MEDIUM",
            "historical_dispute_rate": 0.0042,
            "city": "Mumbai",
            "platform": "E-Commerce Luxury"
        },
        {
            "id": "mer_reliance_004",
            "merchant_name": "Reliance Digital Retail Ltd",
            "merchant_category_code": "5732",
            "contact_email": "dispute-desk@reliancedigital.in",
            "risk_tier": "LOW",
            "historical_dispute_rate": 0.0031,
            "city": "Ahmedabad",
            "platform": "Omnichannel"
        },
        {
            "id": "mer_flipkart_005",
            "merchant_name": "Flipkart India Pvt Ltd",
            "merchant_category_code": "5311",
            "contact_email": "chargeback@flipkart.com",
            "risk_tier": "LOW",
            "historical_dispute_rate": 0.0035,
            "city": "Bengaluru",
            "platform": "Marketplace"
        }
    ]

    for m in merchants:
        db_manager.insert_pg_record("merchants", m["id"], m)
    print(f"[OK] Seeded {len(merchants)} Domestic Merchants into PostgreSQL 'merchants'")

    # 3. Seed Transactions (Domestic INR Swipes & UPI Rails)
    now = datetime.now(timezone.utc)
    transactions = [
        {
            "id": "TXN-IN-882910",
            "user_id": "usr_pooja_iyer",
            "merchant_id": "mer_croma_001",
            "amount": 18999.00,
            "currency": "INR",
            "payment_method": "RUPAY_PLATINUM_DEBIT",
            "original_auth_code": "AUTH_HDFC_992144",
            "terminal_city": "Bengaluru",
            "terminal_country": "IND",
            "is_disputed": True,
            "transaction_timestamp": (now - timedelta(days=6)).isoformat()
        },
        {
            "id": "TXN-IN-771822",
            "user_id": "usr_pooja_iyer",
            "merchant_id": "mer_swiggy_002",
            "amount": 1499.00,
            "currency": "INR",
            "payment_method": "UPI_AUTO_PAY",
            "original_auth_code": "UPI_NPCI_3389102",
            "terminal_city": "Bengaluru",
            "terminal_country": "IND",
            "is_disputed": True,
            "transaction_timestamp": (now - timedelta(days=4)).isoformat()
        },
        {
            "id": "TXN-IN-663914",
            "user_id": "usr_pooja_iyer",
            "merchant_id": "mer_tatacliq_003",
            "amount": 24999.00,
            "currency": "INR",
            "payment_method": "VISA_SIGNATURE_CREDIT",
            "original_auth_code": "AUTH_ICICI_554812",
            "terminal_city": "Dubai (Suspicious Foreign IP)",
            "terminal_country": "ARE",
            "is_disputed": True,
            "transaction_timestamp": (now - timedelta(days=2)).isoformat()
        },
        {
            "id": "TXN-IN-554101",
            "user_id": "usr_pooja_iyer",
            "merchant_id": "mer_reliance_004",
            "amount": 64990.00,
            "currency": "INR",
            "payment_method": "MASTERCARD_WORLD",
            "original_auth_code": "AUTH_SBI_887102",
            "terminal_city": "Ahmedabad",
            "terminal_country": "IND",
            "is_disputed": True,
            "transaction_timestamp": (now - timedelta(days=8)).isoformat()
        },
        {
            "id": "TXN-IN-443210",
            "user_id": "usr_pooja_iyer",
            "merchant_id": "mer_flipkart_005",
            "amount": 3500.00,
            "currency": "INR",
            "payment_method": "RUPAY_CREDIT",
            "original_auth_code": "AUTH_AXIS_771920",
            "terminal_city": "Bengaluru",
            "terminal_country": "IND",
            "is_disputed": True,
            "transaction_timestamp": (now - timedelta(days=5)).isoformat()
        }
    ]

    for t in transactions:
        db_manager.insert_pg_record("transactions", t["id"], t)
    print(f"[OK] Seeded {len(transactions)} Financial Transactions into PostgreSQL 'transactions'")

    # 4. Seed Disputes & Cases via CaseBuilder Service
    dispute_scenarios = [
        {
            "txn_id": "TXN-IN-882910",
            "user_id": "usr_pooja_iyer",
            "reason": DisputeReason.PRODUCT_NOT_RECEIVED,
            "amount": 18999.00,
            "statement": "Ordered OnePlus Pad tablet from Croma online. Blue Dart tracking marks it as delivered, but society gate CCTV and security register confirm no parcel arrived.",
            "evidence": [
                {
                    "type": EvidenceType.COURIER_TRACKING,
                    "source": EvidenceSource.COURIER_CARRIER,
                    "file_name": "bluedart_telematics_pod.pdf",
                    "payload": {
                        "carrier": "Blue Dart Express India",
                        "waybill_number": "BLUEDART-88192034",
                        "status": "DELIVERED",
                        "gps_coordinates": "12.9810 N, 77.6250 E",
                        "intended_coordinates": "12.9716 N, 77.6412 E",
                        "distance_discrepancy_km": 3.2,
                        "signed_by": "Security Desk (Unverified Sign)"
                    }
                },
                {
                    "type": EvidenceType.RECEIPT_INVOICE,
                    "source": EvidenceSource.MERCHANT,
                    "file_name": "croma_gst_tax_invoice.pdf",
                    "payload": {
                        "merchant_name": "Croma Electronics India",
                        "invoice_number": "INV-CROMA-2026-9921",
                        "invoice_date": "2026-10-12",
                        "total_amount": 18999.00,
                        "currency": "INR",
                        "item": "OnePlus Pad Go 11.35 inch Tablet 128GB Wi-Fi"
                    }
                }
            ]
        },
        {
            "txn_id": "TXN-IN-771822",
            "user_id": "usr_pooja_iyer",
            "reason": DisputeReason.DUPLICATE_PROCESSING,
            "amount": 1499.00,
            "statement": "UPI payment debited twice within 12 seconds during order checkout on Swiggy Instamart.",
            "evidence": [
                {
                    "type": EvidenceType.BANK_STATEMENT,
                    "source": EvidenceSource.CARDHOLDER,
                    "file_name": "hdfc_upi_statement_duplicate.pdf",
                    "payload": {
                        "bank_name": "HDFC Bank",
                        "account_ending": "4492",
                        "transaction_1": {"rrn": "338910211", "amount": 1499.00, "time": "14:22:10"},
                        "transaction_2": {"rrn": "338910212", "amount": 1499.00, "time": "14:22:22"},
                        "discrepancy": "Identical amount debited twice within 12 seconds to VPA swiggy@icici"
                    }
                }
            ]
        },
        {
            "txn_id": "TXN-IN-663914",
            "user_id": "usr_pooja_iyer",
            "reason": DisputeReason.FRAUD_UNRECOGNIZED_CHARGE,
            "amount": 24999.00,
            "statement": "Fraudulent luxury apparel purchase on Tata CLiQ Luxury originating from Dubai while physical card and cardholder were in Bengaluru.",
            "evidence": [
                {
                    "type": EvidenceType.COMMUNICATION_LOG,
                    "source": EvidenceSource.CARDHOLDER,
                    "file_name": "cybercrime_fir_receipt.pdf",
                    "payload": {
                        "portal": "National Cyber Crime Reporting Portal (cybercrime.gov.in)",
                        "acknowledgement_no": "2026/NCR/BLR/991204",
                        "incident_type": "Unauthorized Financial Card Fraud",
                        "filed_at": "2026-10-21 09:30 IST",
                        "status": "FIR_REGISTERED"
                    }
                }
            ]
        },
        {
            "txn_id": "TXN-IN-554101",
            "user_id": "usr_pooja_iyer",
            "reason": DisputeReason.PRODUCT_DAMAGED_OR_DEFECTIVE,
            "amount": 64990.00,
            "statement": "Samsung 55-inch OLED TV delivered with severely cracked display panel and punctured outer carton.",
            "evidence": [
                {
                    "type": EvidenceType.RECEIPT_INVOICE,
                    "source": EvidenceSource.CARDHOLDER,
                    "file_name": "reliance_damaged_tv_photo.jpg",
                    "payload": {
                        "visual_defect": "CRACKED_OLED_PANEL",
                        "outer_box_seal": "DAMAGED_IN_TRANSIT",
                        "unboxing_video_url": "s3://verdictai-vault/evidence/unboxing_vid_554101.mp4",
                        "damage_severity": "TOTAL_LOSS"
                    }
                }
            ]
        },
        {
            "txn_id": "TXN-IN-443210",
            "user_id": "usr_pooja_iyer",
            "reason": DisputeReason.INCORRECT_AMOUNT_CHARGED,
            "amount": 3500.00,
            "statement": "Returned defective headphones to Flipkart; credit note promised Rs 3,500 refund, but account was only credited Rs 1,500.",
            "evidence": [
                {
                    "type": EvidenceType.REFUND_POLICY_TERMS,
                    "source": EvidenceSource.CARDHOLDER,
                    "file_name": "flipkart_return_pickup_slip.pdf",
                    "payload": {
                        "return_id": "RET-FK-992144",
                        "item_returned": "Sony WH-CH720N Noise Cancelling Headphones",
                        "pickup_agent": "Ekart Logistics Verified",
                        "promised_refund_inr": 3500.00,
                        "credited_refund_inr": 1500.00,
                        "uncredited_difference_inr": 2000.00
                    }
                }
            ]
        }
    ]

    dispute_count = 0
    evidence_count = 0

    for s in dispute_scenarios:
        case = case_service.create_dispute_case(
            transaction_id=s["txn_id"],
            cardholder_id=s["user_id"],
            dispute_reason=s["reason"],
            disputed_amount=s["amount"],
            cardholder_statement=s["statement"],
            merchant_sla_hours=48
        )
        dispute_count += 1
        d_id = case.header.dispute_id
        
        for ev in s["evidence"]:
            case_service.attach_evidence(
                dispute_id=d_id,
                evidence_type=ev["type"],
                source=ev["source"],
                raw_payload=ev["payload"],
                actor=f"{ev['source'].value}:seed_process",
                file_name=ev["file_name"]
            )
            evidence_count += 1

    print(f"[OK] Successfully created {dispute_count} Active Dispute Cases in PostgreSQL 'disputes'")
    print(f"[OK] Successfully ingested {evidence_count} Polymorphic Evidence Payloads into MongoDB 'case_documents'")
    print(f"[OK] Generated SHA-256 integrity fingerprints and Merkle tree audit logs for all records")
    print("=" * 70)
    print(" Database Populated Successfully! Verification Summary:")
    print(f"  - Total PostgreSQL Tables Populated: 5 (users, merchants, transactions, disputes, audit_logs)")
    print(f"  - Total MongoDB Collections Populated: 2 (case_documents, evidence_payloads)")
    print(f"  - Ready for Automated Functional, Integration & UI Testing")
    print("=" * 70)

if __name__ == "__main__":
    seed_database()
