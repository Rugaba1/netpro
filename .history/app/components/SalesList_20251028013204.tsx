'use client'

import { useState, useEffect } from 'react'
import { deleteSale, getSaleById } from '@/app/actions/sale-action'

interface SaleTransaction {
  id: number
  total_price: number
  sale_date: string
  customer: {
    name: string
    phone: string
  }
  SaleItem: Array<{
    id: number
    qty: number
    unit_price: number
    total_price: number
    item: {
      name: string
    }
  }>
}

export default function SalesList() {
  const [sales, setSales] = useState<SaleTransaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSales()
  }, [])

  const fetchSales = async () => {
    try {
      const response = await fetch('/api/sales')
      const data = await response.json()
      setSales(data.sales)
    } catch (error) {
      console.error('Error fetching sales:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this sale? Stock will be restored.')) {
      return
    }

    const result = await deleteSale(id)
    if (result.success) {
      fetchSales() // Refresh the list
    } else {
      alert('Failed to delete sale: ' + result.error)
    }
  }

  const handlePrintReceipt = async (saleId: number) => {
    const result = await getSaleById(saleId)
    if (result.success && result.data) {
      const saleWithNumberPrice = {
        ...result.data,
        total_price: Number(result.data.total_price),
        sale_date: result.data.sale_date.toString(),
        SaleItem: result.data.SaleItem.map(item => ({
          ...item,
          total_price: Number(item.total_price),
          unit_price: Number(item.unit_price)
        }))
      }
      printReceipt(saleWithNumberPrice)
    }
  }

  const printReceipt = (saleData: SaleTransaction) => {
    const receiptWindow = window.open('', '_blank')
    if (receiptWindow) {
      receiptWindow.document.write(`
        <html>
          <head>
            <title>Sales Receipt #${saleData.id}</title>
            <style>
              body { font-family: 'Courier New', monospace; margin: 20px; font-size: 14px; }
              .header { text-align: center; margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
              .details { margin-bottom: 15px; }
              .table { width: 100%; border-collapse: collapse; margin: 15px 0; }
              .table th, .table td { padding: 5px 0; border-bottom: 1px dashed #ddd; }
              .table th { text-align: left; }
              .table td { text-align: right; }
              .table td:first-child { text-align: left; }
              .total { text-align: right; font-weight: bold; margin: 15px 0; border-top: 2px solid #000; padding-top: 10px; }
              .footer { text-align: center; margin-top: 30px; font-size: 12px; border-top: 1px dashed #000; padding-top: 10px; }
              .barcode { text-align: center; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>ELECTRONICS STORE</h2>
              <p>123 Business Street</p>
              <p>City, State 12345</p>
              <p>Phone: (555) 123-4567</p>
            </div>
            
            <div class="details">
              <p><strong>RECEIPT #:</strong> ${saleData.id}</p>
              <p><strong>DATE:</strong> ${new Date(saleData.sale_date).toLocaleDateString()}</p>
              <p><strong>TIME:</strong> ${new Date().toLocaleTimeString()}</p>
              <p><strong>CUSTOMER:</strong> ${saleData.customer.name}</p>
            </div>
            
            <table class="table">
              <thead>
                <tr>
                  <th>ITEM</th>
                  <th>QTY</th>
                  <th>PRICE</th>
                  <th>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                ${saleData.SaleItem.map(item => `
                  <tr>
                    <td>${item.item.name}</td>
                    <td>${item.qty}</td>
                    <td>$${item.unit_price.toFixed(2)}</td>
                    <td>$${item.total_price.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="total">
              <strong>GRAND TOTAL: $${saleData.total_price.toFixed(2)}</strong>
            </div>
            
            <div class="barcode">
              <small>${saleData.id.toString().padStart(8, '0')}</small>
            </div>
            
            <div class="footer">
              <p>Thank you for your purchase!</p>
              <p>Returns accepted within 30 days with receipt</p>
              <p>www.ourstore.com</p>
            </div>
            
            <script>
              window.onload = function() {
                window.print();
                setTimeout(() => window.close(), 1000);
              }
            </script>
          </body>
        </html>
      `)
      receiptWindow.document.close()
    }
  }

  if (loading) return <div className="text-center py-8">Loading sales...</div>

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold">Sales History</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sale ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Items
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sales.map((sale) => (
              <tr key={sale.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  #{sale.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {sale.customer.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(sale.sale_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {sale.SaleItem.length} items
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  ${sale.total_price.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => handlePrintReceipt(sale.id)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Print
                  </button>
                  <button
                    onClick={() => handleDelete(sale.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}