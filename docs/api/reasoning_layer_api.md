# ⚖️ VerdictAI — Transparent Reasoning Layer & Hallucination Guardrails API Documentation

**Author:** Darshan Prajapati (`202512026`) — Backend Engineer (Reasoning & APIs)  
**Deliverable Window:** Phase 1 (OpenAPI Contract), Phase 3 (Reasoning Layer & REST APIs), and Phase 5 (Reasoning Layer to Case API Integration, Security Headers & Rate Limiting)  
**Status as of 31 October 2026:** ✅ Completed, Integrated & Tested (461 / 461 Passing Tests, 100% Pass Rate)  
**Coverage:** SRS FR-19, FR-20, FR-27, SIR-07, AC-10, AC-13, NFR-02, NFR-08, NFR-13, NFR-14

---

## 1. Executive Summary

The **Transparent Reasoning Layer** bridges quantitative mathematical Fair-Weighing ML scoring with human-readable, auditable, and regulatory-compliant explanations. Designed to serve **Card Members** (Mobile App), **Merchants** (Web Console), and **Dispute-Ops Analysts / Financial Regulators** (Web Console), the engine produces dual-perspective plain-language rationales and enforces deterministic hallucination guardrails.

### Architecture Highlights:
1. **Hybrid Inference Engine:** Seamlessly switches between Google Gemini 2.0 Flash XAI (when `GEMINI_API_KEY` is present) and a calibrated, zero-hallucination **Deterministic Safe Fallback**.
2. **Deterministic Guardrails (`HallucinationGuardrail`):**
   - **PII Scrubbing:** Redacts 13–16 digit credit card PANs and phone numbers to `[REDACTED_CARD_NUMBER]` and `[REDACTED_PHONE]`.
   - **Settlement Commitment Enforcement:** Strictly rejects automated promises of immediate payouts or binding legal verdicts without human intervention (NFR-13).
   - **Internal Formula Secrecy:** Suppresses exposure of raw mathematical weight matrices or equations (FR-20).
   - **Monetary Consistency:** Verifies that currency figures cited match the contested dispute amount within acceptable tolerances.
   - **SRS AC-10 Factor Grounding:** Guarantees that at least three factual evidence-grounded factors are cited in every resolution.
3. **Phase 5 Case API Integration (Completed 31 Oct 2026):**
   - Direct reasoning endpoints embedded on `/api/v1/disputes/{id}/reasoning` and `/api/v1/disputes/{id}/reasoning/explanation`.
   - Direct human analyst override endpoint on `/api/v1/disputes/{id}/override` enforcing mandatory justification (>= 10 characters) and cryptographic audit chain logging.
4. **Production Hardening (Security Headers & Rate Limiting):**
   - OWASP production security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `Content-Security-Policy`, `Referrer-Policy`, `Permissions-Policy`).
   - Thread-safe sliding-window rate limiting with standard RFC headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`) and HTTP 429 status on abuse.

---

## 2. API Endpoints Specification

### Base URLs:
- Reasoning Gateway: `http://localhost:8000/api/v1/reasoning`
- Disputes Gateway: `http://localhost:8000/api/v1/disputes`

---

### Group A: Direct Reasoning Layer Endpoints (`/api/v1/reasoning`)

#### Endpoint 1: Engine Capabilities & Health
- **Route:** `GET /api/v1/reasoning/capabilities`
- **Description:** Returns the runtime operational capabilities, active model provider, and configured hallucination guardrail verification rules.
- **Response (200 OK):**
```json
{
  "service": "VerdictAI Transparent Reasoning & XAI Explanation Layer",
  "owner": "Darshan Prajapati (Backend Engineer - Reasoning & APIs)",
  "version": "1.0.0",
  "gemini_xai_available": false,
  "active_engine": "DETERMINISTIC_SAFE_FALLBACK",
  "guardrails_active": true,
  "enforced_rules": [
    "PII_SCRUBBING",
    "SETTLEMENT_COMMITMENT_CHECK",
    "ADVERSARIAL_BIAS_CHECK",
    "FORMULA_SECRECY_CHECK",
    "MONETARY_AMOUNT_CONSISTENCY",
    "AC10_FACTOR_GROUNDING"
  ],
  "srs_requirements_covered": [
    "FR-19 (Plain-Language Explanations)",
    "FR-20 (Transparent Resolution Justification)",
    "SIR-07 (Synchronous ML Inference Integration)",
    "AC-10 (At least 3 Contributing Factors Citing Verified Evidence)",
    "NFR-02 (Role-Neutral Impartial Explanations)",
    "NFR-13 (Zero Hallucinated Financial Commitments)",
    "NFR-14 (PII Scrubbing & Regulatory Transparency)"
  ],
  "timestamp": "2026-10-31T10:00:00Z"
}
```

#### Endpoint 2: Direct Reasoning Generation
- **Route:** `POST /api/v1/reasoning/generate`
- **Description:** Generates structured explainable rationales from arbitrary scoring metrics and evidence factor breakdowns.
- **Response (200 OK):** `ReasoningResponse`

#### Endpoint 3: Case-Linked Reasoning Generation & Persistence
- **Route:** `POST /api/v1/reasoning/case/{dispute_id}/generate`
- **Query Params:** `actor` (default: `SYSTEM:reasoning_api`)
- **Description:** Pulls case evidence and scoring from the unified database, generates policy-audited reasoning, persists it in the database and dispute resolution record, and logs a tamper-evident audit event.
- **Response (200 OK):** `ReasoningResponse`

#### Endpoint 4: Retrieve Stored Case Reasoning
- **Route:** `GET /api/v1/reasoning/case/{dispute_id}`
- **Description:** Retrieves persisted plain-language explanations, dual rationales, and factor lists for a previously resolved case.

#### Endpoint 5: Hallucination Guardrail Pre-Audit
- **Route:** `POST /api/v1/reasoning/audit-guardrails`
- **Description:** Utility endpoint for frontend applications (e.g. Admin override textarea or Merchant rebuttal submission) to pre-audit text against PII leakage, binding settlement commitments, or formula disclosure before saving.

---

### Group B: Integrated Case Reasoning & Override Endpoints (`/api/v1/disputes`)

#### Endpoint 6: On-Demand Dispute Case Reasoning Generation
- **Route:** `POST /api/v1/disputes/{dispute_id}/reasoning`
- **Query Params:** `actor` (default: `SYSTEM:reasoning_api`)
- **Description:** Generates or refreshes explainable transparent reasoning for a live dispute case. Links scoring evaluation factors directly into plain-language explanations for both parties and updates the audit chain.
- **Response (200 OK):** `ReasoningResponse`

#### Endpoint 7: Retrieve Dispute Case Reasoning
- **Route:** `GET /api/v1/disputes/{dispute_id}/reasoning`
- **Description:** Retrieves previously stored transparent reasoning, dual rationales, and contributing factors for an active or resolved dispute case.
- **Response (200 OK):** `ReasoningResponse`
- **Errors:**
  - `404 Not Found`: Dispute case not found, or reasoning has not been evaluated yet.

#### Endpoint 8: Dual-Perspective Plain-Language Explanations
- **Route:** `GET /api/v1/disputes/{dispute_id}/reasoning/explanation`
- **Description:** Dedicated endpoint returning consumer-facing empathetic explanations and merchant-facing evidence evaluations alongside at least 3 factual contributing factors.
- **Response (200 OK):**
```json
{
  "dispute_id": "DSP-1041",
  "summary": "The dispute for 'Item Not Received' has been resolved in favour of the Card Member with 88.5% confidence. Verified evidence supporting the claim was validated while required merchant confirmation was missing or contradictory.",
  "cardholder_explanation": "Your dispute regarding 'Item Not Received' was upheld. The evidence provided was verified, and the merchant did not provide sufficient rebuttal documentation to substantiate the contested charge.",
  "merchant_explanation": "The dispute for 'Item Not Received' was decided in the cardholder's favour. The submitted transaction files or lack of primary category documentation did not satisfy dispute validation requirements.",
  "contributing_factors": [
    "Cardholder Statement verified (favours: CARD_MEMBER, quality: 90%)",
    "Carrier Delivery Proof missing or unverified",
    "Transaction metadata and payment gateway authorization validated",
    "Cardholder dispute filing timeline and statement recorded"
  ],
  "confidence_score_pct": 88.5,
  "recommended_resolution": "CARD_MEMBER_FAVOUR",
  "guardrails_applied": true,
  "generator_source": "DETERMINISTIC_SAFE_FALLBACK",
  "generated_at": "2026-10-31T10:00:00Z"
}
```

#### Endpoint 9: Direct Dispute Decision Override
- **Route:** `POST /api/v1/disputes/{dispute_id}/override`
- **Description:** Executes a manual human analyst override directly on the dispute resource. Enforces mandatory justification (>= 10 characters) and records an immutable cryptographic audit log event.
- **Request Body (`AdminOverrideRequest`):**
```json
{
  "override_decision": "FAVOR_CARDHOLDER",
  "mandatory_reason": "Carrier GPS confirm parcel misdelivered to adjacent premise.",
  "admin_id": "adm_darshan_01",
  "admin_name": "Darshan Prajapati"
}
```
- **Response (200 OK):** Updated dispute resolution record.

---

## 3. Production Hardening: Security Headers & Rate Limiting

### OWASP Security Headers (Enforced by `SecurityHeadersMiddleware`):
- `X-Content-Type-Options: nosniff` — Prevents MIME-sniffing vulnerabilities.
- `X-Frame-Options: DENY` — Prevents clickjacking and unauthorized framing.
- `X-XSS-Protection: 1; mode=block` — Enables legacy browser XSS filters.
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` — Mandates HTTPS transport.
- `Content-Security-Policy: default-src 'self' ...` — Strict resource-loading boundaries supporting Swagger UI and client apps.
- `Referrer-Policy: strict-origin-when-cross-origin` — Protects referral leakage.
- `Permissions-Policy: geolocation=(), microphone=(), camera=()` — Disables unneeded hardware API access.

### Sliding-Window Rate Limiting (Enforced by `RateLimitMiddleware`):
- Tracks client requests within a 60-second sliding window based on `X-Forwarded-For` or client IP.
- Standard response headers on all compliant requests:
  - `X-RateLimit-Limit`: Maximum requests per window (default 120/min).
  - `X-RateLimit-Remaining`: Remaining request quota.
  - `X-RateLimit-Reset`: Epoch timestamp when current quota window resets.
- HTTP 429 Too Many Requests response on quota breach:
  - `Retry-After`: Seconds to wait before retrying.
  - Response body: `{"error_code": "RATE_LIMIT_EXCEEDED", "detail": "...", "retry_after_seconds": ...}`
- Automated health check (`/health`), docs (`/docs`, `/redoc`), and OpenAPI spec (`/openapi.json`) are permanently exempted.

---

## 4. Test Suite Summary

The API, reasoning, and security layers are covered by comprehensive automated tests in:
- `backend/tests/test_disputes_api.py` (Dispute Lifecycle, Reasoning Integration & Direct Override REST tests)
- `backend/tests/test_security_and_ratelimit.py` (OWASP Security Headers & Rate Limiting verification)
- `backend/tests/test_reasoning_api.py` (Direct Reasoning REST endpoints, XAI generation & Guardrails tests)
- `backend/tests/test_reasoning_guardrails.py` (Guardrail unit tests)
- `backend/tests/test_e2e_milestone3.py` (102 synthetic chargeback scenarios)
- Total test suite status: **461 / 461 tests passing (100%) in ~7.0 seconds**.
