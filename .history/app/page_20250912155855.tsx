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

interface User {
  id: number
  
  email: string
  role: string
  name: string
}

export default function NetproManagement() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    // Check if user is logged in
    const savedUser = localStorage.getItem("netpro_user")
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser))
    }
  }, [])

  const handleLogin = (user: User) => {
    setCurrentUser(user)
    localStorage.setItem("netpro_user", JSON.stringify(user))
  }

  const handleLogout = () => {
    setCurrentUser(null)
    localStorage.removeItem("netpro_user")
    setActiveTab("dashboard")
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />
  }

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, adminOnly: false },
    // { id: "customers", label: "Customers", icon: Users, adminOnly: false },
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

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">{currentUser.name}</p>
              <p className="text-xs text-gray-500 capitalize">{currentUser.role}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="w-full bg-transparent">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
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
            <Button variant="ghost" size="sm">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">{renderContent()}</main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  )
}
