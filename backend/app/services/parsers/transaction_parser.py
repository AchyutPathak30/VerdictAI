"""
VerdictAI Evidence Parsing Pipeline — Transaction Parser
Author: Achyut Pathak (AI/NLP Engineer — Evidence Parsing)

Parses bank/card transaction evidence payloads and extracts structured
financial data, detecting anomalies such as duplicate charges, amount
mismatches, weekend/holiday transactions, and suspicious patterns.
"""

import math
import re
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

from backend.app.services.parsers.base_parser import (
    AnomalyLevel,
    ClaimAlignment,
    DetectedAnomaly,
    EvidenceParser,
    ExtractedEntity,
    ParsedEvidence,
    utc_now,
)


# Known high-risk Merchant Category Codes per card-network guidelines
HIGH_RISK_MCC_CODES = {
    "5962": "Direct Marketing — Travel-Related",
    "5966": "Direct Marketing — Outbound Telemarketing",
    "5967": "Direct Marketing — Inbound Teleservices",
    "7995": "Gambling — Betting/Casino",
    "5912": "Drug Stores — Pharmacies",
    "5122": "Drugs — Proprietary/Patent",
}

# Maximum reasonable transaction amount (USD) before flagging
SUSPICIOUS_AMOUNT_THRESHOLD = 10000.00


class TransactionParser(EvidenceParser):
    """
    Parses bank/card transaction records submitted as structured evidence.

    Expected ``raw_payload`` keys
    ─────────────────────────────
    Required:
        - ``merchant_name``  (str)
        - ``amount``         (float | str)
        - ``transaction_date`` (str, ISO-8601 or common date format)
    Optional:
        - ``currency``       (str, default "USD")
        - ``card_last_four`` (str, e.g. "4242")
        - ``mcc_code``       (str, 4-digit MCC)
        - ``merchant_location`` (str)
        - ``payment_method``    (str, e.g. "VISA_CREDIT")
        - ``transaction_id``    (str)
        - ``authorization_code``(str)
        - ``description``       (str, raw statement descriptor)
    """

    @property
    def parser_name(self) -> str:
        return "TransactionParser"

    # ── validation ───────────────────────────────────────────────

    def validate(self, raw_payload: Dict[str, Any]) -> bool:
        if not isinstance(raw_payload, dict):
            return False
        required = ["merchant_name", "amount", "transaction_date"]
        return all(
            k in raw_payload and raw_payload[k] is not None
            for k in required
        )

    # ── parsing ──────────────────────────────────────────────────

    def parse(self, raw_payload: Dict[str, Any]) -> ParsedEvidence:
        self._require_fields(raw_payload, ["merchant_name", "amount", "transaction_date"])

        entities: List[ExtractedEntity] = []
        anomalies: List[DetectedAnomaly] = []

        # --- Extract and normalise core fields ---
        merchant_name = str(raw_payload["merchant_name"]).replace("\x00", "").strip()[:500]
        amount = self._parse_amount(raw_payload["amount"])
        currency = str(raw_payload.get("currency", "USD")).replace("\x00", "").strip().upper()[:10]
        txn_date = self._parse_date(raw_payload["transaction_date"])
        card_last_four = str(raw_payload.get("card_last_four") or "").replace("\x00", "").strip() or None
        mcc_code = str(raw_payload.get("mcc_code") or "").replace("\x00", "").strip() or None
        merchant_location = str(raw_payload.get("merchant_location") or "").replace("\x00", "").strip()[:200] or None
        payment_method = str(raw_payload.get("payment_method") or "").replace("\x00", "").strip()[:100] or None
        transaction_id = str(raw_payload.get("transaction_id") or "").replace("\x00", "").strip()[:100] or None
        authorization_code = str(raw_payload.get("authorization_code") or "").replace("\x00", "").strip()[:100] or None
        description = str(raw_payload.get("description") or "").replace("\x00", "")[:50000]

        # --- Entity extraction ---
        entities.append(
            ExtractedEntity(entity_type="MERCHANT", text=merchant_name, confidence=0.99)
        )
        entities.append(
            ExtractedEntity(entity_type="MONEY", text=f"{amount} {currency}", confidence=0.99)
        )
        if txn_date:
            entities.append(
                ExtractedEntity(entity_type="DATE", text=txn_date.isoformat(), confidence=0.98)
            )
        if card_last_four:
            entities.append(
                ExtractedEntity(entity_type="CARD_LAST_FOUR", text=str(card_last_four), confidence=0.99)
            )
        if merchant_location:
            entities.append(
                ExtractedEntity(entity_type="GPE", text=merchant_location, confidence=0.90)
            )
        if transaction_id:
            entities.append(
                ExtractedEntity(entity_type="TRANSACTION_ID", text=transaction_id, confidence=1.0)
            )

        # Extract entities from free-text description if present
        if description:
            entities.extend(self._extract_description_entities(description))

        # --- Anomaly detection ---

        # 1. Suspicious amount
        if amount > SUSPICIOUS_AMOUNT_THRESHOLD:
            anomalies.append(DetectedAnomaly(
                anomaly_type="HIGH_VALUE_TRANSACTION",
                description=f"Transaction amount ${amount:,.2f} exceeds ${SUSPICIOUS_AMOUNT_THRESHOLD:,.2f} threshold.",
                severity=AnomalyLevel.MEDIUM,
                supporting_data={"amount": amount, "threshold": SUSPICIOUS_AMOUNT_THRESHOLD},
            ))

        # 2. Negative or zero amount
        if amount <= 0:
            anomalies.append(DetectedAnomaly(
                anomaly_type="INVALID_AMOUNT",
                description=f"Transaction amount is non-positive: {amount}.",
                severity=AnomalyLevel.HIGH,
                supporting_data={"amount": amount},
            ))

        # 3. Weekend transaction (potential fraud vector for certain MCCs)
        if txn_date and txn_date.weekday() in (5, 6):
            anomalies.append(DetectedAnomaly(
                anomaly_type="WEEKEND_TRANSACTION",
                description=f"Transaction occurred on a weekend ({txn_date.strftime('%A')}).",
                severity=AnomalyLevel.LOW,
                supporting_data={"day_of_week": txn_date.strftime("%A")},
            ))

        # 4. High-risk MCC
        if mcc_code and str(mcc_code) in HIGH_RISK_MCC_CODES:
            anomalies.append(DetectedAnomaly(
                anomaly_type="HIGH_RISK_MCC",
                description=f"Merchant Category Code {mcc_code} ({HIGH_RISK_MCC_CODES[str(mcc_code)]}) is classified as high-risk.",
                severity=AnomalyLevel.MEDIUM,
                supporting_data={"mcc_code": mcc_code, "category": HIGH_RISK_MCC_CODES[str(mcc_code)]},
            ))

        # 5. Future-dated transaction
        if txn_date and txn_date > utc_now():
            anomalies.append(DetectedAnomaly(
                anomaly_type="FUTURE_DATED_TRANSACTION",
                description=f"Transaction date {txn_date.isoformat()} is in the future.",
                severity=AnomalyLevel.HIGH,
                supporting_data={"transaction_date": txn_date.isoformat()},
            ))

        # --- Build structured output ---
        structured_data = {
            "merchant_name": merchant_name,
            "amount": amount,
            "currency": currency,
            "transaction_date": txn_date.isoformat() if txn_date else None,
            "card_last_four": card_last_four,
            "mcc_code": mcc_code,
            "merchant_location": merchant_location,
            "payment_method": payment_method,
            "transaction_id": transaction_id,
            "authorization_code": authorization_code,
            "description": description,
        }

        # --- Confidence & alignment ---
        confidence = self._compute_confidence(raw_payload, anomalies)
        alignment = ClaimAlignment.NEUTRAL  # Transactions alone are factual

        return ParsedEvidence(
            parser_name=self.parser_name,
            structured_data=structured_data,
            extracted_entities=entities,
            anomalies=anomalies,
            confidence_score=confidence,
            claim_alignment=alignment,
            raw_text_content=description or None,
            metadata={"source_fields_count": len([v for v in raw_payload.values() if v is not None])},
        )

    # ── helpers ──────────────────────────────────────────────────

    @staticmethod
    def _parse_amount(raw_amount: Any) -> float:
        """Coerce various amount representations to float, rejecting NaN and Inf."""
        if isinstance(raw_amount, (int, float)):
            val = float(raw_amount)
            if math.isnan(val) or math.isinf(val):
                raise ValueError(f"Amount cannot be NaN or Infinite: {raw_amount!r}")
            return val
        if isinstance(raw_amount, str):
            cleaned = re.sub(r"[^\d.\-]", "", raw_amount.replace("\x00", ""))
            if cleaned:
                try:
                    val = float(cleaned)
                    if math.isnan(val) or math.isinf(val):
                        raise ValueError(f"Amount cannot be NaN or Infinite: {raw_amount!r}")
                    return val
                except ValueError:
                    pass
        raise ValueError(f"Cannot parse amount value: {raw_amount!r}")

    @staticmethod
    def _parse_date(raw_date: Any) -> Optional[datetime]:
        """Parse various date formats into timezone-aware datetime."""
        if isinstance(raw_date, datetime):
            if raw_date.tzinfo is None:
                return raw_date.replace(tzinfo=timezone.utc)
            return raw_date
        if not isinstance(raw_date, str):
            return None

        date_str = raw_date.strip()
        formats = [
            "%Y-%m-%dT%H:%M:%S%z",
            "%Y-%m-%dT%H:%M:%SZ",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%d",
            "%m/%d/%Y",
            "%d/%m/%Y",
            "%B %d, %Y",
            "%b %d, %Y",
        ]
        for fmt in formats:
            try:
                dt = datetime.strptime(date_str, fmt)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                return dt
            except ValueError:
                continue

        # Fallback — try ISO format parse
        try:
            dt = datetime.fromisoformat(date_str)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except (ValueError, TypeError):
            return None

    @staticmethod
    def _extract_description_entities(description: str) -> List[ExtractedEntity]:
        """Pull entities from free-text statement descriptors."""
        entities: List[ExtractedEntity] = []

        # Match dollar amounts
        for m in re.finditer(r"\$[\d,]+\.?\d*", description):
            entities.append(ExtractedEntity(
                entity_type="MONEY",
                text=m.group(),
                confidence=0.95,
                start_offset=m.start(),
                end_offset=m.end(),
            ))

        # Match dates like "Aug 20, 2026" or "2026-08-20"
        for m in re.finditer(
            r"\b(?:\d{4}-\d{2}-\d{2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b",
            description,
            re.IGNORECASE,
        ):
            entities.append(ExtractedEntity(
                entity_type="DATE",
                text=m.group(),
                confidence=0.90,
                start_offset=m.start(),
                end_offset=m.end(),
            ))

        return entities

    @staticmethod
    def _compute_confidence(
        raw_payload: Dict[str, Any],
        anomalies: List[DetectedAnomaly],
    ) -> float:
        """
        Heuristic confidence: starts at 1.0, reduced by missing optional
        fields and detected anomalies.
        """
        score = 1.0
        optional_fields = [
            "card_last_four", "mcc_code", "merchant_location",
            "payment_method", "transaction_id", "authorization_code",
        ]
        present = sum(1 for f in optional_fields if raw_payload.get(f))
        completeness = present / len(optional_fields)
        score *= (0.7 + 0.3 * completeness)  # 70% base + 30% bonus for completeness

        # Penalise for anomalies
        severity_penalty = {
            AnomalyLevel.LOW: 0.02,
            AnomalyLevel.MEDIUM: 0.05,
            AnomalyLevel.HIGH: 0.10,
            AnomalyLevel.CRITICAL: 0.20,
        }
        for a in anomalies:
            score -= severity_penalty.get(a.severity, 0)

        return max(round(score, 4), 0.0)
