"""
VerdictAI Demo Evidence Generator
Generates realistic, professional dummy evidence files (PDFs, PNGs, and TXT files)
tailored for live demonstrations of VerdictAI dispute resolution workflows.
"""

import os
import hashlib
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

OUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "demo_evidence"))
os.makedirs(OUT_DIR, exist_ok=True)


def create_croma_invoice_pdf():
    pdf_path = os.path.join(OUT_DIR, "Croma_Tax_Invoice_INV-882910.pdf")
    doc = SimpleDocTemplate(pdf_path, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()
    story = []

    # Title / Header
    title_style = ParagraphStyle(
        'InvoiceHeader',
        parent=styles['Heading1'],
        fontSize=20,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=4,
    )
    sub_style = ParagraphStyle(
        'InvoiceSub',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.HexColor('#475569'),
    )

    story.append(Paragraph("<b>CROMA ELECTRONICS INDIA PVT LTD</b>", title_style))
    story.append(Paragraph("GSTIN: 29AABCC8819Q1ZN | Tax Invoice / Bill of Supply", sub_style))
    story.append(Paragraph("Indiranagar Retail Hub, 100 Feet Rd, HAL 2nd Stage, Bengaluru, Karnataka 560038", sub_style))
    story.append(Spacer(1, 14))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#2563EB'), spaceAfter=14))

    # Meta Table
    meta_data = [
        [
            Paragraph("<b>Invoice Number:</b> INV-882910<br/><b>Invoice Date:</b> 12-Oct-2026<br/><b>Order ID:</b> OD-CROMA-992810", sub_style),
            Paragraph("<b>Billed To:</b><br/>Pooja Iyer<br/>Flat 402, Palm Heights, 12th Main<br/>Indiranagar, Bengaluru 560038<br/>Mob: +91 98450 12345", sub_style)
        ]
    ]
    t_meta = Table(meta_data, colWidths=[270, 270])
    t_meta.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 16))

    # Line Items Table
    headers = [Paragraph("<b>Item Description</b>", sub_style), Paragraph("<b>HSN Code</b>", sub_style), Paragraph("<b>Qty</b>", sub_style), Paragraph("<b>Rate (INR)</b>", sub_style), Paragraph("<b>Total (INR)</b>", sub_style)]
    row1 = [Paragraph("OnePlus Pad Go (Wi-Fi, 128GB, Twin Mint)<br/><font size=7 color='#64748B'>Serial: WX8819203810 | 1 Year Warranty</font>", sub_style), "8471", "1", "16,099.15", "16,099.15"]
    row2 = [Paragraph("CGST (9%)", sub_style), "-", "-", "-", "1,449.92"]
    row3 = [Paragraph("SGST (9%)", sub_style), "-", "-", "-", "1,449.93"]
    row_total = [Paragraph("<b>Grand Total:</b>", sub_style), "", "", "", Paragraph("<b>₹18,999.00</b>", sub_style)]

    items_table = Table([headers, row1, row2, row3, row_total], colWidths=[240, 70, 40, 95, 95])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#EFF6FF')),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 16))

    # Payment info
    pay_data = [
        [
            Paragraph("<b>Payment Information:</b><br/>Method: RuPay Platinum Card (HDFC Bank)<br/>Card Number: **** **** **** 4492<br/>Auth Code: 881920 | Txn ID: TXN-882910<br/>Status: CAPTURED & SETTLED", sub_style),
            Paragraph("<b>Logistics / Carrier:</b><br/>Carrier Partner: Blue Dart Express<br/>Waybill AWB: BLUEDART-88192034<br/>Expected Delivery: 14-Oct-2026", sub_style)
        ]
    ]
    t_pay = Table(pay_data, colWidths=[270, 270])
    t_pay.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F1F5F9')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_pay)
    story.append(Spacer(1, 20))

    story.append(Paragraph("<font size=8 color='#94A3B8'>This is a computer-generated invoice authenticated under Section 31 of the CGST Act 2017. Registered Office: Infiniti Retail Limited.</font>", sub_style))
    doc.build(story)


def create_bluedart_pod_pdf():
    pdf_path = os.path.join(OUT_DIR, "BlueDart_Express_POD_BLUEDART-88192034.pdf")
    doc = SimpleDocTemplate(pdf_path, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()
    story = []

    sub_style = ParagraphStyle('PODSub', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor('#334155'))

    story.append(Paragraph("<b>BLUE DART EXPRESS LIMITED</b>", ParagraphStyle('H1', parent=styles['Heading1'], fontSize=18, textColor=colors.HexColor('#1E3A8A'))))
    story.append(Paragraph("Official Proof of Delivery (POD) & Telematics Telemetry Record", sub_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#1E3A8A'), spaceAfter=14))

    pod_info = [
        [Paragraph("<b>AWB Tracking No:</b> BLUEDART-88192034", sub_style), Paragraph("<b>Carrier Mode:</b> Surface Express Apex", sub_style)],
        [Paragraph("<b>Origin:</b> Indiranagar Hub, Bengaluru", sub_style), Paragraph("<b>Destination:</b> Indiranagar HAL 2nd Stage", sub_style)],
        [Paragraph("<b>Delivery Status:</b> <font color='#16A34A'><b>DELIVERED</b></font>", sub_style), Paragraph("<b>Timestamp:</b> 14-Oct-2026 15:42:18 IST", sub_style)],
        [Paragraph("<b>Recipient Sign-off:</b> 'Security / Gate'", sub_style), Paragraph("<b>Courier Boy ID:</b> BDL-BLR-441 (Ramesh K.)", sub_style)]
    ]
    t_pod = Table(pod_info, colWidths=[270, 270])
    t_pod.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_pod)
    story.append(Spacer(1, 16))

    story.append(Paragraph("<b>GPS Telematics Audit (Key Evidence Discrepancy):</b>", ParagraphStyle('H3', parent=styles['Heading3'], fontSize=11, textColor=colors.HexColor('#B91C1C'))))
    
    geo_data = [
        [Paragraph("<b>Parameter</b>", sub_style), Paragraph("<b>Registered Residence Coordinate</b>", sub_style), Paragraph("<b>Actual Drop-Off Coordinate</b>", sub_style), Paragraph("<b>Variance</b>", sub_style)],
        [Paragraph("GPS Latitude", sub_style), "12.9783° N", "12.9510° N", Paragraph("<font color='#DC2626'><b>-0.0273° (Misplaced)</b></font>", sub_style)],
        [Paragraph("GPS Longitude", sub_style), "77.6408° E", "77.6720° E", Paragraph("<font color='#DC2626'><b>+0.0312° (Misplaced)</b></font>", sub_style)],
        [Paragraph("Radial Distance", sub_style), "Indiranagar Flat 402", "HAL Old Airport Gate 3", Paragraph("<font color='#DC2626'><b>3.2 km Divergence</b></font>", sub_style)],
    ]
    t_geo = Table(geo_data, colWidths=[135, 140, 140, 125])
    t_geo.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#FEF2F2')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#991B1B')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#FECACA')),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_geo)
    story.append(Spacer(1, 16))

    story.append(Paragraph("<font size=8 color='#64748B'>Telemetry captured via Blue Dart Handheld Scanner GPS Module #HH-9921. SHA-256 verification hash: 88192034adcbfe00192834710192837461928304918273645019283746192038.</font>", sub_style))
    doc.build(story)


def create_cybercrime_acknowledgement_pdf():
    pdf_path = os.path.join(OUT_DIR, "National_Cyber_Crime_Portal_Acknowledgement_2026_IN.pdf")
    doc = SimpleDocTemplate(pdf_path, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()
    story = []

    sub_style = ParagraphStyle('CyberSub', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor('#1E293B'))

    story.append(Paragraph("<b>NATIONAL CYBER CRIME REPORTING PORTAL</b>", ParagraphStyle('H1', parent=styles['Heading1'], fontSize=16, textColor=colors.HexColor('#991B1B'))))
    story.append(Paragraph("Ministry of Home Affairs, Government of India (cybercrime.gov.in)", sub_style))
    story.append(Paragraph("<b>ACKNOWLEDGEMENT RECEIPT (FORM 107-B)</b>", ParagraphStyle('Sub', parent=styles['Normal'], fontSize=10, textColor=colors.HexColor('#475569'))))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#991B1B'), spaceAfter=14))

    ack_data = [
        [Paragraph("<b>Acknowledgement No:</b>", sub_style), "2026/CYBER/BLR/99281-F"],
        [Paragraph("<b>Date & Time of Filing:</b>", sub_style), "12-Oct-2026 19:15:33 IST"],
        [Paragraph("<b>Complainant Name:</b>", sub_style), "Pooja Iyer"],
        [Paragraph("<b>Incident Category:</b>", sub_style), "Financial Fraud > Unauthorized Online Card-Not-Present Charge"],
        [Paragraph("<b>Disputed Amount:</b>", sub_style), "₹24,999.00 INR"],
        [Paragraph("<b>Beneficiary / Merchant:</b>", sub_style), "Tata CLiQ Luxury (Merchant ID: MID-TATA-88192)"],
        [Paragraph("<b>Card Identity:</b>", sub_style), "HDFC Bank RuPay Platinum (Card ending in 4492)"],
        [Paragraph("<b>Originating IP Telemetry:</b>", sub_style), "185.220.101.44 (Tor Exit Node, Bucharest Romania)"],
        [Paragraph("<b>Status:</b>", sub_style), "<font color='#16A34A'><b>FIR REGISTERED & INTIMATION FORWARDED TO HDFC DISPUTE OPS</b></font>"],
    ]
    t_ack = Table(ack_data, colWidths=[180, 360])
    t_ack.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_ack)
    story.append(Spacer(1, 14))

    story.append(Paragraph("<b>Official Police / Investigating Officer Remarks:</b>", ParagraphStyle('H3', parent=styles['Heading3'], fontSize=10, textColor=colors.HexColor('#0F172A'))))
    story.append(Paragraph(
        "Cardholder verified physical possession of the RuPay Platinum card in Bengaluru at the time of debit. "
        "No OTP was delivered or entered on cardholder's registered mobile device (+91 98450 12345). "
        "Charge is prima facie fraudulent under IPC Section 420 r/w IT Act 66D. Bank recommended to reverse charge.",
        sub_style
    ))
    doc.build(story)


def create_swiggy_duplicate_statement_pdf():
    pdf_path = os.path.join(OUT_DIR, "HDFC_Bank_RuPay_Statement_Duplicate_Charge.pdf")
    doc = SimpleDocTemplate(pdf_path, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()
    story = []

    sub_style = ParagraphStyle('HDFCSub', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor('#0F172A'))

    story.append(Paragraph("<b>HDFC BANK LIMITED</b>", ParagraphStyle('H1', parent=styles['Heading1'], fontSize=18, textColor=colors.HexColor('#1E3A8A'))))
    story.append(Paragraph("Official Card Account Mini-Statement & Electronic Transaction Ledger", sub_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#1E3A8A'), spaceAfter=14))

    card_meta = [
        [Paragraph("<b>Cardholder:</b> Pooja Iyer", sub_style), Paragraph("<b>Card Type:</b> RuPay Platinum Credit", sub_style)],
        [Paragraph("<b>Card Number:</b> **** **** **** 4492", sub_style), Paragraph("<b>Billing Cycle:</b> Oct 2026", sub_style)],
    ]
    t_meta = Table(card_meta, colWidths=[270, 270])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 16))

    story.append(Paragraph("<b>Recent Transaction Excerpt (Flagged Consecutive Debits):</b>", ParagraphStyle('H3', parent=styles['Heading3'], fontSize=11, textColor=colors.HexColor('#DC2626'))))
    
    headers = [Paragraph("<b>Date / Time</b>", sub_style), Paragraph("<b>Transaction Description</b>", sub_style), Paragraph("<b>POS Ref / Auth</b>", sub_style), Paragraph("<b>Amount (INR)</b>", sub_style)]
    r1 = ["18-Oct-2026 20:11:04", "SWIGGY INSTAMART BANGALORE IN", "POS-SWIG-BLR-88 / AUTH: 192801", "₹1,499.00 (DR)"]
    r2 = ["18-Oct-2026 20:13:02", "SWIGGY INSTAMART BANGALORE IN", "POS-SWIG-BLR-88 / AUTH: 192802", Paragraph("<font color='#DC2626'><b>₹1,499.00 (DUPLICATE)</b></font>", sub_style)]
    r3 = ["17-Oct-2026 12:44:19", "SHELL PETROL STATION INDIRANAGAR", "POS-SHL-0021 / AUTH: 881920", "₹2,800.00 (DR)"]
    
    t_txns = Table([headers, r1, r2, r3], colWidths=[130, 190, 140, 80])
    t_txns.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('PADDING', (0,0), (-1,-1), 6),
        ('BACKGROUND', (0,2), (-1,2), colors.HexColor('#FEF2F2')),
    ]))
    story.append(t_txns)
    story.append(Spacer(1, 16))

    story.append(Paragraph(
        "<b>Automated Telemetry Analysis:</b> POS Terminal Sequence Match is 100%. "
        "Time gap is 118 seconds with identical billed amounts and identical merchant category code (MCC 5411). "
        "Classic duplicate network retry or dual-swipe error.",
        sub_style
    ))
    doc.build(story)


def create_security_gate_cctv_image():
    img_path = os.path.join(OUT_DIR, "Society_Gate_Security_CCTV_Log.png")
    width, height = 800, 500
    img = Image.new('RGB', (width, height), color='#FFFFFF')
    draw = ImageDraw.Draw(img)

    # Header Banner
    draw.rectangle([(0, 0), (width, 80)], fill='#0F172A')
    draw.text((25, 20), "PALM HEIGHTS RESIDENTS APARTMENT ASSOCIATION", fill='#FFFFFF')
    draw.text((25, 45), "Main Security Gate Visitor & Courier Inward Registry — CCTV Monitored", fill='#94A3B8')

    # Border
    draw.rectangle([(20, 100), (width - 20, height - 30)], outline='#CBD5E1', width=2)
    
    # Table Header
    draw.rectangle([(20, 100), (width - 20, 140)], fill='#F1F5F9')
    draw.text((35, 115), "TIME (IST)", fill='#0F172A')
    draw.text((120, 115), "COURIER / VISITOR", fill='#0F172A')
    draw.text((280, 115), "FLAT NO", fill='#0F172A')
    draw.text((360, 115), "PARCEL / ITEM DETAILS", fill='#0F172A')
    draw.text((580, 115), "GUARD SIGN / REMARKS", fill='#0F172A')

    # Rows
    y = 150
    rows = [
        ("14:15", "Amazon Logistics", "Flat 102", "1 Carton Box (Groceries)", "Signed (Guard Kumar)"),
        ("14:40", "Zomato Rider (Anil)", "Flat 305", "Food Parcel", "Visitor Pass #881"),
        ("15:30", "Swiggy Instamart", "Flat 402", "Small bag", "Received by resident"),
        ("15:45", "NO BLUE DART ENTRY", "Flat 402", "NO PARCEL RECEIVED FOR 402", "CCTV Checked: No Blue Dart van arrived"),
        ("16:10", "Delhivery Logistics", "Flat 201", "Fashion parcel", "Signed (Guard Kumar)"),
    ]

    for time_s, courier, flat, details, remarks in rows:
        if "NO BLUE DART" in courier:
            draw.rectangle([(21, y - 5), (width - 21, y + 25)], fill='#FEE2E2')
            fill_col = '#B91C1C'
        else:
            fill_col = '#334155'

        draw.text((35, y), time_s, fill=fill_col)
        draw.text((120, y), courier, fill=fill_col)
        draw.text((280, y), flat, fill=fill_col)
        draw.text((360, y), details, fill=fill_col)
        draw.text((580, y), remarks, fill=fill_col)
        draw.line([(20, y + 30), (width - 20, y + 30)], fill='#E2E8F0', width=1)
        y += 40

    # Official Stamp
    draw.ellipse([(620, 360), (740, 440)], outline='#2563EB', width=3)
    draw.text((640, 390), "VERIFIED", fill='#2563EB')
    draw.text((635, 405), "SECURITY CHIEF", fill='#2563EB')

    img.save(img_path)


def create_text_evidence_files():
    # 1. Croma Tax Invoice Text
    with open(os.path.join(OUT_DIR, "Croma_Tax_Invoice_INV-882910.txt"), "w", encoding="utf-8") as f:
        f.write("""=============================================================
CROMA ELECTRONICS INDIA PVT LTD - TAX INVOICE
=============================================================
Invoice No     : INV-882910
Date           : 12-OCT-2026
GSTIN          : 29AABCC8819Q1ZN
Billed To      : Pooja Iyer, Flat 402 Palm Heights, Indiranagar, Bengaluru
Card Paid      : HDFC Bank RuPay Platinum **** 4492
Transaction ID : TXN-882910
Item           : OnePlus Pad Go (Wi-Fi, 128GB, Twin Mint)
Quantity       : 1
Amount         : INR 16,099.15
CGST (9%)      : INR 1,449.92
SGST (9%)      : INR 1,449.93
TOTAL BILLED   : INR 18,999.00
Carrier        : Blue Dart Express (Waybill AWB: BLUEDART-88192034)
=============================================================
""")

    # 2. Blue Dart Tracking Text
    with open(os.path.join(OUT_DIR, "BlueDart_Tracking_BLUEDART-88192034.txt"), "w", encoding="utf-8") as f:
        f.write("""=============================================================
BLUE DART EXPRESS LIMITED - SHIPMENT TRACKING & POD
=============================================================
Waybill AWB     : BLUEDART-88192034
Status          : DELIVERED
Delivery Date   : 14-OCT-2026 15:42:18 IST
Signed By       : Security Gate
Destination Addr: Flat 402, Palm Heights, Indiranagar, Bengaluru
GPS Telematics  : Drop-off Location = 12.9510 N, 77.6720 E
Expected Loc    : Registered Residence = 12.9783 N, 77.6408 E
Radial Variance : 3.2 KM AWAY FROM MEMBER ADDRESS
Scanner Unit    : Blue Dart Handheld Scanner #HH-BLR-9921
=============================================================
""")

    # 3. Tata CLiQ Fraud Order Dispatch Text
    with open(os.path.join(OUT_DIR, "Tata_CLiQ_Order_Confirmation_TXN-TATACLIQ-99281.txt"), "w", encoding="utf-8") as f:
        f.write("""=============================================================
TATA CLIQ LUXURY - ORDER DISPATCH LOG
=============================================================
Order ID        : OD-TATACLIQ-99281
Transaction ID  : TXN-TATACLIQ-99281
Amount          : INR 24,999.00
Payment Method  : RuPay Platinum Card **** 4492
Cardholder Name : Pooja Iyer
Billed Amount   : INR 24,999.00
Merchant ID     : MID-TATA-88192
Originating IP  : 185.220.101.44 (Tor Exit Relay, Bucharest, Romania)
Device Profile  : Linux x86_64; HeadlessChrome/124.0.0.0 (Bot User-Agent)
2FA OTP Status  : BYPASSED (No 3D-Secure SMS Triggered)
Shipping Addr   : Unauthorized Freight Forwarding Hub, Bucharest Sector 1
=============================================================
""")

    # 4. Swiggy Support Chat Transcript
    with open(os.path.join(OUT_DIR, "Swiggy_Customer_Support_Chat_Transcript.txt"), "w", encoding="utf-8") as f:
        f.write("""=============================================================
SWIGGY INSTAMART - CUSTOMER SUPPORT CHAT TRANSCRIPT
=============================================================
Ticket ID       : #SWG-992102
Customer        : Pooja Iyer (+91 98450 12345)
Date            : 18-Oct-2026 20:25 IST
Issue           : Duplicate Charge on RuPay Card (₹1,499 x 2)

[20:25:10] Pooja Iyer: Hi, I ordered groceries for ₹1,499 on Swiggy Instamart, but my HDFC RuPay card was debited twice at 20:11 and 20:13.
[20:26:02] Swiggy Bot: Checking your order details for Order #SWIG-BLR-8819...
[20:27:15] Swiggy Executive (Rahul): Hello Pooja. I can see that the POS terminal retried payment and debited ₹1,499 twice for Order #SWIG-BLR-8819.
[20:28:40] Swiggy Executive (Rahul): We have initiated a refund on our end for the duplicate transaction, but it may take 5-7 business days to reflect in your HDFC bank account.
[20:29:10] Pooja Iyer: Understood. I will submit this transcript to the VerdictAI dispute portal for expedited bank credit.
=============================================================
""")

    # 5. README Guide for Demo
    with open(os.path.join(OUT_DIR, "README_DEMO_GUIDE.md"), "w", encoding="utf-8") as f:
        f.write("""# VerdictAI Demo Evidence Kit

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
   - Browse to `d:\\WSSOA Project\\demo_evidence\\` and pick any PDF or PNG from above.
   - Watch VerdictAI calculate the SHA-256 fingerprint, parse file size, and register it in the unified case file.

2. **In the Cardholder Portal / Mobile App:**
   - Go to **"+ File a New Dispute"**.
   - Select the transaction and reason.
   - Click **"Upload Supporting Bill / Receipt / Chat Proof"** and select the matching file.
   - Submit the cryptographically signed dispute.
""")


if __name__ == "__main__":
    print(f"Generating demo evidence files into: {OUT_DIR}")
    create_croma_invoice_pdf()
    print("[OK] Created Croma_Tax_Invoice_INV-882910.pdf")
    create_bluedart_pod_pdf()
    print("[OK] Created BlueDart_Express_POD_BLUEDART-88192034.pdf")
    create_cybercrime_acknowledgement_pdf()
    print("[OK] Created National_Cyber_Crime_Portal_Acknowledgement_2026_IN.pdf")
    create_swiggy_duplicate_statement_pdf()
    print("[OK] Created HDFC_Bank_RuPay_Statement_Duplicate_Charge.pdf")
    create_security_gate_cctv_image()
    print("[OK] Created Society_Gate_Security_CCTV_Log.png")
    create_text_evidence_files()
    print("[OK] Created TXT and Markdown documentation files")
    print(f"\nAll dummy files ready in: {OUT_DIR}")
