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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(50),
    country VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock table
CREATE TABLE IF NOT EXISTS stock (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    supplier VARCHAR(100),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Cashpower transactions table
CREATE TABLE IF NOT EXISTS cashpower_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    meter_number VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    units DECIMAL(10,2) NOT NULL,
    token VARCHAR(20) NOT NULL,
    commission DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INT,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('draft', 'sent', 'paid', 'overdue') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Insert sample users
INSERT INTO users (username, email, password, role, full_name) VALUES
('admin', 'admin@netpro.com', 'admin123', 'admin', 'System Administrator'),
('user', 'user@netpro.com', 'user123', 'user', 'Regular User');

-- Insert sample customers
INSERT INTO customers (name, email, phone, address, city, country) VALUES
('John Doe', 'john@example.com', '+250788123456', 'KG 123 St', 'Kigali', 'Rwanda'),
('Jane Smith', 'jane@example.com', '+250788654321', 'KN 456 Ave', 'Kigali', 'Rwanda'),
('Bob Johnson', 'bob@example.com', '+250788789012', 'KK 789 Rd', 'Kigali', 'Rwanda');

-- Insert sample stock items
INSERT INTO stock (product_name, category, quantity, unit_price, supplier) VALUES
('Laptop Dell XPS', 'Electronics', 15, 850.00, 'Dell Rwanda'),
('iPhone 14', 'Electronics', 25, 999.00, 'Apple Store'),
('Office Chair', 'Furniture', 30, 120.00, 'Furniture Plus'),
('Printer HP LaserJet', 'Electronics', 8, 299.00, 'HP Rwanda'),
('Desk Lamp', 'Furniture', 50, 45.00, 'Office Supplies Ltd');

-- Insert sample cashpower transactions
INSERT INTO cashpower_transactions (customer_name, meter_number, amount, units, token, commission, status) VALUES
('Alice Uwimana', '12345678901', 5000.00, 45.5, '12345678901234567890', 250.00, 'completed'),
('Peter Nkurunziza', '09876543210', 10000.00, 91.0, '09876543210987654321', 500.00, 'completed'),
('Mary Mukamana', '11223344556', 3000.00, 27.3, '11223344556677889900', 150.00, 'pending');
