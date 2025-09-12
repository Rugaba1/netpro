"use client"

import { createContext, useContext } from "react"

interface AccountState {
  balance: number
  updateBalance: (amount: number) => void
  transactions: any[]
  addTransaction: (txn: any) => void
}

/**
 * Global context for NETPRO’s cash-in-hand balance.
 */
export const AccountContext = createContext<AccountState>({
  balance: 0,
  updateBalance: () => {},
  transactions: [],
  addTransaction: () => {},
})

/**
 * Convenience hook for accessing the account context.
 *
 * import { useAccount } from '@/lib/account-context'
 */
export function useAccount() {
  return useContext(AccountContext)
}
