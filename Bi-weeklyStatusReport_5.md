# Bi-Weekly Project Status Report #5
**IT644 – Application Development Group Project**

* **Project Name:** Frictionless Dispute & Chargeback Resolution (VerdictAI)
* **Report Period:** 29 Sep 2026 – 12 Oct 2026 (Cycle 5 / Weeks 9–10)
* **Prepared By:** Nirav Kachhiya (Project Lead) & Akshay Purohit (ML Engineer)
* **Date Submitted:** 16/10/2026
* **GitHub Repository:** `https://github.com/AchyutPathak30/VerdictAI`

---

## 1. Project Status Summary

| Item | Details |
| :--- | :--- |
| **Sprint / Milestone** | Phase 4 (Client Interfaces & End-to-End Live API Integration) Completed → Milestone 4 Sign-off; Phase 5 (Production Hardening & Deployment) Active |
| **% Complete (overall)** | **90%** |

### Project Health Indicators

| Indicator | Current | Previous | Trend | Status |
| :--- | :--- | :--- | :---: | :--- |
| **Overall Project** | 90% | 75% | ↑ | **On Track** |
| **Schedule** | 98% (P4 Done, P5 Active) | 96% (P3 Done, P4 Active) | ↑ | **On Track** |
| **Scope** | 100% (P4 & P5 Scope) | 100% (P3 & P4 Scope) | → | **On Track** |
| **Quality** | 100% Tests Pass (333+ tests) | 100% Tests Pass (306 tests) | ↑ | **On Track** |
| **Team Contribution** | 100% | 100% | → | **On Track** |
| **Dependencies** | 100% | 99% | ↑ | **On Track** |

### Summary Notes:
During Cycle 5 (Weeks 9–10), the team achieved formal completion and sign-off for **Phase 4 (Client Interfaces & End-to-End Live API Integration)**, bringing cumulative project completion to **90%**. Both client applications (React Web Console and React Native Mobile Client) have been wired directly into live FastAPI REST gateways, backed by automated fallback handlers and explainable AI reasoning services.

Key milestones delivered in this reporting cycle include:
* **Transparent Reasoning Engine & LLM Guardrails (Akshay Purohit – PR #8 Merged):** Implemented the explainable AI reasoning layer in `backend/app/services/reasoning_layer/engine.py` alongside deterministic regex guardrails in `guardrails.py` to prevent LLM hallucinations and enforce regulatory compliance.
* **Reasoning Layer REST API Endpoints & Router Tests (Darshan Prajapati – PR #9 Merged):** Deployed public endpoints for on-demand dispute reasoning generation (`POST /disputes/{id}/reasoning`), dual-perspective plain-language explanations (`GET /disputes/{id}/reasoning/explanation`), and manual analyst overrides (`POST /disputes/{id}/override`). Authored 21 dedicated router tests in `test_disputes_api.py` and `test_reasoning_api.py`.
* **React Web Console Live REST Integration (Rohit Peswani – PR #10 Merged):** Connected all 6 operational views (Admin Dashboard, Case Queue, Case Detail, Admin Override, Merchant Portal, Reports & Analytics) to live backend gateways through a universal API client (`web-app/src/services/api.ts`) featuring a 4-second timeout controller, graceful offline fallback, and an interactive toast notification system (`Toast.tsx`).
* **Production Frontend Type-Safety Verification:** Resolved all TypeScript strict-typing discrepancies across mock data aliases and component interfaces; validated that `npm run build` (`tsc && vite build`) compiles cleanly (1,587 modules transformed with zero errors).
* **Test Suite Expansion to 333+ Tests (100% Pass Rate):** Pytest coverage expanded from 306 to 333+ automated unit, integration, and E2E tests, executing in under 2.90 seconds with zero warnings or regressions.
* **Card Member Mobile App Verification (Mayank Jayswal):** Verified multi-step cardholder dispute submission, native camera/photo document pickers, and live lifecycle status polling on React Native Expo.
* **Phase 5 Containerization Inception (Hardik Kansara & Nirav Kachhiya):** Initiated multi-container orchestration blueprints (`Dockerfile`, `docker-compose.yml`) to containerize FastAPI, PostgreSQL, MongoDB, and the React web application for cloud staging.

---

## 2. Key Accomplishments in Two Weeks

* **Transparent Reasoning Engine & Guardrails Merged (PR #8 Merged):** Delivered the production reasoning layer (`engine.py`) and deterministic guardrails (`guardrails.py`), generating dual-perspective explanations (empathetic consumer views and structured, audit-ready merchant views) while strictly adhering to Pydantic schemas.
* **Reasoning REST Endpoints & OpenAPI 3.0 Documentation (PR #9 Merged):** Exposed REST gateways for automated rationale generation, dual-perspective explanation queries, and human analyst overrides. Published the updated OpenAPI specification (`openapi.json`) and developer guide (`reasoning_layer_api.md`).
* **Live Web Console Integration & Toast Notification System (PR #10 Merged):** Integrated the 6 React web console views to the FastAPI backend via `api.ts`. Implemented an asynchronous toast notification system (`Toast.tsx`) providing real-time feedback on document uploads, manual overrides, and AI scoring runs.
* **Strict TypeScript Build Gate Passed:** Successfully built the complete production web console bundle using Vite and TypeScript (`tsc && vite build`), transforming 1,587 modules into optimized assets with zero type errors.
* **Backend Test Suite Expanded to 333+ Tests (100% Pass Rate):** Added 21 new tests covering dispute API edge cases and reasoning guardrails.
* **Mobile Application End-to-End Validation:** Verified the React Native Expo cardholder app with live API multipart uploads, receipt camera captures, and dynamic status tracking.
* **Parser Ingestion Robustness Verification:** Confirmed that courier tracking, receipt OCR, and banking feed parsers handle edge-case payloads across all 102 synthetic dispute scenarios without exceptions.
* **Cryptographic Merkle Audit Engine Operational:** Verified that state transitions, evidence submissions, reasoning logs, and analyst overrides are hashed using SHA-256 into tamper-evident Merkle tree roots.
* **High-Concurrency ML Load Benchmark & Sub-50ms SLA Verification (Akshay Purohit):** Engineered `ScoringLoadBenchmark` executing 500+ concurrent dispute evaluations across 10-20 worker threads, verifying P95 latency < 15ms (well within the sub-50ms SLA) and enterprise throughput > 1,500 disputes/sec.
* **High-Throughput Scoring Optimization & LRU Evidence Caching (Akshay Purohit):** Built `OptimizedFairWeighingService` with canonical SHA-256 evidence fingerprint LRU caching, delivering sub-millisecond (0.1ms) evaluations for recurring dispute profiles.
* **Continuous Model Drift & NFR-14 Monitor (Akshay Purohit):** Constructed `ModelDriftMonitor` calculating Population Stability Index (PSI) and monitoring False Positive Rate (FPR < 5.0% per NFR-14) across operational batches.

---

## 3. Planned vs. Actual

| Task / Deliverable | Planned Completion | Current Forecast | Actual Status | Notes |
| :--- | :--- | :--- | :---: | :--- |
| **Web console live API integration** | Oct 05 | Oct 10 | **Done** | PR #10 merged; live FastAPI client & toasts |
| **Mobile app live API integration** | Oct 05 | Oct 08 | **Done** | Expo screens connected to dispute endpoints |
| **Dynamic reasoning engine & guardrails** | Oct 10 | Oct 06 | **Done** | PR #8 merged; dual-perspective XAI rationales |
| **Dedicated API router unit tests** | Oct 12 | Oct 06 | **Done** | PR #9 merged; 21 new router tests in suite |
| **Milestone 4 Client Interface Sign-off** | Oct 19 | Oct 12 | **Done** | Signed off 7 days ahead of schedule |
| **Multi-container Docker environment** | Oct 14 | Oct 20 | **In Progress** | Compose configuration for FastAPI, DBs, Web |
| **End-to-End System & ML Load Benchmark** | Oct 24 | Oct 24 | **Done** | Akshay: 500-dispute load benchmark (<50ms latency) |
| **Milestone 5 Production Release** | Oct 28 | Oct 28 | **On Track** | Final presentation, documentation, & demo |

---

## 4. Project Risks, Issues, & Decisions

### Risks, Issues & Dependencies
* **Dependency (D-01) [Resolved]:** LLM API rate limits & network latency for reasoning. *Mitigation:* Deterministic fallback schemas and local caching ensure sub-second response times. (Owner: Akshay P.)
* **Risk (R-01) [Resolved]:** Multi-client network failure during evidence upload. *Mitigation:* 4-second `AbortController` timeout and offline mock fallback implemented in `api.ts`. (Owner: Rohit P. / Mayank J.)
* **Risk (R-02) [Resolved]:** Strict TypeScript compilation discrepancies. *Mitigation:* Normalized component prop interfaces and mock data exports; 1,587 modules build with 0 errors. (Owner: Rohit P. / Nirav K.)
* **Risk (R-03) [Resolved]:** Concurrent dispute state mutations. *Mitigation:* State machine transition guards and PostgreSQL row-level locks prevent race conditions. (Owner: Nirav K.)
* **Risk (R-04) [On Track]:** Multi-container staging environment orchestration. *Mitigation:* Docker Compose services drafted with healthchecks for PostgreSQL and MongoDB. (Owner: Hardik K.)

### Project Decisions
1. **Universal Fetch Adapter with Offline Fallback:** Prevents UI crashes when backend services are offline during demonstrations and testing. (Decided by Rohit P. & Nirav K., Oct 08)
2. **Dual-Perspective Reasoning Rationale Routing:** Cardholders receive plain-language empathetic summaries; merchants receive structured technical evidence citations. Strictly satisfies FR-19 & FR-20. (Decided by Akshay P. & Darshan P., Oct 04)
3. **Mandatory Audit Log for Analyst Overrides:** Every override records analyst ID, justification rationale, and updates the SHA-256 Merkle root. (Decided by Nirav K. & Darshan P., Oct 05)
4. **Deterministic Guardrail Regex Enforcers:** Enforces zero hallucinations, PII masking, and schema conformity before releasing XAI rationales. (Decided by Akshay P., Oct 06)
5. **Canonical SHA-256 LRU Evidence Digest Caching:** Caches scored evidence patterns to provide sub-millisecond evaluations under peak load. (Decided by Akshay P., Oct 12)

---

## 5. Upcoming Work (Next Two Weeks’ Plan – Cycle 6 / Weeks 11–12 / Phase 5 Focus)

* **Multi-Container Docker Orchestration:** Finalize and test production `docker-compose.yml` orchestrating FastAPI, PostgreSQL, MongoDB, and the built React web application (Hardik Kansara & Nirav Kachhiya, due Oct 20).
* **Cloud Staging Deployment:** Deploy the multi-container stack to cloud hosting (Render / Railway) with live domain routing and SSL termination (Hardik Kansara, due Oct 22).
* **End-to-End System Benchmark & Load Testing:** Conduct concurrent load tests simulating 500+ simultaneous dispute evaluations, verifying sub-50ms scoring latency (Akshay Purohit & Hardik Kansara, due Oct 24).
* **Final Presentation Slide Deck & Oral Rehearsal:** Finalize slide deck, architecture diagrams, and live system demonstration script for course evaluation (Nirav Kachhiya & Team, due Oct 26).
* **Final System Documentation & Delivery Package:** Compile final System Architecture Document, User Manuals, and Code Audit Dossier for Milestone 5 final sign-off (Team, due Oct 28).

---

## 6. Team Member Contributions

### Name: Akshay Purohit (202512033)
* **Role:** ML Engineer – Fair-Weighing Model & High-Throughput Optimization
* **Tasks Completed:**
  1. Delivered the Transparent Reasoning Engine in `engine.py` (PR #8); implemented deterministic LLM guardrails in `guardrails.py` enforcing regex compliance and confidence bounds; authored `test_reasoning_guardrails.py` (10/10 passing).
  2. Conducted concurrent scoring load testing and throughput benchmarking (`scoring_load_benchmark.py`), executing 500+ simultaneous dispute evaluations across 10-20 worker threads, verifying sub-50ms P95 latency (achieved P95 = 0.58ms, throughput > 1,500 disputes/sec).
  3. Engineered `OptimizedFairWeighingService` with canonical SHA-256 evidence fingerprint LRU caching, reducing repeat evaluation latency to < 0.1ms.
  4. Implemented `ModelDriftMonitor` tracking Population Stability Index (PSI) and statutory False Positive Rate (FPR < 5.0% per NFR-14).
  5. Authored comprehensive test suite `test_ml_load_and_optimization.py` (5/5 passing); verified entire ML test suite of 46 automated tests with 100% pass rate.
* **Tasks In Progress:** Supporting final system integration benchmarks and preparing model deployment packaging for cloud staging.
* **Contribution Type:** ML Engineering / High-Concurrency Benchmarking / XAI Reasoning / Algorithmic Fairness
* **Blockers:** None.
* **Hours / Capacity:** 48 / 70 hrs logged this cycle (Cumulative: 230 / 275 hrs).
* **Evidence:** Git commit `d0bf6cd` (PR #8 merged); `akshay_ml_fairweighing/phase6_benchmarks/`; `akshay_ml_fairweighing/phase6_continuous_eval/`; `backend/tests/test_ml_load_and_optimization.py`; 46 passing ML tests.

### Name: Nirav Kachhiya (202512011)
* **Role:** Project Lead / Backend Engineer
* **Tasks Completed:** Supervised Milestone 4 completion and signed off Phase 4 deliverables; reviewed and merged PR #8 (Reasoning Engine), PR #9 (Reasoning APIs), and PR #10 (Web Console Integration); resolved TypeScript build discrepancies and merge conflicts; verified 333+ passing pytest tests; maintained Git repository hygiene.
* **Tasks In Progress:** Orchestrating multi-container Docker Compose staging environment; preparing final project delivery documentation.
* **Contribution Type:** Architecture / Code Review / Release Management / Defect Resolution
* **Blockers:** None.
* **Hours / Capacity:** 52 / 70 hrs logged this cycle (Cumulative: 248 / 280 hrs).
* **Evidence:** Git merge commits `164da7f`, `3d2d3eb`, `8fe6366`; passing pytest execution logs; updated status reports.

### Name: Achyut Pathak (202512039)
* **Role:** AI/NLP Engineer – Evidence Parsing
* **Tasks Completed:** Validated evidence parser resilience against live API multipart uploads from web and mobile clients; audited courier tracking, receipt OCR, and communication NLP parsers across all 102 synthetic dispute cases; verified zero crash rate on malformed payloads.
* **Tasks In Progress:** Supporting final system integration benchmarks and preparing evidence ingestion documentation.
* **Contribution Type:** AI/NLP Optimization / Pipeline Verification / Documentation
* **Blockers:** None.
* **Hours / Capacity:** 46 / 70 hrs logged this cycle (Cumulative: 202 / 278 hrs).
* **Evidence:** Evidence ingestion logs; parser test fixtures; verified execution across 102 synthetic dispute payloads.

### Name: Darshan Prajapati (202512026)
* **Role:** Backend Engineer – Reasoning & APIs
* **Tasks Completed:** Engineered the REST API endpoints for the reasoning layer in `reasoning.py` (PR #9); implemented routes for reasoning generation, dual-perspective explanations, and manual analyst overrides; published updated OpenAPI 3.0 specification; authored 21 router tests in `test_disputes_api.py` and `test_reasoning_api.py`.
* **Tasks In Progress:** Finalizing API rate limiting and security headers for production deployment.
* **Contribution Type:** API Engineering / OpenAPI Contracts / Test Automation
* **Blockers:** None.
* **Hours / Capacity:** 48 / 70 hrs logged this cycle (Cumulative: 208 / 270 hrs).
* **Evidence:** Git commit `968a234` (PR #9 merged); `openapi.json`; `reasoning_layer_api.md`; 21 passing router tests.

### Name: Mayank Jayswal (202512093)
* **Role:** Mobile Engineer – Card Member App
* **Tasks Completed:** Completed React Native Expo form integration with live dispute submission endpoints; verified camera and document picker file streaming to backend; validated real-time status tracker against state machine lifecycle transitions.
* **Tasks In Progress:** Polishing mobile offline error banners and finalizing mobile presentation demo recordings.
* **Contribution Type:** Mobile Development / UI Integration / Client Testing
* **Blockers:** None.
* **Hours / Capacity:** 46 / 70 hrs logged this cycle (Cumulative: 190 / 270 hrs).
* **Evidence:** Mobile client service modules; verified end-to-end dispute submission traces; Expo build artifacts.

### Name: Rohit Peswani (202512115)
* **Role:** Frontend Engineer – Web (Admin/Merchant)
* **Tasks Completed:** Delivered complete React Web Console live backend integration (PR #10); built universal API adapter with 4s timeout and offline mock fallback in `api.ts`; implemented interactive toast notification system in `Toast.tsx`; fixed 15 TypeScript strict-typing issues ensuring clean production build (1,587 modules transformed).
* **Tasks In Progress:** Fine-tuning chart animations in Reports & Analytics view and assisting with live presentation demo preparation.
* **Contribution Type:** Frontend Engineering / API Integration / UI/UX Design
* **Blockers:** None.
* **Hours / Capacity:** 52 / 70 hrs logged this cycle (Cumulative: 192 / 274 hrs).
* **Evidence:** Git commits `beebc6e`, `581345b` (PR #10 merged `8fe6366`); `web-app/src/services/api.ts`; `Toast.tsx`; clean production build logs.

### Name: Hardik Kansara (202512036)
* **Role:** Cloud/DevOps & QA Engineer
* **Tasks Completed:** Maintained and monitored GitHub Actions CI workflow executing automated test suites on all PR merges; initiated Phase 5 multi-container orchestration architecture (`Dockerfile`, `docker-compose.yml`); verified test harness execution (333+ passing tests in 2.90s).
* **Tasks In Progress:** Building production container configurations and configuring cloud staging deployment pipelines on Render/Railway.
* **Contribution Type:** DevOps / CI/CD Automation / Containerization / Quality Assurance
* **Blockers:** None.
* **Hours / Capacity:** 48 / 70 hrs logged this cycle (Cumulative: 202 / 273 hrs).
* **Evidence:** GitHub Actions CI workflow run logs; `backend-tests.yml`; containerization drafts.

