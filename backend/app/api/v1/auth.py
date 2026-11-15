"""
VerdictAI Authentication & Persona Token REST Endpoints
Author: Nirav Kachhiya (Project Lead / Backend Engineer)
"""

from typing import List, Dict, Any, Optional
import uuid
import time
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from backend.app.core.security import (
    RBACManager,
    AuthenticatedUser,
    get_current_user,
    ENTERPRISE_PERSONAS,
    ROLE_SCOPES,
    UserRole
)
from backend.app.core.db import db_manager

router = APIRouter(prefix="/auth", tags=["Authentication & RBAC"])


class TokenRequest(BaseModel):
    user_id: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    expires_in: int = 86400
    user: AuthenticatedUser


class CardholderRegisterRequest(BaseModel):
    full_name: str
    email: str
    phone: str
    card_network: Optional[str] = "RuPay Platinum"


class MerchantRegisterRequest(BaseModel):
    business_name: str
    manager_name: str
    email: str
    tax_id: str
    mcc: str = "5732"


@router.post("/token", response_model=TokenResponse, summary="Obtain JWT token for persona")
async def obtain_token(payload: TokenRequest):
    """
    Issues a cryptographically signed HMAC-SHA256 JWT token for an enterprise persona.
    """
    user = ENTERPRISE_PERSONAS.get(payload.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Persona '{payload.user_id}' not found. Available: {list(ENTERPRISE_PERSONAS.keys())}"
        )
    token = RBACManager.create_access_token(user)
    return TokenResponse(
        access_token=token,
        token_type="Bearer",
        expires_in=86400,
        user=user
    )


@router.get("/me", response_model=AuthenticatedUser, summary="Get current authenticated user profile")
async def get_my_profile(current_user: AuthenticatedUser = Depends(get_current_user)):
    """
    Returns the resolved identity, role, and permission scopes of the calling user.
    """
    return current_user


@router.get("/personas", summary="List enterprise personas for demonstration")
async def list_personas() -> List[Dict[str, Any]]:
    """
    Returns the list of 4 enterprise personas for demonstration and testing.
    """
    return [
        {
            "id": u.user_id,
            "name": u.full_name,
            "email": u.email,
            "role": u.role.value,
            "scopes": u.scopes
        }
        for u in ENTERPRISE_PERSONAS.values()
    ]


@router.post("/register/cardholder", response_model=TokenResponse, summary="Register consumer cardholder account")
async def register_cardholder(payload: CardholderRegisterRequest):
    """
    Consumer self-service enrollment via mobile or web portal.
    Provisions a new cardholder user record and issues a scoped JWT.
    """
    user_id = f"usr_{payload.email.split('@')[0]}_{uuid.uuid4().hex[:6]}"
    user = AuthenticatedUser(
        user_id=user_id,
        email=payload.email,
        full_name=payload.full_name,
        role=UserRole.CARDHOLDER,
        scopes=list(ROLE_SCOPES[UserRole.CARDHOLDER])
    )
    # Store in memory/db
    ENTERPRISE_PERSONAS[user_id] = user
    db_manager.insert_pg_record("users", user_id, {
        "id": user_id,
        "email": payload.email,
        "full_name": payload.full_name,
        "phone_number": payload.phone,
        "role": UserRole.CARDHOLDER.value,
        "is_active": True,
        "created_at": int(time.time())
    })
    token = RBACManager.create_access_token(user)
    return TokenResponse(access_token=token, token_type="Bearer", expires_in=86400, user=user)


@router.post("/register/merchant", response_model=TokenResponse, summary="Register merchant business account")
async def register_merchant(payload: MerchantRegisterRequest):
    """
    B2B Commercial Merchant onboarding.
    Provisions merchant legal profile, assign category code, and issues a scoped JWT.
    """
    merchant_id = f"mer_{uuid.uuid4().hex[:8]}"
    user_id = f"usr_{payload.email.split('@')[0]}_{uuid.uuid4().hex[:6]}"
    
    # Insert merchant record
    db_manager.insert_pg_record("merchants", merchant_id, {
        "id": merchant_id,
        "merchant_name": payload.business_name,
        "merchant_category_code": payload.mcc,
        "contact_email": payload.email,
        "tax_id": payload.tax_id,
        "risk_tier": "LOW",
        "historical_dispute_rate": 0.0050,
        "created_at": int(time.time())
    })

    user = AuthenticatedUser(
        user_id=user_id,
        email=payload.email,
        full_name=payload.managerName if hasattr(payload, "managerName") else payload.manager_name,
        role=UserRole.MERCHANT,
        scopes=list(ROLE_SCOPES[UserRole.MERCHANT])
    )
    ENTERPRISE_PERSONAS[user_id] = user
    db_manager.insert_pg_record("users", user_id, {
        "id": user_id,
        "email": payload.email,
        "full_name": user.full_name,
        "role": UserRole.MERCHANT.value,
        "merchant_id": merchant_id,
        "is_active": True,
        "created_at": int(time.time())
    })
    token = RBACManager.create_access_token(user)
    return TokenResponse(access_token=token, token_type="Bearer", expires_in=86400, user=user)
