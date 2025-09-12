-- Create additional tables for stock, cashpower, and reports

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

-- Reports table to store generated reports
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

-- Create indexes for better performance
CREATE INDEX idx_stock_item_name ON stock_items(item_name);
CREATE INDEX idx_stock_status ON stock_items(status);
CREATE INDEX idx_cashpower_meter ON cashpower_transactions(meter_number);
CREATE INDEX idx_cashpower_date ON cashpower_transactions(transaction_date);
CREATE INDEX idx_reports_type ON reports(report_type);
CREATE INDEX idx_reports_date ON reports(created_at);
