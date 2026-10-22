"""
Test Suite for Evidence Ingestion Pipeline & Dispatcher Integration
Author: Achyut Pathak (AI/NLP Engineer — Evidence Parsing)
"""

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.parsers.dispatcher import (
    EvidenceParserDispatcher,
    evidence_dispatcher,
    parse_evidence_payload,
)
from backend.app.services.parsers.base_parser import ClaimAlignment
from backend.app.services.case_builder.service import case_service
from backend.app.models.schemas import DisputeReason, DisputeStatus
from database.mongodb.models import EvidenceType, EvidenceSource
from backend.app.core.db import db_manager


@pytest.fixture(autouse=True)
def reset_db():
    db_manager.reset_in_memory_stores()


@pytest.fixture
def client():
    return TestClient(app)


class TestEvidenceParserDispatcher:
    """Tests for the dispatcher and parser registry."""

    def test_registered_parsers(self):
        dispatcher = EvidenceParserDispatcher()
        parsers = dispatcher.registered_parsers
        assert "TransactionParser" in parsers
        assert "ReceiptParser" in parsers
        assert "CourierTrackingParser" in parsers
        assert "CommunicationLogParser" in parsers

    def test_resolve_parser_by_evidence_type(self):
        dispatcher = EvidenceParserDispatcher()

        p_receipt = dispatcher.resolve_parser(
            evidence_type=EvidenceType.RECEIPT_INVOICE,
            raw_payload={"merchant_name": "Nike Store", "total": 120.0},
        )
        assert p_receipt is not None
        assert p_receipt.parser_name == "ReceiptParser"

        p_courier = dispatcher.resolve_parser(
            evidence_type=EvidenceType.COURIER_TRACKING,
            raw_payload={"carrier": "DHL", "tracking_number": "1234567890", "status": "IN_TRANSIT"},
        )
        assert p_courier is not None
        assert p_courier.parser_name == "CourierTrackingParser"

        p_comm = dispatcher.resolve_parser(
            evidence_type=EvidenceType.COMMUNICATION_LOG,
            raw_payload={"messages": [{"sender": "Alice", "content": "Help me"}]},
        )
        assert p_comm is not None
        assert p_comm.parser_name == "CommunicationLogParser"

        p_bank = dispatcher.resolve_parser(
            evidence_type=EvidenceType.BANK_STATEMENT,
            raw_payload={"merchant_name": "Target", "amount": 45.0, "transaction_date": "2026-03-01"},
        )
        assert p_bank is not None
        assert p_bank.parser_name == "TransactionParser"

    def test_heuristic_fallback_when_type_missing(self):
        """Dispatcher correctly infers parser from payload keys even without explicit evidence type."""
        dispatcher = EvidenceParserDispatcher()

        # Courier tracking signature
        p = dispatcher.resolve_parser(
            raw_payload={"carrier": "FedEx", "tracking_number": "999888777", "status": "DELIVERED"}
        )
        assert p is not None
        assert p.parser_name == "CourierTrackingParser"

        # Receipt signature
        p = dispatcher.resolve_parser(
            raw_payload={"merchant_name": "Apple", "total": 999.0, "line_items": []}
        )
        assert p is not None
        assert p.parser_name == "ReceiptParser"

        # Communication log signature
        p = dispatcher.resolve_parser(
            raw_payload={"messages": [{"sender": "Support", "content": "Hello"}]}
        )
        assert p is not None
        assert p.parser_name == "CommunicationLogParser"

    def test_enrich_payload_returns_populated_entities(self):
        dispatcher = EvidenceParserDispatcher()
        payload = {
            "merchant_name": "Best Buy",
            "receipt_number": "REC-001",
            "total": 59.99,
            "date": "2026-03-10",
        }
        nlp_dict, conf, parsed = dispatcher.enrich_payload(
            evidence_type=EvidenceType.RECEIPT_INVOICE,
            raw_payload=payload,
        )

        assert isinstance(nlp_dict, dict)
        assert "extracted_entities" in nlp_dict
        assert len(nlp_dict["extracted_entities"]) > 0
        assert conf > 0.0
        assert parsed is not None

    def test_unsupported_or_invalid_payload_safe_fallback(self):
        dispatcher = EvidenceParserDispatcher()
        nlp_dict, conf, parsed = dispatcher.enrich_payload(
            evidence_type="UNKNOWN_TYPE",
            raw_payload={"irrelevant_key": 123},
        )
        assert nlp_dict == {}
        assert conf == 1.0
        assert parsed is None


class TestCaseServicePipelineIntegration:
    """Tests end-to-end integration with CaseService and MongoDB."""

    def test_attach_evidence_populates_nlp_extracted_entities(self):
        case_file = case_service.create_dispute_case(
            transaction_id="txn_pipeline_001",
            cardholder_id="usr_test_101",
            dispute_reason=DisputeReason.PRODUCT_NOT_RECEIVED,
            disputed_amount=150.00,
        )
        dispute_id = case_file.header.dispute_id

        courier_payload = {
            "carrier": "FedEx",
            "tracking_number": "789123456780",
            "status": "DELIVERED",
            "signed_by": "B. JOHNSON",
            "delivery_date": "2026-03-12T15:00:00Z",
        }

        evidence = case_service.attach_evidence(
            dispute_id=dispute_id,
            evidence_type=EvidenceType.COURIER_TRACKING,
            source=EvidenceSource.MERCHANT,
            raw_payload=courier_payload,
            actor="MERCHANT:m001",
            file_name="courier_pod.json",
        )

        assert evidence is not None
        assert evidence.nlp_extracted_entities != {}
        assert "extracted_entities" in evidence.nlp_extracted_entities

        entities = evidence.nlp_extracted_entities["extracted_entities"]
        entity_types = [e["entity"] for e in entities]
        assert "CARRIER" in entity_types
        assert "TRACKING_NUMBER" in entity_types
        assert "DELIVERY_STATUS" in entity_types
        assert evidence.confidence_rating > 0.0

    def test_extract_case_evidence_highlights_aggregation(self):
        case_file = case_service.create_dispute_case(
            transaction_id="txn_pipeline_002",
            cardholder_id="usr_test_102",
            dispute_reason=DisputeReason.PRODUCT_NOT_RECEIVED,
            disputed_amount=299.99,
        )
        dispute_id = case_file.header.dispute_id

        # Attach receipt
        case_service.attach_evidence(
            dispute_id=dispute_id,
            evidence_type=EvidenceType.RECEIPT_INVOICE,
            source=EvidenceSource.MERCHANT,
            raw_payload={
                "merchant_name": "Gizmo Direct",
                "total": 299.99,
                "receipt_number": "GIZ-5544",
                "date": "2026-03-01",
            },
            actor="MERCHANT:m002",
        )

        # Attach courier tracking
        case_service.attach_evidence(
            dispute_id=dispute_id,
            evidence_type=EvidenceType.COURIER_TRACKING,
            source=EvidenceSource.MERCHANT,
            raw_payload={
                "carrier": "UPS",
                "tracking_number": "1Z99999999",
                "status": "DELIVERED",
                "signed_by": "ALEX P.",
            },
            actor="MERCHANT:m002",
        )

        summary = case_service.extract_case_evidence_highlights(dispute_id)
        assert summary is not None
        assert summary.evidence_count == 2
        assert summary.parser_count == 2
        assert len(summary.key_facts) >= 2
        assert summary.net_alignment == ClaimAlignment.SUPPORTS_MERCHANT
        assert len(summary.to_prompt_context()) > 0


class TestEvidenceAPIEndpoints:
    """Tests evidence API highlights endpoint."""

    def test_get_evidence_highlights_api(self, client):
        case_file = case_service.create_dispute_case(
            transaction_id="txn_api_001",
            cardholder_id="usr_api_01",
            dispute_reason=DisputeReason.PRODUCT_NOT_RECEIVED,
            disputed_amount=89.00,
        )
        dispute_id = case_file.header.dispute_id

        # Initially no evidence
        res = client.get(f"/api/v1/evidence/{dispute_id}/highlights")
        assert res.status_code == 200
        data = res.json()
        assert data["evidence_count"] == 0
        assert data["highlights"] is None

        # Attach structured evidence
        payload = {
            "dispute_id": dispute_id,
            "evidence_type": "COURIER_TRACKING",
            "source": "COURIER_CARRIER",
            "raw_payload": {
                "carrier": "USPS",
                "tracking_number": "9400100000000000000000",
                "status": "DELIVERED",
            },
            "actor": "USPS_WEBHOOK",
        }
        res_attach = client.post("/api/v1/evidence/payload", json=payload)
        assert res_attach.status_code == 201

        # Now get highlights
        res = client.get(f"/api/v1/evidence/{dispute_id}/highlights")
        assert res.status_code == 200
        data = res.json()
        assert data["evidence_count"] == 1
        assert data["highlights"] is not None
        assert "key_facts" in data["highlights"]
        assert "prompt_context" in data
        assert len(data["prompt_context"]) > 0
