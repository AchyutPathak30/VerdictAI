"""
VerdictAI NLP Pipeline — Communication Log Parser
Author: Achyut Pathak (AI/NLP Engineer — Evidence Parsing)

Parses cardholder–merchant communication transcripts (emails, chat logs,
phone call notes) and extracts dispute-relevant entities, sentiment
indicators, claim alignment signals, and key dispute keywords.

Designed as a deterministic, rule-based pipeline with a spaCy-compatible
interface.  Can be swapped to a Hugging Face transformer pipeline for
production when models are available.
"""

import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple

from backend.app.services.parsers.base_parser import (
    AnomalyLevel,
    ClaimAlignment,
    DetectedAnomaly,
    EvidenceParser,
    ExtractedEntity,
    ParsedEvidence,
    utc_now,
)
from backend.app.services.nlp.entity_extractor import EntityExtractor, ExtractionResult


# ── Dispute keyword dictionaries ─────────────────────────────────

# Keywords that indicate the cardholder's position
CARDHOLDER_KEYWORDS = {
    "cancel", "cancelled", "cancellation",
    "refund", "refunded", "reimbursement",
    "not received", "never received", "never arrived",
    "damaged", "broken", "defective",
    "wrong item", "incorrect item", "wrong product",
    "unauthorized", "unauthorised", "fraudulent", "fraud",
    "did not order", "never ordered",
    "return", "returned", "returning",
    "overcharged", "double charged", "duplicate charge",
    "poor quality", "not as described", "misleading",
    "scam", "rip off", "ripoff",
    "complaint", "dissatisfied", "unhappy",
    "unacceptable", "terrible", "worst",
}

# Keywords that indicate the merchant's position
MERCHANT_KEYWORDS = {
    "delivered", "shipped", "dispatched",
    "tracking", "signed", "signature",
    "confirmation", "confirmed",
    "policy", "terms", "conditions",
    "non-refundable", "no refund", "final sale",
    "restocking fee",
    "proof", "evidence", "receipt", "invoice",
    "as described", "correct item",
    "inspected", "quality checked",
    "replacement", "exchange",
    "apologies", "apologize", "sorry", "regret",
    "resolved", "resolution",
}

# Positive sentiment indicators
POSITIVE_INDICATORS = {
    "thank", "thanks", "appreciate", "grateful",
    "happy", "satisfied", "pleased", "great",
    "resolved", "helpful", "excellent", "good",
}

# Negative sentiment indicators
NEGATIVE_INDICATORS = {
    "angry", "furious", "frustrated", "disappointed",
    "unacceptable", "terrible", "horrible", "worst",
    "awful", "disgusted", "outraged", "ridiculous",
    "incompetent", "useless", "pathetic",
    "demand", "legal", "lawyer", "lawsuit", "attorney",
    "bbb", "consumer protection", "report",
}

# Prompt injection patterns (adversarial attempts to hijack Gemini reasoning)
PROMPT_INJECTION_PATTERNS = [
    r"(?i)\b(?:system\s+override|ignore\s+(?:all\s+)?previous\s+instructions?)\b",
    r"(?i)\b(?:disregard\s+(?:all\s+)?(?:prior|previous|above)\s+instructions?)\b",
    r"(?i)\b(?:you\s+are\s+now\s+(?:an?\s+)?(?:ai|assistant|evaluator|judge))\b",
    r"(?i)\b(?:rule\s+in\s+favor\s+of\s+(?:merchant|cardholder|customer))\b",
    r"(?i)\b(?:conclude\s+in\s+favor\s+of|verdict\s*:\s*(?:cardholder|merchant))\b",
    r"(?i)\b(?:override\s+verdict|set\s+confidence\s+to\s+100%?)\b",
    r"(?i)<\s*(?:system|prompt_injection|instruction)\s*>",
]


@dataclass
class MessageSegment:
    """A single message within a communication log."""
    sender: str
    timestamp: Optional[datetime] = None
    content: str = ""
    role: str = "UNKNOWN"  # "CARDHOLDER", "MERCHANT", "SUPPORT", "UNKNOWN"


@dataclass
class CommunicationAnalysis:
    """Full analysis result for a communication log."""
    messages: List[MessageSegment] = field(default_factory=list)
    total_messages: int = 0
    cardholder_message_count: int = 0
    merchant_message_count: int = 0
    sentiment_score: float = 0.0  # -1.0 (negative) to +1.0 (positive)
    cardholder_keyword_hits: List[str] = field(default_factory=list)
    merchant_keyword_hits: List[str] = field(default_factory=list)
    dispute_indicators: List[str] = field(default_factory=list)
    escalation_detected: bool = False
    resolution_detected: bool = False
    partial_credit_detected: bool = False
    prompt_injection_detected: bool = False


class CommunicationLogParser(EvidenceParser):
    """
    Parses cardholder–merchant communication transcripts.

    Expected ``raw_payload`` keys
    ─────────────────────────────
    Required:
        - ``messages``  (list[dict]) — each message dict with:
            - ``sender`` (str)
            - ``content`` (str)
            - ``timestamp`` (str, optional)
            - ``role`` (str, optional — "CARDHOLDER", "MERCHANT", "SUPPORT")

        OR

        - ``transcript`` (str) — raw text transcript (the parser will
          attempt to segment it into messages automatically).

    Optional:
        - ``channel``         (str, e.g. "EMAIL", "CHAT", "PHONE")
        - ``dispute_id``      (str)
        - ``date_range_start``(str)
        - ``date_range_end``  (str)
    """

    def __init__(self):
        self._entity_extractor = EntityExtractor()

    @property
    def parser_name(self) -> str:
        return "CommunicationLogParser"

    # ── validation ───────────────────────────────────────────────

    def validate(self, raw_payload: Dict[str, Any]) -> bool:
        if not isinstance(raw_payload, dict):
            return False
        return bool(
            raw_payload.get("messages")
            or raw_payload.get("transcript")
        )

    # ── parsing ──────────────────────────────────────────────────

    def parse(self, raw_payload: Dict[str, Any]) -> ParsedEvidence:
        if not self.validate(raw_payload):
            raise ValueError(
                f"{self.parser_name}: payload must contain 'messages' (list) or 'transcript' (str)."
            )

        entities: List[ExtractedEntity] = []
        anomalies: List[DetectedAnomaly] = []

        # --- Parse messages ---
        if raw_payload.get("messages"):
            messages = self._parse_structured_messages(raw_payload["messages"])
        else:
            messages = self._segment_transcript(raw_payload["transcript"])

        if not messages:
            raise ValueError(f"{self.parser_name}: no messages could be parsed from the payload.")

        channel = raw_payload.get("channel", "UNKNOWN")

        # --- Build full text for NLP entity extraction ---
        full_text = "\n".join(
            f"[{m.sender}]: {m.content}" for m in messages
        )

        # --- Entity extraction ---
        extraction_result = self._entity_extractor.extract_entities(full_text)
        entities.extend(extraction_result.entities)

        # Add sender entities
        unique_senders = set(m.sender for m in messages if m.sender)
        for sender in unique_senders:
            entities.append(
                ExtractedEntity(entity_type="PARTICIPANT", text=sender, confidence=0.95)
            )

        # --- Communication analysis ---
        analysis = self._analyse_communication(messages)

        # --- Anomaly detection ---

        # 1. Prompt injection attempt
        if analysis.prompt_injection_detected:
            anomalies.append(DetectedAnomaly(
                anomaly_type="PROMPT_INJECTION_ATTEMPT",
                description="Adversarial prompt injection or instruction override sequence detected in communication transcript.",
                severity=AnomalyLevel.CRITICAL,
                supporting_data={"indicators": [i for i in analysis.dispute_indicators if i.startswith("prompt_injection:")]},
            ))

        # 2. Escalation language
        if analysis.escalation_detected:
            anomalies.append(DetectedAnomaly(
                anomaly_type="ESCALATION_LANGUAGE",
                description="Communication contains escalation language (legal threats, regulatory complaints).",
                severity=AnomalyLevel.MEDIUM,
                supporting_data={"indicators": analysis.dispute_indicators},
            ))

        # 2. Very negative sentiment
        if analysis.sentiment_score < -0.5:
            anomalies.append(DetectedAnomaly(
                anomaly_type="HIGHLY_NEGATIVE_SENTIMENT",
                description=f"Communication sentiment is highly negative ({analysis.sentiment_score:.2f}).",
                severity=AnomalyLevel.LOW,
                supporting_data={"sentiment_score": analysis.sentiment_score},
            ))

        # 3. One-sided conversation (only one party)
        if analysis.cardholder_message_count == 0 or analysis.merchant_message_count == 0:
            anomalies.append(DetectedAnomaly(
                anomaly_type="ONE_SIDED_COMMUNICATION",
                description=(
                    f"Communication is one-sided: {analysis.cardholder_message_count} cardholder "
                    f"message(s), {analysis.merchant_message_count} merchant message(s)."
                ),
                severity=AnomalyLevel.LOW,
                supporting_data={
                    "cardholder_messages": analysis.cardholder_message_count,
                    "merchant_messages": analysis.merchant_message_count,
                },
            ))

        # 4. Empty messages
        empty_count = sum(1 for m in messages if not m.content.strip())
        if empty_count > 0:
            anomalies.append(DetectedAnomaly(
                anomaly_type="EMPTY_MESSAGES",
                description=f"{empty_count} message(s) have empty content.",
                severity=AnomalyLevel.LOW,
                supporting_data={"empty_count": empty_count},
            ))

        # --- Structured output ---
        structured_data = {
            "channel": channel,
            "total_messages": analysis.total_messages,
            "cardholder_message_count": analysis.cardholder_message_count,
            "merchant_message_count": analysis.merchant_message_count,
            "sentiment_score": round(analysis.sentiment_score, 4),
            "cardholder_keyword_hits": analysis.cardholder_keyword_hits,
            "merchant_keyword_hits": analysis.merchant_keyword_hits,
            "dispute_indicators": analysis.dispute_indicators,
            "escalation_detected": analysis.escalation_detected,
            "resolution_detected": analysis.resolution_detected,
            "partial_credit_detected": analysis.partial_credit_detected,
            "prompt_injection_detected": analysis.prompt_injection_detected,
            "participants": sorted(unique_senders),
        }

        # --- Confidence & alignment ---
        confidence = self._compute_confidence(analysis, anomalies)
        alignment = self._determine_alignment(analysis)

        return ParsedEvidence(
            parser_name=self.parser_name,
            structured_data=structured_data,
            extracted_entities=entities,
            anomalies=anomalies,
            confidence_score=confidence,
            claim_alignment=alignment,
            raw_text_content=full_text,
            metadata={
                "channel": channel,
                "entity_types_found": extraction_result.entity_types_found,
                "total_entities": extraction_result.entity_count,
            },
        )

    # ── message parsing ──────────────────────────────────────────

    @staticmethod
    def _parse_structured_messages(
        messages_data: List[Dict[str, Any]],
    ) -> List[MessageSegment]:
        """Parse structured message dicts into MessageSegment objects."""
        if not isinstance(messages_data, list):
            return []
        segments = []
        for msg in messages_data[:500]:
            if not isinstance(msg, dict):
                continue
            sender = str(msg.get("sender", "Unknown")).replace("\x00", "").strip()[:100]
            content = str(msg.get("content", "")).replace("\x00", "").strip()[:50000]
            role = str(msg.get("role", "UNKNOWN")).replace("\x00", "").strip().upper()[:20]

            timestamp = None
            ts_raw = msg.get("timestamp")
            if ts_raw:
                if isinstance(ts_raw, datetime):
                    timestamp = ts_raw
                elif isinstance(ts_raw, str):
                    try:
                        timestamp = datetime.fromisoformat(ts_raw)
                    except (ValueError, TypeError):
                        pass

            segments.append(MessageSegment(
                sender=sender,
                timestamp=timestamp,
                content=content,
                role=role,
            ))
        return segments

    @staticmethod
    def _segment_transcript(transcript: str) -> List[MessageSegment]:
        """
        Attempt to segment a raw text transcript into individual messages.
        Supports formats like:
            [Sender]: message text
            Sender: message text
            From: Sender
        """
        if not isinstance(transcript, str):
            return []
        transcript = transcript.replace("\x00", "")
        if len(transcript) > 500_000:
            transcript = transcript[:500_000]

        segments: List[MessageSegment] = []

        # Pattern: [Name] or Name: at start of line
        pattern = re.compile(
            r"^\s*\[?([A-Za-z][A-Za-z\s.]{1,40}?)\]?\s*:\s*(.+)",
            re.MULTILINE,
        )

        matches = list(pattern.finditer(transcript))
        if matches:
            for i, match in enumerate(matches):
                sender = match.group(1).strip()
                content_start = match.end()
                content_end = matches[i + 1].start() if i + 1 < len(matches) else len(transcript)
                content = match.group(2) + transcript[content_start:content_end]
                content = content.strip()

                role = "UNKNOWN"
                sender_lower = sender.lower()
                if any(k in sender_lower for k in ("customer", "cardholder", "card member", "buyer")):
                    role = "CARDHOLDER"
                elif any(k in sender_lower for k in ("merchant", "seller", "vendor", "support", "agent", "representative")):
                    role = "MERCHANT"

                segments.append(MessageSegment(
                    sender=sender,
                    content=content,
                    role=role,
                ))
        else:
            # Treat entire transcript as single message
            segments.append(MessageSegment(
                sender="Unknown",
                content=transcript.strip(),
                role="UNKNOWN",
            ))

        return segments

    # ── analysis ─────────────────────────────────────────────────

    def _analyse_communication(
        self,
        messages: List[MessageSegment],
    ) -> CommunicationAnalysis:
        """Run keyword, sentiment, and alignment analysis on messages."""
        analysis = CommunicationAnalysis(
            messages=messages,
            total_messages=len(messages),
        )

        all_text_lower = " ".join(m.content.lower() for m in messages)
        positive_hits = 0
        negative_hits = 0

        # Count messages by role
        for msg in messages:
            if msg.role == "CARDHOLDER":
                analysis.cardholder_message_count += 1
            elif msg.role in ("MERCHANT", "SUPPORT"):
                analysis.merchant_message_count += 1

        # Keyword matching
        for kw in CARDHOLDER_KEYWORDS:
            if kw in all_text_lower:
                analysis.cardholder_keyword_hits.append(kw)

        for kw in MERCHANT_KEYWORDS:
            if kw in all_text_lower:
                analysis.merchant_keyword_hits.append(kw)

        # Sentiment scoring
        for word in POSITIVE_INDICATORS:
            count = all_text_lower.count(word)
            positive_hits += count

        for word in NEGATIVE_INDICATORS:
            count = all_text_lower.count(word)
            negative_hits += count

        total_sentiment_words = positive_hits + negative_hits
        if total_sentiment_words > 0:
            analysis.sentiment_score = (positive_hits - negative_hits) / total_sentiment_words
        else:
            analysis.sentiment_score = 0.0

        # Prompt injection detection
        for pat in PROMPT_INJECTION_PATTERNS:
            match = re.search(pat, all_text_lower)
            if match:
                analysis.prompt_injection_detected = True
                analysis.dispute_indicators.append(f"prompt_injection:{match.group(0)}")

        # Escalation detection
        escalation_terms = {"legal", "lawyer", "attorney", "lawsuit", "court",
                           "bbb", "consumer protection", "report", "regulatory"}
        for term in escalation_terms:
            if term in all_text_lower:
                analysis.escalation_detected = True
                analysis.dispute_indicators.append(f"escalation:{term}")

        # Resolution detection
        resolution_terms = {
            "resolved", "resolution", "agreed", "settlement",
            "refund issued", "refunded", "credit applied", "replacement sent",
            "partial refund", "partial credit", "partial reimbursement", "store credit",
        }
        for term in resolution_terms:
            if term in all_text_lower:
                analysis.resolution_detected = True
                analysis.dispute_indicators.append(f"resolution:{term}")

        # Partial credit detection
        partial_terms = {"partial refund", "partial credit", "partial reimbursement", "store credit"}
        for term in partial_terms:
            if term in all_text_lower:
                analysis.partial_credit_detected = True
                analysis.dispute_indicators.append(f"partial_credit:{term}")

        return analysis

    # ── confidence & alignment ───────────────────────────────────

    @staticmethod
    def _compute_confidence(
        analysis: CommunicationAnalysis,
        anomalies: List[DetectedAnomaly],
    ) -> float:
        score = 1.0

        # More messages → higher confidence
        if analysis.total_messages < 3:
            score *= 0.80
        elif analysis.total_messages < 5:
            score *= 0.90

        # Both parties present → higher confidence
        if analysis.cardholder_message_count > 0 and analysis.merchant_message_count > 0:
            score *= 1.0
        else:
            score *= 0.85

        # Penalty for anomalies
        penalty_map = {
            AnomalyLevel.LOW: 0.02,
            AnomalyLevel.MEDIUM: 0.05,
            AnomalyLevel.HIGH: 0.10,
            AnomalyLevel.CRITICAL: 0.20,
        }
        for a in anomalies:
            score -= penalty_map.get(a.severity, 0)

        return max(round(score, 4), 0.0)

    @staticmethod
    def _determine_alignment(analysis: CommunicationAnalysis) -> ClaimAlignment:
        """
        Determines which party the communication evidence tends to support
        based on keyword frequency analysis.
        """
        ch_score = len(analysis.cardholder_keyword_hits)
        mr_score = len(analysis.merchant_keyword_hits)

        # Resolution language shifts toward merchant (they resolved it)
        if analysis.resolution_detected:
            mr_score += 2

        if ch_score == 0 and mr_score == 0:
            return ClaimAlignment.NEUTRAL
        elif ch_score > mr_score * 1.5:
            return ClaimAlignment.SUPPORTS_CARDHOLDER
        elif mr_score > ch_score * 1.5:
            return ClaimAlignment.SUPPORTS_MERCHANT
        else:
            return ClaimAlignment.NEUTRAL
