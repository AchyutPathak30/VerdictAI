-- ====================================================================
-- VerdictAI: Frictionless Dispute & Chargeback Resolution
-- PostgreSQL Seed Data for Testing and Verification
-- Author: Nirav Kachhiya (Project Lead / Backend Engineer)
-- ====================================================================

-- 1. Insert Initial Users
INSERT INTO users (id, email, full_name, phone_number, role)
VALUES 
    ('a0000000-0000-0000-0000-000000000001', 'cardholder.alice@example.com', 'Alice Smith', '+1-555-0199', 'CARDHOLDER'),
    ('a0000000-0000-0000-0000-000000000002', 'cardholder.bob@example.com', 'Bob Johnson', '+1-555-0198', 'CARDHOLDER'),
    ('a0000000-0000-0000-0000-000000000003', 'merchant.admin@apexretail.com', 'Apex Retail Ops', '+1-555-0150', 'MERCHANT'),
    ('a0000000-0000-0000-0000-000000000004', 'analyst.nirav@verdictai-bank.com', 'Nirav Kachhiya', '+1-555-0101', 'ADMIN')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Test Merchants
INSERT INTO merchants (id, merchant_name, merchant_category_code, contact_email, risk_tier, historical_dispute_rate)
VALUES
    ('m0000000-0000-0000-0000-000000000001', 'Apex Electronics Direct', '5732', 'support@apexretail.com', 'LOW', 0.0035),
    ('m0000000-0000-0000-0000-000000000002', 'CloudStream Media SaaS', '5817', 'billing@cloudstream.io', 'LOW', 0.0012)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Test Transactions
INSERT INTO transactions (id, user_id, merchant_id, amount, currency, payment_method, original_auth_code, terminal_city, terminal_country, is_disputed, transaction_timestamp)
VALUES
    ('t0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'm0000000-0000-0000-0000-000000000001', 349.99, 'USD', 'VISA_CREDIT', 'AUTH_981245', 'San Francisco', 'USA', TRUE, CURRENT_TIMESTAMP - INTERVAL '5 days'),
    ('t0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'm0000000-0000-0000-0000-000000000002', 49.00, 'USD', 'MASTERCARD', 'AUTH_441920', 'New York', 'USA', TRUE, CURRENT_TIMESTAMP - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Test Disputes
INSERT INTO disputes (id, transaction_id, cardholder_id, dispute_reason, disputed_amount, current_status, merchant_sla_hours, sla_deadline, cardholder_statement)
VALUES
    ('d0000000-0000-0000-0000-000000000001', 't0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'PRODUCT_NOT_RECEIVED', 349.99, 'EVIDENCE_INGESTED', 48, CURRENT_TIMESTAMP + INTERVAL '24 hours', 'I ordered a 4K monitor on August 10th but tracking has shown no movement for 10 days.'),
    ('d0000000-0000-0000-0000-000000000002', 't0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'SUBSCRIPTION_CANCELLED_CHARGED', 49.00, 'SUBMITTED', 48, CURRENT_TIMESTAMP + INTERVAL '46 hours', 'I cancelled my subscription on August 1st via portal, but was charged on August 15th.')
ON CONFLICT (id) DO NOTHING;
