"""
VerdictAI API v1 Router Aggregator
Author: Darshan Prajapati (Backend Engineer - Reasoning & APIs)
"""

from fastapi import APIRouter
from backend.app.api.v1.system import router as system_router
from backend.app.api.v1.transactions import router as transactions_router
from backend.app.api.v1.disputes import router as disputes_router
from backend.app.api.v1.evidence import router as evidence_router
from backend.app.api.v1.admin import router as admin_router
from backend.app.api.v1.reasoning import router as reasoning_router

api_v1_router = APIRouter()

api_v1_router.include_router(system_router)
api_v1_router.include_router(transactions_router)
api_v1_router.include_router(disputes_router)
api_v1_router.include_router(evidence_router)
api_v1_router.include_router(admin_router)
api_v1_router.include_router(reasoning_router)

