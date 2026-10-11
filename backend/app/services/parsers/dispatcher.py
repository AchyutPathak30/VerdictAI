"""
VerdictAI Evidence Parsing Pipeline — Dispatcher & Parser Registry
Author: Achyut Pathak (AI/NLP Engineer — Evidence Parsing)

Routes incoming evidence payloads to the appropriate specialized parser
based on EvidenceType and payload content inspection heuristics.
Bridges raw API/MongoDB ingestion with the deterministic NLP extraction pipeline.
"""

import logging
from typing import Any, Dict, List, Optional, Tuple, Type, Union

from backend.app.services.parsers.base_parser import (
    EvidenceParser,
    ParsedEvidence,
)
from backend.app.services.parsers.courier_tracking_parser import CourierTrackingParser
from backend.app.services.parsers.receipt_parser import ReceiptParser
from backend.app.services.parsers.transaction_parser import TransactionParser
from backend.app.services.nlp.communication_parser import CommunicationLogParser
from database.mongodb.models import EvidenceType

logger = logging.getLogger("verdictai.parsers.dispatcher")


class EvidenceParserDispatcher:
    """
    Central registry and dispatcher for VerdictAI evidence parsers.

    Maps ``EvidenceType`` enum values to specialized parsers, provides
    intelligent fallback via payload signature inspection, and safely
    executes validation and parsing without failing the parent transaction.
    """

    def __init__(self):
        # Instantiate singleton parser workers
        self._transaction_parser = TransactionParser()
        self._receipt_parser = ReceiptParser()
        self._courier_parser = CourierTrackingParser()
        self._comm_parser = CommunicationLogParser()

        # Primary mapping by EvidenceType enum string / value
        self._type_map: Dict[str, EvidenceParser] = {
            EvidenceType.RECEIPT_INVOICE.value: self._receipt_parser,
            EvidenceType.COURIER_TRACKING.value: self._courier_parser,
            EvidenceType.COMMUNICATION_LOG.value: self._comm_parser,
            EvidenceType.BANK_STATEMENT.value: self._transaction_parser,
        }

    @property
    def registered_parsers(self) -> Dict[str, EvidenceParser]:
        """Return dict of registered parsers keyed by parser name."""
        return {
            self._transaction_parser.parser_name: self._transaction_parser,
            self._receipt_parser.parser_name: self._receipt_parser,
            self._courier_parser.parser_name: self._courier_parser,
            self._comm_parser.parser_name: self._comm_parser,
        }

    def resolve_parser(
        self,
        evidence_type: Optional[Union[EvidenceType, str]] = None,
        raw_payload: Optional[Dict[str, Any]] = None,
    ) -> Optional[EvidenceParser]:
        """
        Resolves the most appropriate parser for the given evidence type and/or payload.

        Resolution strategy:
        1. Check direct type map matching ``evidence_type``.
        2. If not found or if the resolved parser fails payload validation, inspect
           payload signature to detect the data structure dynamically.
        """
        payload = raw_payload or {}

        # 1. Direct type resolution
        if evidence_type is not None:
            type_key = evidence_type.value if isinstance(evidence_type, EvidenceType) else str(evidence_type)
            parser = self._type_map.get(type_key)
            if parser and parser.validate(payload):
                return parser

        # 2. Content-based signature heuristic fallback
        return self._detect_parser_by_payload(payload)

    def _detect_parser_by_payload(self, payload: Dict[str, Any]) -> Optional[EvidenceParser]:
        """
        Inspects payload dictionary keys to infer the parser type.
        """
        if not payload:
            return None

        # Courier tracking signature
        if any(k in payload for k in ("tracking_number", "checkpoints", "carrier")):
            if self._courier_parser.validate(payload):
                return self._courier_parser

        # Receipt / Invoice signature
        if any(k in payload for k in ("line_items", "receipt_number", "invoice_number", "subtotal")):
            if self._receipt_parser.validate(payload):
                return self._receipt_parser

        # Communication log signature
        if any(k in payload for k in ("messages", "transcript", "chat_log")):
            if self._comm_parser.validate(payload):
                return self._comm_parser

        # Bank transaction signature
        if any(k in payload for k in ("transaction_id", "mcc", "card_last_four", "transaction_date")):
            if self._transaction_parser.validate(payload):
                return self._transaction_parser

        # Final check: see if any parser can validate
        for parser in (self._receipt_parser, self._courier_parser, self._comm_parser, self._transaction_parser):
            if parser.validate(payload):
                return parser

        return None

    def parse(
        self,
        evidence_type: Optional[Union[EvidenceType, str]] = None,
        raw_payload: Optional[Dict[str, Any]] = None,
    ) -> Optional[ParsedEvidence]:
        """
        Executes parser on raw_payload.
        Returns ``ParsedEvidence`` if successfully parsed, or ``None`` if
        no parser matched or parsing could not be completed.
        """
        if not raw_payload:
            return None

        parser = self.resolve_parser(evidence_type=evidence_type, raw_payload=raw_payload)
        if not parser:
            return None

        try:
            return parser.parse(raw_payload)
        except Exception as exc:
            logger.warning(
                "Evidence parsing failed using %s: %s",
                parser.parser_name,
                exc,
                exc_info=True,
            )
            return None

    def enrich_payload(
        self,
        evidence_type: Optional[Union[EvidenceType, str]] = None,
        raw_payload: Optional[Dict[str, Any]] = None,
    ) -> Tuple[Dict[str, Any], float, Optional[ParsedEvidence]]:
        """
        Convenience method for the case ingestion service.

        Returns
        -------
        tuple: (nlp_entities_dict, confidence_rating, parsed_evidence_obj)
        """
        parsed = self.parse(evidence_type=evidence_type, raw_payload=raw_payload)
        if parsed:
            return parsed.to_nlp_entities_dict(), parsed.confidence_score, parsed
        return {}, 1.0, None


# Global dispatcher singleton instance
evidence_dispatcher = EvidenceParserDispatcher()


def parse_evidence_payload(
    evidence_type: Optional[Union[EvidenceType, str]] = None,
    raw_payload: Optional[Dict[str, Any]] = None,
) -> Optional[ParsedEvidence]:
    """Helper functional wrapper around the global dispatcher."""
    return evidence_dispatcher.parse(evidence_type=evidence_type, raw_payload=raw_payload)
