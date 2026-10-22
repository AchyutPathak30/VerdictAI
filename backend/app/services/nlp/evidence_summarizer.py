"""
VerdictAI NLP Pipeline — Evidence Highlight Extractor & Semantic Summarizer
Author: Achyut Pathak (AI/NLP Engineer — Evidence Parsing)

Aggregates parsed evidence from all parser outputs (Transaction, Receipt,
Courier Tracking, Communication Log) and produces a structured highlight
summary suitable for injection into the Gemini reasoning layer prompt.

This module bridges the Evidence Parsing Pipeline and the XAI Reasoning
Layer by distilling parsed anomalies, entities, and alignment signals
into a curated, prompt-ready format.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from backend.app.services.parsers.base_parser import (
    AnomalyLevel,
    ClaimAlignment,
    DetectedAnomaly,
    ExtractedEntity,
    ParsedEvidence,
)


# Severity ranking for sorting anomalies
_SEVERITY_RANK = {
    AnomalyLevel.NONE: 0,
    AnomalyLevel.LOW: 1,
    AnomalyLevel.MEDIUM: 2,
    AnomalyLevel.HIGH: 3,
    AnomalyLevel.CRITICAL: 4,
}

# Entity types considered "key facts" for dispute resolution
_KEY_ENTITY_TYPES = {
    "MERCHANT", "MONEY", "DATE", "CARD_LAST_FOUR",
    "TRANSACTION_ID", "TRACKING_NUMBER", "CARRIER",
    "DELIVERY_STATUS", "PERSON", "GPS_COORDINATES",
    "RECEIPT_NUMBER", "ORDER_ID", "PAYMENT_METHOD",
}


@dataclass
class EvidenceHighlight:
    """A single curated evidence highlight for the reasoning layer."""
    category: str          # "KEY_FACT", "ANOMALY", "ALIGNMENT_SIGNAL"
    source_parser: str     # Which parser produced this highlight
    summary: str           # Human-readable summary sentence
    importance: float      # 0.0–1.0 ranking for prompt ordering
    supporting_data: Dict[str, Any] = field(default_factory=dict)


@dataclass
class EvidenceSummary:
    """
    Aggregated, structured output from the Evidence Highlight Extractor.
    Designed to be consumed directly by the Gemini reasoning prompt builder.
    """
    key_facts: List[EvidenceHighlight] = field(default_factory=list)
    critical_anomalies: List[EvidenceHighlight] = field(default_factory=list)
    alignment_signals: List[EvidenceHighlight] = field(default_factory=list)
    net_alignment: ClaimAlignment = ClaimAlignment.NEUTRAL
    overall_evidence_confidence: float = 0.0
    evidence_count: int = 0
    parser_count: int = 0
    semantic_summary: str = ""

    @property
    def total_highlights(self) -> int:
        return len(self.key_facts) + len(self.critical_anomalies) + len(self.alignment_signals)

    def to_prompt_context(self) -> str:
        """
        Renders the full summary as a structured text block suitable for
        injection into a Gemini / LLM reasoning prompt.
        """
        lines = []
        lines.append("=== EVIDENCE ANALYSIS SUMMARY ===")
        lines.append(f"Evidence Items Analyzed: {self.evidence_count}")
        lines.append(f"Overall Evidence Confidence: {self.overall_evidence_confidence:.1%}")
        lines.append(f"Net Evidence Alignment: {self.net_alignment.value}")
        lines.append("")

        if self.key_facts:
            lines.append("--- KEY FACTS ---")
            for i, fact in enumerate(self.key_facts, 1):
                lines.append(f"  {i}. [{fact.source_parser}] {fact.summary}")
            lines.append("")

        if self.critical_anomalies:
            lines.append("--- CRITICAL ANOMALIES & RED FLAGS ---")
            for i, anomaly in enumerate(self.critical_anomalies, 1):
                lines.append(f"  {i}. [{anomaly.source_parser}] {anomaly.summary}")
            lines.append("")

        if self.alignment_signals:
            lines.append("--- ALIGNMENT SIGNALS ---")
            for signal in self.alignment_signals:
                lines.append(f"  • [{signal.source_parser}] {signal.summary}")
            lines.append("")

        if self.semantic_summary:
            lines.append("--- SEMANTIC SUMMARY ---")
            lines.append(self.semantic_summary)

        return "\n".join(lines)

    def to_dict(self) -> Dict[str, Any]:
        """Serialisable dict representation for API responses and audit logs."""
        return {
            "key_facts": [
                {"category": h.category, "source": h.source_parser,
                 "summary": h.summary, "importance": h.importance}
                for h in self.key_facts
            ],
            "critical_anomalies": [
                {"category": h.category, "source": h.source_parser,
                 "summary": h.summary, "importance": h.importance,
                 "data": h.supporting_data}
                for h in self.critical_anomalies
            ],
            "alignment_signals": [
                {"category": h.category, "source": h.source_parser,
                 "summary": h.summary}
                for h in self.alignment_signals
            ],
            "net_alignment": self.net_alignment.value,
            "overall_evidence_confidence": round(self.overall_evidence_confidence, 4),
            "evidence_count": self.evidence_count,
            "total_highlights": self.total_highlights,
            "semantic_summary": self.semantic_summary,
        }


class EvidenceHighlightExtractor:
    """
    Aggregates a list of ``ParsedEvidence`` outputs from the parsing pipeline
    and produces a curated ``EvidenceSummary`` containing:

    1. **Key Facts** — The most important extracted entities across all evidence
    2. **Critical Anomalies** — HIGH/CRITICAL anomalies summarized in plain language
    3. **Alignment Signals** — Per-parser alignment assessments
    4. **Semantic Summary** — A structured narrative block for Gemini prompts

    Usage::

        from backend.app.services.nlp.evidence_summarizer import EvidenceHighlightExtractor

        extractor = EvidenceHighlightExtractor()
        summary = extractor.extract_highlights([parsed_txn, parsed_receipt, parsed_tracking])
        prompt_text = summary.to_prompt_context()
    """

    # Maximum number of key facts to include
    MAX_KEY_FACTS = 12
    # Minimum anomaly severity to include in critical anomalies
    MIN_ANOMALY_SEVERITY = AnomalyLevel.MEDIUM

    def extract_highlights(
        self,
        parsed_evidence_items: List[ParsedEvidence],
    ) -> EvidenceSummary:
        """
        Extract and aggregate highlights from multiple parsed evidence items.

        Parameters
        ----------
        parsed_evidence_items : list[ParsedEvidence]
            List of parser outputs from TransactionParser, ReceiptParser,
            CourierTrackingParser, and/or CommunicationLogParser.

        Returns
        -------
        EvidenceSummary
            Aggregated highlight summary ready for reasoning layer consumption.
        """
        if not parsed_evidence_items:
            return EvidenceSummary()

        key_facts = self._extract_key_facts(parsed_evidence_items)
        critical_anomalies = self._extract_critical_anomalies(parsed_evidence_items)
        alignment_signals = self._extract_alignment_signals(parsed_evidence_items)
        net_alignment = self._compute_net_alignment(parsed_evidence_items)
        overall_confidence = self._compute_overall_confidence(parsed_evidence_items)
        semantic_summary = self._generate_semantic_summary(
            parsed_evidence_items, net_alignment, overall_confidence, critical_anomalies,
        )

        return EvidenceSummary(
            key_facts=key_facts,
            critical_anomalies=critical_anomalies,
            alignment_signals=alignment_signals,
            net_alignment=net_alignment,
            overall_evidence_confidence=overall_confidence,
            evidence_count=len(parsed_evidence_items),
            parser_count=len(set(p.parser_name for p in parsed_evidence_items)),
            semantic_summary=semantic_summary,
        )

    # ── Key Fact Extraction ─────────────────────────────────────────

    def _extract_key_facts(
        self,
        items: List[ParsedEvidence],
    ) -> List[EvidenceHighlight]:
        """
        Collects the most important entities across all evidence items,
        de-duplicates by (entity_type, text), and ranks by confidence.
        """
        seen: set = set()
        facts: List[EvidenceHighlight] = []

        for parsed in items:
            for entity in parsed.extracted_entities:
                if entity.entity_type not in _KEY_ENTITY_TYPES:
                    continue

                dedup_key = (entity.entity_type, entity.text)
                if dedup_key in seen:
                    continue
                seen.add(dedup_key)

                summary = self._entity_to_summary(entity)
                facts.append(EvidenceHighlight(
                    category="KEY_FACT",
                    source_parser=parsed.parser_name,
                    summary=summary,
                    importance=entity.confidence,
                    supporting_data={
                        "entity_type": entity.entity_type,
                        "value": entity.text,
                    },
                ))

        # Sort by importance (highest first) and limit
        facts.sort(key=lambda h: h.importance, reverse=True)
        return facts[:self.MAX_KEY_FACTS]

    # ── Critical Anomaly Extraction ─────────────────────────────────

    def _extract_critical_anomalies(
        self,
        items: List[ParsedEvidence],
    ) -> List[EvidenceHighlight]:
        """
        Collects anomalies at MEDIUM severity or above from all parsers,
        sorted by severity (most severe first).
        """
        anomalies: List[EvidenceHighlight] = []
        min_rank = _SEVERITY_RANK.get(self.MIN_ANOMALY_SEVERITY, 2)

        for parsed in items:
            for anomaly in parsed.anomalies:
                if _SEVERITY_RANK.get(anomaly.severity, 0) < min_rank:
                    continue

                anomalies.append(EvidenceHighlight(
                    category="ANOMALY",
                    source_parser=parsed.parser_name,
                    summary=f"[{anomaly.severity.value}] {anomaly.description}",
                    importance=_SEVERITY_RANK.get(anomaly.severity, 0) / 4.0,
                    supporting_data=anomaly.supporting_data,
                ))

        # Sort by importance (highest severity first)
        anomalies.sort(key=lambda h: h.importance, reverse=True)
        return anomalies

    # ── Alignment Signal Extraction ─────────────────────────────────

    def _extract_alignment_signals(
        self,
        items: List[ParsedEvidence],
    ) -> List[EvidenceHighlight]:
        """
        Produces one alignment signal per parsed evidence item,
        describing which party the evidence supports and with what confidence.
        """
        signals: List[EvidenceHighlight] = []

        for parsed in items:
            alignment = parsed.claim_alignment
            confidence = parsed.confidence_score

            if alignment == ClaimAlignment.SUPPORTS_CARDHOLDER:
                summary = (
                    f"Evidence supports CARDHOLDER position "
                    f"(confidence: {confidence:.1%})"
                )
            elif alignment == ClaimAlignment.SUPPORTS_MERCHANT:
                summary = (
                    f"Evidence supports MERCHANT position "
                    f"(confidence: {confidence:.1%})"
                )
            elif alignment == ClaimAlignment.INCONCLUSIVE:
                summary = (
                    f"Evidence is INCONCLUSIVE "
                    f"(confidence: {confidence:.1%})"
                )
            else:
                summary = (
                    f"Evidence is NEUTRAL — factual record "
                    f"(confidence: {confidence:.1%})"
                )

            signals.append(EvidenceHighlight(
                category="ALIGNMENT_SIGNAL",
                source_parser=parsed.parser_name,
                summary=summary,
                importance=confidence,
            ))

        return signals

    # ── Net Alignment Computation ───────────────────────────────────

    @staticmethod
    def _compute_net_alignment(
        items: List[ParsedEvidence],
    ) -> ClaimAlignment:
        """
        Computes the net weighted alignment across all evidence items.
        Uses each item's confidence score as a weight for its alignment vote.
        """
        cardholder_weight = 0.0
        merchant_weight = 0.0

        for parsed in items:
            w = parsed.confidence_score
            if parsed.claim_alignment == ClaimAlignment.SUPPORTS_CARDHOLDER:
                cardholder_weight += w
            elif parsed.claim_alignment == ClaimAlignment.SUPPORTS_MERCHANT:
                merchant_weight += w
            # NEUTRAL and INCONCLUSIVE don't contribute to either side

        if cardholder_weight == 0.0 and merchant_weight == 0.0:
            return ClaimAlignment.NEUTRAL

        if cardholder_weight > merchant_weight * 1.3:
            return ClaimAlignment.SUPPORTS_CARDHOLDER
        elif merchant_weight > cardholder_weight * 1.3:
            return ClaimAlignment.SUPPORTS_MERCHANT
        else:
            return ClaimAlignment.NEUTRAL

    # ── Overall Confidence Computation ──────────────────────────────

    @staticmethod
    def _compute_overall_confidence(
        items: List[ParsedEvidence],
    ) -> float:
        """Weighted average of all parser confidence scores."""
        if not items:
            return 0.0
        total = sum(p.confidence_score for p in items)
        return round(total / len(items), 4)

    # ── Semantic Summary Generation ─────────────────────────────────

    @staticmethod
    def _generate_semantic_summary(
        items: List[ParsedEvidence],
        net_alignment: ClaimAlignment,
        overall_confidence: float,
        critical_anomalies: List[EvidenceHighlight],
    ) -> str:
        """
        Generates a deterministic plain-language summary paragraph
        describing the overall evidence picture. This is the primary
        text block injected into the Gemini reasoning prompt.
        """
        parser_names = sorted(set(p.parser_name for p in items))
        evidence_types = ", ".join(parser_names)
        anomaly_count = len(critical_anomalies)

        parts = []

        # Opening statement
        parts.append(
            f"The evidence package contains {len(items)} item(s) "
            f"analyzed by {len(parser_names)} parser(s) ({evidence_types})."
        )

        # Confidence statement
        if overall_confidence >= 0.85:
            parts.append(
                f"Overall evidence confidence is strong at {overall_confidence:.1%}."
            )
        elif overall_confidence >= 0.65:
            parts.append(
                f"Overall evidence confidence is moderate at {overall_confidence:.1%}."
            )
        else:
            parts.append(
                f"Overall evidence confidence is low at {overall_confidence:.1%}, "
                f"suggesting incomplete or questionable evidence."
            )

        # Anomaly statement
        if anomaly_count == 0:
            parts.append(
                "No significant anomalies were detected in the submitted evidence."
            )
        elif anomaly_count == 1:
            parts.append(
                f"1 significant anomaly was detected: "
                f"{critical_anomalies[0].summary}"
            )
        else:
            parts.append(
                f"{anomaly_count} significant anomalies were detected, "
                f"the most critical being: {critical_anomalies[0].summary}"
            )

        # Alignment statement
        if net_alignment == ClaimAlignment.SUPPORTS_CARDHOLDER:
            parts.append(
                "On balance, the parsed evidence tends to support the cardholder's position."
            )
        elif net_alignment == ClaimAlignment.SUPPORTS_MERCHANT:
            parts.append(
                "On balance, the parsed evidence tends to support the merchant's position."
            )
        else:
            parts.append(
                "The evidence does not clearly favour either party and may require "
                "manual review by a Dispute-Ops analyst."
            )

        return " ".join(parts)

    # ── Helpers ──────────────────────────────────────────────────────

    @staticmethod
    def _entity_to_summary(entity: ExtractedEntity) -> str:
        """Convert an extracted entity into a human-readable summary sentence."""
        type_labels = {
            "MERCHANT": "Merchant identified",
            "MONEY": "Amount recorded",
            "DATE": "Date recorded",
            "CARD_LAST_FOUR": "Card ending in",
            "TRANSACTION_ID": "Transaction ID",
            "TRACKING_NUMBER": "Tracking number",
            "CARRIER": "Carrier",
            "DELIVERY_STATUS": "Delivery status",
            "PERSON": "Person identified",
            "GPS_COORDINATES": "GPS location recorded",
            "RECEIPT_NUMBER": "Receipt/Invoice number",
            "ORDER_ID": "Order reference",
            "PAYMENT_METHOD": "Payment method",
        }
        label = type_labels.get(entity.entity_type, entity.entity_type)
        return f"{label}: {entity.text}"
