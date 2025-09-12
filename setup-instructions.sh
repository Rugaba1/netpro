#!/bin/bash

# NETPRO Management System - Local Setup Script
# This script automates the setup process for the NETPRO Management System

echo "=========================================="
echo "NETPRO Management System - Setup Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if Node.js is installed
check_nodejs() {
    print_step "Checking Node.js installation..."
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_status "Node.js is installed: $NODE_VERSION"
        return 0
    else
        print_error "Node.js is not installed. Please install Node.js first."
        return 1
    fi
}

# Check if npm is installed
check_npm() {
    print_step "Checking npm installation..."
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_status "npm is installed: $NPM_VERSION"
        return 0
    else
        print_error "npm is not installed. Please install npm first."
        return 1
    fi
}

# Install npm dependencies
install_dependencies() {
    print_step "Installing npm dependencies..."
    
    if npm install --legacy-peer-deps; then
        print_status "Dependencies installed successfully!"
        return 0
    else
        print_error "Failed to install dependencies."
        print_warning "Trying alternative installation method..."
        
        if npm install --force; then
            print_status "Dependencies installed with --force flag!"
            return 0
        else
            print_error "Failed to install dependencies with both methods."
            return 1
        fi
    fi
}

# Check if XAMPP is running
check_xampp() {
    print_step "Checking XAMPP services..."
    
    # Check if Apache is running (port 80)
    if netstat -an | grep -q ":80.*LISTEN"; then
        print_status "Apache server is running on port 80"
        APACHE_RUNNING=true
    else
        print_warning "Apache server is not running on port 80"
        APACHE_RUNNING=false
    fi
    
    # Check if MySQL is running (port 3306)
    if netstat -an | grep -q ":3306.*LISTEN"; then
        print_status "MySQL server is running on port 3306"
        MYSQL_RUNNING=true
    else
        print_warning "MySQL server is not running on port 3306"
        MYSQL_RUNNING=false
    fi
    
    if [ "$APACHE_RUNNING" = false ] || [ "$MYSQL_RUNNING" = false ]; then
        print_warning "Please start XAMPP services (Apache and MySQL) before continuing."
        print_warning "You can start XAMPP from the control panel or command line."
        return 1
    fi
    
    return 0
}

# Setup backend directory
setup_backend() {
    print_step "Setting up PHP backend..."
    
    # Check if htdocs directory exists
    HTDOCS_PATHS=(
        "/xampp/htdocs"
        "/opt/lampp/htdocs"
        "/Applications/XAMPP/htdocs"
        "C:/xampp/htdocs"
        "/var/www/html"
    )
    
    HTDOCS_DIR=""
    for path in "${HTDOCS_PATHS[@]}"; do
        if [ -d "$path" ]; then
            HTDOCS_DIR="$path"
            break
        fi
    done
    
    if [ -z "$HTDOCS_DIR" ]; then
        print_error "Could not find htdocs directory. Please manually copy the backend folder to your web server directory."
        return 1
    fi
    
    print_status "Found htdocs directory: $HTDOCS_DIR"
    
    # Copy backend files
    if [ -d "backend" ]; then
        TARGET_DIR="$HTDOCS_DIR/netpro-backend"
        
        if cp -r backend "$TARGET_DIR"; then
            print_status "Backend files copied to: $TARGET_DIR"
            
            # Set permissions (Unix-like systems)
            if [[ "$OSTYPE" != "msys" && "$OSTYPE" != "win32" ]]; then
                chmod -R 755 "$TARGET_DIR"
                print_status "Backend permissions set successfully"
            fi
            
            return 0
        else
            print_error "Failed to copy backend files"
            return 1
        fi
    else
        print_error "Backend directory not found in current location"
        return 1
    fi
}

# Test database connection
test_database() {
    print_step "Testing database connection..."
    
    # Try to connect to MySQL and create database
    if command -v mysql &> /dev/null; then
        print_status "MySQL client found, testing connection..."
        
        # Test connection (assuming default XAMPP settings)
        if mysql -u root -e "SELECT 1;" &> /dev/null; then
            print_status "MySQL connection successful!"
            
            # Create database if it doesn't exist
            mysql -u root -e "CREATE DATABASE IF NOT EXISTS netpro_management;" 2>/dev/null
            
            if [ -f "database/netpro_management_complete.sql" ]; then
                print_step "Importing database schema and data..."
                if mysql -u root netpro_management < database/netpro_management_complete.sql; then
                    print_status "Database imported successfully!"
                    return 0
                else
                    print_error "Failed to import database"
                    return 1
                fi
            else
                print_warning "Database SQL file not found. Please import manually."
                return 1
            fi
        else
            print_error "Cannot connect to MySQL. Please check your XAMPP installation."
            return 1
        fi
    else
        print_warning "MySQL client not found. Please import database manually."
        return 1
    fi
}

# Start development server
start_dev_server() {
    print_step "Starting development server..."
    
    print_status "Starting Next.js development server on http://localhost:3000"
    print_status "Backend API will be available at http://localhost/netpro-backend/api/"
    print_status ""
    print_status "Login credentials:"
    print_status "  Admin: admin / admin123"
    print_status "  User:  user / user123"
    print_status ""
    print_status "Press Ctrl+C to stop the server"
    print_status ""
    
    npm run dev
}

# Main setup function
main() {
    echo ""
    print_step "Starting NETPRO Management System setup..."
    echo ""
    
    # Check prerequisites
    if ! check_nodejs || ! check_npm; then
        print_error "Prerequisites not met. Please install Node.js and npm first."
        exit 1
    fi
    
    # Install dependencies
    if ! install_dependencies; then
        print_error "Failed to install dependencies. Setup aborted."
        exit 1
    fi
    
    # Check XAMPP services
    if ! check_xampp; then
        print_warning "XAMPP services are not running. Please start them manually."
        print_warning "You can continue with frontend-only setup or start XAMPP first."
        
        read -p "Continue with frontend-only setup? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Setup paused. Please start XAMPP and run this script again."
            exit 0
        fi
    else
        # Setup backend and database
        setup_backend
        test_database
    fi
    
    echo ""
    print_status "Setup completed successfully!"
    print_status "You can now start the development server."
    echo ""
    
    read -p "Start development server now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        start_dev_server
    else
        print_status "To start the server later, run: npm run dev"
        print_status "Backend API: http://localhost/netpro-backend/api/"
        print_status "Frontend: http://localhost:3000"
    fi
}

# Run main function
main "$@"
