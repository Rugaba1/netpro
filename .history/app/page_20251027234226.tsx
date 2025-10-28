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
  AlertCircle,
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
import { checkLowStockProducts } from "./actions/check-low-stock"
import { getCurrentStockValue } from "./actions/check-total-stock"
import { formatCurrency } from "@/lib/utils"
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

interface LowStockProduct {
  id: number
  name: string
  quantity: number
  reorder_level: number
  min_level: number
  product?: {
    name: string
  }
  supplier?: {
    name: string
  }
  stock_items_category?: {
    name: string
  }
}

type NotificationType = 'invoice' | 'stock';

interface NotificationItem {
  type: NotificationType
  data: ExpiringInvoice | LowStockProduct
  id: string
  timestamp: Date
}

export default function NetproManagement() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [showNotifications, setShowNotifications] = useState(true)
  const [notificationCount, setNotificationCount] = useState(0)
  const [activeNotificationTab, setActiveNotificationTab] = useState<NotificationType>('invoice')
  const[currentStockValue, setCurrentStockValue] = useState<number>(0)

  useEffect(() => {
    // Check if user is logged in
    const savedUser = localStorage.getItem("netpro_user")
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser))
    }
  }, [])

  // Check for expiring invoices and low stock products every 30 seconds
  useEffect(() => {
    if (!currentUser) return;

    const checkNotifications = async () => {
      try {
        const [invoiceResult, stockResult, currentStockValueData] = await Promise.all([
          checkExpiringInvoices(),
          checkLowStockProducts(), 
          getCurrentStockValue()
        ]);

        const newNotifications: NotificationItem[] = [];

        // Add expiring invoices to notifications
        if (invoiceResult.success && invoiceResult.invoices.length > 0) {
          invoiceResult.invoices.forEach(invoice => {
            newNotifications.push({
              type: 'invoice',
              data: invoice,
              id: `invoice-${invoice.id}`,
              timestamp: new Date(),
            });
          });
        }
        if (currentStockValueData.success) {
          setCurrentStockValue(currentStockValueData.total);
        }

        // Add low stock products to notifications
        if (stockResult.success && stockResult.products.length > 0) {
          stockResult.products.forEach(product => {
            newNotifications.push({
              type: 'stock',
              data: product,
              id: `stock-${product.id}`,
              timestamp: new Date(),
            });
          });
        }

        setNotifications(newNotifications);
        setNotificationCount(newNotifications.length);
      } catch (error) {
        console.error('Failed to check notifications:', error);
      }
    };

    // Check immediately on component mount
    checkNotifications();

    // Set up interval for checking every 30 seconds
    const interval = setInterval(checkNotifications, 30000);

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

  const getStockUrgency = (quantity: number, reorderLevel: number): string => {
    if (quantity === 0) return 'out-of-stock';
    if (quantity <= reorderLevel / 2) return 'critical';
    if (quantity <= reorderLevel) return 'low';
    if (quantity <= reorderLevel + 5) return 'warning';
    return 'normal';
  };

  const getStockUrgencyColor = (urgency: string): string => {
    switch (urgency) {
      case 'out-of-stock': return 'bg-red-100 text-red-800';
      case 'critical': return 'bg-red-100 text-red-800';
      case 'low': return 'bg-orange-100 text-orange-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStockUrgencyText = (urgency: string): string => {
    switch (urgency) {
      case 'out-of-stock': return 'Out of Stock';
      case 'critical': return 'Critical';
      case 'low': return 'Low';
      case 'warning': return 'Warning';
      default: return 'Normal';
    }
  };

  // Filter notifications by type
  const invoiceNotifications = notifications.filter(n => n.type === 'invoice');
  const stockNotifications = notifications.filter(n => n.type === 'stock');

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
              <h3 className="font-semibold text-gray-800"> {formatCurrency(currentStockValue)}</h3>
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
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-md shadow-lg border z-50">
                  <div className="p-3 border-b">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-gray-800">Notifications</h3>
                      <div className="flex space-x-1 justify-between">
                        <Button
                          variant={activeNotificationTab === 'invoice' ? 'default' : 'ghost'}
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => setActiveNotificationTab('invoice')}
                        >
                          Invoices ({invoiceNotifications.length})
                        </Button>
                        <Button
                          variant={activeNotificationTab === 'stock' ? 'default' : 'ghost'}
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => setActiveNotificationTab('stock')}
                        >
                          Stock ({stockNotifications.length})
                        </Button>
                        <Button variant={"ghost"}><X className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {activeNotificationTab === 'invoice' ? (
                      invoiceNotifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          No expiring invoices
                        </div>
                      ) : (
                        invoiceNotifications.map((notification) => {
                          const invoice = notification.data as ExpiringInvoice;
                          const remainingDays = calculateRemainingDays(invoice.end_date);
                          const customerName = invoice.customer?.name || invoice.company?.name || 'Unknown';
                          
                          return (
                            <div key={notification.id} className="p-3 border-b hover:bg-gray-50">
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
                      )
                    ) : (
                      stockNotifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          No low stock products
                        </div>
                      ) : (
                        stockNotifications.map((notification) => {
                          const product = notification.data as LowStockProduct;
                          const urgency = getStockUrgency(product.quantity, product.reorder_level);
                          
                          return (
                            <div key={notification.id} className="p-3 border-b hover:bg-gray-50">
                              <div className="flex items-start space-x-3">
                                <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                                <div className="flex-1">
                                  <h4 className="font-medium text-sm">{product.name}</h4>
                                  <p className="text-xs text-gray-600">
                                    {product.supplier?.name || 'No supplier'} • {product.stock_items_category?.name || 'No category'}
                                  </p>
                                  <div className="flex justify-between items-center mt-2">
                                    <span className={`text-xs px-2 py-1 rounded ${getStockUrgencyColor(urgency)}`}>
                                      {getStockUrgencyText(urgency)}: {product.quantity} left
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      Reorder at: {product.reorder_level}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )
                    )}
                  </div>
                  
                  {notifications.length > 0 && (
                    <div className="p-3 border-t">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => {
                          setActiveTab(activeNotificationTab === 'invoice' ? 'invoice' : 'stock');
                          setShowNotifications(false);
                        }}
                      >
                        View {activeNotificationTab === 'invoice' ? 'All Invoices' : 'Stock Management'}
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