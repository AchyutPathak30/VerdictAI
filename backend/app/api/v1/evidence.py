"""
VerdictAI Evidence Ingestion & Polymorphic Storage REST Endpoints
Author: Darshan Prajapati (Backend Engineer - Reasoning & APIs)
"""

import hashlib
from typing import List, Optional
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from backend.app.models.api_schemas import (
    StructuredEvidenceRequest,
    StatementSubmissionRequest,
    utc_now
)
from database.mongodb.models import (
    EvidencePayloadModel,
    EvidenceType,
    EvidenceSource,
    MongoCaseDocument
)
from backend.app.services.case_builder.service import case_service
from backend.app.core.config import settings
from backend.app.core.db import db_manager

router = APIRouter(prefix="/evidence", tags=["Evidence"])


@router.post(
    "/upload",
    response_model=EvidencePayloadModel,
    status_code=status.HTTP_201_CREATED,
    summary="Upload evidence document or image"
)
async def upload_evidence_file(
    dispute_id: str = Form(..., description="Target dispute ID"),
    evidence_type: EvidenceType = Form(..., description="Type of evidence"),
    source: EvidenceSource = Form(..., description="Submitting party"),
    actor: str = Form(default="SYSTEM_UPLOAD", description="Actor identifier"),
    file: UploadFile = File(..., description="Evidence file (PDF, JPG, PNG)")
):
    """
    Ingests binary evidence files (invoices, carrier tracking receipts, chat logs),
    enforces file size limits (10MB for cardholders, 25MB for merchants),
    computes deterministic SHA-256 hash checksums, and updates MongoDB case record (SRS FR-08, FR-14, AC-04).
    """
    dispute_rec = db_manager.get_pg_record("disputes", dispute_id)
    if not dispute_rec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dispute with ID '{dispute_id}' not found."
        )

    # Read binary content
    contents = await file.read()
    file_size = len(contents)

    # File size validation per SRS FR-08 (10MB) & US-MR-02 (25MB)
    max_size = (
        settings.CARDHOLDER_MAX_FILE_SIZE_BYTES
        if source == EvidenceSource.CARDHOLDER
        else settings.MERCHANT_MAX_FILE_SIZE_BYTES
    )

    if file_size > max_size:
        limit_mb = max_size // (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of {limit_mb}MB for {source.value}."
        )

    # Compute raw payload and hash
    content_hash = hashlib.sha256(contents).hexdigest()
    raw_payload = {
        "file_name": file.filename,
        "content_type": file.content_type,
        "size_bytes": file_size,
        "sha256_binary_checksum": content_hash
    }

    try:
        evidence = case_service.attach_evidence(
            dispute_id=dispute_id,
            evidence_type=evidence_type,
            source=source,
            raw_payload=raw_payload,
            actor=actor,
            file_name=file.filename
        )
        return evidence
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to attach evidence: {str(e)}"
        )


@router.post(
    "/payload",
    response_model=EvidencePayloadModel,
    status_code=status.HTTP_201_CREATED,
    summary="Attach structured evidence payload (JSON)"
)
async def attach_structured_evidence(payload: StructuredEvidenceRequest):
    """
    Attaches structured carrier tracking telemetry, invoice details, or communication transcripts (SRS FR-11, FR-12).
    """
    try:
        evidence = case_service.attach_evidence(
            dispute_id=payload.dispute_id,
            evidence_type=payload.evidence_type,
            source=payload.source,
            raw_payload=payload.raw_payload,
            actor=payload.actor,
            file_name=payload.file_name
        )
        return evidence
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to attach structured payload: {str(e)}"
        )


@router.post(
    "/statement",
    summary="Submit written narrative statement"
)
async def submit_statement(payload: StatementSubmissionRequest):
    """
    Attaches or updates the cardholder narrative statement or merchant response statement.
    """
    dispute_rec = db_manager.get_pg_record("disputes", payload.dispute_id)
    if not dispute_rec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dispute with ID '{payload.dispute_id}' not found."
        )

    if payload.statement_type == "CARDHOLDER":
        dispute_rec["cardholder_statement"] = payload.statement_text
    else:
        dispute_rec["merchant_response_statement"] = payload.statement_text

    dispute_rec["updated_at"] = utc_now().isoformat()
    db_manager.update_pg_record("disputes", payload.dispute_id, dispute_rec)
    return {
        "dispute_id": payload.dispute_id,
        "statement_type": payload.statement_type,
        "author": payload.author,
        "status": "RECORDED"
    }


@router.get(
    "/{dispute_id}/items",
    response_model=List[EvidencePayloadModel],
    summary="List all evidence items for a dispute"
)
async def list_dispute_evidence(dispute_id: str):
    """
    Retrieves all attached evidence payload models stored in MongoDB for the dispute.
    """
    mongo_data = db_manager.get_mongo_doc("case_documents", dispute_id)
    if not mongo_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No evidence documents found for dispute '{dispute_id}'."
        )

    items = [EvidencePayloadModel(**item) for item in mongo_data.get("evidence_items", [])]
    return items


@router.get(
    "/{dispute_id}/highlights",
    summary="Get aggregated evidence highlights and semantic summary"
)
async def get_evidence_highlights(dispute_id: str):
    """
    Extracts structured highlights across all attached evidence items,
    including key facts, critical anomalies, claim alignment signals,
    and a prompt-ready semantic summary for the reasoning layer (SRS FR-11, FR-12).
    """
    dispute_rec = db_manager.get_pg_record("disputes", dispute_id)
    if not dispute_rec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dispute with ID '{dispute_id}' not found."
        )

    summary = case_service.extract_case_evidence_highlights(dispute_id)
    if not summary:
        return {
            "dispute_id": dispute_id,
            "evidence_count": 0,
            "highlights": None,
            "prompt_context": "",
            "message": "No structured evidence items available for highlight extraction."
        }

    return {
        "dispute_id": dispute_id,
        "evidence_count": summary.evidence_count,
        "highlights": summary.to_dict(),
        "prompt_context": summary.to_prompt_context()
    }
