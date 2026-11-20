# VerdictAI Machine Learning Training & Optimization Loop Log
**Started:** 2026-11-20 20:26:27  
**Author:** Akshay Purohit (Student ID: 202512033) — Senior ML Engineer  
**Task:** Transition from rule-based condition rubric to calibrated ML model (`XGBClassifier` + `CalibratedClassifierCV`).

---

## Grounding Notes (Step A)
Dispute logic is grounded in public card-network regulatory standards:
- **Visa Core Rules & VCR (Visa Claims Resolution):** Reason codes 10.4 (Fraud Card-Absent), 12.6 (Duplicate Processing), 13.1 (Item Not Received), 13.3 (Defective/Damaged Merchandise).
- **Mastercard Dispute Resolution (Chargeback Guide):** Codes 4837 (Fraud), 4834 (Duplicate), 4853 (Goods/Services Not Provided).
- **MattMMarketing/chargeback-reason-codes:** Used for reference grounding on primary compelling evidence requirements (Carrier tracking POD, 2FA/3DS authorization records, POS duplicate ledgers).
- **azizstark/synthetic-chargeback-cases (HF Sanity Check):** Skipped or offline.

---

### Iteration 1: Train baseline XGBoost model with default parameters (n_estimators=100, max_depth=3, lr=0
**Plan:** Train baseline XGBoost model with default parameters (n_estimators=100, max_depth=3, lr=0.10) wrapped in CalibratedClassifierCV(sigmoid, cv=5).  

**Evaluation Metrics on Held-Out Test Set:**

| Metric Target | Target Threshold | Observed Value | Status |
| :--- | :---: | :---: | :---: |
| Macro F1-Score | `>= 0.85` | `0.9979` | **PASS** |
| Overall Accuracy | `>= 0.88` | `0.9980` | **PASS** |
| Expected Calibration Error (ECE) | `<= 0.05` | `0.0052` | **PASS** |
| ESCALATE Class Recall | `>= 0.80` | `0.9950` | **PASS** |
| 5-Fold CV Accuracy Std | `<= 0.02` | `0.0028` | **PASS** |
| Train-vs-Test Accuracy Gap | `<= 0.05` | `0.0010` | **PASS** |
| Delta vs Rule-Engine Macro F1 | `>= +0.03` | `0.3382` | **PASS** |
| US EEOC 4/5ths Rule (DIR >= 0.80) | `DIR >= 0.80` | `All Groups` | **PASS** |
| Regulatory FPR Ceiling (< 5.0%) | `FPR < 0.05` | `All Groups` | **PASS** |

- **Test Accuracy:** `99.80%` | **Macro F1:** `0.9979`
- **ESCALATE Recall:** `99.50%` | **ECE:** `0.0052`
- **5-Fold CV Accuracy:** `99.65% ± 0.28%`
- **Rule-Engine Baseline Macro F1:** `0.6597` (Delta: `+33.82%`)
- **PyTest Automated Suite:** `ALL PASSED`

**Decision:** All target metrics and fairness thresholds PASSED. Halting loop at Iteration 1.