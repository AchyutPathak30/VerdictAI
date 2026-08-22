"""
VerdictAI Domain Schemas & Unified Case File Models
Author: Nirav Kachhiya (Project Lead / Backend Engineer)
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from database.mongodb.models import EvidencePayloadModel, EvidenceType, EvidenceSource


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class DisputeStatus(str, Enum):
    SUBMITTED = "SUBMITTED"
    EVIDENCE_PENDING = "EVIDENCE_PENDING"
    EVIDENCE_INGESTED = "EVIDENCE_INGESTED"
    IN_ANALYSIS = "IN_ANALYSIS"
    SCORING_EVALUATED = "SCORING_EVALUATED"
    AUTO_RESOLVED = "AUTO_RESOLVED"
    MANUAL_REVIEW_QUEUE = "MANUAL_REVIEW_QUEUE"
    ADMIN_OVERRIDDEN = "ADMIN_OVERRIDDEN"
    RESOLUTION_NOTIFIED = "RESOLUTION_NOTIFIED"
    CLOSED = "CLOSED"
    REJECTED = "REJECTED"


class DisputeReason(str, Enum):
    FRAUD_UNRECOGNIZED_CHARGE = "FRAUD_UNRECOGNIZED_CHARGE"
    PRODUCT_NOT_RECEIVED = "PRODUCT_NOT_RECEIVED"
    PRODUCT_DAMAGED_OR_DEFECTIVE = "PRODUCT_DAMAGED_OR_DEFECTIVE"
    SUBSCRIPTION_CANCELLED_CHARGED = "SUBSCRIPTION_CANCELLED_CHARGED"
    DUPLICATE_PROCESSING = "DUPLICATE_PROCESSING"
    INCORRECT_AMOUNT_CHARGED = "INCORRECT_AMOUNT_CHARGED"


class ResolutionOutcome(str, Enum):
    FAVOR_CARDHOLDER = "FAVOR_CARDHOLDER"
    FAVOR_MERCHANT = "FAVOR_MERCHANT"
    SPLIT_LIABILITY = "SPLIT_LIABILITY"
    MERCHANT_ACCEPTED = "MERCHANT_ACCEPTED"


class TransactionSummary(BaseModel):
    transaction_id: str
    amount: float
    currency: str = "USD"
    merchant_id: str
    merchant_name: str
    cardholder_id: str
    cardholder_name: str
    payment_method: str
    transaction_timestamp: datetime


class CaseFileHeader(BaseModel):
    case_file_id: str
    dispute_id: str
    case_reference_number: str
    current_status: DisputeStatus
    dispute_reason: DisputeReason
    disputed_amount: float
    currency: str = "USD"
    created_at: datetime = Field(default_factory=utc_now)
    sla_deadline: datetime
    is_sealed: bool = False
    sealed_at: Optional[datetime] = None


class UnifiedCaseFile(BaseModel):
    """
    Consolidated, tamper-evident case file aggregating transactional data,
    polymorphic evidence from MongoDB, scoring inputs, and audit chain.
    """
    header: CaseFileHeader
    transaction: TransactionSummary
    cardholder_statement: Optional[str] = None
    merchant_response_statement: Optional[str] = None
    evidence_items: List[EvidencePayloadModel] = Field(default_factory=list)
    case_hash_sha256: str = ""
    audit_chain_length: int = 0
    resolution: Optional[Dict[str, Any]] = None
