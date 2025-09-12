"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Package, AlertTriangle, TrendingUp, DollarSign } from "lucide-react"

interface StockItem {
  id: number
  product_name: string
  category: string
  quantity: number
  unit_price: number
  total_value: number
  supplier: string
  last_updated: string
}

export default function StockManagement() {
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStockItems()
  }, [])

  const fetchStockItems = async () => {
    try {
      const response = await fetch("http://localhost/netpro-backend/api/stock/read.php")
      const data = await response.json()
      if (data.records) {
        setStockItems(data.records)
      }
    } catch (error) {
      console.error("Error fetching stock items:", error)
      // Fallback data for demo
      setStockItems([
        {
          id: 1,
          product_name: "Laptop Dell XPS",
          category: "Electronics",
          quantity: 15,
          unit_price: 850.0,
          total_value: 12750.0,
          supplier: "Dell Rwanda",
          last_updated: "2024-01-15",
        },
        {
          id: 2,
          product_name: "iPhone 14",
          category: "Electronics",
          quantity: 25,
          unit_price: 999.0,
          total_value: 24975.0,
          supplier: "Apple Store",
          last_updated: "2024-01-14",
        },
        {
          id: 3,
          product_name: "Office Chair",
          category: "Furniture",
          quantity: 30,
          unit_price: 120.0,
          total_value: 3600.0,
          supplier: "Furniture Plus",
          last_updated: "2024-01-13",
        },
        {
          id: 4,
          product_name: "Printer HP LaserJet",
          category: "Electronics",
          quantity: 8,
          unit_price: 299.0,
          total_value: 2392.0,
          supplier: "HP Rwanda",
          last_updated: "2024-01-12",
        },
        {
          id: 5,
          product_name: "Desk Lamp",
          category: "Furniture",
          quantity: 50,
          unit_price: 45.0,
          total_value: 2250.0,
          supplier: "Office Supplies Ltd",
          last_updated: "2024-01-11",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = stockItems.filter(
    (item) =>
      item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalItems = stockItems.length
  const totalValue = stockItems.reduce((sum, item) => sum + item.total_value, 0)
  const lowStockItems = stockItems.filter((item) => item.quantity < 10).length
  const categories = [...new Set(stockItems.map((item) => item.category))].length

  const getStockStatus = (quantity: number) => {
    if (quantity < 5) return { label: "Critical", color: "bg-red-500" }
    if (quantity < 10) return { label: "Low", color: "bg-yellow-500" }
    if (quantity < 20) return { label: "Medium", color: "bg-blue-500" }
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
                <p className="text-2xl font-bold text-red-600">{lowStockItems}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold">{categories}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
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
                  <th className="text-left p-4 font-medium">Unit Price</th>
                  <th className="text-left p-4 font-medium">Total Value</th>
                  <th className="text-left p-4 font-medium">Supplier</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const status = getStockStatus(item.quantity)
                  return (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{item.product_name}</div>
                          <div className="text-sm text-gray-500">ID: {item.id}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">{item.category}</Badge>
                      </td>
                      <td className="p-4">
                        <span className={`font-medium ${item.quantity < 10 ? "text-red-600" : "text-gray-900"}`}>
                          {item.quantity}
                        </span>
                      </td>
                      <td className="p-4">${item.unit_price.toFixed(2)}</td>
                      <td className="p-4 font-medium">${item.total_value.toFixed(2)}</td>
                      <td className="p-4">{item.supplier}</td>
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
