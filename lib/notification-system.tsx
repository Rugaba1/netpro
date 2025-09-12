"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"

interface Notification {
  id: string
  type: "warning" | "error" | "info" | "success"
  title: string
  message: string
  time: string
  unread: boolean
  priority: "high" | "medium" | "low"
  category: "service_expiry" | "account_balance" | "payment" | "system"
  customerId?: string
  invoiceId?: string
  expiryDate?: string
  daysRemaining?: number
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, "id" | "time" | "unread">) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotification: (id: string) => void
  clearAllNotifications: () => void
  checkServiceExpiries: () => void
  checkAccountBalance: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Sample customer data with service expiry dates
  const [customerServices] = useState([
    {
      customerId: "1",
      customerName: "Hakizimana Yves",
      service: "120Mbps Internet",
      startDate: "2025-06-03",
      expiryDate: "2025-07-03",
      invoiceId: "INV-001",
    },
    {
      customerId: "2",
      customerName: "NSHIMYUMUREMYI Boniface",
      service: "Prepaid Unlimited",
      startDate: "2025-06-20",
      expiryDate: "2025-06-29", // Expires soon
      invoiceId: "INV-002",
    },
    {
      customerId: "3",
      customerName: "TUYISHIME Alain Serge",
      service: "Postpaid Unlimited",
      startDate: "2025-06-22",
      expiryDate: "2025-06-28", // Expires very soon
      invoiceId: "INV-003",
    },
    {
      customerId: "4",
      customerName: "John Doe",
      service: "5Mbps VPN",
      startDate: "2025-06-01",
      expiryDate: "2025-06-27", // Expires tomorrow
      invoiceId: "INV-004",
    },
  ])

  const calculateDaysRemaining = (expiryDate: string): number => {
    const today = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const checkServiceExpiries = () => {
    customerServices.forEach((service) => {
      const daysRemaining = calculateDaysRemaining(service.expiryDate)

      // Generate notifications for services expiring in 5 days or less
      if (daysRemaining <= 5 && daysRemaining >= 0) {
        const existingNotification = notifications.find(
          (n) => n.category === "service_expiry" && n.customerId === service.customerId,
        )

        if (!existingNotification) {
          let type: "warning" | "error" = "warning"
          let priority: "high" | "medium" | "low" = "medium"

          if (daysRemaining <= 1) {
            type = "error"
            priority = "high"
          }

          addNotification({
            type,
            priority,
            category: "service_expiry",
            title: `Service Expiring ${daysRemaining === 0 ? "Today" : daysRemaining === 1 ? "Tomorrow" : `in ${daysRemaining} days`}`,
            message: `${service.customerName}'s ${service.service} expires on ${service.expiryDate}. Please contact the customer for renewal.`,
            customerId: service.customerId,
            invoiceId: service.invoiceId,
            expiryDate: service.expiryDate,
            daysRemaining,
          })
        }
      }

      // Generate notifications for expired services
      if (daysRemaining < 0) {
        const existingNotification = notifications.find(
          (n) => n.category === "service_expiry" && n.customerId === service.customerId && n.type === "error",
        )

        if (!existingNotification) {
          addNotification({
            type: "error",
            priority: "high",
            category: "service_expiry",
            title: "Service Expired",
            message: `${service.customerName}'s ${service.service} expired ${Math.abs(daysRemaining)} days ago. Immediate action required.`,
            customerId: service.customerId,
            invoiceId: service.invoiceId,
            expiryDate: service.expiryDate,
            daysRemaining,
          })
        }
      }
    })
  }

  const checkAccountBalance = () => {
    const currentBalance = 1822700 // Current account balance
    const lowBalanceThreshold = 500000 // 500,000 RWF
    const criticalBalanceThreshold = 100000 // 100,000 RWF

    const existingBalanceNotification = notifications.find((n) => n.category === "account_balance")

    if (!existingBalanceNotification) {
      if (currentBalance <= criticalBalanceThreshold) {
        addNotification({
          type: "error",
          priority: "high",
          category: "account_balance",
          title: "Critical Account Balance",
          message: `Account balance is critically low: ${currentBalance.toLocaleString()} RWF. Immediate action required to avoid service disruption.`,
        })
      } else if (currentBalance <= lowBalanceThreshold) {
        addNotification({
          type: "warning",
          priority: "medium",
          category: "account_balance",
          title: "Low Account Balance",
          message: `Account balance is running low: ${currentBalance.toLocaleString()} RWF. Consider adding funds to maintain service continuity.`,
        })
      }
    }
  }

  const addNotification = (notification: Omit<Notification, "id" | "time" | "unread">) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      time: new Date().toLocaleString(),
      unread: true,
    }

    setNotifications((prev) => [newNotification, ...prev])
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, unread: false } : notification)),
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, unread: false })))
  }

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  const unreadCount = notifications.filter((n) => n.unread).length

  // Check for expiries and balance issues on component mount and periodically
  useEffect(() => {
    checkServiceExpiries()
    checkAccountBalance()

    // Check every hour for new expiries
    const interval = setInterval(
      () => {
        checkServiceExpiries()
        checkAccountBalance()
      },
      60 * 60 * 1000,
    ) // 1 hour

    return () => clearInterval(interval)
  }, [])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAllNotifications,
        checkServiceExpiries,
        checkAccountBalance,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}
