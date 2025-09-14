"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Package, AlertTriangle, TrendingUp, DollarSign } from "lucide-react"
import { stock_item as StockItem,stock_items_category as StockItemsCategory, product as Product, supplier as Supplier } from "@/lib/generated/prisma"
import axios from "axios"

// Define types based on your Prisma schema
interface StockItemWithRelations extends StockItem {
  stock_items_category: StockItemsCategory
  supplier: Supplier
  product?: Product
 
}

export default function StockManagement() {
  const [stockItems, setStockItems] = useState<StockItemWithRelations[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStockItems()
  }, [])

  const fetchStockItems = async () => {
    try {
      setLoading(true)
      const response = await axios.get("/api/stock-items")
      if (response.status < 400) {
        setStockItems(response.data.stockItems)
        setError(null)
      }
    } catch (error) {
      console.error("Error fetching stock items:", error)
      setError("Failed to fetch stock items")
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = stockItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.stock_items_category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.product?.name && item.product.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const totalItems = stockItems.length
  const totalValue = stockItems.reduce((sum, item) => sum + (item.quantity * (Number(item.product?.price) || 0)), 0)
  const lowStockItems = stockItems.filter((item) => item.quantity <= item.min_level).length
  const criticalStockItems = stockItems.filter((item) => item.quantity <= item.reorder_level).length
  const categories = [...new Set(stockItems.map((item) => item.stock_items_category.name))].length

  const getStockStatus = (item: StockItemWithRelations) => {
    if (item.quantity <= item.reorder_level) return { label: "Critical", color: "bg-red-500" }
    if (item.quantity <= item.min_level) return { label: "Low", color: "bg-yellow-500" }
    return { label: "Good", color: "bg-green-500" }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading stock data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Stock Management</h1>
          <p className="text-gray-600">Manage your inventory and track stock levels</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Stock Item
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
          <button
            className="absolute top-0 right-0 p-3"
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold">{totalItems}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">{lowStockItems}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical Stock</p>
                <p className="text-2xl font-bold text-red-600">{criticalStockItems}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
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
                placeholder="Search by product name, category, or supplier..."
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

      {/* Stock Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Items ({filteredItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Product</th>
                  <th className="text-left p-4 font-medium">Category</th>
                  <th className="text-left p-4 font-medium">Quantity</th>
                  <th className="text-left p-4 font-medium">Min Level</th>
                  <th className="text-left p-4 font-medium">Reorder Level</th>
                  <th className="text-left p-4 font-medium">Supplier</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const status = getStockStatus(item)
                  return (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          {item.product && (
                            <div className="text-sm text-gray-500">Product: {item.product.name}</div>
                          )}
                          <div className="text-sm text-gray-500">ID: {item.id}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">{item.stock_items_category.name}</Badge>
                      </td>
                      <td className="p-4">
                        <span className={`font-medium ${
                          item.quantity <= item.reorder_level ? "text-red-600" : 
                          item.quantity <= item.min_level ? "text-yellow-600" : "text-gray-900"
                        }`}>
                          {item.quantity}
                        </span>
                      </td>
                      <td className="p-4">{item.min_level}</td>
                      <td className="p-4">{item.reorder_level}</td>
                      <td className="p-4">{item.supplier.name}</td>
                      <td className="p-4">
                        <Badge className={`${status.color} text-white`}>{status.label}</Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            Edit
                          </Button>
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}