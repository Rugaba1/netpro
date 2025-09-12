"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAccount } from "@/lib/account-context"
import { useToast } from "@/hooks/use-toast"
import { Eye, Edit, Trash2, Plus, Check } from "lucide-react"
import ProformaTemplate from "./proforma-template"

interface Customer {
  id: number
  customer_name: string
  billing_name: string
  tin: string
  phone: string
  service_number: string
  email: string
  address: string
  status: string
}

interface Product {
  id: number
  package_id: number
  product_type: string
  bundle: string
  wholesales_price: number
  selling_price: number
  duration: string
  status: string
}

interface ProformaItem {
  no: number
  description: string
  qty: number
  unitPrice: number
  discount: number
  priceExclVat: number
  vat: number
  totalIncl: number
}

interface Proforma {
  id: string
  proformaNo: string
  customerId: number
  customerName: string
  billingName: string
  date: string
  validUntil: string
  expiryDate: string
  status: "pending" | "sent" | "paid" | "expired"
  currency: string
  totalExcl: number
  tax: number
  totalDiscount: number
  totalIncl: number
  amountInLetters: string
  notes: string
  items: ProformaItem[]
}

// --- safety helpers --------------------------------------------------------
const safeUpper = (value?: string | null) => (value ? value.toUpperCase() : "UNKNOWN")
// ---------------------------------------------------------------------------

const ManageProforma = () => {
  const [proformas, setProformas] = useState<Proforma[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedProforma, setSelectedProforma] = useState<Proforma | null>(null)
  const [editingProforma, setEditingProforma] = useState<Proforma | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { updateBalance, addTransaction } = useAccount()
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    customerId: "",
    customerName: "",
    billingName: "",
    productId: "",
    description: "",
    quantity: "1",
    unitPrice: "",
    discount: "0",
    expiryDate: "",
    notes: "",
    items: [] as any[],
  })

  const [subtotal, setSubtotal] = useState(0)
  const [tax, setTax] = useState(0)
  const [total, setTotal] = useState(0)

  // Fetch data on component mount
  useEffect(() => {
    fetchCustomers()
    fetchProducts()
    fetchProformas()
  }, [])

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers")
      if (response.ok) {
        const data = await response.json()
        setCustomers(data)
      }
    } catch (error) {
      console.error("Error fetching customers:", error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products")
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error("Error fetching products:", error)
    }
  }

  const fetchProformas = async () => {
    try {
      const response = await fetch("/api/proformas")
      if (response.ok) {
        const data = await response.json()
        const normalised = data.map((p: any) => ({
          ...p,
          totalIncl: Number(p.totalIncl ?? p.totalAmount ?? 0),
        }))
        setProformas(normalised)
      }
    } catch (error) {
      console.error("Error fetching proformas:", error)
    }
  }

  const numberToWords = (num: number): string => {
    if (num === 0) return "Zero"
    return `${num.toLocaleString()} Rwandan Francs Only`
  }

  const calculateItemTotals = (item: any) => {
    const unitPrice = Number.parseFloat(item.unitPrice) || 0
    const qty = Number.parseInt(item.qty) || 1
    const discount = Number.parseFloat(item.discount) || 0

    const priceAfterDiscount = unitPrice * (1 - discount / 100)
    const priceExclVat = (priceAfterDiscount * qty) / 1.18
    const vat = priceExclVat * 0.18
    const totalIncl = priceExclVat + vat

    return {
      priceExclVat,
      vat,
      totalIncl,
    }
  }

  const calculateTotals = (items: any[]) => {
    let totalExcl = 0
    let totalVat = 0
    let totalDiscount = 0

    items.forEach((item) => {
      const { priceExclVat, vat } = calculateItemTotals(item)
      totalExcl += priceExclVat
      totalVat += vat
      totalDiscount += (item.unitPrice * item.qty * item.discount) / 100
    })

    setSubtotal(totalExcl)
    setTax(totalVat)
    setTotal(totalExcl + totalVat)

    return {
      totalExcl,
      tax: totalVat,
      totalDiscount,
      totalIncl: totalExcl + totalVat,
    }
  }

  const addItem = () => {
    if (!formData.description || !formData.unitPrice) {
      toast({
        title: "Error",
        description: "Please fill in description and unit price fields",
        variant: "destructive",
      })
      return
    }

    const newItem = {
      description: formData.description,
      qty: Number.parseInt(formData.quantity) || 1,
      unitPrice: Number.parseFloat(formData.unitPrice) || 0,
      discount: Number.parseFloat(formData.discount) || 0,
    }

    const totals = calculateItemTotals(newItem)
    const itemWithTotals = { ...newItem, ...totals }

    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, itemWithTotals],
      description: "",
      unitPrice: "",
      quantity: "1",
      discount: "0",
    }))

    const newItems = [...formData.items, itemWithTotals]
    calculateTotals(newItems)
  }

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index)
    setFormData((prev) => ({ ...prev, items: newItems }))
    calculateTotals(newItems)
  }

  const handleCreateProforma = async () => {
    if (!formData.customerId || formData.items.length === 0) {
      toast({
        title: "Error",
        description: "Please select a customer and add at least one item",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)

      const proformaData = {
        customerId: formData.customerId,
        customerName: formData.customerName,
        billingName: formData.billingName,
        expiryDate: formData.expiryDate,
        notes: formData.notes,
        items: formData.items,
      }

      const response = await fetch("/api/proformas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(proformaData),
      })

      if (response.ok) {
        const newProforma = await response.json()
        setProformas((prev) => [...prev, newProforma])
        setIsCreateDialogOpen(false)
        resetForm()

        toast({
          title: "Success",
          description: "Proforma created successfully",
        })
      } else {
        throw new Error("Failed to create proforma")
      }
    } catch (error) {
      console.error("Error creating proforma:", error)
      toast({
        title: "Error",
        description: "Failed to create proforma",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditProforma = async () => {
    if (!editingProforma) return

    try {
      setIsLoading(true)

      const proformaData = {
        customerId: formData.customerId,
        customerName: formData.customerName,
        billingName: formData.billingName,
        expiryDate: formData.expiryDate,
        notes: formData.notes,
        items: formData.items,
      }

      const response = await fetch(`/api/proformas/${editingProforma.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(proformaData),
      })

      if (response.ok) {
        const updatedProforma = await response.json()
        setProformas((prev) => prev.map((p) => (p.id === editingProforma.id ? updatedProforma : p)))
        setIsEditDialogOpen(false)
        setEditingProforma(null)
        resetForm()

        toast({
          title: "Success",
          description: "Proforma updated successfully",
        })
      } else {
        throw new Error("Failed to update proforma")
      }
    } catch (error) {
      console.error("Error updating proforma:", error)
      toast({
        title: "Error",
        description: "Failed to update proforma",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewProforma = (proforma: Proforma) => {
    setSelectedProforma(proforma)
    setIsViewDialogOpen(true)
  }

  const handleEditClick = (proforma: Proforma) => {
    setEditingProforma(proforma)
    setFormData({
      customerId: proforma.customerId.toString(),
      customerName: proforma.customerName,
      billingName: proforma.billingName,
      productId: "",
      description: "",
      quantity: "1",
      unitPrice: "",
      discount: "0",
      expiryDate: proforma.expiryDate,
      notes: proforma.notes,
      items: proforma.items.map((item) => ({
        description: item.description,
        qty: item.qty,
        unitPrice: item.unitPrice,
        discount: item.discount,
        priceExclVat: item.priceExclVat,
        vat: item.vat,
        totalIncl: item.totalIncl,
      })),
    })
    calculateTotals(proforma.items)
    setIsEditDialogOpen(true)
  }

  const handleDeleteProforma = async (id: string) => {
    if (!confirm("Are you sure you want to delete this proforma?")) return

    try {
      const response = await fetch(`/api/proformas/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setProformas((prev) => prev.filter((p) => p.id !== id))
        toast({
          title: "Success",
          description: "Proforma deleted successfully",
        })
      } else {
        throw new Error("Failed to delete proforma")
      }
    } catch (error) {
      console.error("Error deleting proforma:", error)
      toast({
        title: "Error",
        description: "Failed to delete proforma",
        variant: "destructive",
      })
    }
  }

  const handleMarkAsPaid = (proforma: Proforma) => {
    updateBalance(proforma.totalIncl)
    addTransaction({
      type: "proforma_payment",
      amount: proforma.totalIncl,
      description: `Proforma ${proforma.proformaNo} payment received - ${proforma.customerName}`,
      proformaId: proforma.id,
    })

    setProformas((prev) => prev.map((p) => (p.id === proforma.id ? { ...p, status: "paid" } : p)))

    toast({
      title: "Success",
      description: "Proforma marked as paid successfully",
    })
  }

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find((c) => c.id.toString() === customerId)
    if (customer) {
      setFormData((prev) => ({
        ...prev,
        customerId,
        customerName: customer.customer_name,
        billingName: customer.billing_name,
      }))
    }
  }

  const handleProductChange = (productId: string) => {
    const product = products.find((p) => p.id.toString() === productId)
    if (product) {
      setFormData((prev) => ({
        ...prev,
        productId,
        description: `${product.product_type} - ${product.bundle}`,
        unitPrice: product.selling_price.toString(),
      }))
    }
  }

  const resetForm = () => {
    setFormData({
      customerId: "",
      customerName: "",
      billingName: "",
      productId: "",
      description: "",
      quantity: "1",
      unitPrice: "",
      discount: "0",
      expiryDate: "",
      notes: "",
      items: [],
    })
    setSubtotal(0)
    setTax(0)
    setTotal(0)
  }

  const filteredProformas = proformas.filter(
    (proforma) =>
      proforma.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proforma.billingName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proforma.proformaNo.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500 text-white px-2 py-1 rounded text-xs"
      case "sent":
        return "bg-blue-500 text-white px-2 py-1 rounded text-xs"
      case "paid":
        return "bg-green-500 text-white px-2 py-1 rounded text-xs"
      case "expired":
        return "bg-red-500 text-white px-2 py-1 rounded text-xs"
      default:
        return "bg-gray-500 text-white px-2 py-1 rounded text-xs"
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <nav className="text-sm text-gray-500 mb-2">🏠 Home / Invoices / Manage Proforma Invoices</nav>
          <h1 className="text-2xl font-semibold">Manage Proforma Invoices</h1>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Create Proforma
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Proforma Invoice</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Customer Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerId">Customer</Label>
                  <Select value={formData.customerId} onValueChange={handleCustomerChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.customer_name} - {customer.billing_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="billingName">Billing Name</Label>
                  <Input
                    value={formData.billingName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, billingName: e.target.value }))}
                    placeholder="Billing name will auto-fill"
                    readOnly
                  />
                </div>
              </div>

              {/* Product Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Product</Label>
                  <Select value={formData.productId} onValueChange={handleProductChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.product_type} - {product.bundle} ({product.selling_price} RWF)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Item description"
                  />
                </div>
              </div>

              {/* Quantity, Price, Discount */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))}
                    placeholder="1"
                  />
                </div>
                <div>
                  <Label>Unit Price (RWF)</Label>
                  <Input
                    type="number"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData((prev) => ({ ...prev, unitPrice: e.target.value }))}
                    placeholder="Enter unit price"
                  />
                </div>
                <div>
                  <Label>Discount (%)</Label>
                  <Input
                    type="number"
                    value={formData.discount}
                    onChange={(e) => setFormData((prev) => ({ ...prev, discount: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Expiry Date and Notes */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Expiry Date</Label>
                  <Input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, expiryDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Enter notes..."
                    rows={2}
                  />
                </div>
              </div>

              {/* Add Item Button */}
              <Button type="button" onClick={addItem} className="bg-green-600 hover:bg-green-700">
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>

              {/* Items Table */}
              {formData.items.length > 0 && (
                <div className="border rounded">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Discount</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formData.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>{item.qty}</TableCell>
                          <TableCell>{Number(item.unitPrice ?? 0).toFixed(2)}</TableCell>
                          <TableCell>{item.discount}%</TableCell>
                          <TableCell>{Number(item.totalIncl ?? 0).toFixed(2)}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="destructive" onClick={() => removeItem(index)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Totals Section */}
                  <div className="p-4 space-y-2 text-right border-t">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax (18%):</span>
                      <span>{tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total:</span>
                      <span>{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Close
                </Button>
                <Button onClick={handleCreateProforma} className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Proforma"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* View Proforma Invoice Information Section */}
      <div className="bg-gray-50 p-4 rounded mb-6">
        <h3 className="font-medium mb-4">View Proforma Invoice Information</h3>

        <div className="flex justify-end mb-4">
          <Input
            className="w-64"
            placeholder="Search:"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <input type="checkbox" />
              </TableHead>
              <TableHead>No</TableHead>
              <TableHead>Proforma #</TableHead>
              <TableHead>Customer Name</TableHead>
              <TableHead>Billing Name</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProformas.map((proforma, index) => (
              <TableRow key={proforma.id}>
                <TableCell>
                  <input type="checkbox" />
                </TableCell>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  <span className="bg-yellow-600 text-white px-2 py-1 rounded text-xs">{proforma.proformaNo}</span>
                </TableCell>
                <TableCell>{proforma.customerName}</TableCell>
                <TableCell>{proforma.billingName}</TableCell>
                <TableCell>
                  {Number((proforma as any).totalIncl ?? (proforma as any).totalAmount ?? 0).toLocaleString()}
                </TableCell>
                <TableCell>
                  <span className={getStatusColor(proforma.status ?? "unknown")}>{safeUpper(proforma.status)}</span>
                </TableCell>
                <TableCell>{proforma.date}</TableCell>
                <TableCell>{proforma.expiryDate}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => handleViewProforma(proforma)}
                      title="View"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleEditClick(proforma)}
                      title="Edit"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    {proforma.status !== "paid" && (
                      <Button
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={() => handleMarkAsPaid(proforma)}
                        title="Mark as Paid"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => handleDeleteProforma(proforma.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <Select defaultValue="10">
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span>entries</span>
          </div>
          <div>
            Showing 1 to {filteredProformas.length} of {filteredProformas.length} entries
          </div>
          <div className="flex gap-1">
            <Button variant="outline" size="sm">
              Previous
            </Button>
            <Button size="sm" className="bg-blue-600 text-white">
              1
            </Button>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* View Proforma Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Proforma</DialogTitle>
          </DialogHeader>
          {selectedProforma && <ProformaTemplate proformaData={selectedProforma} />}
        </DialogContent>
      </Dialog>

      {/* Edit Proforma Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Proforma</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerId">Customer</Label>
                <Select value={formData.customerId} onValueChange={handleCustomerChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.customer_name} - {customer.billing_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="billingName">Billing Name</Label>
                <Input
                  value={formData.billingName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, billingName: e.target.value }))}
                  placeholder="Billing name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Product</Label>
                <Select value={formData.productId} onValueChange={handleProductChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.product_type} - {product.bundle} ({product.selling_price} RWF)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Item description"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))}
                  placeholder="1"
                />
              </div>
              <div>
                <Label>Unit Price (RWF)</Label>
                <Input
                  type="number"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData((prev) => ({ ...prev, unitPrice: e.target.value }))}
                  placeholder="Enter unit price"
                />
              </div>
              <div>
                <Label>Discount (%)</Label>
                <Input
                  type="number"
                  value={formData.discount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, discount: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, expiryDate: e.target.value }))}
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Enter notes..."
                  rows={2}
                />
              </div>
            </div>

            <Button type="button" onClick={addItem} className="bg-green-600 hover:bg-green-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>

            {formData.items.length > 0 && (
              <div className="border rounded">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.qty}</TableCell>
                        <TableCell>{Number(item.unitPrice ?? 0).toFixed(2)}</TableCell>
                        <TableCell>{item.discount}%</TableCell>
                        <TableCell>{Number(item.totalIncl ?? 0).toFixed(2)}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="destructive" onClick={() => removeItem(index)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="p-4 space-y-2 text-right border-t">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (18%):</span>
                    <span>{tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span>{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false)
                  setEditingProforma(null)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleEditProforma} className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Proforma"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ManageProforma
