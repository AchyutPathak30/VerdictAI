# Bi-Weekly Project Status Report #4
**IT644 – Application Development Group Project**

* **Project Name:** Frictionless Dispute & Chargeback Resolution
* **Report Period:** 15 Sep 2026 – 28 Sep 2026 (Cycle 4 / Weeks 7–8)
* **Prepared By:** Nirav Kachhiya (Project Lead) & Akshay Purohit (ML Engineer)
* **Date Submitted:** 30/09/2026
* **GitHub Repository:** `https://github.com/AchyutPathak30/VerdictAI`

---

## 1. Project Status Summary

| Item | Details |
| :--- | :--- |
| **Sprint / Milestone** | Phase 3 (Fair-Weighing & Transparent Reasoning) Completed → Milestone 3 Sign-off; Phase 4/5 Active |
| **% Complete (overall)** | **75%** |

### Project Health Indicators

| Indicator | Current | Previous | Trend | Status |
| :--- | :--- | :--- | :---: | :--- |
| **Overall Project** | 75% | 55% | ↑ | **On Track** |
| **Schedule** | 95% (P3 Done, P4 Active) | 95% (P2 Done, P3 Active) | → | **On Track** |
| **Scope** | 100% (P3 & P4 Scope) | 100% (P2 & P3 Scope) | → | **On Track** |
| **Quality** | 100% Tests Pass (316+ tests) | 100% Tests Pass (182 tests) | ↑ | **On Track** |
| **Team Contribution** | 100% | 100% | → | **On Track** |
| **Dependencies** | 98% | 98% | → | **On Track** |

### Summary Notes:
Over the past two weeks (Weeks 7–8 / Cycle 4), the team achieved full Milestone 3 sign-off, concluding all core deliverables for Phase 3 (Fair-Weighing & Transparent Reasoning Engine) while pulling forward major Phase 4 and Phase 5 integration deliverables. All 102 synthetic chargeback scenarios now execute through the end-to-end REST API with 100% pass rates across all 12 test suites (316+ automated tests).

A key breakthrough of this cycle was the delivery of the **Transparent Reasoning Engine & LLM Hallucination Guardrails** by Akshay Purohit, which bridges mathematical scoring into auditable, natural-language explanations powered by Google Gemini 2.0 Flash with a deterministic fallback. Concurrently, Akshay resolved the critical **FR-17 routing gap** by recalibrating the missing-primary-evidence penalty from -15 to -20 points, ensuring statement-only disputes (CAT-02 and CAT-05) reliably route to the Dispute-Ops Manual Review Queue (confidence drops to 46.1%, strictly below the 50.0% threshold). In addition, an industry-grade **Algorithmic Fairness Audit Engine** was completed, confirming 100% compliance with the US EEOC 4/5ths Rule (DIR ≥ 0.80) and zero disparate treatment across cardholder tiers.

---

## 2. Key Accomplishments in Two Weeks

* **Transparent Reasoning Engine Implementation (Akshay Purohit & Darshan Prajapati):** Architected and deployed `TransparentReasoningEngine` (`backend/app/services/reasoning_layer/engine.py`) providing dual-perspective explainable AI (XAI) for Card Members and Merchants. Generates objective 2-3 sentence summaries grounded in verified evidence factors using Google Gemini 2.0 Flash, with an instantaneous deterministic safe fallback.
* **Deterministic LLM Hallucination Guardrails (Akshay Purohit):** Engineered `HallucinationGuardrail` (`backend/app/services/reasoning_layer/guardrails.py`) enforcing strict financial policy boundaries: PII sanitization (redacting 16-digit card and 10-digit phone numbers), prohibition of unauthorized settlement guarantees (e.g. 'promise full refund in 2 hours'), blocking derogatory/accusatory language, masking internal mathematical formulas, and validating monetary amount consistency against case headers.
* **Resolution of FR-17 / AC-09 Auto-Escalation Defect (Akshay Purohit):** Calibrated missing-primary-evidence penalty from -15.0 to -20.0 points in `fair_weighing_model.py`. Directly resolves the defect identified in Milestone 3 testing where CAT-02 (Defective Product) and CAT-05 (Cancelled Subscription) statement-only disputes incorrectly reached 51.1% confidence. The recalibrated model yields 46.1% confidence, forcing correct automatic routing to `MANUAL_REVIEW_QUEUE`.
* **Algorithmic Fairness & Bias Audit Engine (Akshay Purohit):** Delivered production-grade statistical fairness auditor (`akshay_ml_fairweighing/phase4_fairness_audit/`) evaluating Disparate Impact Ratio (DIR ≥ 0.80 / EEOC 4/5ths Rule), Statistical Parity Difference (|SPD| ≤ 0.10), Equal Opportunity Difference (|EOD| ≤ 0.05), and Counterfactual Fairness Invariance (100% invariance when customer account tier is mutated on identical evidence).
* **Model Diagnostics, Evidence Attribution & Calibration (Akshay Purohit):** Constructed Shapley-style evidence attribution waterfall and Expected Calibration Error (ECE) diagnostic toolkit (`akshay_ml_fairweighing/phase5_diagnostics/`), quantifying exact point contributions per evidence artifact (EV-01 to EV-10) and verifying Brier Score < 0.05.
* **Milestone 3 End-to-End System Integration Suite (Hardik Kansara):** Authored `test_e2e_milestone3.py` validating all 102 synthetic chargeback scenarios end-to-end through public REST APIs: dispute creation → evidence attachment (parsers) → synchronous scoring → lifecycle routing → XAI reasoning → Merkle audit trail.
* **Transparent Reasoning REST Endpoints & Schemas (Darshan Prajapati):** Exposed `POST /api/v1/reasoning/explain`, `POST /api/v1/reasoning/audit-guardrails`, and `GET /api/v1/reasoning/capabilities` with Pydantic request/response validation schemas and 12 passing API tests in `test_reasoning_api.py`.
* **React Web Console & Wireframes (Rohit Peswani):** Merged PR #6 delivering full React web application scaffold (`frontend/web/`), Visily wireframe exports, admin triage queue, and dispute detail views with responsive layout shell.
* **React Native Card Member Mobile App Scaffold (Mayank Jayswal):** Merged PR #4 delivering 32 TypeScript source files in `mobile-app/` with tab navigation (Disputes, New Claim, Evidence, Notifications) and multi-part evidence attachment forms.
* **Test Suite Expansion to 316+ Tests:** Total passing tests expanded from 182 to 316+ across all 12 test suites with 100% pass rate in ~7 seconds.

---

## 3. Planned vs. Actual

| Task / Deliverable | Planned Completion | Current Forecast | Actual Status | Notes |
| :--- | :--- | :--- | :---: | :--- |
| **Transparent reasoning layer design** | Sep 22 | Sep 22 | **Done** | Darshan & Akshay: prompt templates & schemas |
| **Transparent Reasoning Engine build** | Sep 22 | Sep 25 | **Done** | Gemini 2.0 Flash XAI + deterministic fallback |
| **LLM Hallucination Guardrails** | Sep 25 | Sep 25 | **Done** | PII redaction, formula secrecy, policy checks |
| **FR-17 Routing Defect Resolution** | Sep 28 | Sep 27 | **Done** | Penalty calibrated to -20pts; confidence 46.1% |
| **Algorithmic Fairness Audit Engine** | Sep 28 | Sep 26 | **Done** | EEOC 4/5ths Rule & DIR ≥ 0.80 verified |
| **Milestone 3 E2E Test Suite (102 cases)** | Sep 28 | Sep 28 | **Done** | 100% passing across 102 dispute scenarios |
| **Reasoning REST API Gateways (3 routers)** | Sep 28 | Sep 26 | **Done** | `POST /explain`, `POST /audit-guardrails` |
| **Web Console Scaffold & Routing** | Sep 21 | Sep 16 | **Done** | PR #6 merged (Rohit: React web scaffold) |
| **Card Member Mobile Scaffold** | Oct 05 | Sep 09 | **Done** | PR #4 merged (Mayank: 32 TypeScript files) |
| **Client API Wiring (Phase 4)** | Oct 19 | Oct 01 | **In Progress** | Connecting React web & mobile to FastAPI |
| **Docker Compose & CI hardening** | Oct 11 | Oct 11 | **In Progress** | Hardik: multi-stage Docker & GitHub Actions |

---

## 4. Project Risks, Issues, Decisions & Scope Changes

### Risks, Issues & Dependencies
* **Risk (R-01) [Resolved]:** FR-17 Defect: Low-evidence disputes bypassing manual review. *Mitigation:* Calibrated penalty to -20pts; confidence drops to 46.1%.
* **Dependency (D-01) [Resolved]:** Gemini API token limits & network latency for XAI. *Mitigation:* Sub-30s SLA met via deterministic safe fallback.
* **Risk (R-02) [Resolved]:** LLM Hallucinations on binding legal / settlement terms. *Mitigation:* Regex assertion guardrails & PII redaction layer strictly enforced.
* **Risk (R-03) [On Track]:** Multi-client synchronization. *Mitigation:* REST polling implemented; WebSocket integration planned for Phase 4.
* **Issue (I-01) [Resolved]:** Asynchronous socket pair hang during sandboxed test runs. *Mitigation:* Identified AnyIO loopback socket requirement on Windows.

### Project Decisions
1. **Missing-Primary Penalty Calibration (-20pts):** Guarantees that disputes lacking primary evidence cannot exceed 50% confidence. Resolves FR-17 defect across CAT-02 and CAT-05.
2. **Deterministic Rule Guardrails before LLM Output Release:** Prevents hallucinated legal commitments, formula leaks, and PII leakage. Satisfies ISO/IEC 24027.
3. **Dual-Perspective XAI Output Architecture:** Provides customized rationales for Cardholder vs. Merchant viewpoints.
4. **FastAPI Lifespan Startup Seeding:** Pre-populates demonstration dispute cases on container startup for instant web & mobile testing.

### Project Scope Changes
* **Phase 3 Scope Baseline:** Officially Closed & Signed Off. Milestone 3 deliverables are 100% merged on `main`.
* **Fairness Audit & Model Diagnostics Pulled Forward:** Algorithmic bias audit and calibration diagnostics originally scheduled for Phase 6 were completed during Cycle 4 (+30 days buffer for final presentation).

---

## 5. Upcoming Work (Next Two Weeks’ Plan – Cycle 5 / Weeks 9–10)

* **Phase 4 Client Application Integration:** Connect React Web Console and React Native Mobile App to live REST API endpoints (Rohit & Mayank).
* **Dynamic Role-Based Access Control (RBAC):** Implement JWT persona tokens for Card Member, Merchant, and Dispute-Ops Admin (Darshan & Nirav).
* **Real Evidence Attachment & Upload Ingestion:** Implement multi-part binary file uploads (PDF/PNG/TXT) with SHA-256 integrity digests (Achyut & Darshan).
* **Full Containerization with Docker Compose:** Build production-ready Docker containers for FastAPI backend and Vite web console (Hardik).
* **Continuous Fairness Monitoring:** Embed automated fairness audit checks into GitHub Actions CI pipeline (Akshay & Hardik).

---

## 6. Team Member Contributions

### Name: Akshay Purohit (202512033)
* **Role:** ML Engineer – Fair-Weighing Model & Transparent Reasoning
* **Tasks Completed:** Built and integrated `TransparentReasoningEngine` (`engine.py`) with Google Gemini 2.0 Flash XAI and deterministic safe fallback; developed `HallucinationGuardrail` (`guardrails.py`) enforcing PII redaction, settlement protection, and formula secrecy; resolved FR-17 defect by recalibrating missing-primary penalty from -15 to -20 points; authored `test_reasoning_guardrails.py` (10/10 tests passing); built production-grade `FairnessAuditEngine` (verifying EEOC 4/5ths Rule DIR ≥ 0.80 and 100% counterfactual invariance); developed `ModelDiagnosticsEngine` with Shapley-style evidence attribution and calibration evaluation; authored unit test suites (`test_ml_fairness_audit.py`, `test_ml_diagnostics.py`); merged PR #8 (commit `d0bf6cd` / `164da7f`).
* **Tasks In Progress:** Continuous fairness monitoring in CI and production calibration tuning.
* **Contribution Type:** ML Engineering / Algorithm Design / Safety & Guardrails / Testing / Documentation
* **Hours / Capacity:** 54 / 70 hrs logged this cycle (Cumulative: 190 / 205 hrs).
* **Evidence:** Git commits `d0bf6cd`, `164da7f`; `backend/app/services/reasoning_layer/`; `akshay_ml_fairweighing/phase4_fairness_audit/`; `akshay_ml_fairweighing/phase5_diagnostics/`; 41 passing ML & reasoning tests.

### Name: Nirav Kachhiya (202512011)
* **Role:** Project Lead / Backend Engineer
* **Tasks Completed:** Integrated Transparent Reasoning Engine with CaseService; implemented Merkle audit trail inclusion proofs; reviewed and merged PR #6, #7, and #8; coordinated Milestone 3 sign-off; authored system architecture and database design updates.
* **Hours / Capacity:** 50 / 70 hrs logged this cycle (Cumulative: 196 / 210 hrs).
* **Evidence:** Git commits `164da7f`, `3d2d3eb`; `system_architecture.md`; `database_design.md`.

### Name: Darshan Prajapati (202512026)
* **Role:** Backend Engineer – Reasoning & APIs
* **Tasks Completed:** Implemented Phase 3 reasoning layer REST API endpoints (`/api/v1/reasoning/explain`, `/audit-guardrails`, `/capabilities`); authored 12 passing unit & integration tests in `test_reasoning_api.py`; prepared PR #9 (commit `968a234` / `3d2d3eb`).
* **Hours / Capacity:** 46 / 70 hrs logged this cycle (Cumulative: 160 / 200 hrs).
* **Evidence:** `backend/app/api/v1/reasoning.py`; `backend/tests/test_reasoning_api.py`.

### Name: Achyut Pathak (202512039)
* **Role:** AI/NLP Engineer – Evidence Parsing
* **Tasks Completed:** Built evidence highlight summarizer feeding structured evidence extracts to reasoning layer; integrated parser dispatcher into dispute upload pipeline; prepared PR #11.
* **Hours / Capacity:** 42 / 70 hrs logged this cycle (Cumulative: 154 / 208 hrs).
* **Evidence:** `backend/app/services/parsers/`; `test_evidence_summarizer.py`.

### Name: Rohit Peswani (202512115)
* **Role:** Frontend Engineer – Web (Admin/Merchant)
* **Tasks Completed:** Completed React web console scaffold with Vite and TailwindCSS (PR #6); implemented dispute queue table, evidence preview modal, and review dashboard; began connecting REST API endpoints with toast notifications (PR #10).
* **Hours / Capacity:** 48 / 70 hrs logged this cycle (Cumulative: 136 / 204 hrs).
* **Evidence:** `web-app/` codebase; Git commit `922ff0b`, `beebc6e`.

### Name: Mayank Jayswal (202512093)
* **Role:** Mobile Engineer – Card Member App
* **Tasks Completed:** Completed React Native Expo mobile application scaffolding (PR #4, 32 TypeScript source files); built bottom tab navigation, dispute submission flows, and evidence capture screens; initiated Phase 4 API integration.
* **Hours / Capacity:** 46 / 70 hrs logged this cycle (Cumulative: 144 / 200 hrs).
* **Evidence:** `mobile-app/` codebase; Git commit `b0b4afd`.

### Name: Hardik Kansara (202512036)
* **Role:** Cloud/DevOps & QA Engineer
* **Tasks Completed:** Developed Milestone 3 End-to-End automated test harness (`test_e2e_milestone3.py`) covering 102 synthetic chargeback scenarios; filed and verified closure of FR-17 defect; configured CI/CD build workflows; authored test harness documentation.
* **Hours / Capacity:** 50 / 70 hrs logged this cycle (Cumulative: 154 / 203 hrs).
* **Evidence:** `backend/tests/test_e2e_milestone3.py`; `backend/tests/README.md`; Git commit `0ef9303`, `f1e2276`.

