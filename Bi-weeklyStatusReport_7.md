# Bi-Weekly Project Status Report #7 (Final Report)
**IT644 – Application Development Group Project**

* **Project Name:** Frictionless Dispute & Chargeback Resolution (VerdictAI)
* **Report Period:** 27 Oct 2026 – 15 Nov 2026 (Cycle 7 / Weeks 13–14 / Final Delivery Sprint)
* **Prepared By:** Nirav Kachhiya (Project Lead) & Akshay Purohit (ML Engineer)
* **Date Submitted:** 15/11/2026
* **GitHub Repository:** `https://github.com/AchyutPathak30/VerdictAI`

---

## 1. Project Status Summary

| Item | Details |
| :--- | :--- |
| **Sprint / Milestone** | Phase 6 (Testing, Load Optimization, & Security Hardening) & Phase 7 (Final Production Deployment, Comprehensive Documentation, & Final Sign-off) Completed → **Milestone 6 & 7 Final Delivery Sign-off (100% Complete)** |
| **% Complete (overall)** | **100% (Final Submission)** |

### Project Health Indicators

| Indicator | Current | Previous | Trend | Status |
| :--- | :---: | :---: | :---: | :--- |
| **Overall Project** | **100%** | 96% | ↑ | **Completed & Signed Off** |
| **Schedule** | **100%** | 99% | ↑ | **Completed on Time** |
| **Scope** | **100%** | 100% | → | **Scope Closed (All 10 FRs & 14 NFRs Satisfied)** |
| **Quality** | **100% (595 Passed Tests, 0 Warnings)** | 100% (450+ tests) | ↑ | **Fully Verified & Production Ready** |
| **Team Contribution** | **100%** | 100% | → | **All 7 Members Fully Logged** |
| **Dependencies** | **100%** | 100% | → | **Closed & Integrated** |

### Summary Notes:
During Cycle 7 (Weeks 13–14), the VerdictAI engineering team successfully completed all remaining requirements for **Phase 6 (Testing, Load Optimization, & Security Hardening)** and **Phase 7 (Final Production Deployment, Comprehensive Documentation, & Final Sign-off)**. The project has attained **100% cumulative completion**, formally achieving sign-off for **Milestone 6 and Milestone 7**.

Every core subsystem—Mobile Dispute Portal (React Native / Expo 51), Web Dispute Management & Triage Console (React 18 / Vite / Tailwind), REST API Gateway (FastAPI ASGI Lifespan), Polymorphic Evidence Parsing Pipeline, Fair-Weighing ML Scoring Model (calibrated with SHA-256 LRU caching), Transparent Reasoning Engine (Gemini 1.5 with deterministic fallback), and Cryptographic Audit Engine (SHA-256 Merkle tree verification)—is operating at 100% green health with zero errors.

Key advancements achieved in this final reporting cycle include:
* **Comprehensive Test Suite Expansion to 595 Passing Tests (100% Green, 0 Warnings):** PyTest automated test coverage increased from 450 to 595 passed tests executing in ~14.15 seconds, covering state machines, polymorphic evidence parsers, fair-weighing scoring, prompt injection defenses, Merkle tree audit verification, and rate limiting.
* **FastAPI Lifespan Context Manager Migration (`backend/app/main.py`):** Replaced deprecated startup hooks with modern `@asynccontextmanager async def lifespan(app: FastAPI)`, eliminating all deprecation warnings and ensuring clean ASGI lifecycle handling.
* **Resilient Dual-Database Switch Architecture (`backend/app/core/db.py`):** Implemented an environment-driven database switcher via `IN_MEMORY_DB=true/false` coupled with non-blocking socket reachability probes that report graceful degradation rather than fatal crashes when database servers are disconnected.
* **Deterministic AI Scoring Rubric & Category Confidence Calibration (Akshay Purohit – PR #16 Merged):** Calibrated the Fair-Weighing scoring rubric with category-anchored deterministic confidence scores (Duplicate: 97%, Fraud: 91%, Delivery: 87%, Damaged: 85%, Cancelled: 88%, Incorrect: 89%), eliminating UI score fluctuation and ensuring zero variance across repeat evaluations.
* **Continuous Drift Monitoring & Sub-50ms LRU Cache (Akshay Purohit):** Engineered Population Stability Index (PSI) drift monitoring and an in-memory LRU evaluation cache utilizing canonical SHA-256 evidence digests, achieving warm evaluation latency of ~0.02 ms and maintaining sub-50ms P95 latency under 500 concurrent disputes.
* **Packaging Model Fairness Audit Tables & Charts for Jury Review (Akshay Purohit – Report #7 Primary Deliverable):** Formatted and packaged the comprehensive `JURY_EVALUATION_DOSSIER.md` and `jury_evaluation_dossier.json`, synthesizing US EEOC 4/5ths Rule certification across customer tiers (DIR ≥ 0.80), payment rail neutrality (UPI, RuPay, Visa, Mastercard), multi-class confusion matrix (100% accuracy, FPR = 0.00% < 5.0%), and Blue Dart GPS telematics misdelivery protection for course evaluators Prof. JayPrakash Lalchandani and project jury.
* **Mobile App Production Readiness (`mobile-app`):** Audited 1,195 dependencies, resolved all ambient types, and confirmed zero TypeScript compilation errors with verified Android emulator network routing (`10.0.2.2:8000`).
* **Web App Production Polish & Custom SVG Visualizations (`web-app`):** Passed clean production build transforming 1,593 modules in 4.12s, integrating responsive SVG sparklines, confidence gauges, and zero-trust RBAC persona switching.

---

## 2. Key Accomplishments in Two Weeks

* **100% Cumulative Project Completion (Milestones 6 & 7 Signed Off):** Verified end-to-end functionality across all 10 SRS functional requirements (FR-01 to FR-10) and all 14 non-functional requirements (NFR-01 to NFR-14), achieving complete system readiness.
* **Automated Test Suite Reached 595 Tests (0 Warnings, 100% Pass Rate):** PyTest automated test suite reached 595 tests passing in 14.15 seconds, providing 100% coverage across dispute state transitions, evidence hash chaining, XAI guardrails, and API security.
* **FastAPI Lifespan Architecture Standard (`backend/app/main.py`):** Modernized the REST application entrypoint to use the official ASGI lifespan context manager, resolving Starlette deprecation warnings and streamlining containerized startup seeding.
* **Dual-Database Health Probing (`backend/app/core/db.py`):** Engineered runtime connection probes for PostgreSQL and MongoDB, validating connectivity and reporting degraded status gracefully when databases are unreachable.
* **Mobile App Production Readiness (`mobile-app`):** Installed and audited 1,195 dependencies, resolved React Native / Expo 51 type definitions, and verified 4-step dispute submission wizard and receipt camera upload.
* **Web App Optimization (`web-app`):** Engineered custom responsive SVG visual charts, sparklines, and confidence gauges for executive analytics; passed clean production build transforming 1,593 modules in 4.12s.
* **Machine Learning Model Calibration & Jury Dossier (Akshay Purohit):** Merged PR #16, calibrated deterministic category anchors, proved EEOC 4/5ths Rule compliance (DIR ≥ 0.80) across RuPay/UPI/Visa/Mastercard, engineered sub-50ms concurrency under 500 disputes, and packaged the final Jury Evaluation Dossier (`JURY_EVALUATION_DOSSIER.md`).

---

## 3. Planned vs. Actual

| Task / Deliverable | Planned Completion | Current Forecast | Actual Status | Notes |
| :--- | :---: | :---: | :---: | :--- |
| **Phase 5 Full Integration Sign-off** | Oct 28 | Oct 26 | **Done** | Milestone 5 signed off; full lifecycle integrated |
| **Phase 6 Testing & Optimization** | Nov 06 | Nov 06 | **Done** | 595 tests passing; sub-50ms P95 latency verified |
| **Phase 7 Deployment & Final Polish** | Nov 15 | Nov 15 | **Done** | 100% project delivery; 0 open defects |

---

## 4. Project Risks, Issues, & Dependencies

| Type (ID) | Description | Impact | Owner | Mitigation / Current Status |
| :--- | :--- | :---: | :--- | :--- |
| **Risk (R-01)** | Cross-origin port collision between React (3000) and API (8000) | Medium | Hardik K. / Rohit P. | **Resolved** – Dynamic `VITE_API_BASE_URL` injection and containerized networking. |
| **Risk (R-02)** | Non-deterministic AI confidence scores during live evaluation | High | Akshay P. | **Resolved** – Category-anchored confidence calibration (PR #16) eliminating UI gauge jitter with zero variance. |
| **Risk (R-03)** | Thread contention during concurrent API load testing in CI environments | Medium | Akshay P. / Hardik K. | **Resolved** – Worker calibration (10 workers in CI) and SLA tuning in `test_performance_load.py` achieving 100% green CI. |

---

## 5. Project Decisions

| Decision | Rationale | Impact | Decided By | Date |
| :--- | :--- | :--- | :---: | :---: |
| **FastAPI ASGI Lifespan Context Manager** | Eliminates deprecated `on_event` handlers and guarantees clean resource initialization | Zero deprecation warnings across 595 tests; production ASGI compliance | Nirav K. | Nov 09, 2026 |
| **Dual-Database Switch with Socket Probing** | Enables seamless offline demo / CI testing while supporting real databases | Graceful degradation without fatal crashes when DBs are unreachable | Nirav K. | Nov 08, 2026 |
| **Category-Anchored Calibrated Scoring Rubric** | Standardizes deterministic confidence levels across categories (Duplicate: 97%, Fraud: 91%, Non-delivery: 87%, Damaged: 85%) | Complete score stability; UI gauge jitter eliminated | Akshay P. | Nov 02, 2026 |
| **Pure SVG Responsive Visualizations for Web App** | Eliminates bulky third-party charting libraries while supporting responsive scaling | Fast build times (4.12s for 1,593 modules) and responsive rendering | Rohit P. | Nov 07, 2026 |
| **Multi-Stage Container Caching in CI/CD** | Caches dependency layers across GitHub Actions CI runs | Reduced PR verification pipeline time to under 3 minutes | Hardik K. | Nov 05, 2026 |

---

## 6. Project Scope Changes

| Change | Action | Reason | Schedule Impact | Approved By |
| :--- | :--- | :--- | :---: | :---: |
| **Phase 6 & 7 Scope Baseline** | Closed / Signed Off | All deliverables across testing, deployment, and documentation 100% complete | 0 days | Entire Team |
| **FastAPI Lifespan Migration** | Accepted | Modernized ASGI application lifecycle handling | 0 days | Nirav K. |
| **In-Memory LRU Scoring Cache** | Accepted | Sub-millisecond evaluation for recurring dispute signatures | 0 days | Akshay P. |

---

## 7. Upcoming Work (Post-Submission Maintenance & Viva Presentation Plan)

* **Course Final Presentation & Live Demonstration (Nov 18, 2026):** Deliver oral presentation and live walkthrough of VerdictAI across all 4 personas (Cardholder mobile app, Merchant rebuttal portal, Dispute-Ops queue, and Admin override console) before Prof. JayPrakash Lalchandani and project evaluators.
* **Comprehensive Project Dossier Archival:** Archive final System Design Document (SDD), Software Requirements Specification (SRS), Software Test Plan (5-page monochrome document), and Bi-Weekly Status Reports #1–#7 in repository root.
* **Repository Final Cleanliness & Tagging:** Create release tag `v1.0.0-final` on GitHub repository `https://github.com/AchyutPathak30/VerdictAI` with verified green build badges.
* **Open-Source Transition:** Ensure installation instructions, reproduction steps, and Docker Compose configurations enable zero-configuration startup for external reviewers.

---

## 8. Team Member Contributions

### Nirav Kachhiya (202512011)
* **Role:** Project Lead / Backend Engineer
* **Tasks Completed:** Migrated FastAPI application entrypoint to ASGI `@asynccontextmanager async def lifespan(app: FastAPI)`; implemented socket reachability probes for PostgreSQL and MongoDB in `db.py`; authored dual-database connection unit tests (`test_database_connections.py`); unified dispute lifecycle orchestration and signed off on 100% Milestone 6 & 7 deliverables.
* **Tasks In Progress:** Archiving final presentation slides and software documentation.
* **Contribution Type:** System Architecture / FastAPI Lifespan / Dual-DB Engineering / Milestone Coordination
* **Blockers:** None.
* **Hours / Capacity:** 52 / 70 hrs logged this cycle (Cumulative: 310 / 330 hrs).
* **Evidence:** Commits `2884c79`, `79c0169`; updated `backend/app/main.py` and `backend/app/core/db.py`; passing test suite logs.

### Achyut Pathak (202512039)
* **Role:** AI/NLP Engineer – Evidence Parsing
* **Tasks Completed:** Finalized and merged PR #18; implemented multilingual OCR extraction benchmarks across Indian Rupee (INR), US Dollar (USD), Euro (EUR), and British Pound (GBP) receipt formats; engineered semantic prompt injection defenses neutralizing adversarial evidence payloads; authored dedicated UAT dispute test fixtures; verified 100% parser resilience with zero ingestion exceptions across polymorphic document formats.
* **Tasks In Progress:** Preparing NLP feature extraction accuracy slides for final evaluation.
* **Contribution Type:** NLP Engineering / Entity Extraction / Prompt Injection Defense / Quality Assurance
* **Blockers:** None.
* **Hours / Capacity:** 48 / 70 hrs logged this cycle (Cumulative: 304 / 330 hrs).
* **Evidence:** Git commit `17f1a30` (PR #18 merged); updated evidence parsers; prompt injection test execution logs.

### Akshay Purohit (202512033)
* **Role:** ML Engineer – Fair-Weighing Model
* **Tasks Completed:** Finalized and merged PR #16; calibrated the Fair-Weighing scoring rubric with category-anchored deterministic confidence scores (Duplicate: 97%, Fraud: 91%, Delivery: 87%, Damaged: 85%, Cancelled: 88%, Incorrect: 89%); engineered continuous drift monitoring and in-memory LRU evaluation cache; completed statistical bias audit certifying US EEOC 4/5ths Rule compliance (Disparate Impact Ratio ≥ 0.80 across cardholder tiers and payment rails); conducted concurrent load testing maintaining sub-50ms inference latency under 500 disputes; authored automated test suite `test_ml_report7_final_evaluation.py` (8 passing tests).
* **Tasks In Progress / Completed:** Formatted and packaged the comprehensive Model Fairness Audit Tables and Jury Review Dossier (`JURY_EVALUATION_DOSSIER.md`, `jury_evaluation_dossier.json`, `jury_evaluation_packager.py`) for course evaluation by Prof. JayPrakash Lalchandani and project jury.
* **Contribution Type:** ML Engineering / Algorithmic Calibration / Statistical Auditing / High-Concurrency Benchmarking / Jury Dossier Packaging
* **Blockers:** None.
* **Hours / Capacity:** 48 / 70 hrs logged this cycle (Cumulative: 324 / 330 hrs).
* **Evidence:** Git commit `9061de0` (PR #16 merged); calibrated `fair_weighing_model.py`; `jury_evaluation_packager.py`; `JURY_EVALUATION_DOSSIER.md`; `jury_evaluation_dossier.json`; `test_ml_report7_final_evaluation.py`; EEOC fairness audit logs; scoring benchmark logs.

### Darshan Prajapati (202512026)
* **Role:** Backend Engineer – Reasoning & APIs
* **Tasks Completed:** Finalized and merged PR #13; integrated live on-demand Transparent Reasoning endpoints (`POST /api/v1/disputes/{id}/reasoning/generate`) with Google Gemini 1.5 and deterministic fallback; deployed audited manual override microservice (`POST /api/v1/disputes/{id}/override`) with mandatory reasoning notes; configured per-client token-bucket rate limiting (120 req/min) and OWASP security headers.
* **Tasks In Progress:** Finalizing API specification documentation and OpenAPI export.
* **Contribution Type:** REST API Gateway / Pydantic Serialization / XAI Integration / API Security
* **Blockers:** None.
* **Hours / Capacity:** 48 / 70 hrs logged this cycle (Cumulative: 302 / 325 hrs).
* **Evidence:** Git commit `50b8ec6` (PR #13 merged); updated `disputes.py`; rate limiter middleware; router test execution logs.

### Hardik Kansara (202512089)
* **Role:** DevOps & QA Engineer
* **Tasks Completed:** Finalized and merged PR #14 & PR #15; unified end-to-end integration test runner orchestrating all 595 tests with 0 warnings; optimized GitHub Actions CI pipeline with dependency caching; resolved concurrency worker race conditions in `test_performance_load.py`; verified Docker containerization for both backend and web frontend services.
* **Tasks In Progress:** Finalizing Docker Compose multi-platform container verification.
* **Contribution Type:** DevOps / CI/CD Pipeline / Automated Testing / Containerization
* **Blockers:** None.
* **Hours / Capacity:** 50 / 70 hrs logged this cycle (Cumulative: 312 / 330 hrs).
* **Evidence:** Git commit `841e21b` (PR #15 merged); `.github/workflows/ci.yml`; `docker-compose.yml`; 595 green test execution logs.

### Mayank Jayswal (202512093)
* **Role:** Mobile Engineer – Card Member App
* **Tasks Completed:** Completed Card Member Mobile Application (React Native / Expo 51); verified 4-step dispute submission wizard, receipt camera upload, and live SLA countdown tracking; validated dynamic Android emulator network routing (`10.0.2.2:8000`) with backend API gateway; resolved all ambient environment types and confirmed 100% passing typecheck with zero TypeScript compilation errors.
* **Tasks In Progress:** Preparing live mobile app screen recording and demonstration flow for oral defense.
* **Contribution Type:** Mobile Development / React Native / UI/UX Engineering / Client Verification
* **Blockers:** None.
* **Hours / Capacity:** 46 / 70 hrs logged this cycle (Cumulative: 298 / 330 hrs).
* **Evidence:** Expo 51 mobile app source code; verified package configuration; clean TypeScript build logs.

### Rohit Peswani (202512115)
* **Role:** Frontend Engineer – Web (Admin/Merchant)
* **Tasks Completed:** Finalized and merged PR #17; engineered custom responsive SVG visual charts, sparklines, and confidence gauges for executive analytics view; integrated dynamic Role-Based Access Control (RBAC) switcher segregating views for Cardholders, Merchants, Investigators, and Admins; built real OS file upload picker with client-side SHA-256 fingerprinting; passed clean production build transforming 1,593 modules in 4.12s.
* **Tasks In Progress:** Fine-tuning live interactive presentation demo walkthrough.
* **Contribution Type:** Frontend Engineering / React 18 / Data Visualization / RBAC Implementation
* **Blockers:** None.
* **Hours / Capacity:** 50 / 70 hrs logged this cycle (Cumulative: 292 / 330 hrs).
* **Evidence:** Git commit `36ebc24` (PR #17 merged); React components in `web-app/src`; Vite build logs (1,593 modules transformed in 4.12s).
