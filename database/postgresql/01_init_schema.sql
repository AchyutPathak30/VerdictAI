-- ====================================================================
-- VerdictAI: Frictionless Dispute & Chargeback Resolution
-- PostgreSQL Core Relational Schema
-- Author: Nirav Kachhiya (Project Lead / Backend Engineer)
-- Phase 1 Deliverable | Dual-Database Architecture
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum Definitions
DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('CARDHOLDER', 'MERCHANT', 'ADMIN', 'DISPUTE_ANALYST');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE dispute_status_enum AS ENUM (
        'SUBMITTED',
        'EVIDENCE_PENDING',
        'EVIDENCE_INGESTED',
        'IN_ANALYSIS',
        'SCORING_EVALUATED',
        'AUTO_RESOLVED',
        'MANUAL_REVIEW_QUEUE',
        'ADMIN_OVERRIDDEN',
        'RESOLUTION_NOTIFIED',
        'CLOSED',
        'REJECTED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE dispute_reason_enum AS ENUM (
        'FRAUD_UNRECOGNIZED_CHARGE',
        'PRODUCT_NOT_RECEIVED',
        'PRODUCT_DAMAGED_OR_DEFECTIVE',
        'SUBSCRIPTION_CANCELLED_CHARGED',
        'DUPLICATE_PROCESSING',
        'INCORRECT_AMOUNT_CHARGED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE resolution_outcome_enum AS ENUM (
        'FAVOR_CARDHOLDER',
        'FAVOR_MERCHANT',
        'SPLIT_LIABILITY',
        'MERCHANT_ACCEPTED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    role user_role_enum NOT NULL DEFAULT 'CARDHOLDER',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Merchants Table
CREATE TABLE IF NOT EXISTS merchants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_name VARCHAR(255) NOT NULL,
    merchant_category_code VARCHAR(10) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    risk_tier VARCHAR(20) DEFAULT 'LOW',
    historical_dispute_rate NUMERIC(5,4) DEFAULT 0.0050,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Financial Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE RESTRICT,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    payment_method VARCHAR(50) NOT NULL, -- e.g. VISA_CREDIT, MASTERCARD, AMEX
    original_auth_code VARCHAR(100) NOT NULL,
    terminal_city VARCHAR(100),
    terminal_country VARCHAR(100),
    is_disputed BOOLEAN NOT NULL DEFAULT FALSE,
    transaction_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Disputes Table
CREATE TABLE IF NOT EXISTS disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL UNIQUE REFERENCES transactions(id) ON DELETE RESTRICT,
    cardholder_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    dispute_reason dispute_reason_enum NOT NULL,
    disputed_amount NUMERIC(12, 2) NOT NULL,
    current_status dispute_status_enum NOT NULL DEFAULT 'SUBMITTED',
    merchant_sla_hours INTEGER NOT NULL DEFAULT 48,
    sla_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    cardholder_statement TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Case Files Table (Bridge to MongoDB Polymorphic Evidence)
CREATE TABLE IF NOT EXISTS case_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispute_id UUID NOT NULL UNIQUE REFERENCES disputes(id) ON DELETE CASCADE,
    mongo_case_doc_id VARCHAR(100) NOT NULL,
    case_hash_sha256 VARCHAR(64) NOT NULL,
    total_evidence_count INTEGER NOT NULL DEFAULT 0,
    is_sealed BOOLEAN NOT NULL DEFAULT FALSE,
    sealed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Dispute Resolutions Table
CREATE TABLE IF NOT EXISTS dispute_resolutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispute_id UUID NOT NULL UNIQUE REFERENCES disputes(id) ON DELETE CASCADE,
    outcome resolution_outcome_enum NOT NULL,
    confidence_score NUMERIC(5, 4) NOT NULL, -- e.g. 0.9420 (94.20%)
    fairness_index NUMERIC(5, 4) NOT NULL DEFAULT 1.0000,
    justification_summary TEXT NOT NULL,
    reasoning_payload JSONB,
    resolved_by_type VARCHAR(50) NOT NULL DEFAULT 'SYSTEM_AUTOMATION', -- or 'ADMIN_OVERRIDE'
    resolved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tamper-Evident Audit Trail Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
    performed_by VARCHAR(255) NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    previous_state JSONB,
    new_state JSONB,
    state_delta JSONB,
    previous_log_hash VARCHAR(64),
    cryptographic_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_disputes_current_status ON disputes(current_status);
CREATE INDEX IF NOT EXISTS idx_disputes_sla_deadline ON disputes(sla_deadline);
CREATE INDEX IF NOT EXISTS idx_disputes_cardholder_id ON disputes(cardholder_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_merchant ON transactions(user_id, merchant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_dispute_created ON audit_logs(dispute_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_case_files_dispute ON case_files(dispute_id);
