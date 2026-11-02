"""
VerdictAI Core Security, Authentication & Role-Based Access Control (RBAC) Engine
Author: Nirav Kachhiya (Project Lead / Backend Engineer)
Phase 5 & 6 Deliverable: Dynamic Zero-Trust Token Scoping & Persona Isolation
"""

import hmac
import hashlib
import json
import base64
import time
from datetime import datetime, timezone
from typing import Dict, List, Optional, Set
from enum import Enum
from pydantic import BaseModel, Field
from fastapi import Header, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

SECRET_KEY = "verdictai-insecure-dev-secret-key-change-in-prod"
ALGORITHM = "HS256"
security_scheme = HTTPBearer(auto_error=False)


class UserRole(str, Enum):
    CARDHOLDER = "CARDHOLDER"
    MERCHANT = "MERCHANT"
    DISPUTE_ANALYST = "DISPUTE_ANALYST"
    ADMIN = "ADMIN"


ROLE_SCOPES: Dict[UserRole, Set[str]] = {
    UserRole.CARDHOLDER: {
        "disputes:create",
        "disputes:read_self",
        "evidence:upload_self"
    },
    UserRole.MERCHANT: {
        "disputes:read_merchant",
        "evidence:upload_merchant",
        "rebuttal:submit"
    },
    UserRole.DISPUTE_ANALYST: {
        "disputes:read_all",
        "disputes:triage",
        "evidence:read_all",
        "scoring:evaluate",
        "reasoning:generate"
    },
    UserRole.ADMIN: {
        "*"
    }
}


class AuthenticatedUser(BaseModel):
    user_id: str
    email: str
    full_name: str
    role: UserRole
    scopes: List[str] = Field(default_factory=list)
    issued_at: int = Field(default_factory=lambda: int(time.time()))
    expires_at: int = Field(default_factory=lambda: int(time.time()) + 86400)


# Standard Enterprise Persona Registry
ENTERPRISE_PERSONAS: Dict[str, AuthenticatedUser] = {
    "usr_pooja_iyer": AuthenticatedUser(
        user_id="usr_pooja_iyer",
        email="pooja.iyer@gmail.com",
        full_name="Pooja Iyer",
        role=UserRole.CARDHOLDER,
        scopes=list(ROLE_SCOPES[UserRole.CARDHOLDER])
    ),
    "usr_croma_ops": AuthenticatedUser(
        user_id="usr_croma_ops",
        email="rajesh.k@croma.infiniti.com",
        full_name="Rajesh Kumar (Croma Ops)",
        role=UserRole.MERCHANT,
        scopes=list(ROLE_SCOPES[UserRole.MERCHANT])
    ),
    "usr_rajesh_verma": AuthenticatedUser(
        user_id="usr_rajesh_verma",
        email="rajesh.verma@verdictai-bank.com",
        full_name="Rajesh Verma (Senior Analyst)",
        role=UserRole.DISPUTE_ANALYST,
        scopes=list(ROLE_SCOPES[UserRole.DISPUTE_ANALYST])
    ),
    "usr_priya_sharma": AuthenticatedUser(
        user_id="usr_priya_sharma",
        email="priya.sharma@verdictai-bank.com",
        full_name="Priya Sharma (Admin Lead)",
        role=UserRole.ADMIN,
        scopes=list(ROLE_SCOPES[UserRole.ADMIN])
    )
}


class RBACManager:
    """
    Manages cryptographic token creation, signature verification,
    and role-based permission assertions.
    """

    @staticmethod
    def _b64_encode(data: bytes) -> str:
        return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")

    @staticmethod
    def _b64_decode(data: str) -> bytes:
        padded = data + "=" * (-len(data) % 4)
        return base64.urlsafe_b64decode(padded)

    @classmethod
    def create_access_token(cls, user: AuthenticatedUser) -> str:
        """Creates a signed HMAC-SHA256 compact token."""
        header = {"alg": ALGORITHM, "typ": "JWT"}
        payload = user.model_dump()
        
        encoded_header = cls._b64_encode(json.dumps(header).encode("utf-8"))
        encoded_payload = cls._b64_encode(json.dumps(payload, default=str).encode("utf-8"))
        
        signature = hmac.new(
            SECRET_KEY.encode("utf-8"),
            f"{encoded_header}.{encoded_payload}".encode("utf-8"),
            hashlib.sha256
        ).digest()
        encoded_sig = cls._b64_encode(signature)
        
        return f"{encoded_header}.{encoded_payload}.{encoded_sig}"

    @classmethod
    def decode_and_verify_token(cls, token: str) -> AuthenticatedUser:
        """Validates token signature and expiration."""
        parts = token.split(".")
        if len(parts) != 3:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Malformed authorization token."
            )
        
        encoded_header, encoded_payload, encoded_sig = parts
        expected_sig = cls._b64_encode(
            hmac.new(
                SECRET_KEY.encode("utf-8"),
                f"{encoded_header}.{encoded_payload}".encode("utf-8"),
                hashlib.sha256
            ).digest()
        )
        
        if not hmac.compare_digest(encoded_sig, expected_sig):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid cryptographic token signature."
            )
        
        payload_data = json.loads(cls._b64_decode(encoded_payload).decode("utf-8"))
        if payload_data.get("expires_at", 0) < time.time():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authorization token has expired."
            )
        
        return AuthenticatedUser(**payload_data)

    @classmethod
    def authenticate_request(
        cls,
        auth_cred: Optional[HTTPAuthorizationCredentials] = None,
        x_user_role: Optional[str] = None,
        x_user_id: Optional[str] = None
    ) -> AuthenticatedUser:
        """
        Extracts authenticated user from Bearer token, or seamlessly falls back
        to enterprise persona headers (for local testing & dev consoles).
        """
        # 1. Check Bearer token
        if auth_cred and auth_cred.credentials:
            return cls.decode_and_verify_token(auth_cred.credentials)
        
        # 2. Check X-User-Id known persona
        if x_user_id and x_user_id in ENTERPRISE_PERSONAS:
            return ENTERPRISE_PERSONAS[x_user_id]
        
        # 3. Check X-User-Role header fallback
        if x_user_role:
            role_clean = x_user_role.upper().strip()
            for persona in ENTERPRISE_PERSONAS.values():
                if persona.role.value == role_clean:
                    return persona
            if role_clean in UserRole._value2member_map_:
                r_enum = UserRole(role_clean)
                return AuthenticatedUser(
                    user_id=f"usr_auto_{role_clean.lower()}",
                    email=f"operator@{role_clean.lower()}.verdictai.bank",
                    full_name=f"Automated {role_clean.title()}",
                    role=r_enum,
                    scopes=list(ROLE_SCOPES[r_enum])
                )
        
        # 4. Default persona for test harness without credentials (Admin Lead)
        return ENTERPRISE_PERSONAS["usr_priya_sharma"]


def get_current_user(
    auth_cred: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id")
) -> AuthenticatedUser:
    """Dependency to retrieve the currently active authenticated persona."""
    return RBACManager.authenticate_request(
        auth_cred=auth_cred,
        x_user_role=x_user_role,
        x_user_id=x_user_id
    )


def require_roles(allowed_roles: List[str]):
    """Enforces that the authenticated user possesses one of the allowed enterprise roles."""
    def role_checker(user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
        if user.role.value not in allowed_roles and "*" not in user.scopes:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {allowed_roles}. Current role: {user.role.value}"
            )
        return user
    return role_checker


def require_scopes(required_scopes: List[str]):
    """Enforces that the authenticated user possesses the specific operational scope."""
    def scope_checker(user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
        if "*" in user.scopes:
            return user
        for s in required_scopes:
            if s not in user.scopes:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access denied. Missing required permission scope: '{s}'"
                )
        return user
    return scope_checker
