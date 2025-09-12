#!/bin/bash

echo "🚀 Setting up NETPRO Management System..."

# Install dependencies with legacy peer deps to fix the date-fns issue
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Create backend directory structure
echo "📁 Creating backend directory structure..."
mkdir -p backend/config
mkdir -p backend/api/users
mkdir -p backend/api/customers
mkdir -p backend/api/stock
mkdir -p backend/api/cashpower
mkdir -p backend/api/reports
mkdir -p backend/objects

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Install XAMPP and start Apache + MySQL"
echo "2. Create database 'netpro_management'"
echo "3. Import the SQL file: database/netpro_management.sql"
echo "4. Copy backend folder to htdocs/netpro-backend/"
echo "5. Run: npm run dev"
echo ""
echo "🔑 Login credentials:"
echo "Admin: admin / admin123"
echo "User: user / user123"
