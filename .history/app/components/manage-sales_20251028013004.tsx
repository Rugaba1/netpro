'use client'

import { useState, useEffect } from 'react'
import { createSale, getStockItems, getCustomers, deleteSale, type CreateSaleInput, type SaleItemInput } from '@/app/actions/sale-action'

interface StockItem {
  id: number
  name: string
  quantity: number
  price: number
  stock_items_category: {
    name: string
  }
}

interface Customer {
  id: number
  name: string
  phone: string
  service_number: string
}

export default function SaleManagement() {
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [saleItems, setSaleItems] = useState<SaleItemInput[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<string>('')
  const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [itemsResult, customersResult] = await Promise.all([
        getStockItems(),
        getCustomers()
      ])

      if (itemsResult.success && itemsResult.data) {
        setStockItems(
          itemsResult.data.map((item: any) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price ?? 0,
            stock_items_category: {
              name: item.stock_items_category?.name ?? ''
            }
          }))
        )
      }
      if (customersResult.success) setCustomers(customersResult.data ?? [])
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const addSaleItem = () => {
    setSaleItems([...saleItems, { item_id: 0, qty: 1, unit_price: 0 }])
  }

  const updateSaleItem = (index: number, field: keyof SaleItemInput, value: any) => {
    const updatedItems = [...saleItems]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    
    // Auto-calculate unit price if item is selected
    if (field === 'item_id' && value) {
      const selectedItem = stockItems.find(item => item.id === parseInt(value))
      if (selectedItem) {
        updatedItems[index].unit_price = selectedItem.price
      }
    }
    
    setSaleItems(updatedItems)
  }

  const removeSaleItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index))
  }

  const calculateTotal = () => {
    return saleItems.reduce((total, item) => total + (item.unit_price * item.qty), 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    if (!selectedCustomer || saleItems.length === 0) {
      setMessage({ type: 'error', text: 'Please select a customer and add at least one item' })
      setIsLoading(false)
      return
    }

    // Validate quantities
    for (const item of saleItems) {
      const stockItem = stockItems.find(si => si.id === item.item_id)
      if (stockItem && item.qty > stockItem.quantity) {
        setMessage({ 
          type: 'error', 
          text: `Insufficient stock for ${stockItem.name}. Available: ${stockItem.quantity}` 
        })
        setIsLoading(false)
        return
      }
    }

    const saleData: CreateSaleInput = {
      customer_id: parseInt(selectedCustomer),
      sale_date: saleDate,
      items: saleItems
    }

    const result = await createSale(saleData)

    if (result.success) {
      setMessage({ type: 'success', text: 'Sale created successfully!' })
      // Reset form
      setSaleItems([])
      setSelectedCustomer('')
      setSaleDate(new Date().toISOString().split('T')[0])
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to create sale' })
    }

    setIsLoading(false)
  }

  const printReceipt = (saleData: any) => {
    const receiptWindow = window.open('', '_blank')
    if (receiptWindow) {
      receiptWindow.document.write(`
        <html>
          <head>
            <title>Sales Receipt</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              .details { margin-bottom: 20px; }
              .table { width: 100%; border-collapse: collapse; }
              .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              .table th { background-color: #f5f5f5; }
              .total { text-align: right; font-weight: bold; margin-top: 10px; }
              .footer { margin-top: 30px; text-align: center; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>SALES RECEIPT</h2>
              <p>Date: ${new Date().toLocaleDateString()}</p>
            </div>
            <div class="details">
              <p><strong>Sale ID:</strong> ${saleData.id}</p>
              <p><strong>Customer:</strong> ${saleData.customer.name}</p>
              <p><strong>Sale Date:</strong> ${new Date(saleData.sale_date).toLocaleDateString()}</p>
            </div>
            <table class="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${saleData.SaleItem.map((item: any) => `
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
              <strong>Grand Total: $${saleData.total_price.toFixed(2)}</strong>
            </div>
            <div class="footer">
              <p>Thank you for your business!</p>
            </div>
          </body>
        </html>
      `)
      receiptWindow.document.close()
      receiptWindow.print()
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Sale Management</h1>

      {message && (
        <div className={`p-4 mb-4 rounded ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer *
            </label>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select Customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} - {customer.phone}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sale Date *
            </label>
            <input
              type="date"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Sale Items</h3>
            <button
              type="button"
              onClick={addSaleItem}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              Add Item
            </button>
          </div>

          {saleItems.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 mb-3 p-3 border rounded-md">
              <div className="col-span-4">
                <select
                  value={item.item_id}
                  onChange={(e) => updateSaleItem(index, 'item_id', parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select Item</option>
                  {stockItems.map((stockItem) => (
                    <option key={stockItem.id} value={stockItem.id}>
                      {stockItem.name} - ${stockItem.price} (Stock: {stockItem.quantity})
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  min="1"
                  value={item.qty}
                  onChange={(e) => updateSaleItem(index, 'qty', parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Qty"
                  required
                />
              </div>
              <div className="col-span-3">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={item.unit_price}
                  onChange={(e) => updateSaleItem(index, 'unit_price', parseFloat(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Unit Price"
                  required
                />
              </div>
              <div className="col-span-2 flex items-center">
                <span className="font-medium">
                  ${(item.unit_price * item.qty).toFixed(2)}
                </span>
              </div>
              <div className="col-span-1">
                <button
                  type="button"
                  onClick={() => removeSaleItem(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {saleItems.length > 0 && (
          <div className="mb-6 p-4 bg-gray-50 rounded-md">
            <div className="text-xl font-bold text-right">
              Total: ${calculateTotal().toFixed(2)}
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Create Sale'}
          </button>
        </div>
      </form>
    </div>
  )
}