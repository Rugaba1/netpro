"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Zap, DollarSign, Users, TrendingUp } from "lucide-react"

interface CashpowerTransaction {
  id: number
  customer_name: string
  meter_number: string
  amount: number
  units: number
  token: string
  commission: number
  status: "pending" | "completed" | "failed"
  created_at: string
}

export default function CashpowerManagement() {
  const [transactions, setTransactions] = useState<CashpowerTransaction[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      const response = await fetch("http://localhost/netpro-backend/api/cashpower/read.php")
      const data = await response.json()
      if (data.records) {
        setTransactions(data.records)
      }
    } catch (error) {
      console.error("Error fetching cashpower transactions:", error)
      // Fallback data for demo
      setTransactions([
        {
          id: 1,
          customer_name: "Alice Uwimana",
          meter_number: "12345678901",
          amount: 5000.0,
          units: 45.5,
          token: "12345678901234567890",
          commission: 250.0,
          status: "completed",
          created_at: "2024-01-15 10:30:00",
        },
        {
          id: 2,
          customer_name: "Peter Nkurunziza",
          meter_number: "09876543210",
          amount: 10000.0,
          units: 91.0,
          token: "09876543210987654321",
          commission: 500.0,
          status: "completed",
          created_at: "2024-01-15 09:15:00",
        },
        {
          id: 3,
          customer_name: "Mary Mukamana",
          meter_number: "11223344556",
          amount: 3000.0,
          units: 27.3,
          token: "11223344556677889900",
          commission: 150.0,
          status: "pending",
          created_at: "2024-01-15 08:45:00",
        },
        {
          id: 4,
          customer_name: "Jean Baptiste",
          meter_number: "55667788990",
          amount: 7500.0,
          units: 68.2,
          token: "55667788990011223344",
          commission: 375.0,
          status: "completed",
          created_at: "2024-01-14 16:20:00",
        },
        {
          id: 5,
          customer_name: "Grace Uwimana",
          meter_number: "44556677889",
          amount: 2000.0,
          units: 18.2,
          token: "44556677889900112233",
          commission: 100.0,
          status: "failed",
          created_at: "2024-01-14 14:10:00",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const filteredTransactions = transactions.filter(
    (transaction) =>
      transaction.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.meter_number.includes(searchTerm) ||
      transaction.token.includes(searchTerm),
  )

  const totalTransactions = transactions.length
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0)
  const totalCommission = transactions.reduce((sum, t) => sum + t.commission, 0)
  const completedTransactions = transactions.filter((t) => t.status === "completed").length

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500"
      case "pending":
        return "bg-yellow-500"
      case "failed":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading cashpower data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Cashpower Management</h1>
          <p className="text-gray-600">Manage electricity token transactions and commissions</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          New Transaction
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold">{totalTransactions}</p>
              </div>
              <Zap className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold">RWF {totalAmount.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Commission</p>
                <p className="text-2xl font-bold">RWF {totalCommission.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedTransactions}</p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by customer name, meter number, or token..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">Filter</Button>
            <Button variant="outline">Export</Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cashpower Transactions ({filteredTransactions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Customer</th>
                  <th className="text-left p-4 font-medium">Meter Number</th>
                  <th className="text-left p-4 font-medium">Amount</th>
                  <th className="text-left p-4 font-medium">Units</th>
                  <th className="text-left p-4 font-medium">Token</th>
                  <th className="text-left p-4 font-medium">Commission</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Date</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div>
                        <div className="font-medium">{transaction.customer_name}</div>
                        <div className="text-sm text-gray-500">ID: {transaction.id}</div>
                      </div>
                    </td>
                    <td className="p-4 font-mono">{transaction.meter_number}</td>
                    <td className="p-4 font-medium">RWF {transaction.amount.toLocaleString()}</td>
                    <td className="p-4">{transaction.units.toFixed(1)} kWh</td>
                    <td className="p-4">
                      <div className="font-mono text-sm bg-gray-100 p-2 rounded">{transaction.token}</div>
                    </td>
                    <td className="p-4 text-green-600 font-medium">RWF {transaction.commission.toLocaleString()}</td>
                    <td className="p-4">
                      <Badge className={`${getStatusColor(transaction.status)} text-white`}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                        <Button size="sm" variant="outline">
                          Print
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
