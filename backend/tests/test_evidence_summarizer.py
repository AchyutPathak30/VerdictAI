"""
Test Suite for Evidence Highlight Extractor & Semantic Summarizer
Author: Achyut Pathak (AI/NLP Engineer — Evidence Parsing)
"""

import pytest
from datetime import datetime, timezone

from backend.app.services.nlp.evidence_summarizer import (
    EvidenceHighlight,
    EvidenceHighlightExtractor,
    EvidenceSummary,
)
from backend.app.services.parsers.base_parser import (
    AnomalyLevel,
    ClaimAlignment,
    DetectedAnomaly,
    ExtractedEntity,
    ParsedEvidence,
)
from backend.app.services.parsers.transaction_parser import TransactionParser
from backend.app.services.parsers.receipt_parser import ReceiptParser
from backend.app.services.parsers.courier_tracking_parser import CourierTrackingParser
from backend.app.services.nlp.communication_parser import CommunicationLogParser


@pytest.fixture
def sample_transaction_evidence() -> ParsedEvidence:
    parser = TransactionParser()
    payload = {
        "transaction_id": "txn_987654",
        "merchant_name": "Best Buy Electronics",
        "amount": 799.99,
        "currency": "USD",
        "transaction_date": "2026-03-15T14:30:00Z",
        "card_last_four": "4242",
        "mcc": "5732",
    }
    return parser.parse(payload)


@pytest.fixture
def sample_receipt_evidence() -> ParsedEvidence:
    parser = ReceiptParser()
    payload = {
        "merchant_name": "Best Buy Electronics",
        "receipt_number": "REC-987654",
        "date": "2026-03-15",
        "total": 799.99,
        "subtotal": 749.99,
        "tax": 50.00,
        "payment_method": "VISA ****4242",
        "line_items": [
            {"description": "Sony WH-1000XM5 Headphones", "amount": 399.99, "quantity": 1},
            {"description": "Apple iPad 10th Gen", "amount": 350.00, "quantity": 1},
        ],
    }
    return parser.parse(payload)


@pytest.fixture
def sample_courier_evidence_delivered() -> ParsedEvidence:
    parser = CourierTrackingParser()
    payload = {
        "tracking_number": "1Z9999999999999999",
        "carrier": "UPS",
        "status": "DELIVERED",
        "delivery_date": "2026-03-18T10:15:00Z",
        "destination": "Austin, TX, 78701",
        "signed_by": "J. DOE",
        "checkpoints": [
            {"timestamp": "2026-03-16T08:00:00Z", "location": "Dallas, TX", "status": "IN_TRANSIT"},
            {"timestamp": "2026-03-18T10:15:00Z", "location": "Austin, TX", "status": "DELIVERED"},
        ],
    }
    return parser.parse(payload)


@pytest.fixture
def sample_comm_log_evidence() -> ParsedEvidence:
    parser = CommunicationLogParser()
    payload = {
        "channel": "EMAIL",
        "messages": [
            {
                "sender": "Alice",
                "role": "CARDHOLDER",
                "content": "I never received my package. The tracking says delivered but nothing was on my porch. Please issue a refund.",
            },
            {
                "sender": "Best Buy Support",
                "role": "MERCHANT",
                "content": "We have checked with UPS and delivery was confirmed with signature. Please check with neighbors.",
            },
        ],
    }
    return parser.parse(payload)


class TestEvidenceHighlightExtractorBasics:
    """Tests for basic extractor instantiation and edge cases."""

    def test_empty_evidence_list_returns_empty_summary(self):
        extractor = EvidenceHighlightExtractor()
        summary = extractor.extract_highlights([])

        assert isinstance(summary, EvidenceSummary)
        assert summary.evidence_count == 0
        assert summary.parser_count == 0
        assert summary.key_facts == []
        assert summary.critical_anomalies == []
        assert summary.alignment_signals == []
        assert summary.net_alignment == ClaimAlignment.NEUTRAL
        assert summary.overall_evidence_confidence == 0.0
        assert summary.total_highlights == 0

    def test_single_evidence_item(self, sample_transaction_evidence):
        extractor = EvidenceHighlightExtractor()
        summary = extractor.extract_highlights([sample_transaction_evidence])

        assert summary.evidence_count == 1
        assert summary.parser_count == 1
        assert len(summary.key_facts) > 0
        assert len(summary.alignment_signals) == 1
        assert summary.overall_evidence_confidence > 0.0


class TestEvidenceHighlightExtractorAggregation:
    """Tests multi-source evidence synthesis."""

    def test_multi_parser_aggregation(
        self,
        sample_transaction_evidence,
        sample_receipt_evidence,
        sample_courier_evidence_delivered,
        sample_comm_log_evidence,
    ):
        extractor = EvidenceHighlightExtractor()
        items = [
            sample_transaction_evidence,
            sample_receipt_evidence,
            sample_courier_evidence_delivered,
            sample_comm_log_evidence,
        ]
        summary = extractor.extract_highlights(items)

        assert summary.evidence_count == 4
        assert summary.parser_count == 4
        assert summary.total_highlights > 0
        assert summary.overall_evidence_confidence >= 0.70

        # Verify key facts de-duplication
        fact_keys = [(f.supporting_data.get("entity_type"), f.supporting_data.get("value")) for f in summary.key_facts]
        assert len(fact_keys) == len(set(fact_keys))

        # Verify alignment signals contains all 4 items
        assert len(summary.alignment_signals) == 4

    def test_anomaly_ranking_order(self):
        """Verifies anomalies are ordered with highest severity first."""
        p1 = ParsedEvidence(
            parser_name="ParserA",
            structured_data={},
            extracted_entities=[],
            anomalies=[
                DetectedAnomaly(
                    anomaly_type="LOW_FLAG",
                    description="Minor notice",
                    severity=AnomalyLevel.LOW,
                ),
                DetectedAnomaly(
                    anomaly_type="CRITICAL_FLAG",
                    description="Severe mismatch detected",
                    severity=AnomalyLevel.CRITICAL,
                ),
            ],
            confidence_score=0.8,
            claim_alignment=ClaimAlignment.NEUTRAL,
        )
        p2 = ParsedEvidence(
            parser_name="ParserB",
            structured_data={},
            extracted_entities=[],
            anomalies=[
                DetectedAnomaly(
                    anomaly_type="HIGH_FLAG",
                    description="High concern noted",
                    severity=AnomalyLevel.HIGH,
                ),
            ],
            confidence_score=0.75,
            claim_alignment=ClaimAlignment.NEUTRAL,
        )

        extractor = EvidenceHighlightExtractor()
        summary = extractor.extract_highlights([p1, p2])

        # MIN_ANOMALY_SEVERITY is MEDIUM, so LOW is excluded, CRITICAL & HIGH are included
        severities = [a.summary for a in summary.critical_anomalies]
        assert len(severities) == 2
        assert "CRITICAL" in severities[0]
        assert "HIGH" in severities[1]

    def test_net_alignment_merchant_favor(self, sample_receipt_evidence, sample_courier_evidence_delivered):
        """When evidence favors merchant (e.g. proof of delivery + valid receipt), net alignment should be MERCHANT."""
        extractor = EvidenceHighlightExtractor()
        summary = extractor.extract_highlights([sample_receipt_evidence, sample_courier_evidence_delivered])

        assert summary.net_alignment == ClaimAlignment.SUPPORTS_MERCHANT


class TestEvidenceSummaryExportAndPrompt:
    """Tests rendering to dictionary and Gemini prompt context."""

    def test_to_prompt_context_format(
        self,
        sample_transaction_evidence,
        sample_receipt_evidence,
        sample_courier_evidence_delivered,
    ):
        extractor = EvidenceHighlightExtractor()
        summary = extractor.extract_highlights([
            sample_transaction_evidence,
            sample_receipt_evidence,
            sample_courier_evidence_delivered,
        ])

        prompt_text = summary.to_prompt_context()
        assert isinstance(prompt_text, str)
        assert "=== EVIDENCE ANALYSIS SUMMARY ===" in prompt_text
        assert "Evidence Items Analyzed: 3" in prompt_text
        assert "--- KEY FACTS ---" in prompt_text
        assert "--- ALIGNMENT SIGNALS ---" in prompt_text
        assert "--- SEMANTIC SUMMARY ---" in prompt_text

    def test_to_dict_structure(self, sample_transaction_evidence):
        extractor = EvidenceHighlightExtractor()
        summary = extractor.extract_highlights([sample_transaction_evidence])
        data = summary.to_dict()

        assert isinstance(data, dict)
        assert "key_facts" in data
        assert "critical_anomalies" in data
        assert "alignment_signals" in data
        assert "net_alignment" in data
        assert "overall_evidence_confidence" in data
        assert "evidence_count" in data
        assert "total_highlights" in data
        assert "semantic_summary" in data
        assert data["evidence_count"] == 1
