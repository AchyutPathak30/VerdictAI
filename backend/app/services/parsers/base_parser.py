"""
VerdictAI Evidence Parsing Pipeline — Base Parser & Shared Models
Author: Achyut Pathak (AI/NLP Engineer — Evidence Parsing)

Provides the abstract base class and shared data structures used by all
evidence parsers (Transaction, Receipt, Courier Tracking).
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ClaimAlignment(str, Enum):
    """Indicates which party the parsed evidence tends to support."""
    SUPPORTS_CARDHOLDER = "SUPPORTS_CARDHOLDER"
    SUPPORTS_MERCHANT = "SUPPORTS_MERCHANT"
    NEUTRAL = "NEUTRAL"
    INCONCLUSIVE = "INCONCLUSIVE"


class AnomalyLevel(str, Enum):
    """Severity classification for detected evidence anomalies."""
    NONE = "NONE"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


@dataclass
class ExtractedEntity:
    """A single entity extracted from evidence via NLP or rule-based parsing."""
    entity_type: str
    text: str
    confidence: float = 1.0
    start_offset: Optional[int] = None
    end_offset: Optional[int] = None


@dataclass
class DetectedAnomaly:
    """An anomaly or red-flag detected during evidence parsing."""
    anomaly_type: str
    description: str
    severity: AnomalyLevel = AnomalyLevel.LOW
    supporting_data: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ParsedEvidence:
    """
    Standardized output from any evidence parser.
    Contains extracted structured fields, NLP entities, detected anomalies,
    a confidence score, and the claim alignment assessment.
    """
    parser_name: str
    parsed_at: datetime = field(default_factory=utc_now)
    structured_data: Dict[str, Any] = field(default_factory=dict)
    extracted_entities: List[ExtractedEntity] = field(default_factory=list)
    anomalies: List[DetectedAnomaly] = field(default_factory=list)
    confidence_score: float = 1.0
    claim_alignment: ClaimAlignment = ClaimAlignment.NEUTRAL
    raw_text_content: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    @property
    def has_anomalies(self) -> bool:
        return len(self.anomalies) > 0

    @property
    def highest_anomaly_severity(self) -> AnomalyLevel:
        if not self.anomalies:
            return AnomalyLevel.NONE
        severity_order = [
            AnomalyLevel.NONE, AnomalyLevel.LOW, AnomalyLevel.MEDIUM,
            AnomalyLevel.HIGH, AnomalyLevel.CRITICAL,
        ]
        return max(
            (a.severity for a in self.anomalies),
            key=lambda s: severity_order.index(s),
        )

    def to_nlp_entities_dict(self) -> Dict[str, Any]:
        """
        Converts extracted entities to the dict format expected by
        ``EvidencePayloadModel.nlp_extracted_entities``.
        """
        return {
            "extracted_entities": [
                {
                    "entity": e.entity_type,
                    "text": e.text,
                    "confidence": e.confidence,
                }
                for e in self.extracted_entities
            ],
            "anomalies": [
                {
                    "type": a.anomaly_type,
                    "description": a.description,
                    "severity": a.severity.value,
                }
                for a in self.anomalies
            ],
            "claim_alignment": self.claim_alignment.value,
            "confidence_score": self.confidence_score,
        }


class EvidenceParser(ABC):
    """
    Abstract base class for all evidence parsers.

    Subclasses must implement ``parse()`` and ``validate()``.
    The ``parse()`` method receives the ``raw_payload`` dict from an
    ``EvidencePayloadModel`` and returns a ``ParsedEvidence`` result.
    """

    @property
    @abstractmethod
    def parser_name(self) -> str:
        """Human-readable name of this parser."""
        ...

    @abstractmethod
    def validate(self, raw_payload: Dict[str, Any]) -> bool:
        """
        Returns True if the raw_payload contains the minimum required
        fields for parsing. Implementations should NOT raise; they
        should return False on invalid input.
        """
        ...

    @abstractmethod
    def parse(self, raw_payload: Dict[str, Any]) -> ParsedEvidence:
        """
        Parses a raw evidence payload into a structured ParsedEvidence object.

        Parameters
        ----------
        raw_payload : dict
            The ``raw_payload`` field from an ``EvidencePayloadModel``.

        Returns
        -------
        ParsedEvidence
            Structured extraction results including entities, anomalies,
            confidence, and claim alignment.

        Raises
        ------
        ValueError
            If the payload fails validation.
        """
        ...

    def _require_fields(
        self,
        raw_payload: Dict[str, Any],
        required: List[str],
    ) -> None:
        """Utility: raise ValueError when any required key is absent."""
        if not isinstance(raw_payload, dict):
            raise ValueError(
                f"{self.parser_name}: raw_payload must be a dict, got {type(raw_payload).__name__}"
            )
        missing = [f for f in required if f not in raw_payload or raw_payload[f] is None]
        if missing:
            raise ValueError(
                f"{self.parser_name}: missing required fields: {', '.join(missing)}"
            )
