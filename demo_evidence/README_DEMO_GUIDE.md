# VerdictAI Demo Evidence Kit

This folder contains realistic, authentic dummy evidence documents designed for end-to-end demonstrations of **VerdictAI** in both the **Web Console** and the **Mobile App**.

---

## Files Included & Corresponding Use Cases

### 1. Case: Product Not Received (`₹18,999.00`) – Croma OnePlus Pad
* **[Croma_Tax_Invoice_INV-882910.pdf](./Croma_Tax_Invoice_INV-882910.pdf)**
  * *Type:* Merchant Tax Invoice (PDF)
  * *Details:* Croma Indiranagar Bengaluru, GSTIN, itemized breakdown of OnePlus tablet, billed to Pooja Iyer on RuPay Platinum `**** 4492`.
* **[BlueDart_Express_POD_BLUEDART-88192034.pdf](./BlueDart_Express_POD_BLUEDART-88192034.pdf)**
  * *Type:* Courier Proof of Delivery & Telematics (PDF)
  * *Details:* Status DELIVERED with GPS drop-off coordinates (`12.9510° N, 77.6720° E`), showing **3.2 km divergence** from customer's Indiranagar residence.
* **[Society_Gate_Security_CCTV_Log.png](./Society_Gate_Security_CCTV_Log.png)**
  * *Type:* Gate Security Log / CCTV Inward Register (PNG Image)
  * *Details:* Palm Heights Indiranagar visitor register confirming no Blue Dart courier arrived for Flat 402.

---

### 2. Case: Fraudulent / Unrecognized Transaction (`₹24,999.00`) – Tata CLiQ Luxury
* **[National_Cyber_Crime_Portal_Acknowledgement_2026_IN.pdf](./National_Cyber_Crime_Portal_Acknowledgement_2026_IN.pdf)**
  * *Type:* Government Cyber Crime FIR / Complaint Receipt (PDF)
  * *Details:* Ministry of Home Affairs cyber crime receipt noting Tor exit node in Bucharest Romania and bypassed 2FA OTP.
* **[Tata_CLiQ_Order_Confirmation_TXN-TATACLIQ-99281.txt](./Tata_CLiQ_Order_Confirmation_TXN-TATACLIQ-99281.txt)**
  * *Type:* Order Dispatch Telemetry (Text)
  * *Details:* Headless Chrome bot user-agent and unauthorized overseas delivery address.

---

### 3. Case: Duplicate Charge (`₹1,499.00`) – Swiggy Instamart
* **[HDFC_Bank_RuPay_Statement_Duplicate_Charge.pdf](./HDFC_Bank_RuPay_Statement_Duplicate_Charge.pdf)**
  * *Type:* Bank Statement Excerpt (PDF)
  * *Details:* Shows two identical debits of ₹1,499.00 on the same POS terminal within 118 seconds.
* **[Swiggy_Customer_Support_Chat_Transcript.txt](./Swiggy_Customer_Support_Chat_Transcript.txt)**
  * *Type:* Customer Support Chat Log (Text)
  * *Details:* Swiggy representative confirming dual-swipe terminal error.

---

## How to Use in Demo

1. **In the Web Console:**
   - Go to **Case Queue** -> Click any case (e.g. *Fraudulent Transaction* or *Product Not Received*).
   - Under **Attached Polymorphic Evidence**, click **"Upload Manual Proof"**.
   - Browse to `d:\WSSOA Project\demo_evidence\` and pick any PDF or PNG from above.
   - Watch VerdictAI calculate the SHA-256 fingerprint, parse file size, and register it in the unified case file.

2. **In the Cardholder Portal / Mobile App:**
   - Go to **"+ File a New Dispute"**.
   - Select the transaction and reason.
   - Click **"Upload Supporting Bill / Receipt / Chat Proof"** and select the matching file.
   - Submit the cryptographically signed dispute.
