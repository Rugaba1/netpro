"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft, Printer, Download, Zap, DollarSign, User, Calendar, Hash } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface CashpowerTransaction {
  id: number
  amount: number
  meter_number: string
  customer_id: number
  customer_name: string
  created_at: string
  updated_at: string
  user_id: number
  token: string
  units: number
  commission: number
  status: string
}

export default function CashpowerTransactionDetail() {
  const params = useParams()
  const id = params.id as string
  const [transaction, setTransaction] = useState<CashpowerTransaction | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchTransaction()
    }
  }, [id])

  const fetchTransaction = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/cashpower/${id}`)
      setTransaction(response.data.transaction)
    } catch (error) {
      console.error("Error fetching transaction:", error)
      toast.error("Failed to fetch transaction details")
    } finally {
      setLoading(false)
    }
  }

  const printReceipt = () => {
    window.print()
  }

  const downloadReceipt = () => {
    // Create a printable version of the receipt
    const receiptContent = document.getElementById("receipt")?.innerHTML
    if (!receiptContent) return

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Cashpower Receipt - ${transaction?.token}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .receipt { border: 1px solid #ddd; padding: 20px; max-width: 400px; margin: 0 auto; }
              .header { text-align: center; margin-bottom: 20px; }
              .details { margin-bottom: 20px; }
              .detail-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
              .token { background: #f5f5f5; padding: 15px; text-align: center; font-family: monospace; font-size: 18px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="receipt">
              <div class="header">
                <h2>Cashpower Receipt</h2>
                <p>Transaction #${transaction?.id}</p>
              </div>
              <div class="details">
                <div class="detail-row">
                  <strong>Customer:</strong> ${transaction?.customer_name}
                </div>
                <div class="detail-row">
                  <strong>Meter Number:</strong> ${transaction?.meter_number}
                </div>
                <div class="detail-row">
                  <strong>Amount:</strong> RWF ${transaction?.amount.toLocaleString()}
                </div>
                <div class="detail-row">
                  <strong>Units:</strong> ${transaction?.units} kWh
                </div>
                <div class="detail-row">
                  <strong>Commission:</strong> RWF ${transaction?.commission.toLocaleString()}
                </div>
                <div class="detail-row">
                  <strong>Date:</strong> ${transaction ? new Date(transaction.created_at).toLocaleString() : ''}
                </div>
                <div class="detail-row">
                  <strong>Status:</strong> ${transaction?.status}
                </div>
              </div>
              <div class="token">
                <strong>TOKEN:</strong><br>
                ${transaction?.token}
              </div>
              <div class="footer">
                <p>Thank you for your purchase!</p>
                <p>Generated on ${new Date().toLocaleString()}</p>
              </div>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      
      // Wait for content to load before printing
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 250)
    }
  }

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
        <Loader2 className="w-8 h-8 animate-spin mr-2" />
        <div className="text-lg">Loading transaction details...</div>
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Transaction Not Found</h2>
        <p className="text-gray-600 mb-6">The transaction you're looking for doesn't exist.</p>
        <Link href="/cashpower">
          <Button>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Transactions
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Link href="/cashpower">
            <Button variant="ghost" className="mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Transactions
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Transaction Details</h1>
          <p className="text-gray-600">View and manage transaction #{transaction.id}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={downloadReceipt} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button onClick={printReceipt}>
            <Printer className="w-4 h-4 mr-2" />
            Print Receipt
          </Button>
        </div>
      </div>

      {/* Receipt Card (Printable) */}
      <Card id="receipt" className="print:shadow-none print:border-0">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Cashpower Transaction</span>
            <Badge className={`${getStatusColor(transaction.status)} text-white`}>
              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div className="flex items-center">
                <Hash className="w-5 h-5 mr-3 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">Transaction ID</p>
                  <p className="font-medium">#{transaction.id}</p>
                </div>
              </div>
              <div className="flex items-center">
                <User className="w-5 h-5 mr-3 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium">{transaction.customer_name}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Zap className="w-5 h-5 mr-3 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">Meter Number</p>
                  <p className="font-mono font-medium">{transaction.meter_number}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-3 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">Date & Time</p>
                  <p className="font-medium">{new Date(transaction.created_at).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center">
                <DollarSign className="w-5 h-5 mr-3 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="font-medium">RWF {transaction.amount.toLocaleString()}</p>
                </div>
              </div>
          
            </div>
          </div>

          {/* Token Display */}
          <div className="bg-gray-100 p-6 rounded-lg text-center mb-6">
            <p className="text-sm text-gray-500 mb-2">ELECTRICITY TOKEN</p>
            <p className="font-mono text-2xl font-bold tracking-wider">{transaction.token}</p>
            <p className="text-sm text-gray-500 mt-2">
              {transaction.units} kWh • Valid until {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </p>
          </div>

          {/* Transaction Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Units</p>
                <p className="text-2xl font-bold">{transaction.units} kWh</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Commission</p>
                <p className="text-2xl font-bold">RWF {transaction.commission.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Status</p>
                <p className="text-2xl font-bold">
                  <Badge className={`${getStatusColor(transaction.status)} text-white`}>
                    {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                  </Badge>
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt, #receipt * {
            visibility: visible;
          }
          #receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            box-shadow: none;
            border: none;
          }
        }
      `}</style>
    </div>
  )
}