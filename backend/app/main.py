"""
VerdictAI REST API Gateway & Application Entrypoint
Author: Darshan Prajapati (Backend Engineer - Reasoning & APIs)
"""

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from backend.app.core.config import settings
from backend.app.api.v1 import api_v1_router
from backend.app.services.state_machine.state_machine import InvalidStateTransitionError
from backend.app.models.api_schemas import utc_now

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="""
    # ⚖️ VerdictAI REST API Gateway
    **Frictionless Dispute & Chargeback Resolution Platform**
    
    *Engineered for Card Members (Mobile), Merchants (Web), and Dispute-Ops Analysts/Admins (Web).*
    
    ### API Capabilities:
    * **Dispute Lifecycle Operations:** Case file creation, query filtering, state machine transitions.
    * **Polymorphic Evidence Storage:** Ingestion of binary documents (PDF/JPG/PNG) & structured JSON with SHA-256 integrity hashes.
    * **Dispute-Ops Admin Queue:** Filterable review queue & audited manual overrides.
    * **Cryptographic Audit Engine:** Tamper-evident hash-chained logs.
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Configure Cross-Origin Resource Sharing (CORS) for Web & Mobile clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Version 1 API Router
app.include_router(api_v1_router, prefix=settings.API_V1_PREFIX)


@app.on_event("startup")
async def seed_initial_disputes_on_startup():
    """Seeds in-memory store with demo disputes so UI and API have live data immediately."""
    from backend.app.core.db import db_manager
    if db_manager.pg_tables.get("disputes"):
        return
    try:
        from backend.app.services.case_builder.service import case_service
        from backend.app.models.schemas import DisputeReason
        from database.mongodb.models import EvidenceType, EvidenceSource

        c1 = case_service.create_dispute_case(
            transaction_id="TXN-APEX-1041",
            cardholder_id="usr_sarah_jenkins",
            dispute_reason=DisputeReason.PRODUCT_NOT_RECEIVED,
            disputed_amount=1249.50,
            cardholder_statement="Ordered high-end electronics; courier marks delivered but package never received at residence.",
            merchant_sla_hours=48
        )
        case_service.attach_evidence(
            dispute_id=c1.header.dispute_id,
            evidence_type=EvidenceType.COURIER_TRACKING,
            source=EvidenceSource.COURIER_CARRIER,
            raw_payload={
                "carrier": "FedEx Express",
                "tracking_number": "TRK-981273941",
                "status": "DELIVERED",
                "delivery_address_match": True,
                "signed_by": "S. Jenkins (Front Desk)"
            },
            actor="CARRIER:fedex",
            file_name="fedex_delivery_proof.pdf"
        )
        case_service.create_dispute_case(
            transaction_id="TXN-CLOUD-1042",
            cardholder_id="usr_david_ross",
            dispute_reason=DisputeReason.DUPLICATE_PROCESSING,
            disputed_amount=199.00,
            cardholder_statement="Subscription fee charged twice on October billing cycle.",
            merchant_sla_hours=48
        )
        case_service.create_dispute_case(
            transaction_id="TXN-LUXURY-99281",
            cardholder_id="usr_elena_m",
            dispute_reason=DisputeReason.FRAUD_UNRECOGNIZED_CHARGE,
            disputed_amount=3499.00,
            cardholder_statement="Unrecognized overseas charge on credit card statement while abroad.",
            merchant_sla_hours=24
        )
    except Exception as e:
        pass


# Global Exception Handlers
@app.exception_handler(InvalidStateTransitionError)
async def state_transition_exception_handler(request: Request, exc: InvalidStateTransitionError):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error_code": "INVALID_STATE_TRANSITION",
            "message": str(exc),
            "timestamp": utc_now().isoformat()
        }
    )


@app.exception_handler(ValueError)
async def value_error_exception_handler(request: Request, exc: ValueError):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error_code": "BAD_REQUEST_VALUE",
            "message": str(exc),
            "timestamp": utc_now().isoformat()
        }
    )


@app.get("/health", tags=["System"])
async def health_check():
    """
    Standard liveness health-check endpoint for cloud container orchestration.
    """
    return {
        "status": "healthy",
        "service": "VerdictAI API Gateway",
        "version": settings.VERSION,
        "timestamp": utc_now().isoformat()
    }


@app.get("/", tags=["System"])
async def root():
    """
    API Gateway root endpoint providing navigational links.
    """
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "documentation_swagger": "/docs",
        "documentation_redoc": "/redoc",
        "openapi_spec": "/openapi.json",
        "health": "/health",
        "api_v1_base": settings.API_V1_PREFIX
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
