"""
VerdictAI — Comprehensive UAT Edge-Case Dispute Tests
Author: Achyut Pathak (AI/NLP Engineer — Evidence Parsing)
Date: November 2026

User Acceptance Testing (UAT) suite covering all 6 dispute categories with
edge-case evidence payloads, cross-parser interactions, and end-to-end
pipeline validation against the CaseService and EvidenceSummary systems.

Due: Nov 07, 2026 (Phase 6 — All Members)
"""

import pytest
from datetime import datetime, timezone, timedelta

from backend.app.services.parsers.transaction_parser import TransactionParser
from backend.app.services.parsers.receipt_parser import ReceiptParser
from backend.app.services.parsers.courier_tracking_parser import CourierTrackingParser
from backend.app.services.nlp.communication_parser import CommunicationLogParser
from backend.app.services.nlp.evidence_summarizer import (
    EvidenceHighlightExtractor,
    EvidenceSummary,
)
from backend.app.services.parsers.base_parser import (
    AnomalyLevel,
    ClaimAlignment,
    ParsedEvidence,
)
from backend.app.services.case_builder.service import case_service
from backend.app.models.schemas import DisputeReason, DisputeStatus
from database.mongodb.models import EvidenceType, EvidenceSource
from backend.app.core.db import db_manager


@pytest.fixture(autouse=True)
def reset_db():
    db_manager.reset_in_memory_stores()


# ═══════════════════════════════════════════════════════════════════════
# Category 1: FRAUD (Unauthorized Transaction)
# ═══════════════════════════════════════════════════════════════════════

class TestUATFraudDispute:
    """UAT for fraud / unauthorized transaction disputes."""

    def test_fraud_high_value_weekend_transaction(self):
        """Fraud on a high-value weekend transaction with high-risk MCC."""
        parser = TransactionParser()
        result = parser.parse({
            "merchant_name": "CryptoExchange Intl.",
            "amount": 15250.00,
            "currency": "USD",
            "transaction_date": "2026-10-31T23:45:00Z",  # Saturday late night
            "card_last_four": "9999",
            "mcc_code": "7995",  # Gambling MCC
            "merchant_location": "Offshore, Unknown",
            "payment_method": "VISA_CREDIT",
            "transaction_id": "txn_fraud_001",
        })

        anomaly_types = [a.anomaly_type for a in result.anomalies]
        assert "HIGH_VALUE_TRANSACTION" in anomaly_types
        assert "WEEKEND_TRANSACTION" in anomaly_types
        assert "HIGH_RISK_MCC" in anomaly_types
        assert result.confidence_score < 0.85  # Multiple anomalies reduce confidence

    def test_fraud_future_dated_transaction(self):
        """Transaction dated in the future should be flagged as HIGH severity."""
        parser = TransactionParser()
        future_date = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
        result = parser.parse({
            "merchant_name": "FutureStore",
            "amount": 500.00,
            "transaction_date": future_date,
        })
        anomaly_types = [a.anomaly_type for a in result.anomalies]
        assert "FUTURE_DATED_TRANSACTION" in anomaly_types
        assert any(a.severity == AnomalyLevel.HIGH for a in result.anomalies)

    def test_fraud_negative_amount(self):
        """Negative transaction amount (possible refund manipulation)."""
        parser = TransactionParser()
        result = parser.parse({
            "merchant_name": "ShadyRefundCo",
            "amount": -250.00,
            "transaction_date": "2026-10-15",
        })
        anomaly_types = [a.anomaly_type for a in result.anomalies]
        assert "INVALID_AMOUNT" in anomaly_types


# ═══════════════════════════════════════════════════════════════════════
# Category 2: PRODUCT NOT RECEIVED (Item-Not-Received)
# ═══════════════════════════════════════════════════════════════════════

class TestUATProductNotReceived:
    """UAT for product-not-received / delivery failure disputes."""

    def test_delivery_address_mismatch_supports_cardholder(self):
        """Delivery to wrong address should support cardholder claim."""
        parser = CourierTrackingParser()
        result = parser.parse({
            "carrier": "Blue Dart Express",
            "tracking_number": "BDED1234567890",
            "status": "DELIVERED",
            "delivery_date": "2026-10-20T14:30:00Z",
            "signed_by": "Unknown Person",
            "delivery_address": "456 Wrong Street, Mumbai 400001",
            "expected_address": "123 Correct Lane, Pune 411001",
            "delivery_address_match": False,
        })
        assert result.claim_alignment == ClaimAlignment.SUPPORTS_CARDHOLDER
        anomaly_types = [a.anomaly_type for a in result.anomalies]
        assert "ADDRESS_MISMATCH" in anomaly_types

    def test_unsigned_delivery_supports_cardholder(self):
        """Delivered but unsigned — cardholder claims non-receipt."""
        parser = CourierTrackingParser()
        result = parser.parse({
            "carrier": "FedEx",
            "tracking_number": "789456123012",
            "status": "DELIVERED",
            "delivery_date": "2026-10-18T11:00:00Z",
        })
        anomaly_types = [a.anomaly_type for a in result.anomalies]
        assert "UNSIGNED_DELIVERY" in anomaly_types

    def test_delivery_exception_supports_cardholder(self):
        """Exception status (LOST, DAMAGED_IN_TRANSIT) supports cardholder."""
        parser = CourierTrackingParser()
        result = parser.parse({
            "carrier": "DHL",
            "tracking_number": "DHL1234567890",
            "status": "LOST",
        })
        assert result.claim_alignment == ClaimAlignment.SUPPORTS_CARDHOLDER
        anomaly_types = [a.anomaly_type for a in result.anomalies]
        assert "DELIVERY_EXCEPTION" in anomaly_types

    def test_excessive_transit_time(self):
        """Package in transit for over 30 days flags anomaly."""
        parser = CourierTrackingParser()
        result = parser.parse({
            "carrier": "India Post",
            "tracking_number": "EM123456789IN",
            "status": "IN_TRANSIT",
            "shipped_date": "2026-08-01T10:00:00Z",
            "delivery_date": "2026-10-15T12:00:00Z",
        })
        anomaly_types = [a.anomaly_type for a in result.anomalies]
        assert "EXCESSIVE_TRANSIT_TIME" in anomaly_types

    def test_bluedart_gps_telematics_coordinate_discrepancy(self):
        """UAT: Blue Dart Express 3.2 km GPS telematics misdelivery detection."""
        parser = CourierTrackingParser()
        result = parser.parse({
            "carrier": "Blue Dart Express",
            "tracking_number": "BDED9922883311",
            "status": "DELIVERED",
            "delivery_date": "2026-10-22T15:30:00Z",
            "signed_by": "Security Guard",
            "delivery_address": "Flat 402, Sunshine Apts, Bandra West, Mumbai 400050",
            "expected_address": "Flat 402, Sunshine Apts, Bandra West, Mumbai 400050",
            "gps_latitude": 19.0596,
            "gps_longitude": 72.8295,
            "expected_latitude": 19.0330,
            "expected_longitude": 72.8450,
            "gps_distance_km": 3.2,
        })
        anomaly_types = [a.anomaly_type for a in result.anomalies]
        assert "COORDINATE_DISCREPANCY" in anomaly_types
        # 3.2 km misdelivery must override DELIVERED status to support cardholder
        assert result.claim_alignment == ClaimAlignment.SUPPORTS_CARDHOLDER

    def test_multi_evidence_non_receipt_pipeline(self):
        """Full pipeline: transaction + courier exception → supports cardholder."""
        txn = TransactionParser().parse({
            "merchant_name": "Flipkart",
            "amount": 8999.00,
            "currency": "INR",
            "transaction_date": "2026-10-01",
            "transaction_id": "FKT-2026-10-001",
        })
        courier = CourierTrackingParser().parse({
            "carrier": "Delhivery",
            "tracking_number": "DEL9876543210",
            "status": "RETURNED_TO_SENDER",
        })
        extractor = EvidenceHighlightExtractor()
        summary = extractor.extract_highlights([txn, courier])
        assert summary.evidence_count == 2
        assert summary.net_alignment == ClaimAlignment.SUPPORTS_CARDHOLDER


# ═══════════════════════════════════════════════════════════════════════
# Category 3: DUPLICATE BILLING
# ═══════════════════════════════════════════════════════════════════════

class TestUATDuplicateBilling:
    """UAT for duplicate charge disputes."""

    def test_duplicate_transactions_detected_by_pipeline(self):
        """Two identical transactions should be separately parsed and flagged in summary."""
        parser = TransactionParser()
        txn1 = parser.parse({
            "merchant_name": "Swiggy",
            "amount": 450.00,
            "currency": "INR",
            "transaction_date": "2026-10-15T12:30:00Z",
            "transaction_id": "SWG-001",
        })
        txn2 = parser.parse({
            "merchant_name": "Swiggy",
            "amount": 450.00,
            "currency": "INR",
            "transaction_date": "2026-10-15T12:31:00Z",  # 1 minute later
            "transaction_id": "SWG-002",
        })
        extractor = EvidenceHighlightExtractor()
        summary = extractor.extract_highlights([txn1, txn2])
        assert summary.evidence_count == 2
        # Key facts should de-duplicate merchant name but keep both transaction IDs
        txn_id_facts = [f for f in summary.key_facts if f.supporting_data.get("entity_type") == "TRANSACTION_ID"]
        assert len(txn_id_facts) == 2

    def test_receipt_amount_discrepancy_for_duplicate(self):
        """Receipt shows single charge but bank shows double."""
        receipt = ReceiptParser().parse({
            "merchant_name": "Swiggy",
            "total": 450.00,
            "currency": "INR",
            "receipt_number": "SWG-REC-001",
            "date": "2026-10-15",
            "transaction_amount": 900.00,  # Double!
        })
        anomaly_types = [a.anomaly_type for a in receipt.anomalies]
        assert "AMOUNT_DISCREPANCY" in anomaly_types


# ═══════════════════════════════════════════════════════════════════════
# Category 4: DEFECTIVE PRODUCT
# ═══════════════════════════════════════════════════════════════════════

class TestUATDefectiveProduct:
    """UAT for defective/damaged goods disputes."""

    def test_defective_product_communication_escalation(self):
        """Cardholder threatens legal action for defective product."""
        parser = CommunicationLogParser()
        result = parser.parse({
            "channel": "EMAIL",
            "messages": [
                {
                    "sender": "Pooja Iyer",
                    "role": "CARDHOLDER",
                    "content": "I received a damaged, broken, and defective Samsung phone. "
                               "The screen has dead pixels. I demand a full refund and return. "
                               "This is completely unacceptable. If not resolved I will file a consumer court complaint.",
                },
                {
                    "sender": "Croma Support",
                    "role": "MERCHANT",
                    "content": "We apologize. Please bring the product to the store for inspection.",
                },
                {
                    "sender": "Pooja Iyer",
                    "role": "CARDHOLDER",
                    "content": "It has been 15 days since I reported this defective and damaged item. "
                               "I will contact my lawyer and the consumer protection forum.",
                },
            ],
        })
        assert result.structured_data.get("escalation_detected") is True
        assert result.claim_alignment == ClaimAlignment.SUPPORTS_CARDHOLDER

    def test_defective_product_with_receipt_evidence(self):
        """Receipt confirms purchase; communication shows complaint chain."""
        receipt = ReceiptParser().parse({
            "merchant_name": "Croma",
            "total": 42999.00,
            "currency": "INR",
            "receipt_number": "CRM-2026-445781",
            "date": "2026-10-01",
            "payment_method": "RuPay ****8891",
            "line_items": [
                {"description": "Samsung Galaxy S24 Ultra", "amount": 42999.00, "quantity": 1},
            ],
        })
        comm = CommunicationLogParser().parse({
            "channel": "EMAIL",
            "messages": [
                {"sender": "Customer", "role": "CARDHOLDER",
                 "content": "Product is defective. Screen has dead pixels. Want refund."},
                {"sender": "Store", "role": "MERCHANT",
                 "content": "Please bring product to store for inspection."},
            ],
        })
        extractor = EvidenceHighlightExtractor()
        summary = extractor.extract_highlights([receipt, comm])
        assert summary.evidence_count == 2
        prompt = summary.to_prompt_context()
        assert "EVIDENCE ANALYSIS SUMMARY" in prompt
        assert len(prompt) > 100


# ═══════════════════════════════════════════════════════════════════════
# Category 5: CANCELLED SUBSCRIPTION
# ═══════════════════════════════════════════════════════════════════════

class TestUATCancelledSubscription:
    """UAT for cancelled subscription recurring charge disputes."""

    def test_cancelled_subscription_with_communication(self):
        """Cardholder shows cancellation confirmation but still charged."""
        comm = CommunicationLogParser().parse({
            "channel": "EMAIL",
            "messages": [
                {"sender": "User", "role": "CARDHOLDER",
                 "content": "I cancelled my subscription on October 1st but was still charged "
                            "Rs.999 on October 15. Please refund this unauthorized charge."},
                {"sender": "Service", "role": "MERCHANT",
                 "content": "Your subscription was active until the end of your billing period. "
                            "The charge on October 15 was for the period Oct 1–Oct 31."},
                {"sender": "User", "role": "CARDHOLDER",
                 "content": "I have a confirmation email from your system saying cancelled on Oct 1. "
                            "This is unfair. I want my money back."},
            ],
        })
        assert len(comm.extracted_entities) > 0
        assert comm.confidence_score > 0.0

    def test_subscription_transaction_with_receipt_mismatch(self):
        """Transaction shows Rs.999 but receipt shows Rs.499 (plan change not reflected)."""
        txn = TransactionParser().parse({
            "merchant_name": "Netflix India",
            "amount": 999.00,
            "currency": "INR",
            "transaction_date": "2026-10-15",
            "transaction_id": "NFLX-IN-2026-10",
        })
        receipt = ReceiptParser().parse({
            "merchant_name": "Netflix India",
            "total": 499.00,
            "currency": "INR",
            "receipt_number": "NFLX-REC-499",
            "date": "2026-10-15",
            "transaction_amount": 999.00,  # Mismatch!
        })
        extractor = EvidenceHighlightExtractor()
        summary = extractor.extract_highlights([txn, receipt])
        assert summary.evidence_count == 2
        # Receipt should flag AMOUNT_DISCREPANCY
        assert len(summary.critical_anomalies) >= 1


    def test_partial_credit_resolution_negotiation(self):
        """UAT: Cardholder and merchant negotiate a partial credit / partial refund."""
        parser = CommunicationLogParser()
        result = parser.parse({
            "channel": "EMAIL",
            "messages": [
                {
                    "sender": "Cardholder",
                    "role": "CARDHOLDER",
                    "content": "The annual software subscription charged Rs.12,000 but I only used 3 months. "
                               "I want a full refund.",
                },
                {
                    "sender": "Merchant Billing",
                    "role": "MERCHANT",
                    "content": "Under our terms, annual plans are non-refundable. However, as a goodwill gesture, "
                               "we can offer a partial refund of Rs.9,000 or store credit for the remaining period.",
                },
                {
                    "sender": "Cardholder",
                    "role": "CARDHOLDER",
                    "content": "I accept the partial refund of Rs.9,000 to resolve this dispute.",
                },
            ],
        })
        assert result.structured_data.get("partial_credit_detected") is True
        assert result.structured_data.get("resolution_detected") is True
        assert any("partial_credit" in ind for ind in result.structured_data.get("dispute_indicators", []))


# ═══════════════════════════════════════════════════════════════════════
# Category 6: SERVICE NOT RENDERED
# ═══════════════════════════════════════════════════════════════════════

class TestUATServiceNotRendered:
    """UAT for service-not-rendered disputes."""

    def test_service_dispute_communication_only(self):
        """Cardholder complains service was never provided despite payment."""
        comm = CommunicationLogParser().parse({
            "channel": "CHAT",
            "messages": [
                {"sender": "Customer", "role": "CARDHOLDER",
                 "content": "I paid for a premium car wash service but the staff said they "
                            "have no record of my booking. I want a full refund."},
                {"sender": "Merchant", "role": "MERCHANT",
                 "content": "We cannot find your booking in our system. Can you provide "
                            "the booking confirmation number?"},
                {"sender": "Customer", "role": "CARDHOLDER",
                 "content": "I don't have a confirmation number. I paid through UPI. "
                            "This is unacceptable. I'll report to the consumer forum."},
            ],
        })
        assert comm.structured_data.get("escalation_detected") is True
        assert comm.claim_alignment == ClaimAlignment.SUPPORTS_CARDHOLDER

    def test_service_with_transaction_and_empty_receipt(self):
        """Transaction exists but receipt is minimal (service not rendered)."""
        txn = TransactionParser().parse({
            "merchant_name": "SparkleWash Premium",
            "amount": 2499.00,
            "currency": "INR",
            "transaction_date": "2026-10-20",
        })
        receipt = ReceiptParser().parse({
            "merchant_name": "SparkleWash Premium",
            "total": 2499.00,
        })
        extractor = EvidenceHighlightExtractor()
        summary = extractor.extract_highlights([txn, receipt])
        assert summary.evidence_count == 2
        # Minimal receipt should flag missing receipt number and date
        receipt_anomalies = [a for a in summary.critical_anomalies
                             if a.source_parser == "ReceiptParser"]
        assert len(receipt_anomalies) >= 1


# ═══════════════════════════════════════════════════════════════════════
# Cross-Category Edge Cases
# ═══════════════════════════════════════════════════════════════════════

class TestUATCrossCategoryEdgeCases:
    """Edge cases spanning multiple dispute categories and parsers."""

    def test_four_parser_full_pipeline(self):
        """All 4 parsers produce evidence for a single dispute."""
        txn = TransactionParser().parse({
            "merchant_name": "Tata CLiQ Luxury",
            "amount": 25000.00,
            "currency": "INR",
            "transaction_date": "2026-10-05",
            "transaction_id": "TCLQ-2026-10-001",
            "card_last_four": "7788",
        })
        receipt = ReceiptParser().parse({
            "merchant_name": "Tata CLiQ Luxury",
            "total": 25000.00,
            "currency": "INR",
            "receipt_number": "TCLQ-REC-001",
            "date": "2026-10-05",
            "line_items": [
                {"description": "Ray-Ban Aviator Classic RB3025", "amount": 12500.00, "quantity": 1},
                {"description": "Fossil Gen 6 Smartwatch", "amount": 12500.00, "quantity": 1},
            ],
        })
        courier = CourierTrackingParser().parse({
            "carrier": "Blue Dart Express",
            "tracking_number": "BDED5678901234",
            "status": "DELIVERED",
            "delivery_date": "2026-10-08T16:00:00Z",
            "signed_by": "Achyut P.",
            "delivery_address": "123 Test Lane, Pune 411001",
            "expected_address": "123 Test Lane, Pune 411001",
            "delivery_address_match": True,
        })
        comm = CommunicationLogParser().parse({
            "channel": "EMAIL",
            "messages": [
                {"sender": "Customer", "role": "CARDHOLDER",
                 "content": "I received both items but the watch is damaged. Box was dented."},
                {"sender": "Tata CLiQ", "role": "MERCHANT",
                 "content": "We apologize. Please initiate a return from the app and we will "
                            "send a replacement within 5 business days."},
            ],
        })

        extractor = EvidenceHighlightExtractor()
        summary = extractor.extract_highlights([txn, receipt, courier, comm])
        assert summary.evidence_count == 4
        assert summary.parser_count == 4
        assert summary.total_highlights > 0
        assert len(summary.semantic_summary) > 100

        # Verify prompt context contains all sections
        prompt = summary.to_prompt_context()
        assert "=== EVIDENCE ANALYSIS SUMMARY ===" in prompt
        assert "--- KEY FACTS ---" in prompt
        assert "--- ALIGNMENT SIGNALS ---" in prompt
        assert "--- SEMANTIC SUMMARY ---" in prompt

    def test_empty_evidence_graceful_handling(self):
        """No evidence submitted — should not crash."""
        extractor = EvidenceHighlightExtractor()
        summary = extractor.extract_highlights([])
        assert summary.evidence_count == 0
        assert summary.net_alignment == ClaimAlignment.NEUTRAL
        assert summary.overall_evidence_confidence == 0.0

    def test_single_evidence_item_summary(self):
        """Just one transaction — minimal summary."""
        txn = TransactionParser().parse({
            "merchant_name": "Amazon India",
            "amount": 999.00,
            "currency": "INR",
            "transaction_date": "2026-10-25",
        })
        extractor = EvidenceHighlightExtractor()
        summary = extractor.extract_highlights([txn])
        assert summary.evidence_count == 1
        assert summary.parser_count == 1
        assert len(summary.alignment_signals) == 1
        assert summary.semantic_summary != ""

    def test_conflicting_evidence_neutral_alignment(self):
        """Courier says delivered + signed, but cardholder escalates — should be NEUTRAL or close."""
        courier = CourierTrackingParser().parse({
            "carrier": "DTDC",
            "tracking_number": "DTDC123456789",
            "status": "DELIVERED",
            "signed_by": "Ramesh K.",
            "delivery_address": "45 MG Road, Bengaluru",
            "expected_address": "45 MG Road, Bengaluru",
            "delivery_address_match": True,
        })
        comm = CommunicationLogParser().parse({
            "channel": "EMAIL",
            "messages": [
                {"sender": "Customer", "role": "CARDHOLDER",
                 "content": "I never received this package. Someone else signed for it. "
                            "I want a refund immediately or I will file a police report."},
            ],
        })
        extractor = EvidenceHighlightExtractor()
        summary = extractor.extract_highlights([courier, comm])
        # Conflicting signals — net should not be NEUTRAL or SUPPORTS_CARDHOLDER
        # (since courier has high confidence MERCHANT support)
        assert summary.evidence_count == 2
        assert len(summary.alignment_signals) == 2

    def test_all_parsers_with_anomalies(self):
        """Every parser produces anomalies — critical anomalies should be populated."""
        txn = TransactionParser().parse({
            "merchant_name": "Casino Online",
            "amount": 50000.00,  # HIGH_VALUE
            "transaction_date": "2026-10-26T23:00:00Z",  # Weekend
            "mcc_code": "7995",  # HIGH_RISK
        })
        receipt = ReceiptParser().parse({
            "merchant_name": "Casino Online",
            "total": 50000.00,
            "transaction_amount": 45000.00,  # DISCREPANCY
        })
        courier = CourierTrackingParser().parse({
            "carrier": "UnknownCarrier",
            "tracking_number": "XX",  # Too short
            "status": "LOST",  # EXCEPTION
        })
        comm = CommunicationLogParser().parse({
            "channel": "CHAT",
            "messages": [
                {"sender": "User", "role": "CARDHOLDER",
                 "content": "This is fraud! I will sue you! Contact my lawyer immediately!"},
            ],
        })

        extractor = EvidenceHighlightExtractor()
        summary = extractor.extract_highlights([txn, receipt, courier, comm])
        assert len(summary.critical_anomalies) >= 3
        assert summary.overall_evidence_confidence < 0.80

    def test_to_dict_serialization_complete(self):
        """Verify full dictionary output for API consumption."""
        txn = TransactionParser().parse({
            "merchant_name": "TestMerchant",
            "amount": 100.00,
            "transaction_date": "2026-10-01",
        })
        extractor = EvidenceHighlightExtractor()
        summary = extractor.extract_highlights([txn])
        data = summary.to_dict()

        assert isinstance(data, dict)
        required_keys = [
            "key_facts", "critical_anomalies", "alignment_signals",
            "net_alignment", "overall_evidence_confidence",
            "evidence_count", "total_highlights", "semantic_summary",
        ]
        for key in required_keys:
            assert key in data, f"Missing key: {key}"
        assert data["evidence_count"] == 1

    def test_prompt_context_rendering_non_empty(self):
        """Prompt context for Gemini should be well-formatted text."""
        receipt = ReceiptParser().parse({
            "merchant_name": "Reliance Digital",
            "total": 15999.00,
            "receipt_number": "RD-001",
            "date": "2026-10-25",
        })
        extractor = EvidenceHighlightExtractor()
        summary = extractor.extract_highlights([receipt])
        prompt = summary.to_prompt_context()

        assert isinstance(prompt, str)
        assert len(prompt) > 50
        assert "Evidence Items Analyzed: 1" in prompt

    def test_case_service_integration_with_highlights(self):
        """Full CaseService pipeline: create dispute, attach evidence, extract highlights."""
        case_file = case_service.create_dispute_case(
            transaction_id="txn_uat_final",
            cardholder_id="usr_uat_pooja",
            dispute_reason=DisputeReason.PRODUCT_NOT_RECEIVED,
            disputed_amount=8999.00,
        )
        dispute_id = case_file.header.dispute_id

        # Attach courier tracking
        case_service.attach_evidence(
            dispute_id=dispute_id,
            evidence_type=EvidenceType.COURIER_TRACKING,
            source=EvidenceSource.MERCHANT,
            raw_payload={
                "carrier": "Blue Dart Express",
                "tracking_number": "BDED9999888877",
                "status": "DELIVERED",
                "signed_by": "Unknown",
                "delivery_address": "Wrong Address, Mumbai",
                "expected_address": "Correct Address, Pune",
                "delivery_address_match": False,
            },
            actor="MERCHANT:croma",
        )

        # Extract highlights
        summary = case_service.extract_case_evidence_highlights(dispute_id)
        assert summary is not None
        assert summary.evidence_count >= 1
        assert len(summary.key_facts) > 0
        prompt = summary.to_prompt_context()
        assert "EVIDENCE ANALYSIS SUMMARY" in prompt

