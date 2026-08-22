# Dual-Database Schema & Storage Architecture
## VerdictAI: Frictionless Dispute & Chargeback Resolution
**Author / Module Lead:** Nirav Kachhiya (Project Lead / Backend Engineer)  
**Document Version:** 1.0 (Phase 1 Deliverable)  
**Status:** Signed Off

---

## 1. Design Rationale for Dual-Database Architecture

A chargeback resolution platform encounters two fundamentally divergent data requirements:
1. **Transactional, High-Integrity State (PostgreSQL):** Financial transaction linkages, dispute state transitions, user roles, authentication, strict foreign key constraints, SLA deadlines, and audit trails.
2. **Polymorphic, Unstructured Evidence (MongoDB):** Raw receipt OCR tokens, PDF attachments, courier delivery GPS tracking payloads, email/chat transcripts, and arbitrary metadata.

---

## 2. PostgreSQL Relational Entity-Relationship Model

```mermaid
erDiagram
    USERS ||--o{ TRANSACTIONS : initiates
    USERS ||--o{ DISPUTES : creates
    MERCHANTS ||--o{ TRANSACTIONS : receives
    TRANSACTIONS ||--o| DISPUTES : subject_of
    DISPUTES ||--|| CASE_FILES : compiles_to
    DISPUTES ||--o{ AUDIT_LOGS : generates
    DISPUTES ||--o| RESOLUTIONS : resolves_with

    USERS {
        uuid id PK
        string email UK
        string full_name
        string role "CARDHOLDER | MERCHANT | ADMIN | ANALYST"
        timestamp created_at
    }

    MERCHANTS {
        uuid id PK
        string merchant_name
        string merchant_category_code
        string contact_email
        decimal risk_score
    }

    TRANSACTIONS {
        uuid id PK
        uuid user_id FK
        uuid merchant_id FK
        decimal amount
        string currency
        string payment_method
        string original_auth_code
        timestamp transaction_timestamp
        string status
    }

    DISPUTES {
        uuid id PK
        uuid transaction_id FK
        uuid cardholder_id FK
        string dispute_reason_code
        decimal disputed_amount
        string current_status
        int merchant_sla_hours
        timestamp sla_deadline
        timestamp created_at
        timestamp updated_at
    }

    CASE_FILES {
        uuid id PK
        uuid dispute_id FK
        string mongo_case_doc_id
        string case_hash_sha256
        int total_evidence_count
        boolean is_sealed
        timestamp sealed_at
    }

    AUDIT_LOGS {
        uuid id PK
        uuid dispute_id FK
        string performed_by
        string action_type
        jsonb previous_state
        jsonb new_state
        string cryptographic_hash
        timestamp created_at
    }

    RESOLUTIONS {
        uuid id PK
        uuid dispute_id FK
        string resolution_outcome "FAVOR_CARDHOLDER | FAVOR_MERCHANT | SPLIT"
        decimal confidence_score
        string justification_summary
        uuid resolved_by_user_id FK
        timestamp resolved_at
    }
```
