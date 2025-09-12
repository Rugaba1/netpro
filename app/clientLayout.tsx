"use client"

import type React from "react"
import { Suspense } from "react"
import { AccountContext } from "@/lib/account-context"
import { NotificationProvider } from "@/lib/notification-system"
import { Inter } from "next/font/google"
import { useState } from "react"

const inter = Inter({ subsets: ["latin"] })

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Account balance state - starting with 1,822,700 RWF
  const [balance, setBalance] = useState(1822700)
  const [transactions, setTransactions] = useState([])

  const updateBalance = (amount: number) => {
    setBalance((prev) => prev + amount) // Increase balance when payment is made
  }

  const addTransaction = (transaction: any) => {
    setTransactions((prev) => [
      {
        ...transaction,
        id: Date.now(),
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ])
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <Suspense fallback={null}>
          <AccountContext.Provider value={{ balance, updateBalance, transactions, addTransaction }}>
            <NotificationProvider>{children}</NotificationProvider>
          </AccountContext.Provider>
        </Suspense>
      </body>
    </html>
  )
}
