'use client'

import { useState, useEffect } from 'react'
import { deleteSale, getSaleById } from '@/app/actions/sale-action'
import { formatCurrency } from '@/lib/utils'

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
    const receiptWindow = window.open('', '_blank', 'width=400,height=600')
    if (receiptWindow) {
      receiptWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>NETPRO Receipt #${saleData.id}</title>
            <meta charset="utf-8">
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: 12px;
                line-height: 1.4;
                color: #333;
                background: white;
                padding: 15px;
                max-width: 380px;
                margin: 0 auto;
              }
              
              .receipt-container {
                border: 2px solid #1e40af;
                border-radius: 8px;
                padding: 20px;
                background: white;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
              }
              
              .header {
                text-align: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 2px dashed #1e40af;
              }
              
              .company-logo {
                max-width: 120px;
                height: auto;
                margin: 0 auto 10px;
                display: block;
              }
              
              .company-name {
                font-size: 18px;
                font-weight: bold;
                color: #1e40af;
                margin-bottom: 5px;
                text-transform: uppercase;
                letter-spacing: 1px;
              }
              
              .company-details {
                font-size: 10px;
                color: #666;
                line-height: 1.3;
              }
              
              .receipt-title {
                text-align: center;
                font-size: 16px;
                font-weight: bold;
                margin: 15px 0;
                color: #1e40af;
                text-transform: uppercase;
                letter-spacing: 1px;
              }
              
              .receipt-info {
                background: #f8fafc;
                padding: 12px;
                border-radius: 6px;
                margin-bottom: 15px;
                border-left: 3px solid #1e40af;
              }
              
              .info-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 4px;
              }
              
              .info-label {
                font-weight: 600;
                color: #555;
              }
              
              .info-value {
                font-weight: 500;
                color: #333;
              }
              
              .items-table {
                width: 100%;
                border-collapse: collapse;
                margin: 15px 0;
                font-size: 11px;
              }
              
              .items-table th {
                background: #1e40af;
                color: white;
                padding: 8px 4px;
                text-align: left;
                font-weight: 600;
                text-transform: uppercase;
                font-size: 10px;
                letter-spacing: 0.5px;
              }
              
              .items-table td {
                padding: 6px 4px;
                border-bottom: 1px dashed #e5e7eb;
              }
              
              .items-table tr:last-child td {
                border-bottom: none;
              }
              
              .item-name {
                text-align: left;
                font-weight: 500;
              }
              
              .item-qty, .item-price, .item-total {
                text-align: right;
                font-family: 'Courier New', monospace;
              }
              
              .total-section {
                background: #1e40af;
                color: white;
                padding: 12px;
                border-radius: 6px;
                margin: 15px 0;
                text-align: center;
              }
              
              .total-label {
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 4px;
              }
              
              .total-amount {
                font-size: 18px;
                font-weight: bold;
                font-family: 'Courier New', monospace;
              }
              
              .payment-info {
                background: #f0f9ff;
                padding: 10px;
                border-radius: 6px;
                margin: 15px 0;
                border: 1px dashed #1e40af;
                text-align: center;
              }
              
              .payment-method {
                font-weight: 600;
                color: #1e40af;
                margin-bottom: 4px;
              }
              
              .payment-status {
                font-size: 10px;
                color: #059669;
                font-weight: 600;
              }
              
              .barcode-section {
                text-align: center;
                margin: 20px 0;
                padding: 10px;
                background: #f8fafc;
                border-radius: 6px;
              }
              
              .barcode-number {
                font-family: 'Courier New', monospace;
                font-size: 14px;
                font-weight: bold;
                letter-spacing: 3px;
                color: #333;
                margin-bottom: 5px;
              }
              
              .barcode-label {
                font-size: 9px;
                color: #666;
                text-transform: uppercase;
              }
              
              .footer {
                text-align: center;
                margin-top: 20px;
                padding-top: 15px;
                border-top: 2px dashed #1e40af;
                font-size: 9px;
                color: #666;
                line-height: 1.4;
              }
              
              .thank-you {
                font-weight: 600;
                color: #1e40af;
                margin-bottom: 8px;
                font-size: 11px;
              }
              
              .contact-info {
                margin-bottom: 8px;
              }
              
              .return-policy {
                font-style: italic;
                margin-bottom: 8px;
              }
              
              .watermark {
                opacity: 0.1;
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-45deg);
                font-size: 60px;
                font-weight: bold;
                color: #1e40af;
                pointer-events: none;
                z-index: -1;
              }
              
              @media print {
                body {
                  padding: 0;
                  margin: 0;
                }
                
                .receipt-container {
                  border: none;
                  box-shadow: none;
                  padding: 15px;
                }
                
                .no-print {
                  display: none;
                }
              }
            </style>
          </head>
          <body>
            <div class="watermark">NETPRO</div>
            
            <div class="receipt-container">
              <div class="header">
                <div class="company-name">NETPRO Ltd</div>
                <div class="company-details">
                  KG 9, Ave | P.O. Box 2234 Kigali Rwanda<br>
                  Tel: 0786856484 | Email: netprorwanda@gmail.com<br>
                  TIN: 106838391
                </div>
              </div>
              
              <div class="receipt-title">OFFICIAL RECEIPT</div>
              
              <div class="receipt-info">
                <div class="info-row">
                  <span class="info-label">Receipt No:</span>
                  <span class="info-value">#${saleData.id.toString().padStart(6, '0')}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Date:</span>
                  <span class="info-value">${new Date(saleData.sale_date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Time:</span>
                  <span class="info-value">${new Date().toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                  })}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Customer:</span>
                  <span class="info-value">${saleData.customer.name}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Phone:</span>
                  <span class="info-value">${saleData.customer.phone || 'N/A'}</span>
                </div>
              </div>
              
              <table class="items-table">
                <thead>
                  <tr>
                    <th style="width: 45%;">Description</th>
                    <th style="width: 15%; text-align: right;">Qty</th>
                    <th style="width: 20%; text-align: right;">Unit Price</th>
                    <th style="width: 20%; text-align: right;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${saleData.SaleItem.map(item => `
                    <tr>
                      <td class="item-name">${item.item.name}</td>
                      <td class="item-qty">${item.qty}</td>
                      <td class="item-price">${formatCurrency(item.unit_price)}</td>
                      <td class="item-total">${formatCurrency(item.total_price)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              
              <div class="total-section">
                <div class="total-label">Total Amount</div>
                <div class="total-amount">${formatCurrency(saleData.total_price)}</div>
              </div>
              
              <div class="payment-info">
                <div class="payment-method">PAID IN FULL</div>
                <div class="payment-status">● Payment Completed</div>
              </div>
              
              <div class="barcode-section">
                <div class="barcode-number">${saleData.id.toString().padStart(8, '0')}</div>
                <div class="barcode-label">Transaction ID</div>
              </div>
              
              <div class="footer">
                <div class="thank-you">Thank you for your business!</div>
                <div class="contact-info">
                  For inquiries: 0786856484 | netprorwanda@gmail.com
                </div>
                <div class="return-policy">
                  Goods sold are not returnable unless defective
                </div>
                <div>
                  This is a computer generated receipt | Valid without signature
                </div>
              </div>
            </div>
            
            <div class="no-print" style="text-align: center; margin-top: 20px; padding: 10px;">
              <button onclick="window.print()" style="
                background: #1e40af;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 600;
              ">Print Receipt</button>
              <button onclick="window.close()" style="
                background: #6b7280;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 600;
                margin-left: 10px;
              ">Close Window</button>
            </div>
            
            <script>
              // Auto-print when window loads
              window.onload = function() {
                setTimeout(() => {
                  window.print();
                }, 500);
              }
              
              // Close window after print (if user doesn't close manually)
              window.onafterprint = function() {
                setTimeout(() => {
                  window.close();
                }, 3000);
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
                  #${sale.id.toString().padStart(6, '0')}
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
                  {formatCurrency(sale.total_price)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => handlePrintReceipt(sale.id)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Print Receipt
                  </button>
                  <button
                    onClick={() => handleDelete(sale.id)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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