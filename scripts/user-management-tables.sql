-- User Management System Tables
-- Enhanced user system with roles and permissions

-- Drop existing users table if it exists and recreate with proper structure
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS users;

-- Users table with enhanced role management
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role ENUM('admin', 'user') DEFAULT 'user',
    permissions JSON,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- User sessions table for authentication
CREATE TABLE user_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert default admin user
INSERT INTO users (username, email, password_hash, first_name, last_name, role, permissions, status) VALUES
('admin', 'admin@netpro.com', '$2b$10$rQZ9QmjytWIeJqvGVqB9/.K8yF8xB5qF5qF5qF5qF5qF5qF5qF5qF', 'System', 'Administrator', 'admin', 
'{"dashboard": true, "customers": true, "products": true, "packages": true, "invoices": true, "quotations": true, "proformas": true, "reports": true, "settings": true, "users": true}', 'active');

-- Insert sample users
INSERT INTO users (username, email, password_hash, first_name, last_name, role, permissions, status, created_by) VALUES
('john.doe', 'john@netpro.com', '$2b$10$rQZ9QmjytWIeJqvGVqB9/.K8yF8xB5qF5qF5qF5qF5qF5qF5qF5qF', 'John', 'Doe', 'user', 
'{"dashboard": true, "customers": true, "products": false, "packages": false, "invoices": true, "quotations": true, "proformas": false, "reports": false, "settings": false, "users": false}', 'active', 1),
('jane.smith', 'jane@netpro.com', '$2b$10$rQZ9QmjytWIeJqvGVqB9/.K8yF8xB5qF5qF5qF5qF5qF5qF5qF5qF', 'Jane', 'Smith', 'user', 
'{"dashboard": true, "customers": true, "products": true, "packages": true, "invoices": false, "quotations": false, "proformas": false, "reports": false, "settings": false, "users": false}', 'active', 1),
('mike.wilson', 'mike@netpro.com', '$2b$10$rQZ9QmjytWIeJqvGVqB9/.K8yF8xB5qF5qF5qF5qF5qF5qF5qF5qF', 'Mike', 'Wilson', 'user', 
'{"dashboard": true, "customers": false, "products": false, "packages": false, "invoices": true, "quotations": true, "proformas": true, "reports": false, "settings": false, "users": false}', 'inactive', 1);

-- Create indexes for better performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);
