"""
VerdictAI: Frictionless Dispute & Chargeback Resolution
MongoDB Polymorphic Evidence Models
Author: Nirav Kachhiya (Project Lead / Backend Engineer)
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
import hashlib
import json


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class EvidenceSource(str, Enum):
    CARDHOLDER = "CARDHOLDER"
    MERCHANT = "MERCHANT"
    PAYMENT_GATEWAY = "PAYMENT_GATEWAY"
    COURIER_CARRIER = "COURIER_CARRIER"
    SYSTEM_AUTOMATION = "SYSTEM_AUTOMATION"


class EvidenceType(str, Enum):
    RECEIPT_INVOICE = "RECEIPT_INVOICE"
    COURIER_TRACKING = "COURIER_TRACKING"
    COMMUNICATION_LOG = "COMMUNICATION_LOG"
    REFUND_POLICY_TERMS = "REFUND_POLICY_TERMS"
    BANK_STATEMENT = "BANK_STATEMENT"
    IDENTITY_VERIFICATION = "IDENTITY_VERIFICATION"
    SYSTEM_AUDIT_PROOF = "SYSTEM_AUDIT_PROOF"


class EvidencePayloadModel(BaseModel):
    """
    Polymorphic evidence item stored within MongoDB.
    Capable of storing dynamic multi-modal data with verified SHA-256 hash.
    """
    evidence_id: str
    dispute_id: str
    evidence_type: EvidenceType
    source: EvidenceSource
    file_name: Optional[str] = None
    mime_type: Optional[str] = None
    file_size_bytes: Optional[int] = None
    sha256_checksum: str
    uploaded_at: datetime = Field(default_factory=utc_now)
    
    # Polymorphic unconstrained metadata
    raw_payload: Dict[str, Any] = Field(default_factory=dict)
    
    # NLP & Extraction Enrichment Fields
    nlp_extracted_entities: Dict[str, Any] = Field(default_factory=dict)
    ocr_extracted_text: Optional[str] = None
    confidence_rating: float = Field(default=1.0, ge=0.0, le=1.0)

    @classmethod
    def create_with_hash(
        cls,
        evidence_id: str,
        dispute_id: str,
        evidence_type: EvidenceType,
        source: EvidenceSource,
        raw_payload: Dict[str, Any],
        file_name: Optional[str] = None,
        mime_type: Optional[str] = None,
        nlp_entities: Optional[Dict[str, Any]] = None,
        ocr_text: Optional[str] = None
    ) -> "EvidencePayloadModel":
        """Generates evidence model with automatic SHA-256 integrity hash."""
        serialized = json.dumps(raw_payload, sort_keys=True, default=str).encode("utf-8")
        payload_hash = hashlib.sha256(serialized).hexdigest()
        
        return cls(
            evidence_id=evidence_id,
            dispute_id=dispute_id,
            evidence_type=evidence_type,
            source=source,
            file_name=file_name,
            mime_type=mime_type,
            file_size_bytes=len(serialized),
            sha256_checksum=payload_hash,
            raw_payload=raw_payload,
            nlp_extracted_entities=nlp_entities or {},
            ocr_extracted_text=ocr_text
        )


class MongoCaseDocument(BaseModel):
    """
    Full case document representation stored in MongoDB, referencing PostgreSQL dispute ID.
    """
    dispute_id: str
    case_reference_number: str
    evidence_items: List[EvidencePayloadModel] = Field(default_factory=list)
    total_evidence_count: int = 0
    composite_case_hash: str = ""
    is_sealed: bool = False
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

    def calculate_composite_hash(self) -> str:
        """
        Computes deterministic Merkle-style root hash across all attached evidence hashes.
        """
        sorted_hashes = sorted([item.sha256_checksum for item in self.evidence_items])
        combined = ":".join(sorted_hashes).encode("utf-8")
        return hashlib.sha256(combined).hexdigest()

    def add_evidence(self, evidence: EvidencePayloadModel) -> None:
        """Adds evidence and updates composite case hash."""
        if self.is_sealed:
            raise ValueError(f"Cannot add evidence to sealed case {self.case_reference_number}")
        self.evidence_items.append(evidence)
        self.total_evidence_count = len(self.evidence_items)
        self.composite_case_hash = self.calculate_composite_hash()
        self.updated_at = utc_now()
