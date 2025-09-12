-- Create database
CREATE DATABASE IF NOT EXISTS netpro_management;
USE netpro_management;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(50),
    country VARCHAR(50) DEFAULT 'Rwanda',
    customer_type ENUM('individual', 'business') DEFAULT 'individual',
    tax_id VARCHAR(50),
    credit_limit DECIMAL(10,2) DEFAULT 0.00,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    sku VARCHAR(50) UNIQUE,
    price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2),
    category VARCHAR(50),
    unit VARCHAR(20) DEFAULT 'pcs',
    tax_rate DECIMAL(5,2) DEFAULT 0.00,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Stock table
CREATE TABLE IF NOT EXISTS stock (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    product_name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    quantity INT NOT NULL DEFAULT 0,
    min_quantity INT DEFAULT 10,
    unit_price DECIMAL(10,2) NOT NULL,
    total_value DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    supplier VARCHAR(100),
    location VARCHAR(100) DEFAULT 'Main Warehouse',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Cashpower transactions table
CREATE TABLE IF NOT EXISTS cashpower_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20),
    meter_number VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    units DECIMAL(10,2) NOT NULL,
    token VARCHAR(20) NOT NULL,
    commission DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,2) DEFAULT 5.00,
    status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    payment_method ENUM('cash', 'mobile_money', 'bank_transfer') DEFAULT 'cash',
    processed_by INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INT,
    customer_name VARCHAR(100) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    balance DECIMAL(10,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    status ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled') DEFAULT 'draft',
    due_date DATE,
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Invoice items table
CREATE TABLE IF NOT EXISTS invoice_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    product_id INT,
    product_name VARCHAR(100) NOT NULL,
    description TEXT,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Quotations table
CREATE TABLE IF NOT EXISTS quotations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quotation_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INT,
    customer_name VARCHAR(100) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('draft', 'sent', 'accepted', 'rejected', 'expired') DEFAULT 'draft',
    valid_until DATE,
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Quotation items table
CREATE TABLE IF NOT EXISTS quotation_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quotation_id INT NOT NULL,
    product_id INT,
    product_name VARCHAR(100) NOT NULL,
    description TEXT,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Proformas table
CREATE TABLE IF NOT EXISTS proformas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proforma_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INT,
    customer_name VARCHAR(100) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('draft', 'sent', 'approved', 'rejected', 'converted') DEFAULT 'draft',
    valid_until DATE,
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Proforma items table
CREATE TABLE IF NOT EXISTS proforma_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proforma_id INT NOT NULL,
    product_id INT,
    product_name VARCHAR(100) NOT NULL,
    description TEXT,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    FOREIGN KEY (proforma_id) REFERENCES proformas(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Packages table
CREATE TABLE IF NOT EXISTS packages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration_months INT DEFAULT 1,
    features JSON,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Package items table
CREATE TABLE IF NOT EXISTS package_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    package_id INT NOT NULL,
    product_id INT,
    product_name VARCHAR(100) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'warning', 'error', 'success') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert sample users
INSERT INTO users (username, email, password, role, full_name, phone) VALUES
('admin', 'admin@netpro.com', 'admin123', 'admin', 'System Administrator', '+250788123456'),
('user', 'user@netpro.com', 'user123', 'user', 'Regular User', '+250788654321'),
('manager', 'manager@netpro.com', 'manager123', 'admin', 'Sales Manager', '+250788789012');

-- Insert sample customers
INSERT INTO customers (name, email, phone, address, city, country, customer_type, tax_id) VALUES
('John Doe', 'john@example.com', '+250788123456', 'KG 123 St, Kimisagara', 'Kigali', 'Rwanda', 'individual', NULL),
('Jane Smith', 'jane@example.com', '+250788654321', 'KN 456 Ave, Nyamirambo', 'Kigali', 'Rwanda', 'individual', NULL),
('Bob Johnson', 'bob@example.com', '+250788789012', 'KK 789 Rd, Kicukiro', 'Kigali', 'Rwanda', 'business', 'TIN123456789'),
('Alice Uwimana', 'alice@example.com', '+250788111222', 'KG 321 St, Gasabo', 'Kigali', 'Rwanda', 'individual', NULL),
('Peter Nkurunziza', 'peter@example.com', '+250788333444', 'KN 654 Ave, Remera', 'Kigali', 'Rwanda', 'business', 'TIN987654321'),
('Mary Mukamana', 'mary@example.com', '+250788555666', 'KK 987 Rd, Gikondo', 'Kigali', 'Rwanda', 'individual', NULL);

-- Insert sample products
INSERT INTO products (name, description, sku, price, cost_price, category, unit, tax_rate) VALUES
('Laptop Dell XPS 13', 'High-performance ultrabook with Intel i7 processor', 'DELL-XPS13', 1200.00, 850.00, 'Electronics', 'pcs', 18.00),
('iPhone 14 Pro', 'Latest Apple smartphone with advanced camera system', 'IPHONE-14PRO', 1099.00, 999.00, 'Electronics', 'pcs', 18.00),
('Office Chair Ergonomic', 'Comfortable ergonomic office chair with lumbar support', 'CHAIR-ERG01', 150.00, 120.00, 'Furniture', 'pcs', 18.00),
('HP LaserJet Printer', 'Professional laser printer for office use', 'HP-LJ-P1102', 299.00, 250.00, 'Electronics', 'pcs', 18.00),
('Desk Lamp LED', 'Adjustable LED desk lamp with USB charging port', 'LAMP-LED01', 45.00, 35.00, 'Furniture', 'pcs', 18.00),
('Samsung Monitor 27"', '27-inch 4K monitor with USB-C connectivity', 'SAM-MON27', 350.00, 280.00, 'Electronics', 'pcs', 18.00),
('Wireless Mouse', 'Ergonomic wireless mouse with long battery life', 'MOUSE-WL01', 25.00, 18.00, 'Electronics', 'pcs', 18.00),
('Keyboard Mechanical', 'RGB mechanical keyboard for gaming and productivity', 'KB-MECH01', 89.00, 65.00, 'Electronics', 'pcs', 18.00);

-- Insert sample stock items
INSERT INTO stock (product_id, product_name, category, quantity, min_quantity, unit_price, supplier, location) VALUES
(1, 'Laptop Dell XPS 13', 'Electronics', 15, 5, 850.00, 'Dell Rwanda Ltd', 'Main Warehouse'),
(2, 'iPhone 14 Pro', 'Electronics', 25, 10, 999.00, 'Apple Store Rwanda', 'Main Warehouse'),
(3, 'Office Chair Ergonomic', 'Furniture', 30, 15, 120.00, 'Furniture Plus Ltd', 'Furniture Section'),
(4, 'HP LaserJet Printer', 'Electronics', 8, 5, 250.00, 'HP Rwanda', 'Electronics Section'),
(5, 'Desk Lamp LED', 'Furniture', 50, 20, 35.00, 'Office Supplies Ltd', 'Furniture Section'),
(6, 'Samsung Monitor 27"', 'Electronics', 12, 8, 280.00, 'Samsung Rwanda', 'Electronics Section'),
(7, 'Wireless Mouse', 'Electronics', 45, 25, 18.00, 'Tech Accessories Ltd', 'Accessories Section'),
(8, 'Keyboard Mechanical', 'Electronics', 20, 10, 65.00, 'Gaming Gear Rwanda', 'Accessories Section');

-- Insert sample cashpower transactions
INSERT INTO cashpower_transactions (transaction_id, customer_name, customer_phone, meter_number, amount, units, token, commission, commission_rate, status, payment_method, processed_by) VALUES
('CP001', 'Alice Uwimana', '+250788111222', '12345678901', 5000.00, 45.5, '12345678901234567890', 250.00, 5.00, 'completed', 'mobile_money', 1),
('CP002', 'Peter Nkurunziza', '+250788333444', '09876543210', 10000.00, 91.0, '09876543210987654321', 500.00, 5.00, 'completed', 'cash', 1),
('CP003', 'Mary Mukamana', '+250788555666', '11223344556', 3000.00, 27.3, '11223344556677889900', 150.00, 5.00, 'pending', 'mobile_money', 2),
('CP004', 'John Doe', '+250788123456', '55667788990', 7500.00, 68.2, '55667788990011223344', 375.00, 5.00, 'completed', 'bank_transfer', 1),
('CP005', 'Jane Smith', '+250788654321', '99887766554', 2000.00, 18.2, '99887766554433221100', 100.00, 5.00, 'completed', 'cash', 2);

-- Insert sample packages
INSERT INTO packages (name, description, price, duration_months, features) VALUES
('Basic Office Package', 'Essential office equipment for small businesses', 500.00, 12, '["1x Laptop", "1x Printer", "1x Office Chair"]'),
('Premium Tech Package', 'Complete technology solution for modern offices', 2500.00, 24, '["2x Laptops", "1x Monitor", "1x Printer", "Accessories"]'),
('Startup Bundle', 'Perfect package for new businesses', 1200.00, 18, '["1x Laptop", "1x Monitor", "1x Chair", "1x Desk Lamp"]');

-- Insert sample notifications
INSERT INTO notifications (user_id, title, message, type) VALUES
(1, 'Low Stock Alert', 'HP LaserJet Printer stock is running low (8 units remaining)', 'warning'),
(1, 'New Customer', 'New customer Bob Johnson has been added to the system', 'info'),
(2, 'Cashpower Transaction', 'Cashpower transaction CP003 is pending approval', 'info'),
(1, 'Monthly Report', 'Monthly sales report is ready for review', 'success');

-- Create indexes for better performance
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_stock_product_name ON stock(product_name);
CREATE INDEX idx_cashpower_meter ON cashpower_transactions(meter_number);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_quotations_number ON quotations(quotation_number);
CREATE INDEX idx_proformas_number ON proformas(proforma_number);
