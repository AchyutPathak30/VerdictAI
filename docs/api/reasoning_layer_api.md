# ⚖️ VerdictAI — Transparent Reasoning Layer & Hallucination Guardrails API Documentation

**Author:** Darshan Prajapati (`202512026`) — Backend Engineer (Reasoning & APIs)  
**Deliverable Window:** Phase 1 (OpenAPI Contract) & Phase 3 (Reasoning Layer & REST APIs)  
**Status as of 29 September 2026:** ✅ Completed & Tested (100% Passing Unit & Integration Tests)  
**Coverage:** SRS FR-19, FR-20, SIR-07, AC-10, NFR-02, NFR-13, NFR-14

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

---

## 2. API Endpoints Specification (`/api/v1/reasoning`)

### Base URL:
`http://localhost:8000/api/v1/reasoning`

---

### Endpoint 1: Engine Capabilities & Health
- **Route:** `GET /capabilities`
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
  "timestamp": "2026-09-29T18:00:00Z"
}
```

---

### Endpoint 2: Direct Reasoning Generation
- **Route:** `POST /generate`
- **Description:** Generates structured explainable rationales from arbitrary scoring metrics and evidence factor breakdowns.
- **Request Body (`ReasoningGenerateRequest`):**
```json
{
  "case_id": "CASE-2026-0001",
  "category_id": "CAT-01",
  "category_name": "Item Not Received",
  "recommended_resolution": "CARD_MEMBER_FAVOUR",
  "confidence_score": 88.5,
  "card_member_score": 85.0,
  "merchant_score": 20.0,
  "disputed_amount": 1500.0,
  "currency": "INR",
  "factor_breakdown": [
    {
      "evidence_type": "Cardholder Statement",
      "status": "Present",
      "quality_score": 0.9,
      "favours": "CARD_MEMBER"
    },
    {
      "evidence_type": "Carrier Delivery Proof",
      "status": "Missing",
      "quality_score": 0.0,
      "favours": "CARD_MEMBER"
    }
  ],
  "raw_statement": "Item never arrived at delivery address."
}
```
- **Response (200 OK):**
```json
{
  "summary": "The dispute for 'Item Not Received' has been resolved in favour of the Card Member with 88.5% confidence. Verified evidence supporting the claim was validated while required merchant confirmation was missing or contradictory.",
  "cardholder_rationale": "Your dispute regarding 'Item Not Received' was upheld. The evidence provided was verified, and the merchant did not provide sufficient rebuttal documentation to substantiate the contested charge.",
  "merchant_rationale": "The dispute for 'Item Not Received' was decided in the cardholder's favour. The submitted transaction files or lack of primary category documentation did not satisfy dispute validation requirements.",
  "contributing_factors": [
    "Cardholder Statement verified (favours: CARD_MEMBER, quality: 90%)",
    "Carrier Delivery Proof missing or unverified",
    "Transaction metadata and payment gateway authorization validated",
    "Cardholder dispute filing timeline and statement recorded"
  ],
  "generator_source": "DETERMINISTIC_SAFE_FALLBACK",
  "guardrails_applied": true,
  "guardrail_violations": [],
  "confidence_score_pct": 88.5,
  "recommended_resolution": "CARD_MEMBER_FAVOUR",
  "case_id": "CASE-2026-0001",
  "generated_at": "2026-09-29T18:00:00Z"
}
```

---

### Endpoint 3: Case-Linked Reasoning Generation & Persistence
- **Route:** `POST /case/{dispute_id}/generate`
- **Query Params:** `actor` (default: `SYSTEM:reasoning_api`)
- **Description:** Pulls case evidence and scoring from the unified database, generates policy-audited reasoning, persists it in the database and dispute resolution record, and logs a tamper-evident audit event.
- **Response (200 OK):** `ReasoningResponse`

---

### Endpoint 4: Retrieve Stored Case Reasoning
- **Route:** `GET /case/{dispute_id}`
- **Description:** Retrieves persisted plain-language explanations, dual rationales, and factor lists for a previously resolved case.
- **Response (200 OK):** `ReasoningResponse`
- **Errors:**
  - `404 Not Found`: Dispute case not found, or reasoning has not been generated yet.

---

### Endpoint 5: Hallucination Guardrail Pre-Audit
- **Route:** `POST /audit-guardrails`
- **Description:** Utility endpoint for frontend applications (e.g. Admin override textarea or Merchant rebuttal submission) to pre-audit text against PII leakage, binding settlement commitments, or formula disclosure before saving.
- **Request Body (`GuardrailAuditRequest`):**
```json
{
  "text": "Cardholder with card 4111 2222 3333 4444 called from 9876543210 regarding the order.",
  "expected_amount": 1500.0,
  "currency": "INR"
}
```
- **Response (200 OK):**
```json
{
  "passed": true,
  "violations": [],
  "sanitized_text": "Cardholder with card [REDACTED_CARD_NUMBER] called from [REDACTED_PHONE] regarding the order.",
  "checked_rules": [
    "PII_SCRUBBING",
    "SETTLEMENT_COMMITMENT_CHECK",
    "ADVERSARIAL_BIAS_CHECK",
    "FORMULA_SECRECY_CHECK",
    "MONETARY_AMOUNT_CONSISTENCY"
  ],
  "audited_at": "2026-09-29T18:00:00Z"
}
```

---

## 3. Client Integration Guide

### For Rohit Peswani (Web Console — Admin / Merchant):
1. **Case Detail Screen:**
   - Call `GET /api/v1/reasoning/case/{dispute_id}` to retrieve:
     - `summary`: Displays in the AI Resolution Intelligence panel card.
     - `contributing_factors`: Renders into the 4 primary reasoning factor progress bars.
     - `merchant_rationale`: Shows in the Merchant View tab.
2. **Admin Override Screen:**
   - In `AdminOverrideScreen.tsx`, as the analyst types their mandatory decision reasoning into the character-counted textarea, call `POST /api/v1/reasoning/audit-guardrails` on blur or before submit to ensure compliance with PII and regulatory policies.

### For Mayank Jayswal (Card Member Mobile App):
1. **Dispute Detail / Resolution Screen:**
   - Call `GET /api/v1/reasoning/case/{dispute_id}`.
   - Display `cardholder_rationale` prominently on the user-friendly resolution screen.
   - Show `contributing_factors` as chips or bullet points explaining why the dispute was upheld or denied.

---

## 4. Test Suite Summary

The API and reasoning layers are covered by comprehensive automated tests in:
- `backend/tests/test_disputes_api.py` (Phase 2 Case-Creation & Dispute Lifecycle REST tests)
- `backend/tests/test_reasoning_api.py` (Phase 3 Reasoning REST endpoints, XAI generation & Guardrails tests)
- `backend/tests/test_reasoning_guardrails.py` (Guardrail unit tests)
- `backend/tests/test_e2e_milestone3.py` (102 synthetic chargeback scenarios)
- Total test suite status: **337 / 337 tests passing (100%) in ~3.2 seconds**.
