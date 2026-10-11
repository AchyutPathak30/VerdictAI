"""
VerdictAI NLP Pipeline
Author: Achyut Pathak (AI/NLP Engineer — Evidence Parsing)

Public API for the NLP sub-package.
"""

from backend.app.services.nlp.entity_extractor import (
    EntityExtractor,
    ExtractionResult,
)
from backend.app.services.nlp.communication_parser import (
    CommunicationLogParser,
    CommunicationAnalysis,
    MessageSegment,
)
from backend.app.services.nlp.evidence_summarizer import (
    EvidenceHighlightExtractor,
    EvidenceSummary,
    EvidenceHighlight,
)

__all__ = [
    "EntityExtractor",
    "ExtractionResult",
    "CommunicationLogParser",
    "CommunicationAnalysis",
    "MessageSegment",
    "EvidenceHighlightExtractor",
    "EvidenceSummary",
    "EvidenceHighlight",
]
