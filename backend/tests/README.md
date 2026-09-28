# VerdictAI — QA & Test Harness

Owner: Hardik Kansara (202512036) — Cloud/DevOps & QA Engineer
Covers Milestone 3 (System Integration & End-to-End Validation).

## Running the suite

From the repository root:

```bash
python -m venv .venv
.venv/Scripts/pip install -r backend/requirements.txt   # Linux/macOS: .venv/bin/pip
.venv/Scripts/python -m pytest -q
```

Current baseline: **294 passed, 12 xfailed in ~6s**. CI runs the same command on every
push and pull request (`.github/workflows/backend-tests.yml`).

## Suite inventory

| Test module | Tests | Scope | Owner |
|---|---:|---|---|
| `test_case_builder.py` | 3 | Case-file compilation & sealing | Nirav |
| `test_state_machine.py` | 3 | 6-state FSM, SLA deadlines | Nirav |
| `test_audit_log.py` | 2 | Merkle hash chain, tamper detection | Nirav |
| `test_transaction_parser.py` | 38 | Transaction CSV/JSON parsing | Achyut |
| `test_receipt_parser.py` | 33 | Receipt text/JSON parsing | Achyut |
| `test_courier_tracking_parser.py` | 42 | Courier tracking & anomalies | Achyut |
| `test_communication_parser.py` | 50 | spaCy dialogue entity extraction | Achyut |
| `test_evidence_pipeline_integration.py` | 6 | Dispatcher → CaseService enrichment | Nirav |
| `test_fair_weighing_integration.py` | 5 | Scoring service & fairness metrics | Akshay |
| `test_e2e_milestone3.py` | 120 | **End-to-end pipeline over 102 scenarios** | Hardik |
| `akshay_ml_fairweighing/.../test_scoring.py` | 4 | Model unit validation | Akshay |

## Synthetic chargeback dataset

`fixtures/synthetic_disputes.json` — 102 scenarios, regenerate with:

```bash
python backend/tests/fixtures/generate_synthetic_disputes.py
```

The matrix is 6 dispute reasons × 2–3 evidence profiles × 6 transaction amounts
($49.99 – $15,250):

| Profile | Meaning |
|---|---|
| `merchant_proof` | Merchant supplies the category's primary evidence (delivery confirmation, auth log, policy terms) |
| `cardholder_proof` | Cardholder evidence contradicts the merchant (failed delivery, failed auth, duplicate debit) |
| `missing_primary` | The category's primary evidence is absent — the case should escalate |

Payloads are raw JSON exactly as a mobile or web client would POST them, so the parsers
run for real rather than being stubbed.

## What the E2E harness asserts (`test_e2e_milestone3.py`)

Each scenario is driven through the public REST API only — no direct service calls:
`POST /disputes` → `POST /evidence/payload` (per item) → `POST /disputes/{id}/score` →
`GET /disputes/{id}/audit-trail` → `GET /disputes/{id}/resolution` → `GET /admin/queue`.

| Check | Requirement |
|---|---|
| Scoring returns synchronously in < 30s | SIR-07 |
| Expected recommendation, outcome enum matches recommendation | FR-15, FR-16 |
| Auto-resolve only at ≥ 50% confidence, otherwise manual review queue | FR-17, AC-09 |
| Explanation present and citing ≥ 3 contributing factors | FR-19, FR-20, AC-10 |
| Audit chain intact; submit + every attach + exactly one scoring event logged, with model version | FR-18, FR-21, AC-11, NFR-08 |
| Same evidence gives the same verdict at every transaction amount | Algorithmic fairness |

## Open QA finding — FR-17 routing gap (owner: Akshay)

A dispute with **no evidence at all** beyond the cardholder's written statement
auto-resolves in the cardholder's favour for two categories instead of going to manual
review:

| Category | Confidence | Actual | Expected |
|---|---:|---|---|
| CAT-02 Defective / not as described | 51.1% | `AUTO_RESOLVED` (cardholder) | `MANUAL_REVIEW_QUEUE` |
| CAT-05 Cancelled subscription | 51.1% | `AUTO_RESOLVED` (cardholder) | `MANUAL_REVIEW_QUEUE` |

Cause: the −15 point missing-primary-evidence penalty in `fair_weighing_model.py` is not
enough to push these two category weightings below the 50% auto-resolve threshold.

Reproduce:

```bash
.venv/Scripts/python -m pytest backend/tests/test_e2e_milestone3.py -k missing_primary -rx
```

The 12 affected scenarios are marked `xfail(strict=True)`, so the suite stays green while
the gap is open, and pytest will fail once the model is fixed — that is the signal to
delete `KNOWN_MODEL_GAPS` from the test module.
