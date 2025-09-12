-- NETPRO Management System Sample Data
-- Insert sample data for testing and demonstration

USE netpro_management;

-- Insert admin user (password: admin123 - should be hashed in production)
INSERT INTO users (username, email, password_hash, role) VALUES
('admin', 'admin@netpro.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('manager', 'manager@netpro.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'manager'),
('staff', 'staff@netpro.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'staff');

-- Insert categories
INSERT INTO categories (name, description) VALUES
('Electronics', 'Electronic devices and gadgets'),
('Accessories', 'Various accessories and add-ons'),
('Wearables', 'Wearable technology devices'),
('Cables', 'Cables and connectors'),
('Chargers', 'Charging devices and power supplies'),
('Audio', 'Audio equipment and accessories'),
('Mobile', 'Mobile phone accessories'),
('Computer', 'Computer accessories and peripherals');

-- Insert products
INSERT INTO products (name, sku, description, category_id, price, cost_price, stock_quantity, min_stock_level, status) VALUES
('Wireless Bluetooth Headphones', 'WBH-001', 'High-quality wireless headphones with noise cancellation', 1, 79.99, 45.00, 45, 10, 'active'),
('Smart Fitness Watch', 'SFW-002', 'Advanced fitness tracking smartwatch', 3, 199.99, 120.00, 23, 5, 'active'),
('Portable Laptop Stand', 'PLS-003', 'Adjustable aluminum laptop stand', 2, 29.99, 15.00, 67, 15, 'active'),
('USB-C Charging Cable', 'UCC-004', '6ft braided USB-C cable', 4, 12.99, 6.50, 156, 25, 'active'),
('Wireless Phone Charger', 'WPC-005', '15W fast wireless charging pad', 5, 34.99, 20.00, 0, 10, 'active'),
('Bluetooth Speaker', 'BTS-006', 'Portable waterproof Bluetooth speaker', 6, 49.99, 28.00, 34, 8, 'active'),
('Phone Case - iPhone', 'PCI-007', 'Protective case for iPhone models', 7, 19.99, 8.00, 89, 20, 'active'),
('Wireless Mouse', 'WM-008', 'Ergonomic wireless optical mouse', 8, 24.99, 12.00, 78, 15, 'active'),
('Gaming Keyboard', 'GK-009', 'Mechanical RGB gaming keyboard', 8, 89.99, 55.00, 12, 5, 'active'),
('Tablet Stand', 'TS-010', 'Adjustable tablet and phone stand', 2, 16.99, 8.50, 45, 12, 'active');

-- Insert customers
INSERT INTO customers (first_name, last_name, email, phone, status) VALUES
('John', 'Doe', 'john@example.com', '+1-555-123-4567', 'active'),
('Jane', 'Smith', 'jane@example.com', '+1-555-234-5678', 'active'),
('Bob', 'Johnson', 'bob@example.com', '+1-555-345-6789', 'vip'),
('Alice', 'Brown', 'alice@example.com', '+1-555-456-7890', 'active'),
('Charlie', 'Wilson', 'charlie@example.com', '+1-555-567-8901', 'inactive'),
('Diana', 'Davis', 'diana@example.com', '+1-555-678-9012', 'active'),
('Edward', 'Miller', 'edward@example.com', '+1-555-789-0123', 'vip'),
('Fiona', 'Garcia', 'fiona@example.com', '+1-555-890-1234', 'active');

-- Insert customer addresses
INSERT INTO customer_addresses (customer_id, type, first_name, last_name, address_line_1, city, state, postal_code, country, is_default) VALUES
(1, 'billing', 'John', 'Doe', '123 Main St', 'New York', 'NY', '10001', 'USA', TRUE),
(1, 'shipping', 'John', 'Doe', '123 Main St', 'New York', 'NY', '10001', 'USA', TRUE),
(2, 'billing', 'Jane', 'Smith', '456 Oak Ave', 'Los Angeles', 'CA', '90210', 'USA', TRUE),
(2, 'shipping', 'Jane', 'Smith', '456 Oak Ave', 'Los Angeles', 'CA', '90210', 'USA', TRUE),
(3, 'billing', 'Bob', 'Johnson', '789 Pine St', 'Chicago', 'IL', '60601', 'USA', TRUE),
(3, 'shipping', 'Bob', 'Johnson', '789 Pine St', 'Chicago', 'IL', '60601', 'USA', TRUE);

-- Insert orders
INSERT INTO orders (order_number, customer_id, status, subtotal, tax_amount, shipping_amount, total_amount, payment_status, payment_method) VALUES
('ORD-3210', 1, 'completed', 229.97, 18.40, 9.99, 258.36, 'paid', 'Credit Card'),
('ORD-3209', 2, 'pending', 149.98, 12.00, 9.99, 171.97, 'pending', 'PayPal'),
('ORD-3208', 3, 'processing', 319.96, 25.60, 0.00, 345.56, 'paid', 'Credit Card'),
('ORD-3207', 4, 'shipped', 119.99, 9.60, 9.99, 139.58, 'paid', 'Debit Card'),
('ORD-3206', 1, 'delivered', 279.97, 22.40, 9.99, 312.36, 'paid', 'Credit Card');

-- Insert order items
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES
-- Order 1 items
(1, 1, 1, 79.99, 79.99),
(1, 2, 1, 199.99, 199.99),
(1, 4, 2, 12.99, 25.98),
-- Order 2 items
(2, 3, 2, 29.99, 59.98),
(2, 8, 1, 24.99, 24.99),
(2, 10, 1, 16.99, 16.99),
-- Order 3 items
(3, 2, 1, 199.99, 199.99),
(3, 9, 1, 89.99, 89.99),
(3, 3, 1, 29.99, 29.99),
-- Order 4 items
(4, 1, 1, 79.99, 79.99),
(4, 7, 2, 19.99, 39.98),
-- Order 5 items
(5, 2, 1, 199.99, 199.99),
(5, 1, 1, 79.99, 79.99);

-- Insert inventory transactions
INSERT INTO inventory_transactions (product_id, transaction_type, quantity, reference_type, reference_id, notes) VALUES
(1, 'out', 2, 'order', 1, 'Order fulfillment'),
(2, 'out', 2, 'order', 1, 'Order fulfillment'),
(4, 'out', 2, 'order', 1, 'Order fulfillment'),
(3, 'out', 2, 'order', 2, 'Order fulfillment'),
(8, 'out', 1, 'order', 2, 'Order fulfillment'),
(10, 'out', 1, 'order', 2, 'Order fulfillment');

-- Insert system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('company_name', 'NETPRO', 'string', 'Company name'),
('company_email', 'admin@netpro.com', 'string', 'Company contact email'),
('company_phone', '+1 (555) 123-4567', 'string', 'Company phone number'),
('default_currency', 'USD', 'string', 'Default currency for transactions'),
('tax_rate', '8.0', 'number', 'Default tax rate percentage'),
('shipping_rate', '9.99', 'number', 'Default shipping rate'),
('low_stock_threshold', '10', 'number', 'Low stock alert threshold'),
('email_notifications', 'true', 'boolean', 'Enable email notifications'),
('sms_notifications', 'false', 'boolean', 'Enable SMS notifications');
