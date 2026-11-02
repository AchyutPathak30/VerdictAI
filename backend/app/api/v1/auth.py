"""
VerdictAI Authentication & Persona Token REST Endpoints
Author: Nirav Kachhiya (Project Lead / Backend Engineer)
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from backend.app.core.security import (
    RBACManager,
    AuthenticatedUser,
    get_current_user,
    ENTERPRISE_PERSONAS,
    UserRole
)

router = APIRouter(prefix="/auth", tags=["Authentication & RBAC"])


class TokenRequest(BaseModel):
    user_id: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    expires_in: int = 86400
    user: AuthenticatedUser


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
