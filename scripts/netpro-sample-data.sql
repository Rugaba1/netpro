-- NETPRO Management System Sample Data
-- Insert sample data matching the screenshots

USE netpro_management;

-- Insert admin user (password should be hashed in production)
INSERT INTO users (username, email, password_hash, role) VALUES
('admin', 'admin@netpro.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Insert packages
INSERT INTO packages (package_type, package_description, created_at, updated_at) VALUES
('4G LTE', 'This Package Is For Those Big Company', '2025-02-13 05:22:29', '2025-03-28 03:00:50'),
('BROADBAND', 'This Package Is For Those Big Company', '2025-02-13 07:44:34', '2025-03-28 04:59:22'),
('BSME', 'Broadband for SME', '2025-04-08 08:27:59', '0000-00-00 00:00:00'),
('HBB Kigali', 'HBB in Kigali area', '2025-04-10 03:43:00', '0000-00-00 00:00:00'),
('VPN BB', 'VPN Broadband', '2025-06-03 12:29:34', '0000-00-00 00:00:00'),
('YELLOW PACK', 'YELLOW PACK', '2025-06-23 04:13:48', '0000-00-00 00:00:00');

-- Insert products
INSERT INTO products (package_id, product_type, bundle, wholesales_price, selling_price, duration) VALUES
(1, 'Prepaid Unlimited', '20Mbps', 18000.00, 18000.00, '30 days'),
(2, 'MKZ-Broadband', '20Mbps', 40000.00, 40000.00, '30 days'),
(1, 'Postpaid Unlimited', '20Mbps', 20000.00, 20000.00, '30 days'),
(3, 'Prepaid', '20Mbps', 45000.00, 50000.00, '5 days'),
(4, 'Prepaid', '50Mbps', 28000.00, 30000.00, '30 days'),
(5, 'Prepaid', '5Mbps', 340000.00, 360000.00, '30 day'),
(6, 'Postpaid', 'Up to 10Mbps', 35000.00, 40000.00, '30 day');

-- Insert customers
INSERT INTO customers (customer_name, billing_name, tin, phone, service_number) VALUES
('RUGABA Innocent Gilbert', 'RCD CORPORATION Ltd', '112765478', '0780765548', '0776345214'),
('NSHIMYUMUREMYI Boniface', 'RIESCO Ltd', '122433221', '0788606201', '0776345299'),
('TUYISHIME Alain Serge', 'ERR CORP', '155243777', '0788955247', '0776345756'),
('Muhorane Eric', 'DISACCO', '108364757', '0786646456', '0771178450'),
('Muhire Egide', 'Sinotrack', '108483784', '0794374367', '0771347763'),
('RUGAJU Leogan', 'RBA', '777777779', '0780765548', '0771645293'),
('Nshuti Bosco', 'Shaoman Ltd', '108589505', '0787791893', '0771047484'),
('KBS Ltd', 'Hoklzimana Yves', '999999999', '0784874747', '0000000000'),
('Ngango Bernard', 'Nil Ltd', '888888888', '0737638788', '0771123026'),
('Kagabo Maurice', 'Spiro Ltd', '103894874', '0784747374', '0771007482');

-- Insert quotations
INSERT INTO quotations (quotation_number, customer_id, billing_name, total_amount, status, notes, created_date) VALUES
('12', 3, 'ERR CORP', 25000.00, 'draft', 'kjhgfafghjkl;kjhugfghjklhgcgvhbj', '2025-06-06');

-- Insert proforma invoices
INSERT INTO proforma_invoices (proforma_number, customer_id, billing_name, total_amount, status, created_date, expiry_date) VALUES
('PRO-20250603-5243', 9, 'Nil Ltd', 424800.00, 'sent', '2025-06-03', '2025-07-03'),
('PRO-20250508-7304', 2, 'RIESCO Ltd', 95568.20, 'converted', '2025-05-08', '2025-06-07'),
('12', 1, 'RCD CORPORATION Ltd', 20000.00, 'converted', '2025-04-17', '2025-04-02');

-- Insert invoices
INSERT INTO invoices (invoice_number, customer_id, billing_name, product_type, payment_method, amount_to_pay, paid_amount, remained_amount, started_date, expired_date) VALUES
('INV-001', 1, 'RCD CORPORATION Ltd', 'Prepaid Unlimited', 'cash', 18000.00, 18000.00, 0.00, '2025-03-04', '2025-04-04'),
('INV-002', 2, 'RIESCO Ltd', 'Prepaid Unlimited, MKZ-Broadband', 'mobile_money', 90000.00, 40000.00, 50000.00, '2025-03-18', '2025-04-18'),
('INV-003', 3, 'ERR CORP', 'Postpaid Unlimited', 'mobile_money', 20000.00, 15000.00, 5000.00, '2025-03-20', '2025-04-20'),
('INV-004', 4, 'DISACCO', 'Prepaid Unlimited, MKZ-Broadband', 'bank', 138000.00, 138000.00, 0.00, '2025-03-20', '2025-04-20'),
('INV-005', 5, 'Sinotrack', 'Postpaid Unlimited, B3TB-22s', 'mobile_money', 105000.00, 96000.00, 9000.00, '2025-03-25', '2025-04-25'),
('INV-006', 7, 'Shaoman Ltd', '50Mbps', 'mobile_money', 30000.00, 30000.00, 0.00, '2025-04-10', '2025-05-10');

-- Insert system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('company_name', 'NETPRO', 'string', 'Company name'),
('company_email', 'admin@netpro.com', 'string', 'Company contact email'),
('account_balance', '1822700', 'number', 'Current account balance in RWF'),
('default_currency', 'RWF', 'string', 'Default currency (Rwandan Franc)'),
('tax_rate', '18.0', 'number', 'Default tax rate percentage'),
('low_stock_threshold', '10', 'number', 'Low stock alert threshold');
