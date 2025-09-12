# NETPRO Management System - Local Setup Instructions

## Prerequisites

1. **XAMPP/WAMP/MAMP** - For PHP and MySQL
2. **Node.js** (v18 or higher)
3. **npm or yarn**

## Step 1: Download and Install XAMPP

1. Download XAMPP from https://www.apachefriends.org/
2. Install XAMPP with Apache, MySQL, and PHP
3. Start Apache and MySQL services from XAMPP Control Panel

## Step 2: Database Setup

1. Open phpMyAdmin (http://localhost/phpmyadmin)
2. Create a new database named `netpro_management`
3. Import the SQL files in this order:
   - `backend/setup/create-tables.sql`
   - `backend/setup/sample-data.sql`

## Step 3: Backend Setup

1. Copy the `backend` folder to your XAMPP htdocs directory:
   \`\`\`
   C:\xampp\htdocs\netpro-backend\
   \`\`\`

2. Update database credentials in `backend/config/database.php` if needed:
   \`\`\`php
   private $host = "localhost";
   private $db_name = "netpro_management";
   private $username = "root";
   private $password = "";
   \`\`\`

3. Test the API by visiting:
   \`\`\`
   http://localhost/netpro-backend/api/users/read.php
   \`\`\`

## Step 4: Frontend Setup

1. Download the project files
2. Open terminal/command prompt in the project directory
3. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

4. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

5. Open your browser and go to:
   \`\`\`
   http://localhost:3000
   \`\`\`

## Step 5: Login Credentials

Use these credentials to login:

**Admin Account:**
- Username: `admin`
- Password: `admin123`

**User Account:**
- Username: `user`
- Password: `user123`

## Step 6: API Configuration

The frontend is configured to use the PHP backend. If you need to change the API URL, update the base URL in the API calls.

## Troubleshooting

### Common Issues:

1. **Database Connection Error:**
   - Make sure MySQL is running in XAMPP
   - Check database credentials in `backend/config/database.php`
   - Ensure the database `netpro_management` exists

2. **CORS Errors:**
   - The PHP files include CORS headers
   - Make sure you're accessing via http://localhost, not file://

3. **API Not Working:**
   - Check that Apache is running in XAMPP
   - Verify the backend folder is in the correct location
   - Test API endpoints directly in browser

4. **Frontend Not Loading:**
   - Make sure Node.js is installed
   - Run `npm install` to install dependencies
   - Check that port 3000 is not in use

## File Structure

\`\`\`
netpro-management/
├── app/                    # Next.js frontend
├── backend/               # PHP backend
│   ├── api/              # API endpoints
│   ├── config/           # Database configuration
│   ├── objects/          # PHP classes
│   └── setup/            # Database setup files
├── public/               # Static assets
└── package.json          # Node.js dependencies
\`\`\`

## Features Available

✅ **Authentication System**
✅ **Customer Management**
✅ **Product & Package Management**
✅ **Invoice, Proforma & Quotation Management**
✅ **Stock Management**
✅ **Cashpower (Electricity Token) Management**
✅ **Comprehensive Reporting System**
✅ **User Management (Admin only)**
✅ **Role-based Access Control**

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify XAMPP services are running
3. Ensure all files are in the correct locations
4. Check database connection and data

The system is now ready for local development and testing!
