# NETPRO Management System

A comprehensive business management system built with Next.js and PHP, designed for managing customers, inventory, invoices, quotations, proformas, and cashpower transactions.

## 🚀 Features

### Core Modules
- **Dashboard** - Real-time business analytics and overview
- **Customer Management** - Complete customer database with CRM features
- **Product Management** - Inventory and product catalog management
- **Stock Management** - Real-time inventory tracking and alerts
- **Invoice Management** - Professional invoice generation and tracking
- **Quotation System** - Quote generation and conversion to invoices
- **Proforma Management** - Proforma invoice handling
- **Package Management** - Product bundling and package deals
- **Cashpower System** - Electricity token management and transactions
- **Reports & Analytics** - Comprehensive business reporting
- **User Management** - Role-based access control

### Key Features
- ✅ **Role-Based Access Control** - Admin, Manager, and User roles
- ✅ **Real-Time Notifications** - System alerts and updates
- ✅ **Professional UI** - Modern, responsive design
- ✅ **Database Integration** - MySQL backend with PHP APIs
- ✅ **Export Functionality** - CSV and PDF export capabilities
- ✅ **Search & Filtering** - Advanced search across all modules
- ✅ **Audit Trail** - Complete activity logging
- ✅ **Multi-Currency Support** - RWF primary with exchange rates
- ✅ **Mobile Responsive** - Works on all devices

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/UI** - Modern UI components
- **Lucide React** - Beautiful icons

### Backend
- **PHP 8+** - Server-side scripting
- **MySQL 8+** - Relational database
- **RESTful APIs** - Clean API architecture
- **PDO** - Secure database connections

### Development Tools
- **XAMPP/WAMP** - Local development environment
- **Git** - Version control
- **ESLint** - Code linting
- **Prettier** - Code formatting

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **XAMPP** or **WAMP** (for PHP and MySQL)
- **Git** (optional, for version control)

## 🚀 Quick Start

### 1. Clone or Download the Project

\`\`\`bash
# If using Git
git clone <repository-url>
cd netpro-management

# Or download and extract the ZIP file
\`\`\`

### 2. Install Dependencies

\`\`\`bash
# Install Node.js dependencies
npm install --legacy-peer-deps

# Alternative if above fails
npm install --force
\`\`\`

### 3. Setup XAMPP

1. **Download and Install XAMPP**
   - Visit [https://www.apachefriends.org/](https://www.apachefriends.org/)
   - Download XAMPP for your operating system
   - Install with default settings

2. **Start XAMPP Services**
   - Open XAMPP Control Panel
   - Start **Apache** and **MySQL** services
   - Ensure both show "Running" status

### 4. Setup Database

1. **Create Database**
   - Open phpMyAdmin: [http://localhost/phpmyadmin](http://localhost/phpmyadmin)
   - Create new database: `netpro_management`

2. **Import Database Schema**
   - In phpMyAdmin, select the `netpro_management` database
   - Go to "Import" tab
   - Choose file: `database/netpro_management_complete.sql`
   - Click "Go" to import

### 5. Setup Backend

1. **Copy Backend Files**
   \`\`\`bash
   # Copy backend folder to XAMPP htdocs
   cp -r backend /xampp/htdocs/netpro-backend
   
   # On Windows (using Command Prompt)
   xcopy backend C:\xampp\htdocs\netpro-backend /E /I
   \`\`\`

2. **Test Backend API**
   - Visit: [http://localhost/netpro-backend/api/users/login.php](http://localhost/netpro-backend/api/users/login.php)
   - Should return JSON response (even if error, means PHP is working)

### 6. Start Development Server

\`\`\`bash
# Start Next.js development server
npm run dev
\`\`\`

### 7. Access the Application

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost/netpro-backend/api/](http://localhost/netpro-backend/api/)
- **phpMyAdmin**: [http://localhost/phpmyadmin](http://localhost/phpmyadmin)

## 🔐 Default Login Credentials

| Role | Username | Password | Access Level |
|------|----------|----------|--------------|
| Admin | `admin` | `admin123` | Full system access |
| Manager | `manager` | `manager123` | Management features |
| User | `user` | `user123` | Limited access |

## 📁 Project Structure

\`\`\`
netpro-management/
├── app/                          # Next.js app directory
│   ├── components/              # React components
│   │   ├── dashboard.tsx        # Dashboard component
│   │   ├── customer-management.tsx
│   │   ├── stock-management.tsx
│   │   ├── cashpower-management.tsx
│   │   ├── reports.tsx
│   │   └── ...
│   ├── api/                     # Next.js API routes (optional)
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page
├── backend/                     # PHP backend
│   ├── api/                     # API endpoints
│   │   ├── users/              # User management APIs
│   │   ├── customers/          # Customer APIs
│   │   ├── products/           # Product APIs
│   │   ├── stock/              # Stock management APIs
│   │   ├── cashpower/          # Cashpower APIs
│   │   └── reports/            # Reporting APIs
│   ├── config/                 # Configuration files
│   │   └── database.php        # Database connection
│   ├── objects/                # PHP classes
│   └── setup/                  # Setup scripts
├── database/                   # Database files
│   └── netpro_management_complete.sql
├── public/                     # Static assets
│   └── images/                 # Images and logos
├── components/                 # Shadcn/UI components
├── lib/                        # Utility functions
├── types/                      # TypeScript type definitions
├── package.json               # Node.js dependencies
├── tailwind.config.ts         # Tailwind configuration
├── next.config.js             # Next.js configuration
└── README.md                  # This file
\`\`\`

## 🔧 Configuration

### Database Configuration

Edit `backend/config/database.php` to match your database settings:

\`\`\`php
private $host = "localhost";
private $db_name = "netpro_management";
private $username = "root";
private $password = "";
\`\`\`

### Environment Variables

Create `.env.local` file in the root directory:

\`\`\`env
# Database
DB_HOST=localhost
DB_NAME=netpro_management
DB_USER=root
DB_PASS=

# API URLs
NEXT_PUBLIC_API_URL=http://localhost/netpro-backend/api
\`\`\`

## 📊 Database Schema

The system uses a comprehensive MySQL database with the following main tables:

- **users** - System users and authentication
- **customers** - Customer information and contacts
- **products** - Product catalog and inventory
- **stock** - Real-time inventory tracking
- **invoices** - Invoice management
- **quotations** - Quote generation and tracking
- **proformas** - Proforma invoice handling
- **cashpower_transactions** - Electricity token transactions
- **packages** - Product bundles and packages
- **notifications** - System notifications
- **audit_log** - Activity tracking

## 🔌 API Endpoints

### Authentication
- `POST /api/users/login.php` - User login
- `POST /api/users/logout.php` - User logout

### Customers
- `GET /api/customers/read.php` - Get all customers
- `POST /api/customers/create.php` - Create new customer
- `PUT /api/customers/update.php` - Update customer
- `DELETE /api/customers/delete.php` - Delete customer

### Products
- `GET /api/products/read.php` - Get all products
- `POST /api/products/create.php` - Create new product
- `PUT /api/products/update.php` - Update product

### Stock
- `GET /api/stock/read.php` - Get stock levels
- `POST /api/stock/update.php` - Update stock
- `GET /api/stock/movements.php` - Get stock movements

### Cashpower
- `GET /api/cashpower/read.php` - Get transactions
- `POST /api/cashpower/create.php` - Create transaction
- `PUT /api/cashpower/update.php` - Update transaction status

### Reports
- `GET /api/reports/sales.php` - Sales reports
- `GET /api/reports/inventory.php` - Inventory reports
- `GET /api/reports/cashpower.php` - Cashpower reports

## 🎨 Customization

### Styling
- Modify `tailwind.config.ts` for theme customization
- Edit `app/globals.css` for global styles
- Components use Tailwind CSS classes

### Branding
- Replace logo in `public/images/`
- Update company information in database settings
- Modify colors in Tailwind configuration

### Features
- Add new components in `app/components/`
- Create new API endpoints in `backend/api/`
- Extend database schema as needed

## 🚀 Deployment

### Production Deployment

1. **Frontend (Vercel/Netlify)**
   \`\`\`bash
   npm run build
   npm run start
   \`\`\`

2. **Backend (cPanel/VPS)**
   - Upload `backend/` folder to web server
   - Import database to production MySQL
   - Update database credentials
   - Ensure PHP 8+ is available

3. **Database**
   - Create production database
   - Import `database/netpro_management_complete.sql`
   - Update connection settings

## 🐛 Troubleshooting

### Common Issues

1. **npm install fails**
   \`\`\`bash
   npm install --legacy-peer-deps
   # or
   npm install --force
   \`\`\`

2. **XAMPP not starting**
   - Check if ports 80 and 3306 are free
   - Run XAMPP as administrator
   - Check Windows Firewall settings

3. **Database connection fails**
   - Verify MySQL is running
   - Check database credentials
   - Ensure database exists

4. **API returns 404**
   - Verify backend files are in htdocs
   - Check Apache is running
   - Verify file permissions

5. **CORS errors**
   - Check CORS headers in `database.php`
   - Verify API URL in frontend

### Debug Mode

Enable debug mode by setting in `backend/config/database.php`:

\`\`\`php
error_reporting(E_ALL);
ini_set('display_errors', 1);
\`\`\`

## 📞 Support

For support and questions:

- **Email**: support@netpro.com
- **Documentation**: Check this README
- **Issues**: Create GitHub issue (if applicable)

## 📄 License

This project is licensed under the MIT License. See LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 🔄 Updates

### Version 1.0.0
- Initial release with all core features
- Complete database schema
- Full API implementation
- Responsive UI design

### Planned Features
- [ ] Email notifications
- [ ] SMS integration
- [ ] Advanced reporting
- [ ] Mobile app
- [ ] Multi-language support
- [ ] Advanced analytics

---

**NETPRO Management System** - Streamlining business operations with modern technology.
