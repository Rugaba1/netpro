"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import axios, { isAxiosError } from "axios"

// UI Components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Icons
import { Search, Plus, Package, AlertTriangle, DollarSign, Edit, Trash2 } from "lucide-react"

// Types
import { stock_item as StockItem, stock_items_category as StockItemsCategory, product as Product, supplier as Supplier } from "@/lib/generated/prisma"
import { formatCurrency } from "@/lib/utils"

interface StockItemWithRelations extends StockItem {
  stock_items_category: StockItemsCategory
  supplier: Supplier
  product?: Product
}

// Form Schemas
const stockItemFormSchema = z.object({
  name: z.string().min(1, "Stock item name is required"),
  quantity: z.number().min(0, "Quantity must be non-negative"),
  min_level: z.number().min(0, "Minimum level must be non-negative"),
  reorder_level: z.number().min(0, "Reorder level must be non-negative"),
  category_id: z.string().min(1, "Category is required"),
  supplier_id: z.string().min(1, "Supplier is required"),
  product_id: z.string(),
})

const categoryFormSchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
})

export default function StockManagement() {
  // State management
  const [stockItems, setStockItems] = useState<StockItemWithRelations[]>([])
  const [categories, setCategories] = useState<StockItemsCategory[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showEntries, setShowEntries] = useState("10")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [editingStockItem, setEditingStockItem] = useState<StockItemWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Forms
  const stockItemForm = useForm<z.infer<typeof stockItemFormSchema>>({
    resolver: zodResolver(stockItemFormSchema),
    defaultValues: {
      name: "",
      quantity: 0,
      min_level: 0,
      reorder_level: 0,
      category_id: "",
      supplier_id: "",
      product_id: "none",
    },
  })

  const categoryForm = useForm<z.infer<typeof categoryFormSchema>>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  })

  // Data fetching functions
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
      if (isAxiosError(error)) {
        setError(error.response?.data?.message || "Failed to fetch stock items")
      } else {
        setError("An unexpected error occurred")
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await axios.get("/api/stock-categories")
      if (response.status < 400) {
        setCategories(response.data.categories)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get("/api/suppliers")
      if (response.status < 400) {
        setSuppliers(response.data.suppliers)
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await axios.get("/api/products")
      if (response.status < 400) {
        setProducts(response.data.products)
      }
    } catch (error) {
      console.error("Error fetching products:", error)
    }
  }

  // Form submission handlers
  const handleStockItemSubmit = async (values: z.infer<typeof stockItemFormSchema>) => {
    try {
      const url = editingStockItem
        ? `/api/stock-items/${editingStockItem.id}`
        : "/api/stock-items"
      const method = editingStockItem ? "put" : "post"

      const payload = {
        ...values,
        category_id: Number(values.category_id),
        supplier_id: Number(values.supplier_id),
        product_id: values.product_id && values.product_id !== "none" ? Number(values.product_id) : null,
      }

      const response = await axios[method](url, payload)

      if (response.status < 400) {
        stockItemForm.reset()
        setIsAddDialogOpen(false)
        setEditingStockItem(null)
        fetchStockItems()
      }
    } catch (error) {
      console.error("Error saving stock item:", error)
      if (isAxiosError(error)) {
        setError(error.response?.data?.message || "Failed to save stock item")
      } else {
        setError("An unexpected error occurred")
      }
    }
  }

  const handleCategorySubmit = async (values: z.infer<typeof categoryFormSchema>) => {
    try {
      const response = await axios.post("/api/stock-categories", values)

      if (response.status < 400) {
        categoryForm.reset()
        setIsCategoryDialogOpen(false)
        fetchCategories() // Refresh categories list
      }
    } catch (error) {
      console.error("Error saving category:", error)
      if (isAxiosError(error)) {
        setError(error.response?.data?.message || "Failed to save category")
      } else {
        setError("An unexpected error occurred")
      }
    }
  }

  // Action handlers
  const handleEdit = (stockItem: StockItemWithRelations) => {
    setEditingStockItem(stockItem)
    stockItemForm.reset({
      name: stockItem.name,
      quantity: stockItem.quantity,
      min_level: stockItem.min_level,
      reorder_level: stockItem.reorder_level,
      category_id: stockItem.category_id.toString(),
      supplier_id: stockItem.supplier_id.toString(),
      product_id: stockItem.product_id?.toString() || "none",
    })
    setIsAddDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this stock item?")) {
      try {
        const response = await axios.delete(`/api/stock-items/${id}`)
        if (response.status < 400) {
          fetchStockItems()
        }
      } catch (error) {
        console.error("Error deleting stock item:", error)
        if (isAxiosError(error)) {
          setError(error.response?.data?.message || "Failed to delete stock item")
        } else {
          setError("An unexpected error occurred")
        }
      }
    }
  }

  // Filtered items
  const filteredItems = stockItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.stock_items_category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.product?.name && item.product.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Statistics
  const totalItems = stockItems.length
  const totalValue = stockItems.reduce((sum, item) => sum + (item.quantity * (Number(item.product?.price) || 0)), 0)
  const lowStockItems = stockItems.filter((item) => item.quantity <= item.min_level).length
  const criticalStockItems = stockItems.filter((item) => item.quantity <= item.reorder_level).length

  const getStockStatus = (item: StockItemWithRelations) => {
    if (item.quantity <= item.reorder_level) return { label: "Critical", color: "bg-red-500" }
    if (item.quantity <= item.min_level) return { label: "Low", color: "bg-yellow-500" }
    return { label: "Good", color: "bg-green-500" }
  }

  // Effects
  useEffect(() => {
    fetchStockItems()
    fetchCategories()
    fetchSuppliers()
    fetchProducts()
  }, [])

  // Reset forms when dialogs close
  useEffect(() => {
    if (!isAddDialogOpen) {
      setEditingStockItem(null)
      stockItemForm.reset()
    }
  }, [isAddDialogOpen, stockItemForm])

  useEffect(() => {
    if (!isCategoryDialogOpen) {
      categoryForm.reset()
    }
  }, [isCategoryDialogOpen, categoryForm])

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
          <h1 className="text-2xl font-bold text-gray-800">Stock Management</h1>
          <nav className="text-sm text-gray-600 mt-1">
            <span>Home</span> / <span>Stock</span> /{" "}
            <span className="text-gray-400">Manage Stock Items</span>
          </nav>
        </div>
      </div>

      {/* Error Message */}
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
                <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
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

      {/* Main Stock Items Section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Stock Items</CardTitle>
            <div className="flex gap-2">
              {/* Add Category Dialog */}
              <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[400px]">
                  <DialogHeader>
                    <DialogTitle>Add New Category</DialogTitle>
                    <DialogDescription>
                      Create a new stock item category
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...categoryForm}>
                    <form
                      onSubmit={categoryForm.handleSubmit(handleCategorySubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={categoryForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter category name"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsCategoryDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">
                          Add Category
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              {/* Add Stock Item Dialog */}
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Stock Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingStockItem ? "Edit Stock Item" : "Add New Stock Item"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingStockItem
                        ? "Update stock item information"
                        : "Create a new stock item entry"}
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...stockItemForm}>
                    <form
                      onSubmit={stockItemForm.handleSubmit(handleStockItemSubmit)}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={stockItemForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Stock Item Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter stock item name"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={stockItemForm.control}
                          name="quantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantity</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Enter quantity"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={stockItemForm.control}
                          name="min_level"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Minimum Level</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Enter minimum level"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={stockItemForm.control}
                          name="reorder_level"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Reorder Level</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Enter reorder level"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={stockItemForm.control}
                          name="category_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center justify-between">
                                Category
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setIsCategoryDialogOpen(true)}
                                  className="h-6 px-2 text-xs"
                                >
                                  + Add New
                                </Button>
                              </FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ""}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {categories.map((category) => (
                                    <SelectItem key={category.id} value={category.id.toString()}>
                                      {category.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={stockItemForm.control}
                          name="supplier_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Supplier</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ""}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a supplier" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {suppliers.map((supplier) => (
                                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                      {supplier.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={stockItemForm.control}
                        name="product_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product (Optional)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || "none"}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a product" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">No product</SelectItem>
                                {products.map((product) => (
                                  <SelectItem key={product.id} value={product.id.toString()}>
                                    {product.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsAddDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">
                          {editingStockItem ? "Update Stock Item" : "Add Stock Item"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Controls */}
          <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm">Show</span>
              <Select value={showEntries} onValueChange={setShowEntries}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm">entries</span>
            </div>
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                className="w-48 md:w-64"
                placeholder="Search stock items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Min Level</TableHead>
                  <TableHead>Reorder Level</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      {searchTerm
                        ? "No stock items match your search"
                        : "No stock items found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems
                    .slice(0, Number.parseInt(showEntries))
                    .map((item, index) => {
                      const status = getStockStatus(item)
                      return (
                        <TableRow key={item.id} className="hover:bg-gray-50">
                          <TableCell className="text-center">
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.name}</div>
                              {item.product && (
                                <div className="text-sm text-gray-500">
                                  Product: {item.product.name}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {item.stock_items_category.name}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={`font-medium ${
                              item.quantity <= item.reorder_level ? "text-red-600" : 
                              item.quantity <= item.min_level ? "text-yellow-600" : "text-gray-900"
                            }`}>
                              {item.quantity}
                            </span>
                          </TableCell>
                          <TableCell>{item.min_level}</TableCell>
                          <TableCell>{item.reorder_level}</TableCell>
                          <TableCell>{item.supplier.name}</TableCell>
                          <TableCell>
                            <Badge className={`${status.color} text-white`}>
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(item)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(item.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {filteredItems.length > 0 && (
            <div className="flex justify-between items-center mt-4 flex-wrap gap-4">
              <div className="text-sm text-gray-600">
                Showing 1 to{" "}
                {Math.min(
                  Number.parseInt(showEntries),
                  filteredItems.length
                )}{" "}
                of {filteredItems.length} entries
                {searchTerm &&
                  ` (filtered from ${stockItems.length} total entries)`}
              </div>
              <div className="flex space-x-1">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button size="sm" className="bg-blue-600 text-white">
                  1
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}