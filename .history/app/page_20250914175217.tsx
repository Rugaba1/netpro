"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Users,
  Package,
  ShoppingCart,
  FileText,
  Bell,
  Search,
  Menu,
  X,
  Home,
  UserCheck,
  Boxes,
  Zap,
  FileBarChart,
  UserCog,
  LogOut,
  AlertTriangle,
} from "lucide-react"
 
import Dashboard from "./components/dashboard"
import CustomerManagement from "./components/manage-customers"
import ProductManagement from "./components/product-management"
import PackageManagement from "./components/manage-packages"
import InvoiceManagement from "./components/manage-invoice"
import QuotationManagement from "./components/manage-quotations"
import ProformaManagement from "./components/manage-proforma"
import StockManagement from "./components/stock-management"
import CashpowerManagement from "./components/cashpower-management"
import Reports from "./components/reports"
import UserManagement from "./components/manage-users"
import Login from "./components/login"
import { signIn } from 'next-auth/react'
import SupplierManagement from "./components/supplier-management"
import { checkExpiringInvoices } from "./actions/check-expiring-invoices"

interface User {
  id: number
  email: string
  role: string
  name: string
}

interface ExpiringInvoice {
  id: number
  billing_name: string
  amount_to_pay: number
  amount_paid: number
  end_date: Date
  status: string
  customer?: {
    name: string
  }
  company?: {
    name: string
  }
  invoice_items: Array<{
    item: {
      name: string
    }
  }>
}

export default function NetproManagement() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [notifications, setNotifications] = useState<ExpiringInvoice[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [notificationCount, setNotificationCount] = useState(0)

  useEffect(() => {
    // Check if user is logged in
    const savedUser = localStorage.getItem("netpro_user")
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser))
    }
  }, [])

  // Check for expiring invoices every 30 seconds
  useEffect(() => {
    if (!currentUser) return;

    const checkInvoices = async () => {
      try {
        const result = await checkExpiringInvoices();
        if (result.success && result.invoices.length > 0) {
          setNotifications(result.invoices);
          setNotificationCount(result.count);
        }
      } catch (error) {
        console.error('Failed to check expiring invoices:', error);
      }
    };

    // Check immediately on component mount
    checkInvoices();

    // Set up interval for checking every 30 seconds
    const interval = setInterval(checkInvoices, 30000);

    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleLogin = (user: User) => {
    setCurrentUser(user)
    localStorage.setItem("netpro_user", JSON.stringify(user))
  }

  const handleLogout = () => {
    setCurrentUser(null)
    localStorage.removeItem("netpro_user")
    setActiveTab("dashboard")
    setNotifications([])
    setNotificationCount(0)
  }

  const calculateRemainingDays = (endDate: Date): number => {
    const today = new Date();
    const end = new Date(endDate);
    
    // Reset time part to compare only dates
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    const timeDiff = end.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return daysDiff;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />
  }

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, adminOnly: false },
    { id: "customers", label: "Customers", icon: Users, adminOnly: false },
    { id: "suppliers", label: "Suppliers", icon: Users, adminOnly: false },
    { id: "packages", label: "Packages", icon: Package, adminOnly: false },
    { id: "products", label: "Products", icon: ShoppingCart, adminOnly: false },
    { id: "invoice", label: "Invoice", icon: FileText, adminOnly: false },
    { id: "proforma", label: "Proforma", icon: FileText, adminOnly: false },
    { id: "quotation", label: "Quotation", icon: FileText, adminOnly: false },
    { id: "stock", label: "Stock", icon: Boxes, adminOnly: false },
    { id: "cashpower", label: "Cashpower", icon: Zap, adminOnly: false },
    { id: "report", label: "Report", icon: FileBarChart, adminOnly: false },
    { id: "management", label: "Management", icon: UserCog, adminOnly: true },
  ]

  const filteredMenuItems = menuItems.filter((item) => !item.adminOnly || currentUser.role === "admin")

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />
      case "customers":
        return <CustomerManagement />
      case "suppliers":
        return <SupplierManagement />
      case "products":
        return <ProductManagement />
      case "packages":
        return <PackageManagement />
      case "invoice":
        return <InvoiceManagement />
      case "quotation":
        return <QuotationManagement />
      case "proforma":
        return <ProformaManagement />
      case "stock":
        return <StockManagement />
      case "cashpower":
        return <CashpowerManagement />
      case "report":
        return <Reports />
      case "management":
        return currentUser.role === "admin" ? <UserManagement /> : <Dashboard />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">NP</span>
            </div>
            <span className="text-xl font-bold text-gray-800">NETPRO</span>
          </div>
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="mt-6">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id)
                  setSidebarOpen(false)
                }}
                className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-50 transition-colors ${
                  activeTab === item.id ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600" : "text-gray-600"
                }`}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b h-16 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold text-gray-800 capitalize">
              {activeTab === "management" ? "User Management" : activeTab}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            
            {/* Notifications Button */}
            <div className="relative">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative"
              >
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </Button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border z-50">
                  <div className="p-3 border-b">
                    <h3 className="font-semibold text-gray-800">Expiring Invoices</h3>
                    <p className="text-sm text-gray-500">Invoices expiring in less than 3 days</p>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No expiring invoices
                      </div>
                    ) : (
                      notifications.map((invoice) => {
                        const remainingDays = calculateRemainingDays(invoice.end_date);
                        const customerName = invoice.customer?.name || invoice.company?.name || 'Unknown';
                        
                        return (
                          <div key={invoice.id} className="p-3 border-b hover:bg-gray-50">
                            <div className="flex items-start space-x-3">
                              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{customerName}</h4>
                                <p className="text-xs text-gray-600">
                                  {invoice.invoice_items.map(item => item.item.name).join(', ')}
                                </p>
                                <div className="flex justify-between items-center mt-2">
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    remainingDays <= 1 
                                      ? 'bg-red-100 text-red-800' 
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {remainingDays} day{remainingDays !== 1 ? 's' : ''} left
                                  </span>
                                  <span className="text-xs font-medium">
                                    {formatCurrency(invoice.amount_to_pay - invoice.amount_paid)} due
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  
                  {notifications.length > 0 && (
                    <div className="p-3 border-t">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => {
                          setActiveTab('invoice');
                          setShowNotifications(false);
                        }}
                      >
                        View All Invoices
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User profile and logout */}
            <div className="flex items-center space-x-3">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-gray-800">{currentUser.name}</p>
                <p className="text-xs text-gray-500 capitalize">{currentUser.role}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">{renderContent()}</main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Overlay for notifications */}
      {showNotifications && (
        <div 
          className="fixed inset-0 z-40 lg:hidden" 
          onClick={() => setShowNotifications(false)}
        />
      )}
    </div>
  )
}