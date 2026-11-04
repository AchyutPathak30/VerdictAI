"""
VerdictAI Configuration & Environment Settings
Author: Darshan Prajapati (Backend Engineer - Reasoning & APIs)
"""

import os
from typing import List
from pydantic import BaseModel, Field


class Settings(BaseModel):
    PROJECT_NAME: str = "VerdictAI: Frictionless Dispute & Chargeback Resolution"
    API_V1_PREFIX: str = "/api/v1"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Server & CORS
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8081",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "https://verdictai.onrender.com",
        "https://verdictai.railway.app",
        "*"
    ]
    
    # Evidence constraints (in bytes)
    CARDHOLDER_MAX_FILE_SIZE_BYTES: int = 10 * 1024 * 1024  # 10 MB (SRS FR-08)
    MERCHANT_MAX_FILE_SIZE_BYTES: int = 25 * 1024 * 1024    # 25 MB (SRS US-MR-02)
    
    # Security & Production Hardening (Phase 5 - Darshan Prajapati)
    JWT_SECRET: str = os.getenv("JWT_SECRET", "verdictai-insecure-secret-key-change-in-prod")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30  # SRS FR-04
    
    # Rate Limiting & Security Headers (Phase 5 Hardening)
    RATE_LIMIT_ENABLED: bool = os.getenv("RATE_LIMIT_ENABLED", "true").lower() in ("true", "1", "yes")
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_REQUESTS_PER_MINUTE", "120"))
    RATE_LIMIT_BURST: int = int(os.getenv("RATE_LIMIT_BURST", "30"))
    SECURITY_HEADERS_ENABLED: bool = True


settings = Settings()
