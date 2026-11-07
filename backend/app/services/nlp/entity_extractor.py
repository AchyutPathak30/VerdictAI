"""
VerdictAI NLP Pipeline — Lightweight Named Entity Extractor
Author: Achyut Pathak (AI/NLP Engineer — Evidence Parsing)

Rule-based and pattern-based entity extraction engine designed for
deterministic, reproducible NLP across dispute evidence text.  Provides
a spaCy-compatible interface without requiring heavy model downloads,
making it suitable for CI/CD pipelines and unit testing.

Supports extraction of: DATE, MONEY, PERSON, ORDER_ID, TRACKING_NUMBER,
EMAIL, PHONE, and custom dispute-domain entities.
"""

import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

from backend.app.services.parsers.base_parser import ExtractedEntity


# ── Pattern Definitions ──────────────────────────────────────────

# ISO & common date patterns
_DATE_PATTERNS = [
    # ISO 8601
    (r"\b\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})?)?\b", 0.95),
    # Month DD, YYYY
    (r"\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b", 0.93),
    # Mon DD, YYYY (abbreviated)
    (r"\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}\b", 0.90),
    # MM/DD/YYYY or DD/MM/YYYY
    (r"\b\d{1,2}/\d{1,2}/\d{2,4}\b", 0.80),
]

# Monetary amounts
_MONEY_PATTERNS = [
    (r"\$\s*[\d,]+\.?\d*", 0.95),
    (r"(?:USD|EUR|GBP|CAD|AUD)\s*[\d,]+\.?\d*", 0.90),
    (r"[\d,]+\.\d{2}\s*(?:USD|EUR|GBP|CAD|AUD|dollars?)", 0.85),
]

# Order / Reference IDs
_ORDER_ID_PATTERNS = [
    (r"(?:Order|ORD|Ref|Reference|Confirmation)\s*#?\s*:?\s*([A-Z0-9\-]{5,20})", 0.92),
    (r"\b(?:ORD|INV|TXN|REF)-[A-Z0-9]{4,16}\b", 0.90),
]

# Tracking numbers (carrier-agnostic pattern)
_TRACKING_PATTERNS = [
    (r"(?:Tracking|Track)\s*#?\s*:?\s*([A-Z0-9]{10,30})", 0.90),
    (r"\b1Z[A-Z0-9]{16}\b", 0.95),  # UPS
    (r"\b\d{12,22}\b", 0.70),        # FedEx / USPS (numeric)
]

# Email addresses
_EMAIL_PATTERN = (r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b", 0.95)

# Phone numbers
_PHONE_PATTERN = (r"(?:\+?\d{1,3}[\s\-]?)?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}\b", 0.85)

# Person names — simple heuristic: capitalised word pairs (limited precision)
_PERSON_PATTERN = (r"\b[A-Z][a-z]+\s+[A-Z][a-z]+\b", 0.60)


@dataclass
class ExtractionResult:
    """Aggregated result from the entity extractor."""
    entities: List[ExtractedEntity] = field(default_factory=list)
    entity_count: int = 0
    entity_types_found: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "extracted_entities": [
                {
                    "entity": e.entity_type,
                    "text": e.text,
                    "confidence": e.confidence,
                }
                for e in self.entities
            ],
            "entity_count": self.entity_count,
            "entity_types_found": self.entity_types_found,
        }


class EntityExtractor:
    """
    Lightweight, deterministic named entity extractor.

    Uses compiled regex patterns to identify and extract entities from
    free-text evidence (communication logs, OCR output, statement
    descriptors).  The interface is designed to be swappable with a
    spaCy ``nlp()`` pipeline when heavier models become available.
    """

    def __init__(self):
        self._compiled_patterns: Dict[str, List[Tuple[re.Pattern, float]]] = {
            "DATE": [(re.compile(p, re.IGNORECASE), c) for p, c in _DATE_PATTERNS],
            "MONEY": [(re.compile(p, re.IGNORECASE), c) for p, c in _MONEY_PATTERNS],
            "ORDER_ID": [(re.compile(p, re.IGNORECASE), c) for p, c in _ORDER_ID_PATTERNS],
            "TRACKING_NUMBER": [(re.compile(p), c) for p, c in _TRACKING_PATTERNS],
            "EMAIL": [(re.compile(_EMAIL_PATTERN[0]), _EMAIL_PATTERN[1])],
            "PHONE": [(re.compile(_PHONE_PATTERN[0]), _PHONE_PATTERN[1])],
        }

    def extract_entities(self, text: str) -> ExtractionResult:
        """
        Extract all recognised entities from the given text.

        Parameters
        ----------
        text : str
            Free-text input (communication log, OCR output, etc.).

        Returns
        -------
        ExtractionResult
            Aggregated extraction result with all found entities.
        """
        if not isinstance(text, str):
            return ExtractionResult()

        text = text.replace("\x00", "")
        # Guard against pathological input length (max 500 KB)
        if len(text) > 500_000:
            text = text[:500_000]

        if not text.strip():
            return ExtractionResult()

        all_entities: List[ExtractedEntity] = []
        seen_spans: set = set()  # (start, end) to avoid overlaps

        # Pattern-based extraction
        for entity_type, patterns in self._compiled_patterns.items():
            for pattern, base_confidence in patterns:
                for match in pattern.finditer(text):
                    # Use the last captured group if there is one, else full match
                    if match.lastindex:
                        entity_text = match.group(match.lastindex)
                        start = match.start(match.lastindex)
                        end = match.end(match.lastindex)
                    else:
                        entity_text = match.group()
                        start = match.start()
                        end = match.end()

                    span_key = (start, end)
                    if span_key in seen_spans:
                        continue
                    seen_spans.add(span_key)

                    all_entities.append(ExtractedEntity(
                        entity_type=entity_type,
                        text=entity_text.strip(),
                        confidence=base_confidence,
                        start_offset=start,
                        end_offset=end,
                    ))

        # Person names (run separately with lower priority to avoid false positives)
        person_pattern = re.compile(_PERSON_PATTERN[0])
        for match in person_pattern.finditer(text):
            span_key = (match.start(), match.end())
            if span_key not in seen_spans:
                candidate = match.group()
                # Filter out common false positives
                if not self._is_common_phrase(candidate):
                    seen_spans.add(span_key)
                    all_entities.append(ExtractedEntity(
                        entity_type="PERSON",
                        text=candidate,
                        confidence=_PERSON_PATTERN[1],
                        start_offset=match.start(),
                        end_offset=match.end(),
                    ))

        # Sort by position in text
        all_entities.sort(key=lambda e: (e.start_offset or 0))

        types_found = sorted(set(e.entity_type for e in all_entities))
        return ExtractionResult(
            entities=all_entities,
            entity_count=len(all_entities),
            entity_types_found=types_found,
        )

    def extract_specific_type(
        self,
        text: str,
        entity_type: str,
    ) -> List[ExtractedEntity]:
        """
        Extract entities of a single type from the text.
        """
        result = self.extract_entities(text)
        return [e for e in result.entities if e.entity_type == entity_type]

    @staticmethod
    def _is_common_phrase(candidate: str) -> bool:
        """Filter out capitalised bigrams that are not person names."""
        common_phrases = {
            "Dear Sir", "Dear Madam", "Dear Customer", "Dear Team",
            "Thank You", "Best Regards", "Kind Regards", "Dear Member",
            "Dear Merchant", "Customer Service", "Support Team",
            "Order Number", "Order Confirmation", "Tracking Number",
            "Delivery Status", "Delivery Date", "Return Policy",
            "Refund Policy", "Credit Card", "Debit Card",
            "Please Contact", "Please Note", "We Apologize",
        }
        return candidate in common_phrases
