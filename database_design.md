# 🗄️ VerdictAI: Dual-Database Schema & Cryptographic Data Architecture
**Author:** Nirav Kachhiya (Project Lead / Backend Engineer)  
**Course:** IT644 — Application Development Group Project  
**Date:** November 2026  
**Document Version:** 2.0 (Milestone 5/6 Architecture Final)

---

## 1. Overview & Architectural Rationale

VerdictAI processes sensitive, high-stakes dispute and chargeback transactions between card members, financial institutions, and retail merchants. To satisfy both strict **ACID compliance** for monetary state transitions and **semi-structured multi-modal polymorphism** for evidence (PDF tax invoices, GPS delivery telematics, customer chat transcripts), VerdictAI utilizes a **Hybrid Polyglot Dual-Database Architecture**:

1. **Relational Tier (PostgreSQL):** Enforces relational referential integrity, unique constraints, foreign keys, SLA countdown timers, and financial transaction immutability.
2. **Polymorphic Document Tier (MongoDB):** Houses unconstrained, polymorphic evidence payloads with automated SHA-256 integrity checksums.
3. **Cryptographic Ledger Tier (Merkle-Chained Audit Trail):** Provides legal non-repudiation and tamper detection through pairwise SHA-256 Merkle root computation.

```
+--------------------------------------------------------------------------+
|                          VerdictAI Data Architecture                     |
+------------------------------------+-------------------------------------+
|        PostgreSQL (Relational)     |        MongoDB (Polymorphic)        |
+------------------------------------+-------------------------------------+
|  • users                           |  • case_documents                   |
|  • merchants                       |  • evidence_payloads                |
|  • transactions                    |     - RECEIPT_INVOICE (OCR)         |
|  • disputes                        |     - COURIER_TRACKING (GPS)        |
|  • case_files (Bridge Table)       |     - BANK_STATEMENT (RRN)          |
|  • dispute_resolutions             |     - COMMUNICATION_LOG (NLP)       |
|  • audit_logs (Chained Events)     |     - REFUND_POLICY_TERMS           |
+------------------------------------+-------------------------------------+
```

---

## 2. PostgreSQL Relational Schema (`verdictai_db`)

### 2.1 Entity-Relationship (ER) Model

```
 [users] 1 --------< N [transactions] 1 -------- 1 [disputes]
   |                         |                         |
   |                         |                         +--- 1:1 --- [case_files] (Bridge to Mongo)
   |                         |                         +--- 1:1 --- [dispute_resolutions]
   |                         |                         +--- 1:N --- [audit_logs]
   |                         |
 [merchants] 1 -------------+
```

### 2.2 Table Definitions & Constraints

#### Table 1: `users`
* **Purpose:** Stores authenticated user accounts across the 4 enterprise personas.
* **Fields:**
  * `id` (`UUID`, PK, Default: `uuid_generate_v4()`)
  * `email` (`VARCHAR(255)`, UNIQUE, NOT NULL)
  * `full_name` (`VARCHAR(255)`, NOT NULL)
  * `phone_number` (`VARCHAR(50)`)
  * `role` (`user_role_enum`: `CARDHOLDER`, `MERCHANT`, `DISPUTE_ANALYST`, `ADMIN`)
  * `is_active` (`BOOLEAN`, NOT NULL, Default: `TRUE`)
  * `created_at`, `updated_at` (`TIMESTAMP WITH TIME ZONE`)

#### Table 2: `merchants`
* **Purpose:** Stores commercial merchant profiles, risk classifications, and historical chargeback ratios.
* **Fields:**
  * `id` (`UUID`, PK, Default: `uuid_generate_v4()`)
  * `merchant_name` (`VARCHAR(255)`, NOT NULL)
  * `merchant_category_code` (`VARCHAR(10)`, NOT NULL)
  * `contact_email` (`VARCHAR(255)`, NOT NULL)
  * `risk_tier` (`VARCHAR(20)`, Default: `'LOW'`)
  * `historical_dispute_rate` (`NUMERIC(5,4)`, Default: `0.0050`)
  * `created_at` (`TIMESTAMP WITH TIME ZONE`)

#### Table 3: `transactions`
* **Purpose:** Represents original authorized card / UPI payments.
* **Fields:**
  * `id` (`UUID`, PK)
  * `user_id` (`UUID`, FK $\rightarrow$ `users.id`)
  * `merchant_id` (`UUID`, FK $\rightarrow$ `merchants.id`)
  * `amount` (`NUMERIC(12,2)`, NOT NULL, Check: `amount > 0`)
  * `currency` (`VARCHAR(3)`, NOT NULL, Default: `'INR'`)
  * `payment_method` (`VARCHAR(50)`, e.g. `RUPAY_PLATINUM`, `UPI`, `VISA_CREDIT`)
  * `original_auth_code` (`VARCHAR(100)`, NOT NULL)
  * `terminal_city`, `terminal_country` (`VARCHAR(100)`)
  * `is_disputed` (`BOOLEAN`, NOT NULL, Default: `FALSE`)
  * `transaction_timestamp` (`TIMESTAMP WITH TIME ZONE`, NOT NULL)

#### Table 4: `disputes`
* **Purpose:** Primary state machine entity governing dispute lifecycle.
* **Fields:**
  * `id` (`UUID`, PK)
  * `transaction_id` (`UUID`, UNIQUE, FK $\rightarrow$ `transactions.id`)
  * `cardholder_id` (`UUID`, FK $\rightarrow$ `users.id`)
  * `dispute_reason` (`dispute_reason_enum`: `PRODUCT_NOT_RECEIVED`, `DUPLICATE_PROCESSING`, `FRAUD_UNRECOGNIZED_CHARGE`, `PRODUCT_DAMAGED_OR_DEFECTIVE`, `SUBSCRIPTION_CANCELLED_CHARGED`, `INCORRECT_AMOUNT_CHARGED`)
  * `disputed_amount` (`NUMERIC(12,2)`, NOT NULL)
  * `current_status` (`dispute_status_enum`: 11-stage state machine)
  * `merchant_sla_hours` (`INTEGER`, Default: `48`)
  * `sla_deadline` (`TIMESTAMP WITH TIME ZONE`, NOT NULL)
  * `cardholder_statement` (`TEXT`)
  * `created_at`, `updated_at` (`TIMESTAMP WITH TIME ZONE`)

#### Table 5: `case_files` (Cross-DB Bridge)
* **Purpose:** Cryptographically bridges PostgreSQL relational disputes with MongoDB polymorphic documents.
* **Fields:**
  * `id` (`UUID`, PK)
  * `dispute_id` (`UUID`, UNIQUE, FK $\rightarrow$ `disputes.id`)
  * `mongo_case_doc_id` (`VARCHAR(100)`, NOT NULL)
  * `case_hash_sha256` (`VARCHAR(64)`, NOT NULL)
  * `total_evidence_count` (`INTEGER`, Default: `0`)
  * `is_sealed` (`BOOLEAN`, Default: `FALSE`)

#### Table 6: `dispute_resolutions`
* **Purpose:** Persists Fair-Weighing ML scoring output, factor weights, and XAI rationale.
* **Fields:**
  * `id` (`UUID`, PK)
  * `dispute_id` (`UUID`, UNIQUE, FK $\rightarrow$ `disputes.id`)
  * `outcome` (`resolution_outcome_enum`: `FAVOR_CARDHOLDER`, `FAVOR_MERCHANT`, `SPLIT_LIABILITY`, `MERCHANT_ACCEPTED`)
  * `confidence_score` (`NUMERIC(5,4)`, e.g. `0.9420`)
  * `fairness_index` (`NUMERIC(5,4)`, Default: `1.0000`)
  * `justification_summary` (`TEXT`, NOT NULL)
  * `reasoning_payload` (`JSONB`)
  * `resolved_by_type` (`VARCHAR(50)`, Default: `'SYSTEM_AUTOMATION'`)

#### Table 7: `audit_logs`
* **Purpose:** Tamper-evident cryptographic state change history.
* **Fields:**
  * `id` (`UUID`, PK)
  * `dispute_id` (`UUID`, FK $\rightarrow$ `disputes.id`)
  * `performed_by` (`VARCHAR(255)`, NOT NULL)
  * `action_type` (`VARCHAR(100)`, NOT NULL)
  * `previous_state`, `new_state`, `state_delta` (`JSONB`)
  * `previous_log_hash` (`VARCHAR(64)`)
  * `cryptographic_hash` (`VARCHAR(64)`, NOT NULL)
  * `created_at` (`TIMESTAMP WITH TIME ZONE`)

---

## 3. MongoDB Polymorphic Evidence Schema (`verdictai_evidence`)

### 3.1 Collection: `case_documents`
```json
{
  "_id": "ObjectId('672b1234abcd5678ef012345')",
  "dispute_id": "d0000000-0000-0000-0000-000000000001",
  "case_reference_number": "CAS-D0000000",
  "total_evidence_count": 2,
  "created_at": "2026-10-21T08:30:00Z",
  "evidence_items": [
    {
      "evidence_id": "evi_98f12a00bc14",
      "dispute_id": "d0000000-0000-0000-0000-000000000001",
      "evidence_type": "COURIER_TRACKING",
      "source": "COURIER_CARRIER",
      "file_name": "bluedart_pod_gps.pdf",
      "mime_type": "application/pdf",
      "sha256_checksum": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "confidence_rating": 0.95,
      "raw_payload": {
        "carrier": "Blue Dart Express India",
        "waybill": "BLUEDART-88192034",
        "status": "DELIVERED",
        "gps_coordinates": "12.9810 N, 77.6250 E",
        "intended_coordinates": "12.9716 N, 77.6412 E",
        "distance_discrepancy_km": 3.2
      },
      "nlp_extracted_entities": {
        "carrier": "Blue Dart Express India",
        "anomaly": "LOCATION_DISCREPANCY"
      }
    }
  ]
}
```

---

## 4. Merkle-Tree Cryptographic Audit Trail Architecture

To prevent dispute record alteration by malicious insiders or compromised API tokens, every state mutation undergoes hash chaining and Merkle tree root compilation:

$$H_i = \text{SHA-256}(L_i \parallel A_i \parallel S_{prev} \parallel S_{new} \parallel H_{i-1})$$

The Merkle Root is recursively computed pairwise over all leaf hashes:

$$\text{MerkleRoot} = \text{SHA-256}(H_{0,1} \parallel H_{2,3})$$

```
                     [ Merkle Tree Root ]
                            /     \
                     H(0,1)         H(2,3)
                     /    \         /    \
                   H(0)   H(1)    H(2)   H(3)
```

Any modification to historical states in PostgreSQL immediately invalidates the computed Merkle Root, raising the `TAMPER_DETECTED` security alert.
