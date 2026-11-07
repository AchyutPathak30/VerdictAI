"""
VerdictAI Evidence Parsing Pipeline — Courier / Carrier Tracking Parser
Author: Achyut Pathak (AI/NLP Engineer — Evidence Parsing)

Parses courier and carrier tracking evidence payloads submitted by
merchants or payment gateways.  Validates delivery status chains,
detects address mismatches, unsigned deliveries, delivery delays,
and extracts GPS coordinates and signatory information.
"""

import math
import re
from datetime import datetime, timezone, timedelta
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


# Valid delivery status progression
VALID_STATUS_CHAIN = [
    "LABEL_CREATED",
    "PICKED_UP",
    "SHIPPED",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
]

# Statuses that indicate an unsuccessful delivery
EXCEPTION_STATUSES = {
    "RETURNED_TO_SENDER",
    "DELIVERY_EXCEPTION",
    "LOST",
    "DAMAGED_IN_TRANSIT",
    "REFUSED",
    "HELD_AT_FACILITY",
}

# Known carrier names for validation
KNOWN_CARRIERS = {
    "FEDEX", "UPS", "USPS", "DHL", "CANADA_POST", "ROYAL_MAIL",
    "AUSTRALIA_POST", "ARAMEX", "TNT", "ONTRAC", "LASERSHIP",
    "AMAZON_LOGISTICS", "PUROLATOR",
}


class CourierTrackingParser(EvidenceParser):
    """
    Parses courier / carrier tracking evidence payloads.

    Expected ``raw_payload`` keys
    ─────────────────────────────
    Required:
        - ``carrier``         (str, e.g. "FedEx")
        - ``tracking_number`` (str)
        - ``status``          (str, current delivery status)
    Optional:
        - ``delivery_date``      (str, ISO-8601)
        - ``shipped_date``       (str, ISO-8601)
        - ``signed_by``          (str, name of person who signed)
        - ``delivery_address``   (str)
        - ``expected_address``   (str, for mismatch detection)
        - ``gps_latitude``       (float)
        - ``gps_longitude``      (float)
        - ``delivery_address_match`` (bool)
        - ``status_history``     (list[dict], e.g. [{"status": "SHIPPED", "timestamp": "…"}, …])
        - ``weight_kg``          (float)
        - ``service_type``       (str, e.g. "EXPRESS", "GROUND")
        - ``estimated_delivery`` (str, ISO-8601)
    """

    # Maximum reasonable transit days before flagging
    MAX_TRANSIT_DAYS = 30
    # Maximum GPS discrepancy between delivery telematics and destination before flagging
    MAX_COORDINATE_DISTANCE_KM = 1.0

    @property
    def parser_name(self) -> str:
        return "CourierTrackingParser"

    # ── validation ───────────────────────────────────────────────

    def validate(self, raw_payload: Dict[str, Any]) -> bool:
        if not isinstance(raw_payload, dict):
            return False
        return all(
            k in raw_payload and raw_payload[k] is not None
            for k in ("carrier", "tracking_number", "status")
        )

    # ── parsing ──────────────────────────────────────────────────

    def parse(self, raw_payload: Dict[str, Any]) -> ParsedEvidence:
        self._require_fields(raw_payload, ["carrier", "tracking_number", "status"])

        entities: List[ExtractedEntity] = []
        anomalies: List[DetectedAnomaly] = []

        # --- Core fields ---
        carrier = str(raw_payload["carrier"]).replace("\x00", "").strip().upper()[:100]
        tracking_number = str(raw_payload["tracking_number"]).replace("\x00", "").strip()[:100]
        status = str(raw_payload["status"]).replace("\x00", "").strip().upper()[:50]
        delivery_date = self._parse_date(raw_payload.get("delivery_date"))
        shipped_date = self._parse_date(raw_payload.get("shipped_date"))
        signed_by = str(raw_payload["signed_by"]).replace("\x00", "").strip()[:200] if raw_payload.get("signed_by") else None
        delivery_address = str(raw_payload["delivery_address"]).replace("\x00", "").strip()[:500] if raw_payload.get("delivery_address") else None
        expected_address = str(raw_payload["expected_address"]).replace("\x00", "").strip()[:500] if raw_payload.get("expected_address") else None
        gps_lat = raw_payload.get("gps_latitude")
        gps_lng = raw_payload.get("gps_longitude")
        exp_lat = raw_payload.get("expected_latitude")
        exp_lng = raw_payload.get("expected_longitude")
        gps_distance_km = raw_payload.get("gps_distance_km")
        address_match = raw_payload.get("delivery_address_match")
        raw_history = raw_payload.get("status_history", [])
        status_history = raw_history[:200] if isinstance(raw_history, list) else []
        weight_kg = raw_payload.get("weight_kg")
        service_type = str(raw_payload["service_type"]).replace("\x00", "").strip()[:100] if raw_payload.get("service_type") else None
        estimated_delivery = self._parse_date(raw_payload.get("estimated_delivery"))

        # --- Entity extraction ---
        entities.append(
            ExtractedEntity(entity_type="CARRIER", text=carrier, confidence=0.99)
        )
        entities.append(
            ExtractedEntity(entity_type="TRACKING_NUMBER", text=tracking_number, confidence=1.0)
        )
        entities.append(
            ExtractedEntity(entity_type="DELIVERY_STATUS", text=status, confidence=0.99)
        )
        if delivery_date:
            entities.append(
                ExtractedEntity(entity_type="DATE", text=delivery_date.isoformat(), confidence=0.97)
            )
        if signed_by:
            entities.append(
                ExtractedEntity(entity_type="PERSON", text=signed_by, confidence=0.95)
            )
        if delivery_address:
            entities.append(
                ExtractedEntity(entity_type="GPE", text=delivery_address, confidence=0.90)
            )

        valid_gps = None
        if gps_lat is not None and gps_lng is not None:
            try:
                lat_f, lng_f = float(gps_lat), float(gps_lng)
                if not (math.isnan(lat_f) or math.isinf(lat_f) or math.isnan(lng_f) or math.isinf(lng_f)):
                    if -90.0 <= lat_f <= 90.0 and -180.0 <= lng_f <= 180.0:
                        valid_gps = (lat_f, lng_f)
            except (ValueError, TypeError):
                valid_gps = None

            if valid_gps:
                entities.append(
                    ExtractedEntity(
                        entity_type="GPS_COORDINATES",
                        text=f"{valid_gps[0]},{valid_gps[1]}",
                        confidence=0.98,
                    )
                )
            else:
                anomalies.append(DetectedAnomaly(
                    anomaly_type="INVALID_GPS_COORDINATES",
                    description=f"Invalid or out-of-bounds GPS coordinates provided: ({gps_lat}, {gps_lng}).",
                    severity=AnomalyLevel.MEDIUM,
                    supporting_data={"latitude": gps_lat, "longitude": gps_lng},
                ))

        # --- Anomaly detection ---

        # 1. Unknown carrier
        carrier_normalized = re.sub(r"[\s\-_.]", "_", carrier)
        if carrier_normalized not in KNOWN_CARRIERS:
            anomalies.append(DetectedAnomaly(
                anomaly_type="UNKNOWN_CARRIER",
                description=f"Carrier '{carrier}' is not in the known carriers list.",
                severity=AnomalyLevel.LOW,
                supporting_data={"carrier": carrier},
            ))

        # 2. Invalid tracking number format (basic length/pattern check)
        if len(tracking_number) < 8:
            anomalies.append(DetectedAnomaly(
                anomaly_type="INVALID_TRACKING_NUMBER",
                description=f"Tracking number '{tracking_number}' is suspiciously short ({len(tracking_number)} chars).",
                severity=AnomalyLevel.MEDIUM,
                supporting_data={"tracking_number": tracking_number, "length": len(tracking_number)},
            ))

        # 3. Delivery exception status
        if status in EXCEPTION_STATUSES:
            anomalies.append(DetectedAnomaly(
                anomaly_type="DELIVERY_EXCEPTION",
                description=f"Delivery status is '{status}' — package was not successfully delivered.",
                severity=AnomalyLevel.HIGH,
                supporting_data={"status": status},
            ))

        # 4. Status says DELIVERED but no signature
        if status == "DELIVERED" and not signed_by:
            anomalies.append(DetectedAnomaly(
                anomaly_type="UNSIGNED_DELIVERY",
                description="Package marked as DELIVERED but no signature was captured.",
                severity=AnomalyLevel.MEDIUM,
                supporting_data={"status": status},
            ))

        # 5. Address mismatch
        if address_match is False:
            anomalies.append(DetectedAnomaly(
                anomaly_type="ADDRESS_MISMATCH",
                description="Delivery address does not match the expected cardholder address.",
                severity=AnomalyLevel.HIGH,
                supporting_data={
                    "delivery_address": delivery_address,
                    "expected_address": expected_address,
                },
            ))
        elif delivery_address and expected_address:
            if not self._addresses_match(delivery_address, expected_address):
                anomalies.append(DetectedAnomaly(
                    anomaly_type="ADDRESS_MISMATCH",
                    description="Delivery and expected addresses appear to differ.",
                    severity=AnomalyLevel.HIGH,
                    supporting_data={
                        "delivery_address": delivery_address,
                        "expected_address": expected_address,
                    },
                ))

        # 5b. GPS Coordinate Discrepancy / Telematics Misdelivery Detection
        coord_distance = None
        if gps_distance_km is not None:
            try:
                coord_distance = float(gps_distance_km)
            except (ValueError, TypeError):
                pass
        elif gps_lat is not None and gps_lng is not None and exp_lat is not None and exp_lng is not None:
            try:
                coord_distance = self._haversine_distance_km(
                    float(gps_lat), float(gps_lng), float(exp_lat), float(exp_lng)
                )
            except (ValueError, TypeError):
                pass

        if coord_distance is not None and coord_distance > self.MAX_COORDINATE_DISTANCE_KM:
            anomalies.append(DetectedAnomaly(
                anomaly_type="COORDINATE_DISCREPANCY",
                description=(
                    f"Carrier GPS telematics records delivery {coord_distance:.1f} km away "
                    f"from expected destination (threshold: {self.MAX_COORDINATE_DISTANCE_KM} km)."
                ),
                severity=AnomalyLevel.HIGH,
                supporting_data={
                    "distance_km": coord_distance,
                    "threshold_km": self.MAX_COORDINATE_DISTANCE_KM,
                    "delivery_coordinates": {"latitude": gps_lat, "longitude": gps_lng},
                    "expected_coordinates": {"latitude": exp_lat, "longitude": exp_lng} if exp_lat is not None else None,
                },
            ))

        # 6. Excessive transit time
        if shipped_date and delivery_date:
            transit_days = (delivery_date - shipped_date).days
            if transit_days > self.MAX_TRANSIT_DAYS:
                anomalies.append(DetectedAnomaly(
                    anomaly_type="EXCESSIVE_TRANSIT_TIME",
                    description=f"Package was in transit for {transit_days} days (threshold: {self.MAX_TRANSIT_DAYS}).",
                    severity=AnomalyLevel.MEDIUM,
                    supporting_data={"transit_days": transit_days},
                ))

        # 7. Status history chain validation
        if status_history:
            chain_anomalies = self._validate_status_chain(status_history)
            anomalies.extend(chain_anomalies)

        # 8. Late delivery (past estimated)
        if estimated_delivery and delivery_date:
            if delivery_date > estimated_delivery:
                delay_days = (delivery_date - estimated_delivery).days
                anomalies.append(DetectedAnomaly(
                    anomaly_type="LATE_DELIVERY",
                    description=f"Package delivered {delay_days} day(s) after the estimated delivery date.",
                    severity=AnomalyLevel.LOW,
                    supporting_data={"delay_days": delay_days},
                ))

        # --- Structured output ---
        structured_data = {
            "carrier": carrier,
            "tracking_number": tracking_number,
            "status": status,
            "delivery_date": delivery_date.isoformat() if delivery_date else None,
            "shipped_date": shipped_date.isoformat() if shipped_date else None,
            "signed_by": signed_by,
            "delivery_address": delivery_address,
            "expected_address": expected_address,
            "gps_coordinates": {
                "latitude": gps_lat,
                "longitude": gps_lng,
            } if gps_lat is not None and gps_lng is not None else None,
            "delivery_address_match": address_match,
            "service_type": service_type,
            "weight_kg": weight_kg,
            "status_history_count": len(status_history),
        }

        # --- Confidence & alignment ---
        confidence = self._compute_confidence(raw_payload, anomalies)
        alignment = self._determine_alignment(status, anomalies)

        return ParsedEvidence(
            parser_name=self.parser_name,
            structured_data=structured_data,
            extracted_entities=entities,
            anomalies=anomalies,
            confidence_score=confidence,
            claim_alignment=alignment,
            metadata={
                "has_gps": gps_lat is not None and gps_lng is not None,
                "has_signature": signed_by is not None,
                "has_status_history": len(status_history) > 0,
            },
        )

    # ── helpers ──────────────────────────────────────────────────

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
            "%B %d, %Y",
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
    def _haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> Optional[float]:
        """Computes great-circle distance between two GPS coordinates in kilometers."""
        for val in (lat1, lon1, lat2, lon2):
            if not isinstance(val, (int, float)) or math.isnan(val) or math.isinf(val):
                return None
        if not (-90.0 <= lat1 <= 90.0 and -90.0 <= lat2 <= 90.0 and -180.0 <= lon1 <= 180.0 and -180.0 <= lon2 <= 180.0):
            return None
        r = 6371.0  # Earth radius in km
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (
            math.sin(dlat / 2.0) ** 2
            + math.cos(math.radians(lat1))
            * math.cos(math.radians(lat2))
            * math.sin(dlon / 2.0) ** 2
        )
        a = max(0.0, min(1.0, a))
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return round(r * c, 2)

    @staticmethod
    def _addresses_match(addr1: str, addr2: str) -> bool:
        """Simple normalised address comparison."""
        if not isinstance(addr1, str) or not isinstance(addr2, str):
            return False
        def normalise(a: str) -> str:
            a = a.lower().strip()[:500]
            a = re.sub(r"[^a-z0-9\s]", "", a)
            a = re.sub(r"\s+", " ", a)
            return a
        return normalise(addr1) == normalise(addr2)

    @staticmethod
    def _validate_status_chain(
        status_history: List[Dict[str, Any]],
    ) -> List[DetectedAnomaly]:
        """
        Validates that the status history follows a logical progression.
        """
        anomalies = []
        statuses = [
            str(entry.get("status", "")).strip().upper()
            for entry in status_history
            if isinstance(entry, dict)
        ]

        for i in range(1, len(statuses)):
            prev = statuses[i - 1]
            curr = statuses[i]

            # Check for backward transitions in the normal chain
            if prev in VALID_STATUS_CHAIN and curr in VALID_STATUS_CHAIN:
                prev_idx = VALID_STATUS_CHAIN.index(prev)
                curr_idx = VALID_STATUS_CHAIN.index(curr)
                if curr_idx < prev_idx:
                    anomalies.append(DetectedAnomaly(
                        anomaly_type="STATUS_CHAIN_REGRESSION",
                        description=f"Status went backward: {prev} → {curr}.",
                        severity=AnomalyLevel.HIGH,
                        supporting_data={"from": prev, "to": curr, "position": i},
                    ))

            # Check for duplicate consecutive statuses
            if prev == curr:
                anomalies.append(DetectedAnomaly(
                    anomaly_type="DUPLICATE_STATUS_EVENT",
                    description=f"Duplicate consecutive status event: {curr}.",
                    severity=AnomalyLevel.LOW,
                    supporting_data={"status": curr, "position": i},
                ))

        return anomalies

    @staticmethod
    def _determine_alignment(
        status: str,
        anomalies: List[DetectedAnomaly],
    ) -> ClaimAlignment:
        """
        Determines claim alignment based on delivery status and anomalies.
        """
        has_address_mismatch = any(a.anomaly_type == "ADDRESS_MISMATCH" for a in anomalies)
        has_delivery_exception = any(a.anomaly_type == "DELIVERY_EXCEPTION" for a in anomalies)
        has_coord_discrepancy = any(a.anomaly_type == "COORDINATE_DISCREPANCY" for a in anomalies)

        if status == "DELIVERED" and not has_address_mismatch and not has_coord_discrepancy:
            return ClaimAlignment.SUPPORTS_MERCHANT
        elif status in EXCEPTION_STATUSES or has_delivery_exception:
            return ClaimAlignment.SUPPORTS_CARDHOLDER
        elif has_address_mismatch or has_coord_discrepancy:
            return ClaimAlignment.SUPPORTS_CARDHOLDER
        else:
            return ClaimAlignment.NEUTRAL

    @staticmethod
    def _compute_confidence(
        raw_payload: Dict[str, Any],
        anomalies: List[DetectedAnomaly],
    ) -> float:
        score = 1.0
        optional = [
            "delivery_date", "shipped_date", "signed_by",
            "delivery_address", "gps_latitude", "gps_longitude",
            "status_history", "service_type",
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
