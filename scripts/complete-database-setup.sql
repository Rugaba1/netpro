-- Complete Database Setup for NETPRO Management System
-- Run this script to create all necessary tables and sample data

-- Create database
CREATE DATABASE IF NOT EXISTS netpro_management;
USE netpro_management;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    permissions JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_name VARCHAR(255) NOT NULL,
    billing_name VARCHAR(255),
    tin VARCHAR(50),
    phone VARCHAR(20),
    service_number VARCHAR(50),
    email VARCHAR(100),
    address TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Packages table
CREATE TABLE IF NOT EXISTS packages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    package_type VARCHAR(100) NOT NULL,
    package_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    package_id INT,
    product_type VARCHAR(100) NOT NULL,
    bundle VARCHAR(100),
    wholesales_price DECIMAL(10, 2),
    selling_price DECIMAL(10, 2),
    duration VARCHAR(50),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE SET NULL
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INT,
    billing_name VARCHAR(255),
    product_type VARCHAR(100),
    payment_method VARCHAR(50),
    amount_to_pay DECIMAL(10, 2),
    paid_amount DECIMAL(10, 2) DEFAULT 0,
    remained_amount DECIMAL(10, 2),
    started_date DATE,
    expired_date DATE,
    status ENUM('pending', 'paid', 'overdue', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- Invoice items table
CREATE TABLE IF NOT EXISTS invoice_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_id INT,
    product_id INT,
    quantity INT DEFAULT 1,
    unit_price DECIMAL(10, 2),
    total_price DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Proformas table
CREATE TABLE IF NOT EXISTS proformas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    proforma_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INT,
    billing_name VARCHAR(255),
    product_type VARCHAR(100),
    amount DECIMAL(10, 2),
    valid_until DATE,
    status ENUM('draft', 'sent', 'accepted', 'rejected', 'expired') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- Proforma items table
CREATE TABLE IF NOT EXISTS proforma_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    proforma_id INT,
    product_id INT,
    quantity INT DEFAULT 1,
    unit_price DECIMAL(10, 2),
    total_price DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proforma_id) REFERENCES proformas(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Quotations table
CREATE TABLE IF NOT EXISTS quotations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    quotation_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INT,
    billing_name VARCHAR(255),
    product_type VARCHAR(100),
    amount DECIMAL(10, 2),
    valid_until DATE,
    status ENUM('draft', 'sent', 'accepted', 'rejected', 'expired') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- Quotation items table
CREATE TABLE IF NOT EXISTS quotation_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    quotation_id INT,
    product_id INT,
    quantity INT DEFAULT 1,
    unit_price DECIMAL(10, 2),
    total_price DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Stock items table
CREATE TABLE IF NOT EXISTS stock_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    item_name VARCHAR(255) NOT NULL,
    item_type VARCHAR(100) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    unit_price DECIMAL(10, 2) NOT NULL,
    supplier VARCHAR(255),
    purchase_date DATE,
    status ENUM('in_stock', 'low_stock', 'out_of_stock') DEFAULT 'in_stock',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Cashpower transactions table
CREATE TABLE IF NOT EXISTS cashpower_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    transaction_id VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    meter_number VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    token VARCHAR(100),
    commission DECIMAL(10, 2) DEFAULT 0,
    transaction_date DATE,
    status ENUM('completed', 'pending', 'failed') DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    report_type VARCHAR(50) NOT NULL,
    report_name VARCHAR(255) NOT NULL,
    start_date DATE,
    end_date DATE,
    generated_by INT,
    report_data LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Insert default admin user
INSERT INTO users (username, email, password_hash, first_name, last_name, role, permissions) VALUES
('admin', 'admin@netpro.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System', 'Administrator', 'admin', '["dashboard", "customers", "packages", "products", "invoices", "proformas", "quotations", "stock", "cashpower", "reports", "user_management"]'),
('user', 'user@netpro.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Regular', 'User', 'user', '["dashboard", "customers", "packages", "products", "invoices", "proformas", "quotations", "stock", "cashpower", "reports"]');

-- Insert sample customers
INSERT INTO customers (customer_name, billing_name, tin, phone, service_number, email, address, status) VALUES
('John Doe', 'John Doe', '123456789', '+250788123456', 'SN001', 'john@example.com', 'Kigali, Rwanda', 'active'),
('Jane Smith', 'Jane Smith Ltd', '987654321', '+250788654321', 'SN002', 'jane@example.com', 'Kigali, Rwanda', 'active'),
('Robert Johnson', 'RJ Enterprises', '456789123', '+250788456789', 'SN003', 'robert@example.com', 'Kigali, Rwanda', 'active'),
('Mary Williams', 'MW Solutions', '789123456', '+250788789123', 'SN004', 'mary@example.com', 'Kigali, Rwanda', 'active'),
('David Brown', 'DB Tech', '321654987', '+250788321654', 'SN005', 'david@example.com', 'Kigali, Rwanda', 'active');

-- Insert sample packages
INSERT INTO packages (package_type, package_description) VALUES
('Internet Package', 'High-speed internet connectivity packages'),
('Voice Package', 'Voice communication packages'),
('Data Package', 'Mobile data packages'),
('Bundle Package', 'Combined internet and voice packages');

-- Insert sample products
INSERT INTO products (package_id, product_type, bundle, wholesales_price, selling_price, duration, status) VALUES
(1, 'Internet Package', '50 Mbps', 20000, 25000, '30 days', 'active'),
(1, 'Internet Package', '100 Mbps', 35000, 40000, '30 days', 'active'),
(1, 'Internet Package', '200 Mbps', 60000, 70000, '30 days', 'active'),
(2, 'Voice Package', 'Unlimited Local', 8000, 10000, '30 days', 'active'),
(2, 'Voice Package', 'International', 12000, 15000, '30 days', 'active'),
(3, 'Data Package', '5GB', 5000, 6000, '30 days', 'active'),
(3, 'Data Package', '10GB', 9000, 11000, '30 days', 'active'),
(4, 'Bundle Package', 'Internet + Voice', 30000, 35000, '30 days', 'active');

-- Insert sample stock items
INSERT INTO stock_items (item_name, item_type, quantity, unit_price, supplier, purchase_date, status) VALUES
('Router TP-Link AC1200', 'Hardware', 15, 25000, 'Tech Imports Ltd', '2025-06-01', 'in_stock'),
('4G LTE Modem', 'Hardware', 8, 35000, 'Network Solutions', '2025-06-05', 'in_stock'),
('Cat6 Ethernet Cable (100m)', 'Cable', 5, 18000, 'Cable Masters', '2025-06-10', 'in_stock'),
('Wireless Access Point', 'Hardware', 3, 45000, 'Tech Imports Ltd', '2025-06-15', 'low_stock'),
('Network Switch 8-Port', 'Hardware', 0, 30000, 'Network Solutions', '2025-06-20', 'out_of_stock'),
('Fiber Optic Cable (500m)', 'Cable', 2, 120000, 'Fiber Connect Ltd', '2025-06-25', 'low_stock'),
('RJ45 Connectors (Pack of 100)', 'Accessories', 12, 5000, 'Cable Masters', '2025-07-01', 'in_stock'),
('Crimping Tool', 'Tool', 5, 8000, 'Tech Tools Ltd', '2025-07-05', 'in_stock'),
('Network Tester', 'Tool', 2, 15000, 'Tech Tools Ltd', '2025-07-10', 'low_stock'),
('Outdoor Antenna 4G/LTE', 'Hardware', 6, 28000, 'Antenna Specialists', '2025-07-15', 'in_stock');

-- Insert sample cashpower transactions
INSERT INTO cashpower_transactions (transaction_id, customer_name, meter_number, amount, token, commission, transaction_date, status) VALUES
('CP-20250701-001', 'John Doe', '12345678901', 5000, '1234-5678-9012-3456-7890', 250, '2025-07-01', 'completed'),
('CP-20250702-002', 'Jane Smith', '23456789012', 10000, '2345-6789-0123-4567-8901', 500, '2025-07-02', 'completed'),
('CP-20250703-003', 'Robert Johnson', '34567890123', 15000, '3456-7890-1234-5678-9012', 750, '2025-07-03', 'completed'),
('CP-20250704-004', 'Mary Williams', '45678901234', 20000, '4567-8901-2345-6789-0123', 1000, '2025-07-04', 'completed'),
('CP-20250705-005', 'David Brown', '56789012345', 5000, '5678-9012-3456-7890-1234', 250, '2025-07-05', 'completed'),
('CP-20250706-006', 'Sarah Miller', '67890123456', 10000, '6789-0123-4567-8901-2345', 500, '2025-07-06', 'completed'),
('CP-20250707-007', 'Michael Davis', '78901234567', 15000, '7890-1234-5678-9012-3456', 750, '2025-07-07', 'completed'),
('CP-20250708-008', 'Jennifer Garcia', '89012345678', 20000, '8901-2345-6789-0123-4567', 1000, '2025-07-08', 'completed'),
('CP-20250709-009', 'James Rodriguez', '90123456789', 5000, NULL, 0, '2025-07-09', 'pending'),
('CP-20250710-010', 'Patricia Martinez', '01234567890', 10000, NULL, 0, '2025-07-10', 'failed');

-- Insert sample invoices
INSERT INTO invoices (invoice_number, customer_id, billing_name, product_type, payment_method, amount_to_pay, paid_amount, remained_amount, started_date, expired_date, status) VALUES
('INV-2025-001', 1, 'John Doe', 'Internet Package', 'Bank Transfer', 25000, 25000, 0, '2025-07-01', '2025-07-31', 'paid'),
('INV-2025-002', 2, 'Jane Smith Ltd', 'Voice Package', 'Cash', 10000, 5000, 5000, '2025-07-02', '2025-08-01', 'pending'),
('INV-2025-003', 3, 'RJ Enterprises', 'Bundle Package', 'Mobile Money', 35000, 35000, 0, '2025-07-03', '2025-08-02', 'paid'),
('INV-2025-004', 4, 'MW Solutions', 'Data Package', 'Bank Transfer', 11000, 0, 11000, '2025-07-04', '2025-08-03', 'overdue'),
('INV-2025-005', 5, 'DB Tech', 'Internet Package', 'Cash', 40000, 20000, 20000, '2025-07-05', '2025-08-04', 'pending');

-- Create indexes for better performance
CREATE INDEX idx_customers_name ON customers(customer_name);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_products_type ON products(product_type);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_stock_item_name ON stock_items(item_name);
CREATE INDEX idx_stock_status ON stock_items(status);
CREATE INDEX idx_cashpower_meter ON cashpower_transactions(meter_number);
CREATE INDEX idx_cashpower_date ON cashpower_transactions(transaction_date);
CREATE INDEX idx_reports_type ON reports(report_type);
CREATE INDEX idx_reports_date ON reports(created_at);
