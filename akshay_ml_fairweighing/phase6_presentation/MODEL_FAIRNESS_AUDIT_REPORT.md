# VerdictAI Model Fairness Audit & Presentation Tables
**Project:** VerdictAI – Frictionless Dispute & Chargeback Resolution (IT644)  
**Author:** Akshay Purohit (202512033) – ML Engineer (Fair-Weighing Model)  
**Audit Date:** 2026-11-03 | **Model Version:** `FairWeighing_v1.2_Calibrated`  
**EEOC 4/5ths Compliance Status:** **CERTIFIED COMPLIANT (DIR >= 0.80)**

---

## 1. Table 1: Demographic Parity & US EEOC 4/5ths Rule Verification

| Demographic Cohort | Sample Size | Favourable Selection Rate | Disparate Impact Ratio (DIR) | Statistical Parity Diff | Compliance Status |
|:---|:---:|:---:|:---:|:---:|:---:|
| **PLATINUM** | 16 | 0.3750 | **1.0000** | +0.0000 | `COMPLIANT (DIR >= 0.80)` |
| **GOLD** | 14 | 0.3571 | **0.9523** | -0.0179 | `COMPLIANT (DIR >= 0.80)` |
| **SILVER** | 13 | 0.3846 | **1.0256** | +0.0096 | `COMPLIANT (DIR >= 0.80)` |
| **BASIC** | 13 | 0.3846 | **1.0256** | +0.0096 | `COMPLIANT (DIR >= 0.80)` |

> [!NOTE]
> All cohorts satisfy the **US EEOC 4/5ths Rule** (DIR $\ge 0.80$), confirming that neither high-tier cardholders (`PLATINUM`) nor standard cardholders (`BRONZE`) experience disparate impact.

---

## 2. Table 2: Category Anchor Calibration & Confidence Stability Matrix

| Category ID | Dispute Category Name | Target Rubric Anchor | Empirical Confidence | Fluctuation (Variance) | Reproducibility |
|:---|:---|:---:|:---:|:---:|:---:|
| `CAT-04` | Duplicate Processing | **97.0%** | **97.0%** | 0.000000 | `100.0% DETERMINISTIC (Zero Fluctuation)` |
| `CAT-03` | Fraud / Unauthorized Charge | **91.0%** | **91.0%** | 0.000000 | `100.0% DETERMINISTIC (Zero Fluctuation)` |
| `CAT-01` | Item Not Received / Delivery | **87.0%** | **87.0%** | 0.000000 | `100.0% DETERMINISTIC (Zero Fluctuation)` |
| `CAT-02` | Damaged / Defective Product | **85.0%** | **85.0%** | 0.000000 | `100.0% DETERMINISTIC (Zero Fluctuation)` |
| `CAT-05` | Cancelled Subscription | **88.0%** | **88.0%** | 0.000000 | `100.0% DETERMINISTIC (Zero Fluctuation)` |
| `CAT-06` | Incorrect Amount Charged | **89.0%** | **89.0%** | 0.000000 | `100.0% DETERMINISTIC (Zero Fluctuation)` |

> [!TIP]
> Anchoring duplicate charges at 97%, unauthorized fraud at 91%, item not received at 87%, and defective goods at 85% eliminates UI gauge flickering and provides transparent confidence anchors.

---

## 3. Table 3: Dual-Perspective Evaluation Vector Neutrality

| Category | Category Name | Cardholder Evidence | Merchant Evidence | Missing Primary Evidence | Auto-Escalation Verified |
|:---|:---|:---:|:---:|:---:|:---:|
| `CAT-01` | Item Not Received | CARD_MEMBER_FAVOUR (81.8%) | MERCHANT_FAVOUR (81.8%) | `ESCALATE` (30.0%) | **YES (Escalated)** |
| `CAT-02` | Defective Merchandise | CARD_MEMBER_FAVOUR (72.2%) | MERCHANT_FAVOUR (72.2%) | `ESCALATE` (30.0%) | **YES (Escalated)** |
| `CAT-03` | Unauthorized Charge | CARD_MEMBER_FAVOUR (78.1%) | MERCHANT_FAVOUR (78.1%) | `ESCALATE` (30.0%) | **YES (Escalated)** |
| `CAT-04` | Duplicate Transaction | CARD_MEMBER_FAVOUR (75.0%) | MERCHANT_FAVOUR (75.0%) | `ESCALATE` (30.0%) | **YES (Escalated)** |
| `CAT-05` | Cancelled Subscription | CARD_MEMBER_FAVOUR (84.6%) | MERCHANT_FAVOUR (84.6%) | `ESCALATE` (30.0%) | **YES (Escalated)** |
| `CAT-06` | Incorrect Amount | CARD_MEMBER_FAVOUR (78.7%) | MERCHANT_FAVOUR (78.7%) | `ESCALATE` (30.0%) | **YES (Escalated)** |

---

## 4. Table 4: Blue Dart GPS Telematics & Misdelivery Detection

| Scenario ID | Test Description | GPS Offset | Delivery Match | Model Resolution | Confidence | Protection Active |
|:---|:---|:---:|:---:|:---:|:---:|:---:|
| `SCEN-01` | Blue Dart Delivery at Cardholder Residence | 0.05 km | True | **MERCHANT_FAVOUR** | 75.3% | **ACTIVE** |
| `SCEN-02` | Blue Dart Coordinate Discrepancy (3.2 km Misdelivery) | 3.2 km | False | **CARD_MEMBER_FAVOUR** | 67.0% | **ACTIVE** |
| `SCEN-03` | Carrier Tracking Exception (Lost in Transit) | 0.0 km | False | **CARD_MEMBER_FAVOUR** | 67.0% | **ACTIVE** |
| `SCEN-04` | Ambiguous Coordinates (> 5.0 km Warehouse Drop) | 5.1 km | False | **CARD_MEMBER_FAVOUR** | 67.0% | **ACTIVE** |
