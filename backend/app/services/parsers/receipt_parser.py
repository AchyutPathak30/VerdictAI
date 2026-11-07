"""
VerdictAI Evidence Parsing Pipeline — Receipt / Invoice Parser
Author: Achyut Pathak (AI/NLP Engineer — Evidence Parsing)

Parses receipt and invoice evidence payloads submitted by merchants or
cardholders.  Extracts line items, totals, tax, payment method, receipt
identifiers, and detects amount discrepancies between the receipt and
the disputed transaction.
"""

import math
import re
from datetime import datetime, timezone
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


class ReceiptParser(EvidenceParser):
    """
    Parses invoice / receipt evidence payloads.

    Expected ``raw_payload`` keys
    ─────────────────────────────
    Required:
        - ``merchant_name``  (str)
        - ``total``          (float | str)
    Optional:
        - ``receipt_number`` (str)
        - ``receipt_date``   (str, ISO-8601 or common format)
        - ``line_items``     (list[dict] — each with "description", "quantity", "unit_price")
        - ``subtotal``       (float)
        - ``tax``            (float)
        - ``payment_method`` (str)
        - ``currency``       (str, default "USD")
        - ``ocr_text``       (str, raw OCR-extracted text when receipt is an image/PDF)
        - ``transaction_amount`` (float — the disputed txn amount for cross-reference)
    """

    # Tolerance for receipt ↔ transaction amount comparison (±)
    AMOUNT_DISCREPANCY_TOLERANCE = 0.01  # 1 cent

    @property
    def parser_name(self) -> str:
        return "ReceiptParser"

    # ── validation ───────────────────────────────────────────────

    def validate(self, raw_payload: Dict[str, Any]) -> bool:
        if not isinstance(raw_payload, dict):
            return False
        return all(
            k in raw_payload and raw_payload[k] is not None
            for k in ("merchant_name", "total")
        )

    # ── parsing ──────────────────────────────────────────────────

    def parse(self, raw_payload: Dict[str, Any]) -> ParsedEvidence:
        self._require_fields(raw_payload, ["merchant_name", "total"])

        entities: List[ExtractedEntity] = []
        anomalies: List[DetectedAnomaly] = []

        # --- Core fields ---
        merchant_name = str(raw_payload["merchant_name"]).replace("\x00", "").strip()[:500]
        total = self._safe_float(raw_payload["total"])
        if total is None:
            raise ValueError(
                f"{self.parser_name}: Invalid or unparseable total amount: {raw_payload.get('total')!r}"
            )
        currency = str(raw_payload.get("currency", "USD")).replace("\x00", "").strip().upper()[:10]
        receipt_number = str(raw_payload.get("receipt_number") or "").replace("\x00", "").strip() or None
        raw_date = raw_payload.get("receipt_date") or raw_payload.get("date")
        receipt_date = self._parse_date(raw_date)
        payment_method = str(raw_payload.get("payment_method") or "").replace("\x00", "").strip()[:100] or None
        subtotal = self._safe_float(raw_payload.get("subtotal"))
        tax = self._safe_float(raw_payload.get("tax"))
        line_items = raw_payload.get("line_items", [])
        ocr_text = str(raw_payload["ocr_text"]).replace("\x00", "")[:100000] if raw_payload.get("ocr_text") else None
        transaction_amount = self._safe_float(raw_payload.get("transaction_amount"))

        # --- Entity extraction ---
        entities.append(
            ExtractedEntity(entity_type="MERCHANT", text=merchant_name, confidence=0.98)
        )
        entities.append(
            ExtractedEntity(entity_type="MONEY", text=f"{total} {currency}", confidence=0.99)
        )
        if receipt_number:
            entities.append(
                ExtractedEntity(entity_type="RECEIPT_NUMBER", text=str(receipt_number), confidence=0.97)
            )
        if receipt_date:
            entities.append(
                ExtractedEntity(entity_type="DATE", text=receipt_date.isoformat(), confidence=0.95)
            )
        if payment_method:
            entities.append(
                ExtractedEntity(entity_type="PAYMENT_METHOD", text=payment_method, confidence=0.90)
            )

        # Entities from OCR text
        if ocr_text:
            entities.extend(self._extract_ocr_entities(ocr_text))

        # --- Line item aggregation & validation ---
        parsed_items = self._parse_line_items(line_items)
        computed_subtotal = sum(item["line_total"] for item in parsed_items) if parsed_items else None

        # --- Anomaly detection ---

        # 1. Receipt total vs. transaction amount cross-reference
        if transaction_amount is not None and abs(total - transaction_amount) > self.AMOUNT_DISCREPANCY_TOLERANCE:
            discrepancy = total - transaction_amount
            anomalies.append(DetectedAnomaly(
                anomaly_type="AMOUNT_DISCREPANCY",
                description=(
                    f"Receipt total (${total:,.2f}) differs from disputed "
                    f"transaction amount (${transaction_amount:,.2f}) by ${abs(discrepancy):,.2f}."
                ),
                severity=AnomalyLevel.HIGH,
                supporting_data={
                    "receipt_total": total,
                    "transaction_amount": transaction_amount,
                    "discrepancy": round(discrepancy, 2),
                },
            ))

        # 2. Line-item subtotal vs stated subtotal
        if computed_subtotal is not None and subtotal is not None:
            if abs(computed_subtotal - subtotal) > self.AMOUNT_DISCREPANCY_TOLERANCE:
                anomalies.append(DetectedAnomaly(
                    anomaly_type="SUBTOTAL_MISMATCH",
                    description=(
                        f"Computed line-item subtotal (${computed_subtotal:,.2f}) "
                        f"does not match stated subtotal (${subtotal:,.2f})."
                    ),
                    severity=AnomalyLevel.MEDIUM,
                    supporting_data={
                        "computed_subtotal": round(computed_subtotal, 2),
                        "stated_subtotal": subtotal,
                    },
                ))

        # 3. Subtotal + tax vs total
        if subtotal is not None and tax is not None:
            expected_total = subtotal + tax
            if abs(expected_total - total) > self.AMOUNT_DISCREPANCY_TOLERANCE:
                anomalies.append(DetectedAnomaly(
                    anomaly_type="TOTAL_CALCULATION_ERROR",
                    description=(
                        f"Subtotal (${subtotal:,.2f}) + Tax (${tax:,.2f}) = "
                        f"${expected_total:,.2f}, but receipt total is ${total:,.2f}."
                    ),
                    severity=AnomalyLevel.MEDIUM,
                    supporting_data={
                        "subtotal": subtotal,
                        "tax": tax,
                        "expected_total": round(expected_total, 2),
                        "stated_total": total,
                    },
                ))

        # 4. Missing receipt number (documentation quality)
        if not receipt_number:
            anomalies.append(DetectedAnomaly(
                anomaly_type="MISSING_RECEIPT_NUMBER",
                description="Receipt/invoice number is not provided — reduces document traceability.",
                severity=AnomalyLevel.LOW,
            ))

        # 5. Missing date
        if receipt_date is None and raw_date is None:
            anomalies.append(DetectedAnomaly(
                anomaly_type="MISSING_RECEIPT_DATE",
                description="Receipt date is missing — cannot establish purchase timeline.",
                severity=AnomalyLevel.MEDIUM,
            ))

        # --- Structured output ---
        structured_data = {
            "merchant_name": merchant_name,
            "total": total,
            "currency": currency,
            "receipt_number": receipt_number,
            "receipt_date": receipt_date.isoformat() if receipt_date else None,
            "subtotal": subtotal,
            "tax": tax,
            "payment_method": payment_method,
            "line_items": parsed_items,
            "line_item_count": len(parsed_items),
        }

        # --- Confidence & alignment ---
        confidence = self._compute_confidence(raw_payload, anomalies)
        # Receipts generally support the merchant (proof of sale)
        alignment = ClaimAlignment.SUPPORTS_MERCHANT if not anomalies else ClaimAlignment.NEUTRAL

        return ParsedEvidence(
            parser_name=self.parser_name,
            structured_data=structured_data,
            extracted_entities=entities,
            anomalies=anomalies,
            confidence_score=confidence,
            claim_alignment=alignment,
            raw_text_content=ocr_text,
            metadata={
                "has_line_items": len(parsed_items) > 0,
                "has_ocr_text": ocr_text is not None,
            },
        )

    # ── helpers ──────────────────────────────────────────────────

    @staticmethod
    def _safe_float(value: Any) -> Optional[float]:
        if value is None:
            return None
        if isinstance(value, (int, float)):
            val = float(value)
            if math.isnan(val) or math.isinf(val):
                return None
            return val
        if isinstance(value, str):
            cleaned = re.sub(r"[^\d.\-]", "", value.replace("\x00", "").strip())
            if cleaned:
                try:
                    val = float(cleaned)
                    if math.isnan(val) or math.isinf(val):
                        return None
                    return val
                except ValueError:
                    return None
        return None

    @staticmethod
    def _parse_date(raw_date: Any) -> Optional[datetime]:
        if raw_date is None:
            return None
        if isinstance(raw_date, datetime):
            if raw_date.tzinfo is None:
                return raw_date.replace(tzinfo=timezone.utc)
            return raw_date
        if not isinstance(raw_date, str):
            return None

        formats = [
            "%Y-%m-%dT%H:%M:%S%z",
            "%Y-%m-%dT%H:%M:%SZ",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%d",
            "%m/%d/%Y",
            "%d/%m/%Y",
            "%d.%m.%Y",
            "%B %d, %Y",
            "%b %d, %Y",
        ]
        for fmt in formats:
            try:
                dt = datetime.strptime(raw_date.strip(), fmt)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                return dt
            except ValueError:
                continue
        try:
            dt = datetime.fromisoformat(raw_date.strip())
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except (ValueError, TypeError):
            return None

    @staticmethod
    def _parse_line_items(line_items: List[Any]) -> List[Dict[str, Any]]:
        if not isinstance(line_items, list):
            return []
        parsed = []
        for item in line_items[:500]:
            if not isinstance(item, dict):
                continue
            description = str(item.get("description", "Unknown Item")).replace("\x00", "")[:200]
            try:
                quantity = float(item.get("quantity", 1))
                if math.isnan(quantity) or math.isinf(quantity) or quantity < 0:
                    quantity = 1.0
            except (ValueError, TypeError):
                quantity = 1.0
            unit_price_raw = item.get("unit_price")
            if unit_price_raw is None:
                unit_price_raw = item.get("amount") if item.get("amount") is not None else item.get("price", 0.0)
            try:
                unit_price = float(unit_price_raw)
                if math.isnan(unit_price) or math.isinf(unit_price):
                    unit_price = 0.0
            except (ValueError, TypeError):
                unit_price = 0.0
            parsed.append({
                "description": str(description),
                "quantity": quantity,
                "unit_price": unit_price,
                "line_total": round(quantity * unit_price, 2),
            })
        return parsed

    @staticmethod
    def _extract_ocr_entities(ocr_text: str) -> List[ExtractedEntity]:
        entities = []

        # Dollar amounts
        for m in re.finditer(r"\$[\d,]+\.?\d*", ocr_text):
            entities.append(ExtractedEntity(
                entity_type="MONEY", text=m.group(), confidence=0.85,
                start_offset=m.start(), end_offset=m.end(),
            ))

        # Date patterns
        for m in re.finditer(
            r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b",
            ocr_text,
        ):
            entities.append(ExtractedEntity(
                entity_type="DATE", text=m.group(), confidence=0.80,
                start_offset=m.start(), end_offset=m.end(),
            ))

        # Receipt / Invoice number patterns
        for m in re.finditer(
            r"(?:Receipt|Invoice|Ref|Order)\s*#?\s*:?\s*([A-Z0-9\-]{4,})",
            ocr_text,
            re.IGNORECASE,
        ):
            entities.append(ExtractedEntity(
                entity_type="RECEIPT_NUMBER", text=m.group(1), confidence=0.80,
                start_offset=m.start(), end_offset=m.end(),
            ))

        return entities

    @staticmethod
    def _compute_confidence(
        raw_payload: Dict[str, Any],
        anomalies: List[DetectedAnomaly],
    ) -> float:
        score = 1.0
        optional = [
            "receipt_number", "receipt_date", "line_items",
            "subtotal", "tax", "payment_method",
        ]
        present = sum(1 for f in optional if raw_payload.get(f))
        score *= (0.7 + 0.3 * (present / len(optional)))

        penalty_map = {
            AnomalyLevel.LOW: 0.02,
            AnomalyLevel.MEDIUM: 0.05,
            AnomalyLevel.HIGH: 0.10,
            AnomalyLevel.CRITICAL: 0.20,
        }
        for a in anomalies:
            score -= penalty_map.get(a.severity, 0)

        return max(round(score, 4), 0.0)
