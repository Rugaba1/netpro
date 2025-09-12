-- =====================================================
-- NETPRO MANAGEMENT SYSTEM - COMPLETE DATABASE SETUP
-- =====================================================

-- Create database
DROP DATABASE IF EXISTS netpro_management;
CREATE DATABASE netpro_management;
USE netpro_management;

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user', 'manager') DEFAULT 'user',
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar VARCHAR(255),
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    last_login TIMESTAMP NULL,
    login_attempts INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- CUSTOMERS TABLE
-- =====================================================
CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(50) DEFAULT 'Rwanda',
    customer_type ENUM('individual', 'business', 'government') DEFAULT 'individual',
    tax_id VARCHAR(50),
    credit_limit DECIMAL(12,2) DEFAULT 0.00,
    current_balance DECIMAL(12,2) DEFAULT 0.00,
    payment_terms INT DEFAULT 30,
    discount_rate DECIMAL(5,2) DEFAULT 0.00,
    status ENUM('active', 'inactive', 'blocked') DEFAULT 'active',
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- SUPPLIERS TABLE
-- =====================================================
CREATE TABLE suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(50),
    country VARCHAR(50) DEFAULT 'Rwanda',
    tax_id VARCHAR(50),
    payment_terms INT DEFAULT 30,
    status ENUM('active', 'inactive') DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- CATEGORIES TABLE
-- =====================================================
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id INT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- =====================================================
-- PRODUCTS TABLE
-- =====================================================
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category_id INT,
    brand VARCHAR(50),
    model VARCHAR(50),
    sku VARCHAR(50) UNIQUE,
    barcode VARCHAR(100),
    price DECIMAL(12,2) NOT NULL,
    cost_price DECIMAL(12,2),
    wholesale_price DECIMAL(12,2),
    unit VARCHAR(20) DEFAULT 'pcs',
    weight DECIMAL(8,2),
    dimensions VARCHAR(50),
    tax_rate DECIMAL(5,2) DEFAULT 18.00,
    min_stock_level INT DEFAULT 10,
    max_stock_level INT DEFAULT 1000,
    reorder_point INT DEFAULT 20,
    warranty_period INT DEFAULT 0,
    status ENUM('active', 'inactive', 'discontinued') DEFAULT 'active',
    image_url VARCHAR(255),
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- STOCK TABLE
-- =====================================================
CREATE TABLE stock (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    location VARCHAR(100) DEFAULT 'Main Warehouse',
    quantity_on_hand INT NOT NULL DEFAULT 0,
    quantity_reserved INT NOT NULL DEFAULT 0,
    quantity_available INT GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
    unit_cost DECIMAL(12,2) NOT NULL,
    total_value DECIMAL(12,2) GENERATED ALWAYS AS (quantity_on_hand * unit_cost) STORED,
    last_purchase_date DATE,
    last_sale_date DATE,
    reorder_level INT DEFAULT 10,
    max_level INT DEFAULT 1000,
    supplier_id INT,
    batch_number VARCHAR(50),
    expiry_date DATE,
    notes TEXT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

-- =====================================================
-- STOCK MOVEMENTS TABLE
-- =====================================================
CREATE TABLE stock_movements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    movement_type ENUM('in', 'out', 'adjustment', 'transfer') NOT NULL,
    quantity INT NOT NULL,
    unit_cost DECIMAL(12,2),
    reference_type ENUM('purchase', 'sale', 'adjustment', 'transfer', 'return') NOT NULL,
    reference_id INT,
    location_from VARCHAR(100),
    location_to VARCHAR(100),
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- CASHPOWER TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE cashpower_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id VARCHAR(50) UNIQUE NOT NULL,
    customer_id INT,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20),
    customer_email VARCHAR(100),
    meter_number VARCHAR(50) NOT NULL,
    meter_type ENUM('prepaid', 'postpaid') DEFAULT 'prepaid',
    amount DECIMAL(12,2) NOT NULL,
    service_fee DECIMAL(12,2) DEFAULT 0.00,
    tax_amount DECIMAL(12,2) DEFAULT 0.00,
    total_amount DECIMAL(12,2) GENERATED ALWAYS AS (amount + service_fee + tax_amount) STORED,
    units DECIMAL(10,2) NOT NULL,
    rate_per_unit DECIMAL(8,4) NOT NULL,
    token VARCHAR(20) NOT NULL,
    commission DECIMAL(12,2) NOT NULL,
    commission_rate DECIMAL(5,2) DEFAULT 5.00,
    status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded') DEFAULT 'pending',
    payment_method ENUM('cash', 'mobile_money', 'bank_transfer', 'card', 'credit') DEFAULT 'cash',
    payment_reference VARCHAR(100),
    provider ENUM('eucl', 'reg', 'wasac') DEFAULT 'eucl',
    processed_by INT,
    approved_by INT,
    notes TEXT,
    error_message TEXT,
    processed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- INVOICES TABLE
-- =====================================================
CREATE TABLE invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INT,
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(100),
    customer_phone VARCHAR(20),
    customer_address TEXT,
    billing_address TEXT,
    shipping_address TEXT,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    discount_type ENUM('percentage', 'fixed') DEFAULT 'percentage',
    discount_value DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    shipping_cost DECIMAL(12,2) DEFAULT 0.00,
    total_amount DECIMAL(12,2) NOT NULL,
    paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    balance DECIMAL(12,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    status ENUM('draft', 'sent', 'viewed', 'paid', 'partial', 'overdue', 'cancelled', 'refunded') DEFAULT 'draft',
    payment_status ENUM('unpaid', 'partial', 'paid', 'overpaid', 'refunded') DEFAULT 'unpaid',
    payment_terms INT DEFAULT 30,
    due_date DATE,
    issue_date DATE NOT NULL,
    currency VARCHAR(3) DEFAULT 'RWF',
    exchange_rate DECIMAL(10,4) DEFAULT 1.0000,
    notes TEXT,
    terms_conditions TEXT,
    created_by INT,
    sent_at TIMESTAMP NULL,
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- INVOICE ITEMS TABLE
-- =====================================================
CREATE TABLE invoice_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    product_id INT,
    product_code VARCHAR(50),
    product_name VARCHAR(100) NOT NULL,
    description TEXT,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    tax_rate DECIMAL(5,2) DEFAULT 18.00,
    tax_amount DECIMAL(12,2) DEFAULT 0.00,
    line_total DECIMAL(12,2) GENERATED ALWAYS AS ((quantity * unit_price) - discount_amount + tax_amount) STORED,
    notes TEXT,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- =====================================================
-- QUOTATIONS TABLE
-- =====================================================
CREATE TABLE quotations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quotation_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INT,
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(100),
    customer_phone VARCHAR(20),
    customer_address TEXT,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    discount_type ENUM('percentage', 'fixed') DEFAULT 'percentage',
    discount_value DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(12,2) NOT NULL,
    status ENUM('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'converted') DEFAULT 'draft',
    valid_until DATE,
    issue_date DATE NOT NULL,
    currency VARCHAR(3) DEFAULT 'RWF',
    exchange_rate DECIMAL(10,4) DEFAULT 1.0000,
    notes TEXT,
    terms_conditions TEXT,
    created_by INT,
    sent_at TIMESTAMP NULL,
    accepted_at TIMESTAMP NULL,
    converted_to_invoice_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (converted_to_invoice_id) REFERENCES invoices(id) ON DELETE SET NULL
);

-- =====================================================
-- QUOTATION ITEMS TABLE
-- =====================================================
CREATE TABLE quotation_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quotation_id INT NOT NULL,
    product_id INT,
    product_code VARCHAR(50),
    product_name VARCHAR(100) NOT NULL,
    description TEXT,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    tax_rate DECIMAL(5,2) DEFAULT 18.00,
    tax_amount DECIMAL(12,2) DEFAULT 0.00,
    line_total DECIMAL(12,2) GENERATED ALWAYS AS ((quantity * unit_price) - discount_amount + tax_amount) STORED,
    notes TEXT,
    FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- =====================================================
-- PROFORMAS TABLE
-- =====================================================
CREATE TABLE proformas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proforma_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INT,
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(100),
    customer_phone VARCHAR(20),
    customer_address TEXT,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    discount_type ENUM('percentage', 'fixed') DEFAULT 'percentage',
    discount_value DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(12,2) NOT NULL,
    status ENUM('draft', 'sent', 'viewed', 'approved', 'rejected', 'expired', 'converted') DEFAULT 'draft',
    valid_until DATE,
    issue_date DATE NOT NULL,
    currency VARCHAR(3) DEFAULT 'RWF',
    exchange_rate DECIMAL(10,4) DEFAULT 1.0000,
    notes TEXT,
    terms_conditions TEXT,
    created_by INT,
    sent_at TIMESTAMP NULL,
    approved_at TIMESTAMP NULL,
    converted_to_invoice_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (converted_to_invoice_id) REFERENCES invoices(id) ON DELETE SET NULL
);

-- =====================================================
-- PROFORMA ITEMS TABLE
-- =====================================================
CREATE TABLE proforma_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proforma_id INT NOT NULL,
    product_id INT,
    product_code VARCHAR(50),
    product_name VARCHAR(100) NOT NULL,
    description TEXT,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    tax_rate DECIMAL(5,2) DEFAULT 18.00,
    tax_amount DECIMAL(12,2) DEFAULT 0.00,
    line_total DECIMAL(12,2) GENERATED ALWAYS AS ((quantity * unit_price) - discount_amount + tax_amount) STORED,
    notes TEXT,
    FOREIGN KEY (proforma_id) REFERENCES proformas(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- =====================================================
-- PACKAGES TABLE
-- =====================================================
CREATE TABLE packages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    package_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    price DECIMAL(12,2) NOT NULL,
    cost_price DECIMAL(12,2),
    duration_months INT DEFAULT 1,
    features JSON,
    includes_installation BOOLEAN DEFAULT FALSE,
    includes_support BOOLEAN DEFAULT FALSE,
    support_duration_months INT DEFAULT 0,
    warranty_months INT DEFAULT 0,
    status ENUM('active', 'inactive', 'discontinued') DEFAULT 'active',
    image_url VARCHAR(255),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- PACKAGE ITEMS TABLE
-- =====================================================
CREATE TABLE package_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    package_id INT NOT NULL,
    product_id INT,
    product_name VARCHAR(100) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    notes TEXT,
    FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- =====================================================
-- PAYMENTS TABLE
-- =====================================================
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_id INT,
    customer_id INT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_method ENUM('cash', 'mobile_money', 'bank_transfer', 'card', 'cheque', 'credit') NOT NULL,
    payment_reference VARCHAR(100),
    transaction_id VARCHAR(100),
    status ENUM('pending', 'completed', 'failed', 'cancelled', 'refunded') DEFAULT 'pending',
    payment_date DATE NOT NULL,
    notes TEXT,
    processed_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'warning', 'error', 'success', 'reminder') DEFAULT 'info',
    category ENUM('system', 'stock', 'payment', 'customer', 'order', 'report') DEFAULT 'system',
    is_read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(255),
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- SYSTEM SETTINGS TABLE
-- =====================================================
CREATE TABLE system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- AUDIT LOG TABLE
-- =====================================================
CREATE TABLE audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- INSERT SAMPLE DATA
-- =====================================================

-- Insert sample users
INSERT INTO users (username, email, password, role, full_name, phone, status) VALUES
('admin', 'admin@netpro.com', 'admin123', 'admin', 'System Administrator', '+250788123456', 'active'),
('user', 'user@netpro.com', 'user123', 'user', 'Regular User', '+250788654321', 'active'),
('manager', 'manager@netpro.com', 'manager123', 'manager', 'Sales Manager', '+250788789012', 'active'),
('john_doe', 'john@netpro.com', 'john123', 'user', 'John Doe', '+250788111222', 'active'),
('jane_smith', 'jane@netpro.com', 'jane123', 'user', 'Jane Smith', '+250788333444', 'active');

-- Insert sample suppliers
INSERT INTO suppliers (supplier_code, name, contact_person, email, phone, address, city, country, tax_id, payment_terms, status) VALUES
('SUP001', 'Dell Rwanda Ltd', 'Peter Uwimana', 'peter@dell.rw', '+250788111111', 'KG 123 St, Kimisagara', 'Kigali', 'Rwanda', 'TIN123456789', 30, 'active'),
('SUP002', 'Apple Store Rwanda', 'Mary Mukamana', 'mary@apple.rw', '+250788222222', 'KN 456 Ave, Nyamirambo', 'Kigali', 'Rwanda', 'TIN987654321', 15, 'active'),
('SUP003', 'HP Rwanda', 'Bob Nkurunziza', 'bob@hp.rw', '+250788333333', 'KK 789 Rd, Kicukiro', 'Kigali', 'Rwanda', 'TIN456789123', 30, 'active'),
('SUP004', 'Samsung Rwanda', 'Alice Uwimana', 'alice@samsung.rw', '+250788444444', 'KG 321 St, Gasabo', 'Kigali', 'Rwanda', 'TIN789123456', 30, 'active'),
('SUP005', 'Furniture Plus Ltd', 'David Habimana', 'david@furniture.rw', '+250788555555', 'KN 654 Ave, Remera', 'Kigali', 'Rwanda', 'TIN321654987', 45, 'active');

-- Insert sample categories
INSERT INTO categories (name, description, status) VALUES
('Electronics', 'Electronic devices and accessories', 'active'),
('Computers', 'Laptops, desktops, and computer accessories', 'active'),
('Mobile Phones', 'Smartphones and mobile accessories', 'active'),
('Furniture', 'Office and home furniture', 'active'),
('Printers', 'Printing devices and supplies', 'active'),
('Accessories', 'Various accessories and peripherals', 'active'),
('Software', 'Software licenses and applications', 'active'),
('Networking', 'Network equipment and accessories', 'active');

-- Insert sample customers
INSERT INTO customers (customer_code, name, email, phone, address, city, country, customer_type, tax_id, credit_limit, payment_terms, status, created_by) VALUES
('CUST001', 'John Doe', 'john@example.com', '+250788123456', 'KG 123 St, Kimisagara', 'Kigali', 'Rwanda', 'individual', NULL, 500000.00, 30, 'active', 1),
('CUST002', 'Jane Smith', 'jane@example.com', '+250788654321', 'KN 456 Ave, Nyamirambo', 'Kigali', 'Rwanda', 'individual', NULL, 300000.00, 15, 'active', 1),
('CUST003', 'Rwandan Tech Solutions Ltd', 'info@rwandatech.com', '+250788789012', 'KK 789 Rd, Kicukiro', 'Kigali', 'Rwanda', 'business', 'TIN123456789', 2000000.00, 45, 'active', 1),
('CUST004', 'Alice Uwimana', 'alice@example.com', '+250788111222', 'KG 321 St, Gasabo', 'Kigali', 'Rwanda', 'individual', NULL, 400000.00, 30, 'active', 1),
('CUST005', 'Peter Nkurunziza', 'peter@example.com', '+250788333444', 'KN 654 Ave, Remera', 'Kigali', 'Rwanda', 'business', 'TIN987654321', 1500000.00, 30, 'active', 1),
('CUST006', 'Mary Mukamana', 'mary@example.com', '+250788555666', 'KK 987 Rd, Gikondo', 'Kigali', 'Rwanda', 'individual', NULL, 250000.00, 15, 'active', 1),
('CUST007', 'Smart Business Ltd', 'info@smartbiz.rw', '+250788777888', 'KG 147 St, Kacyiru', 'Kigali', 'Rwanda', 'business', 'TIN456789123', 3000000.00, 60, 'active', 1),
('CUST008', 'Innovation Hub Rwanda', 'contact@innovation.rw', '+250788999000', 'KN 258 Ave, Kibagabaga', 'Kigali', 'Rwanda', 'business', 'TIN789123456', 2500000.00, 45, 'active', 1);

-- Insert sample products
INSERT INTO products (product_code, name, description, category_id, brand, sku, price, cost_price, wholesale_price, unit, tax_rate, min_stock_level, reorder_point, warranty_period, status, created_by) VALUES
('PROD001', 'Dell XPS 13 Laptop', 'High-performance ultrabook with Intel i7 processor, 16GB RAM, 512GB SSD', 2, 'Dell', 'DELL-XPS13-I7', 1200000.00, 850000.00, 1100000.00, 'pcs', 18.00, 5, 10, 24, 'active', 1),
('PROD002', 'iPhone 14 Pro', 'Latest Apple smartphone with advanced camera system, 128GB storage', 3, 'Apple', 'IPHONE-14PRO-128', 1099000.00, 999000.00, 1050000.00, 'pcs', 18.00, 10, 15, 12, 'active', 1),
('PROD003', 'HP LaserJet Pro P1102', 'Professional laser printer for office use, black and white printing', 5, 'HP', 'HP-LJ-P1102', 299000.00, 250000.00, 280000.00, 'pcs', 18.00, 5, 8, 12, 'active', 1),
('PROD004', 'Samsung 27" 4K Monitor', '27-inch 4K monitor with USB-C connectivity and HDR support', 1, 'Samsung', 'SAM-MON27-4K', 350000.00, 280000.00, 320000.00, 'pcs', 18.00, 8, 12, 24, 'active', 1),
('PROD005', 'Ergonomic Office Chair', 'Comfortable ergonomic office chair with lumbar support and adjustable height', 4, 'OfficeMax', 'CHAIR-ERG01', 150000.00, 120000.00, 140000.00, 'pcs', 18.00, 15, 20, 12, 'active', 1),
('PROD006', 'Wireless Mouse Logitech', 'Ergonomic wireless mouse with long battery life and precision tracking', 6, 'Logitech', 'MOUSE-WL01', 25000.00, 18000.00, 22000.00, 'pcs', 18.00, 25, 30, 6, 'active', 1),
('PROD007', 'Mechanical Keyboard RGB', 'RGB mechanical keyboard for gaming and productivity with blue switches', 6, 'Corsair', 'KB-MECH01', 89000.00, 65000.00, 80000.00, 'pcs', 18.00, 10, 15, 12, 'active', 1),
('PROD008', 'LED Desk Lamp', 'Adjustable LED desk lamp with USB charging port and touch controls', 4, 'Philips', 'LAMP-LED01', 45000.00, 35000.00, 42000.00, 'pcs', 18.00, 20, 25, 6, 'active', 1),
('PROD009', 'External Hard Drive 1TB', 'Portable external hard drive with USB 3.0 connectivity, 1TB capacity', 1, 'Seagate', 'HDD-EXT-1TB', 75000.00, 60000.00, 70000.00, 'pcs', 18.00, 15, 20, 24, 'active', 1),
('PROD010', 'Webcam HD 1080p', 'Full HD webcam with auto-focus and built-in microphone for video calls', 1, 'Logitech', 'CAM-HD-1080', 65000.00, 50000.00, 60000.00, 'pcs', 18.00, 12, 18, 12, 'active', 1);

-- Insert sample stock data
INSERT INTO stock (product_id, location, quantity_on_hand, quantity_reserved, unit_cost, supplier_id, reorder_level, max_level) VALUES
(1, 'Main Warehouse', 15, 2, 850000.00, 1, 5, 50),
(2, 'Main Warehouse', 25, 3, 999000.00, 2, 10, 100),
(3, 'Electronics Section', 8, 1, 250000.00, 3, 5, 30),
(4, 'Electronics Section', 12, 0, 280000.00, 4, 8, 40),
(5, 'Furniture Section', 30, 5, 120000.00, 5, 15, 100),
(6, 'Accessories Section', 45, 8, 18000.00, 1, 25, 200),
(7, 'Accessories Section', 20, 2, 65000.00, 1, 10, 80),
(8, 'Furniture Section', 50, 3, 35000.00, 5, 20, 150),
(9, 'Electronics Section', 18, 1, 60000.00, 1, 15, 60),
(10, 'Electronics Section', 22, 0, 50000.00, 1, 12, 80);

-- Insert sample cashpower transactions
INSERT INTO cashpower_transactions (transaction_id, customer_id, customer_name, customer_phone, customer_email, meter_number, meter_type, amount, service_fee, tax_amount, units, rate_per_unit, token, commission, commission_rate, status, payment_method, payment_reference, provider, processed_by, processed_at) VALUES
('CP2024001', 1, 'John Doe', '+250788123456', 'john@example.com', '12345678901', 'prepaid', 5000.00, 100.00, 918.00, 45.5, 110.00, '12345678901234567890', 250.00, 5.00, 'completed', 'mobile_money', 'MM123456789', 'eucl', 1, NOW()),
('CP2024002', 5, 'Peter Nkurunziza', '+250788333444', 'peter@example.com', '09876543210', 'prepaid', 10000.00, 200.00, 1836.00, 91.0, 110.00, '09876543210987654321', 500.00, 5.00, 'completed', 'cash', NULL, 'eucl', 1, NOW()),
('CP2024003', 6, 'Mary Mukamana', '+250788555666', 'mary@example.com', '11223344556', 'prepaid', 3000.00, 60.00, 550.80, 27.3, 110.00, '11223344556677889900', 150.00, 5.00, 'pending', 'mobile_money', 'MM987654321', 'eucl', 2, NULL),
('CP2024004', 4, 'Alice Uwimana', '+250788111222', 'alice@example.com', '55667788990', 'prepaid', 7500.00, 150.00, 1377.00, 68.2, 110.00, '55667788990011223344', 375.00, 5.00, 'completed', 'bank_transfer', 'BT456789123', 'eucl', 1, NOW()),
('CP2024005', 2, 'Jane Smith', '+250788654321', 'jane@example.com', '99887766554', 'prepaid', 2000.00, 40.00, 367.20, 18.2, 110.00, '99887766554433221100', 100.00, 5.00, 'completed', 'cash', NULL, 'eucl', 2, NOW()),
('CP2024006', 3, 'Rwandan Tech Solutions Ltd', '+250788789012', 'info@rwandatech.com', '44556677889', 'prepaid', 15000.00, 300.00, 2754.00, 136.4, 110.00, '44556677889900112233', 750.00, 5.00, 'processing', 'bank_transfer', 'BT789123456', 'eucl', 1, NULL),
('CP2024007', 7, 'Smart Business Ltd', '+250788777888', 'info@smartbiz.rw', '33445566778', 'prepaid', 20000.00, 400.00, 3672.00, 181.8, 110.00, '33445566778899001122', 1000.00, 5.00, 'completed', 'mobile_money', 'MM147258369', 'eucl', 3, NOW());

-- Insert sample packages
INSERT INTO packages (package_code, name, description, category, price, cost_price, duration_months, features, includes_installation, includes_support, support_duration_months, warranty_months, status, created_by) VALUES
('PKG001', 'Basic Office Package', 'Essential office equipment for small businesses and startups', 'Office Setup', 500000.00, 400000.00, 12, '["1x Laptop", "1x Printer", "1x Office Chair", "1x Desk Lamp"]', TRUE, TRUE, 6, 12, 'active', 1),
('PKG002', 'Premium Tech Package', 'Complete technology solution for modern offices and businesses', 'Technology', 2500000.00, 2000000.00, 24, '["2x Laptops", "1x Monitor", "1x Printer", "Accessories", "Software Licenses"]', TRUE, TRUE, 12, 24, 'active', 1),
('PKG003', 'Startup Bundle', 'Perfect package for new businesses and entrepreneurs', 'Startup', 1200000.00, 950000.00, 18, '["1x Laptop", "1x Monitor", "1x Chair", "1x Desk Lamp", "Accessories"]', TRUE, TRUE, 9, 18, 'active', 1),
('PKG004', 'Gaming Setup Pro', 'High-performance gaming setup for enthusiasts', 'Gaming', 1800000.00, 1400000.00, 12, '["Gaming Laptop", "Gaming Monitor", "Mechanical Keyboard", "Gaming Mouse", "Headset"]', TRUE, TRUE, 6, 12, 'active', 1),
('PKG005', 'Home Office Essentials', 'Complete home office setup for remote workers', 'Home Office', 800000.00, 650000.00, 12, '["Laptop", "Webcam", "Headset", "Ergonomic Chair", "Desk Accessories"]', FALSE, TRUE, 3, 6, 'active', 1);

-- Insert package items
INSERT INTO package_items (package_id, product_id, product_name, quantity, unit_price, discount_percentage) VALUES
(1, 1, 'Dell XPS 13 Laptop', 1, 1200000.00, 10.00),
(1, 3, 'HP LaserJet Pro P1102', 1, 299000.00, 5.00),
(1, 5, 'Ergonomic Office Chair', 1, 150000.00, 0.00),
(1, 8, 'LED Desk Lamp', 1, 45000.00, 0.00),
(2, 1, 'Dell XPS 13 Laptop', 2, 1200000.00, 15.00),
(2, 4, 'Samsung 27" 4K Monitor', 1, 350000.00, 10.00),
(2, 3, 'HP LaserJet Pro P1102', 1, 299000.00, 10.00),
(2, 6, 'Wireless Mouse Logitech', 2, 25000.00, 0.00),
(2, 7, 'Mechanical Keyboard RGB', 2, 89000.00, 5.00),
(3, 1, 'Dell XPS 13 Laptop', 1, 1200000.00, 12.00),
(3, 4, 'Samsung 27" 4K Monitor', 1, 350000.00, 8.00),
(3, 5, 'Ergonomic Office Chair', 1, 150000.00, 5.00),
(3, 8, 'LED Desk Lamp', 1, 45000.00, 0.00),
(3, 6, 'Wireless Mouse Logitech', 1, 25000.00, 0.00);

-- Insert sample invoices
INSERT INTO invoices (invoice_number, customer_id, customer_name, customer_email, customer_phone, customer_address, subtotal, discount_amount, tax_amount, total_amount, paid_amount, status, payment_status, payment_terms, due_date, issue_date, created_by) VALUES
('INV-2024-001', 1, 'John Doe', 'john@example.com', '+250788123456', 'KG 123 St, Kimisagara, Kigali', 1200000.00, 0.00, 216000.00, 1416000.00, 1416000.00, 'paid', 'paid', 30, '2024-08-15', '2024-07-15', 1),
('INV-2024-002', 3, 'Rwandan Tech Solutions Ltd', 'info@rwandatech.com', '+250788789012', 'KK 789 Rd, Kicukiro, Kigali', 2500000.00, 125000.00, 427500.00, 2802500.00, 1500000.00, 'partial', 'partial', 45, '2024-08-30', '2024-07-16', 1),
('INV-2024-003', 2, 'Jane Smith', 'jane@example.com', '+250788654321', 'KN 456 Ave, Nyamirambo, Kigali', 350000.00, 0.00, 63000.00, 413000.00, 0.00, 'sent', 'unpaid', 15, '2024-08-05', '2024-07-20', 2),
('INV-2024-004', 5, 'Peter Nkurunziza', 'peter@example.com', '+250788333444', 'KN 654 Ave, Remera, Kigali', 800000.00, 40000.00, 136800.00, 896800.00, 896800.00, 'paid', 'paid', 30, '2024-08-25', '2024-07-25', 1),
('INV-2024-005', 7, 'Smart Business Ltd', 'info@smartbiz.rw', '+250788777888', 'KG 147 St, Kacyiru, Kigali', 1500000.00, 75000.00, 256500.00, 1681500.00, 500000.00, 'partial', 'partial', 60, '2024-09-15', '2024-07-28', 3);

-- Insert invoice items
INSERT INTO invoice_items (invoice_id, product_id, product_code, product_name, description, quantity, unit_price, discount_percentage, tax_rate) VALUES
(1, 1, 'PROD001', 'Dell XPS 13 Laptop', 'High-performance ultrabook with Intel i7 processor', 1, 1200000.00, 0.00, 18.00),
(2, 1, 'PROD001', 'Dell XPS 13 Laptop', 'High-performance ultrabook with Intel i7 processor', 2, 1200000.00, 5.00, 18.00),
(2, 4, 'PROD004', 'Samsung 27" 4K Monitor', '27-inch 4K monitor with USB-C connectivity', 1, 350000.00, 0.00, 18.00),
(3, 4, 'PROD004', 'Samsung 27" 4K Monitor', '27-inch 4K monitor with USB-C connectivity', 1, 350000.00, 0.00, 18.00),
(4, 5, 'PROD005', 'Ergonomic Office Chair', 'Comfortable ergonomic office chair with lumbar support', 2, 150000.00, 0.00, 18.00),
(4, 1, 'PROD001', 'Dell XPS 13 Laptop', 'High-performance ultrabook with Intel i7 processor', 1, 1200000.00, 10.00, 18.00),
(5, 2, 'PROD002', 'iPhone 14 Pro', 'Latest Apple smartphone with advanced camera system', 1, 1099000.00, 0.00, 18.00),
(5, 6, 'PROD006', 'Wireless Mouse Logitech', 'Ergonomic wireless mouse with long battery life', 5, 25000.00, 0.00, 18.00),
(5, 7, 'PROD007', 'Mechanical Keyboard RGB', 'RGB mechanical keyboard for gaming and productivity', 3, 89000.00, 5.00, 18.00);

-- Insert sample quotations
INSERT INTO quotations (quotation_number, customer_id, customer_name, customer_email, customer_phone, customer_address, subtotal, discount_amount, tax_amount, total_amount, status, valid_until, issue_date, created_by) VALUES
('QUO-2024-001', 4, 'Alice Uwimana', 'alice@example.com', '+250788111222', 'KG 321 St, Gasabo, Kigali', 500000.00, 25000.00, 85500.00, 560500.00, 'sent', '2024-08-15', '2024-07-15', 1),
('QUO-2024-002', 6, 'Mary Mukamana', 'mary@example.com', '+250788555666', 'KK 987 Rd, Gikondo, Kigali', 750000.00, 0.00, 135000.00, 885000.00, 'accepted', '2024-08-20', '2024-07-20', 2),
('QUO-2024-003', 8, 'Innovation Hub Rwanda', 'contact@innovation.rw', '+250788999000', 'KN 258 Ave, Kibagabaga, Kigali', 2000000.00, 100000.00, 342000.00, 2242000.00, 'draft', '2024-08-30', '2024-07-30', 1);

-- Insert quotation items
INSERT INTO quotation_items (quotation_id, product_id, product_code, product_name, description, quantity, unit_price, discount_percentage, tax_rate) VALUES
(1, 3, 'PROD003', 'HP LaserJet Pro P1102', 'Professional laser printer for office use', 1, 299000.00, 0.00, 18.00),
(1, 5, 'PROD005', 'Ergonomic Office Chair', 'Comfortable ergonomic office chair', 1, 150000.00, 0.00, 18.00),
(1, 8, 'PROD008', 'LED Desk Lamp', 'Adjustable LED desk lamp with USB charging port', 1, 45000.00, 0.00, 18.00),
(2, 1, 'PROD001', 'Dell XPS 13 Laptop', 'High-performance ultrabook with Intel i7 processor', 1, 1200000.00, 10.00, 18.00),
(2, 6, 'PROD006', 'Wireless Mouse Logitech', 'Ergonomic wireless mouse', 2, 25000.00, 0.00, 18.00),
(3, 1, 'PROD001', 'Dell XPS 13 Laptop', 'High-performance ultrabook with Intel i7 processor', 3, 1200000.00, 5.00, 18.00),
(3, 4, 'PROD004', 'Samsung 27" 4K Monitor', '27-inch 4K monitor with USB-C connectivity', 2, 350000.00, 0.00, 18.00);

-- Insert sample proformas
INSERT INTO proformas (proforma_number, customer_id, customer_name, customer_email, customer_phone, customer_address, subtotal, discount_amount, tax_amount, total_amount, status, valid_until, issue_date, created_by) VALUES
('PRO-2024-001', 1, 'John Doe', 'john@example.com', '+250788123456', 'KG 123 St, Kimisagara, Kigali', 400000.00, 20000.00, 68400.00, 448400.00, 'approved', '2024-08-10', '2024-07-10', 1),
('PRO-2024-002', 3, 'Rwandan Tech Solutions Ltd', 'info@rwandatech.com', '+250788789012', 'KK 789 Rd, Kicukiro, Kigali', 1800000.00, 90000.00, 307800.00, 2017800.00, 'sent', '2024-08-25', '2024-07-25', 2);

-- Insert proforma items
INSERT INTO proforma_items (proforma_id, product_id, product_code, product_name, description, quantity, unit_price, discount_percentage, tax_rate) VALUES
(1, 3, 'PROD003', 'HP LaserJet Pro P1102', 'Professional laser printer for office use', 1, 299000.00, 0.00, 18.00),
(1, 6, 'PROD006', 'Wireless Mouse Logitech', 'Ergonomic wireless mouse', 4, 25000.00, 0.00, 18.00),
(2, 1, 'PROD001', 'Dell XPS 13 Laptop', 'High-performance ultrabook with Intel i7 processor', 2, 1200000.00, 5.00, 18.00),
(2, 7, 'PROD007', 'Mechanical Keyboard RGB', 'RGB mechanical keyboard for gaming', 2, 89000.00, 0.00, 18.00);

-- Insert sample payments
INSERT INTO payments (payment_number, invoice_id, customer_id, amount, payment_method, payment_reference, transaction_id, status, payment_date, processed_by) VALUES
('PAY-2024-001', 1, 1, 1416000.00, 'mobile_money', 'MM123456789', 'TXN001', 'completed', '2024-07-20', 1),
('PAY-2024-002', 2, 3, 1500000.00, 'bank_transfer', 'BT987654321', 'TXN002', 'completed', '2024-07-25', 1),
('PAY-2024-003', 4, 5, 896800.00, 'cash', NULL, 'TXN003', 'completed', '2024-07-30', 2),
('PAY-2024-004', 5, 7, 500000.00, 'mobile_money', 'MM456789123', 'TXN004', 'completed', '2024-08-01', 3);

-- Insert sample notifications
INSERT INTO notifications (user_id, title, message, type, category, is_read, action_url) VALUES
(1, 'Low Stock Alert', 'HP LaserJet Pro P1102 stock is running low (8 units remaining). Consider reordering soon.', 'warning', 'stock', FALSE, '/stock'),
(1, 'New Customer Added', 'New customer "Innovation Hub Rwanda" has been successfully added to the system.', 'success', 'customer', FALSE, '/customers'),
(2, 'Cashpower Transaction Pending', 'Cashpower transaction CP2024003 for Mary Mukamana is pending approval.', 'info', 'payment', FALSE, '/cashpower'),
(1, 'Monthly Sales Report Ready', 'Your monthly sales report for July 2024 is ready for review.', 'success', 'report', TRUE, '/reports'),
(3, 'Payment Received', 'Payment of RWF 500,000 received from Smart Business Ltd for Invoice INV-2024-005.', 'success', 'payment', FALSE, '/invoices'),
(1, 'System Backup Completed', 'Daily system backup has been completed successfully.', 'info', 'system', TRUE, NULL),
(2, 'Quotation Accepted', 'Quotation QUO-2024-002 has been accepted by Mary Mukamana.', 'success', 'order', FALSE, '/quotations'),
(1, 'Stock Reorder Required', 'Multiple products are below reorder level. Check stock management for details.', 'warning', 'stock', FALSE, '/stock');

-- Insert system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('company_name', 'NETPRO Management System', 'string', 'Company name displayed in the system', TRUE),
('company_address', 'Kigali, Rwanda', 'string', 'Company address for invoices and documents', TRUE),
('company_phone', '+250788123456', 'string', 'Company contact phone number', TRUE),
('company_email', 'info@netpro.com', 'string', 'Company contact email address', TRUE),
('tax_rate', '18.00', 'number', 'Default tax rate percentage', TRUE),
('currency', 'RWF', 'string', 'Default currency code', TRUE),
('invoice_prefix', 'INV', 'string', 'Prefix for invoice numbers', FALSE),
('quotation_prefix', 'QUO', 'string', 'Prefix for quotation numbers', FALSE),
('proforma_prefix', 'PRO', 'string', 'Prefix for proforma numbers', FALSE),
('low_stock_threshold', '10', 'number', 'Threshold for low stock alerts', FALSE),
('backup_frequency', 'daily', 'string', 'Frequency of automatic backups', FALSE),
('session_timeout', '3600', 'number', 'Session timeout in seconds', FALSE);

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_code ON customers(customer_code);

CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_code ON products(product_code);
CREATE INDEX idx_products_category ON products(category_id);

CREATE INDEX idx_stock_product ON stock(product_id);
CREATE INDEX idx_stock_location ON stock(location);
CREATE INDEX idx_stock_quantity ON stock(quantity_on_hand);

CREATE INDEX idx_cashpower_transaction ON cashpower_transactions(transaction_id);
CREATE INDEX idx_cashpower_meter ON cashpower_transactions(meter_number);
CREATE INDEX idx_cashpower_customer ON cashpower_transactions(customer_id);
CREATE INDEX idx_cashpower_status ON cashpower_transactions(status);
CREATE INDEX idx_cashpower_date ON cashpower_transactions(created_at);

CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_date ON invoices(issue_date);

CREATE INDEX idx_quotations_number ON quotations(quotation_number);
CREATE INDEX idx_quotations_customer ON quotations(customer_id);
CREATE INDEX idx_quotations_status ON quotations(status);

CREATE INDEX idx_proformas_number ON proformas(proforma_number);
CREATE INDEX idx_proformas_customer ON proformas(customer_id);
CREATE INDEX idx_proformas_status ON proformas(status);

CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_date ON payments(payment_date);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(type);

-- =====================================================
-- CREATE VIEWS FOR REPORTING
-- =====================================================

-- Sales summary view
CREATE VIEW sales_summary AS
SELECT 
    DATE(i.created_at) as sale_date,
    COUNT(i.id) as total_invoices,
    SUM(i.subtotal) as total_subtotal,
    SUM(i.tax_amount) as total_tax,
    SUM(i.total_amount) as total_sales,
    SUM(i.paid_amount) as total_paid,
    SUM(i.total_amount - i.paid_amount) as total_outstanding
FROM invoices i
WHERE i.status != 'cancelled'
GROUP BY DATE(i.created_at);

-- Stock status view
CREATE VIEW stock_status AS
SELECT 
    p.id,
    p.product_code,
    p.name as product_name,
    p.category_id,
    c.name as category_name,
    s.quantity_on_hand,
    s.quantity_reserved,
    s.quantity_available,
    s.unit_cost,
    s.total_value,
    p.min_stock_level,
    CASE 
        WHEN s.quantity_available <= 0 THEN 'Out of Stock'
        WHEN s.quantity_available <= p.min_stock_level THEN 'Low Stock'
        ELSE 'In Stock'
    END as stock_status
FROM products p
LEFT JOIN stock s ON p.id = s.product_id
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.status = 'active';

-- Customer balance view
CREATE VIEW customer_balances AS
SELECT 
    c.id,
    c.customer_code,
    c.name,
    c.credit_limit,
    COALESCE(SUM(i.total_amount - i.paid_amount), 0) as outstanding_balance,
    c.credit_limit - COALESCE(SUM(i.total_amount - i.paid_amount), 0) as available_credit
FROM customers c
LEFT JOIN invoices i ON c.id = i.customer_id AND i.status != 'cancelled'
WHERE c.status = 'active'
GROUP BY c.id, c.customer_code, c.name, c.credit_limit;

-- Cashpower daily summary view
CREATE VIEW cashpower_daily_summary AS
SELECT 
    DATE(created_at) as transaction_date,
    COUNT(*) as total_transactions,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_transactions,
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_transactions,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_transactions,
    SUM(amount) as total_amount,
    SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as completed_amount,
    SUM(commission) as total_commission,
    SUM(CASE WHEN status = 'completed' THEN commission ELSE 0 END) as earned_commission
FROM cashpower_transactions
GROUP BY DATE(created_at);

-- =====================================================
-- STORED PROCEDURES
-- =====================================================

DELIMITER //

-- Procedure to update stock after sale
CREATE PROCEDURE UpdateStockAfterSale(
    IN p_product_id INT,
    IN p_quantity DECIMAL(10,2),
    IN p_reference_id INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Update stock quantity
    UPDATE stock 
    SET quantity_on_hand = quantity_on_hand - p_quantity
    WHERE product_id = p_product_id;
    
    -- Insert stock movement record
    INSERT INTO stock_movements (product_id, movement_type, quantity, reference_type, reference_id, created_by)
    VALUES (p_product_id, 'out', p_quantity, 'sale', p_reference_id, 1);
    
    COMMIT;
END //

-- Procedure to generate next invoice number
CREATE PROCEDURE GetNextInvoiceNumber(OUT next_number VARCHAR(50))
BEGIN
    DECLARE last_number INT DEFAULT 0;
    DECLARE prefix VARCHAR(10);
    
    SELECT setting_value INTO prefix FROM system_settings WHERE setting_key = 'invoice_prefix';
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number, LENGTH(prefix) + 2) AS UNSIGNED)), 0) 
    INTO last_number 
    FROM invoices 
    WHERE invoice_number LIKE CONCAT(prefix, '-%');
    
    SET next_number = CONCAT(prefix, '-', YEAR(NOW()), '-', LPAD(last_number + 1, 3, '0'));
END //

DELIMITER ;

-- =====================================================
-- TRIGGERS
-- =====================================================

DELIMITER //

-- Trigger to update invoice totals when items are inserted/updated
CREATE TRIGGER update_invoice_totals_after_insert
AFTER INSERT ON invoice_items
FOR EACH ROW
BEGIN
    UPDATE invoices 
    SET 
        subtotal = (SELECT SUM((quantity * unit_price) - discount_amount) FROM invoice_items WHERE invoice_id = NEW.invoice_id),
        tax_amount = (SELECT SUM(tax_amount) FROM invoice_items WHERE invoice_id = NEW.invoice_id),
        total_amount = (SELECT SUM((quantity * unit_price) - discount_amount + tax_amount) FROM invoice_items WHERE invoice_id = NEW.invoice_id)
    WHERE id = NEW.invoice_id;
END //

-- Trigger to log user activities
CREATE TRIGGER log_user_login
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    IF NEW.last_login != OLD.last_login THEN
        INSERT INTO audit_log (user_id, action, table_name, record_id, new_values)
        VALUES (NEW.id, 'login', 'users', NEW.id, JSON_OBJECT('last_login', NEW.last_login));
    END IF;
END //

DELIMITER ;

-- =====================================================
-- FINAL SETUP CONFIRMATION
-- =====================================================
SELECT 'NETPRO Management System database setup completed successfully!' as status;
SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'netpro_management';
SELECT 'Sample data inserted for testing and development' as note;
