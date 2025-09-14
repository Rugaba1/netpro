"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, Edit, Trash2, Plus, Check, Loader2 } from "lucide-react"
import { useAccount } from "@/lib/account-context"
import { useToast } from "@/hooks/use-toast"
import QuotationTemplate from "./quotation-template"

/* ---------- Types ---------- */
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

interface QuotationItem {
  no: number
  description: string
  qty: number
  unitPrice: number
  discount: number
  priceExclVat: number
  vat: number
  totalIncl: number
}

interface Quotation {
  id: string
  quotationNo: string
  customerId: number
  customerName: string
  billingName: string
  date: string
  validUntil: string
  status: "draft" | "sent" | "approved" | "converted"
  currency: string
  totalExcl: number
  tax: number
  totalDiscount: number
  totalIncl: number
  amountInLetters: string
  notes: string
  items: QuotationItem[]
}

/* ---------- Helper ---------- */
const n = (num: unknown) => Number(num ?? 0) // safe-number helper

/* ---------- Component ---------- */
export default function ManageQuotations() {
  /* ----- state ----- */
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null)
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDataLoading, setIsDataLoading] = useState(true)

  const { updateBalance, addTransaction } = useAccount()
  const { toast } = useToast()

  /* ----- form state ----- */
  const [formData, setFormData] = useState({
    customerId: "",
    customerName: "",
    billingName: "",
    productId: "",
    description: "",
    quantity: "1",
    unitPrice: "",
    discount: "0",
    notes: "",
    items: [] as QuotationItem[],
  })
  const [totalAmount, setTotalAmount] = useState(0)

  /* ---------- fetch on mount ---------- */
  useEffect(() => {
    void (async () => {
      const [c, p, q] = await Promise.all([
        fetch("/api/customers").then((r) => (r.ok ? r.json() : [])),
        fetch("/api/products").then((r) => (r.ok ? r.json() : [])),
        fetch("/api/quotations").then((r) => (r.ok ? r.json() : [])),
      ])
      setCustomers(c)
      setProducts(p)
      setQuotations(q)
      setIsDataLoading(false)
    })()
  }, [])

  /* ---------- utils ---------- */
  const calculateItemTotals = (item: { unitPrice: number; qty: number; discount: number }) => {
    const unitPrice = Number(item.unitPrice) || 0
    const qty = Number(item.qty) || 1
    const discount = Number(item.discount) || 0

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

  const calculateTotals = (items: QuotationItem[]) => {
    let totalExcl = 0
    let totalVat = 0
    let totalDiscount = 0

    items.forEach((item) => {
      const { priceExclVat, vat } = calculateItemTotals(item)
      totalExcl += priceExclVat
      totalVat += vat
      totalDiscount += (item.unitPrice * item.qty * item.discount) / 100
    })

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
      qty: Number(formData.quantity) || 1,
      unitPrice: Number(formData.unitPrice) || 0,
      discount: Number(formData.discount) || 0,
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
      productId: "",
    }))

    const newItems = [...formData.items, itemWithTotals]
    const calculatedTotals = calculateTotals(newItems)
    setTotalAmount(calculatedTotals.totalIncl)
  }

  const removeItem = (idx: number) => {
    const nextItems = formData.items.filter((_, i) => i !== idx)
    setFormData((f) => ({ ...f, items: nextItems }))
    const calculatedTotals = calculateTotals(nextItems)
    setTotalAmount(calculatedTotals.totalIncl)
  }

  const handleCreateQuotation = async () => {
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

      const quotationData = {
        customerId: formData.customerId,
        customerName: formData.customerName,
        billingName: formData.billingName,
        notes: formData.notes,
        items: formData.items,
      }

      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quotationData),
      })

      if (!res.ok) throw new Error()
      const newQ = await res.json()
      setQuotations((qs) => [...qs, newQ])
      setIsCreateDialogOpen(false)
      resetForm()
      toast({ title: "Success", description: "Quotation created successfully" })
    } catch {
      toast({ title: "Error", description: "Failed to create quotation", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditQuotation = async () => {
    if (!editingQuotation) return

    try {
      setIsLoading(true)

      const quotationData = {
        customerId: formData.customerId,
        customerName: formData.customerName,
        billingName: formData.billingName,
        notes: formData.notes,
        items: formData.items,
      }

      const res = await fetch(`/api/quotations/${editingQuotation.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quotationData),
      })

      if (!res.ok) throw new Error()
      const updatedQ = await res.json()
      setQuotations((qs) => qs.map((q) => (q.id === editingQuotation.id ? updatedQ : q)))
      setIsEditDialogOpen(false)
      setEditingQuotation(null)
      resetForm()
      toast({ title: "Success", description: "Quotation updated successfully" })
    } catch {
      toast({ title: "Error", description: "Failed to update quotation", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewQuotation = (quotation: Quotation) => {
    setSelectedQuotation(quotation)
    setIsViewDialogOpen(true)
  }

  const handleEditClick = (quotation: Quotation) => {
    setEditingQuotation(quotation)
    setFormData({
      customerId: quotation.customerId.toString(),
      customerName: quotation.customerName,
      billingName: quotation.billingName,
      productId: "",
      description: "",
      quantity: "1",
      unitPrice: "",
      discount: "0",
      notes: quotation.notes,
      items: quotation.items.map((item) => ({
        description: item.description,
        qty: item.qty,
        unitPrice: item.unitPrice,
        discount: item.discount,
        priceExclVat: item.priceExclVat,
        vat: item.vat,
        totalIncl: item.totalIncl,
      })),
    })
    setTotalAmount(quotation.totalIncl)
    setIsEditDialogOpen(true)
  }

  const handleDeleteQuotation = async (id: string) => {
    if (!confirm("Are you sure you want to delete this quotation?")) return

    try {
      const res = await fetch(`/api/quotations/${id}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error()
      setQuotations((qs) => qs.filter((q) => q.id !== id))
      toast({ title: "Success", description: "Quotation deleted successfully" })
    } catch {
      toast({ title: "Error", description: "Failed to delete quotation", variant: "destructive" })
    }
  }

  const handleConvertToInvoice = async (quotation: Quotation) => {
    try {
      updateBalance(quotation.totalIncl)
      addTransaction({
        type: "invoice_conversion",
        amount: quotation.totalIncl,
        description: `Quotation ${quotation.quotationNo} converted to invoice - ${quotation.customerName}`,
        quotationId: quotation.id,
      })

      setQuotations((qs) => qs.map((q) => (q.id === quotation.id ? { ...q, status: "converted" } : q)))

      toast({ title: "Success", description: "Quotation converted to invoice successfully" })
    } catch {
      toast({ title: "Error", description: "Failed to convert quotation", variant: "destructive" })
    }
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
      notes: "",
      items: [],
    })
    setTotalAmount(0)
  }

  const filteredQuotations = quotations.filter(
    (quotation) =>
      quotation.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.billingName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.quotationNo?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-500 text-white px-2 py-1 rounded text-xs"
      case "sent":
        return "bg-blue-500 text-white px-2 py-1 rounded text-xs"
      case "approved":
        return "bg-green-500 text-white px-2 py-1 rounded text-xs"
      case "converted":
        return "bg-purple-500 text-white px-2 py-1 rounded text-xs"
      default:
        return "bg-gray-500 text-white px-2 py-1 rounded text-xs"
    }
  }

  if (isDataLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading quotations...</span>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <nav className="text-sm text-gray-500 mb-2">🏠 Home / Sales / Manage Quotations</nav>
          <h1 className="text-2xl font-semibold">Manage Quotations</h1>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Create Quotation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Quotation</DialogTitle>
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
                          {product.product_type} - {product.bundle} ({product.selling_price.toLocaleString()} RWF)
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
                    min="1"
                  />
                </div>
                <div>
                  <Label>Unit Price (RWF)</Label>
                  <Input
                    type="number"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData((prev) => ({ ...prev, unitPrice: e.target.value }))}
                    placeholder="Enter unit price"
                    min="0"
                  />
                </div>
                <div>
                  <Label>Discount (%)</Label>
                  <Input
                    type="number"
                    value={formData.discount}
                    onChange={(e) => setFormData((prev) => ({ ...prev, discount: e.target.value }))}
                    placeholder="0"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Enter notes..."
                  rows={3}
                />
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
                          <TableCell>{Number(item.unitPrice || 0).toLocaleString()}</TableCell>
                          <TableCell>{item.discount}%</TableCell>
                          <TableCell>{Number(item.totalIncl || 0).toLocaleString()}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="destructive" onClick={() => removeItem(index)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="p-4 text-right font-semibold">Total Amount: {totalAmount.toLocaleString()} RWF</div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Close
                </Button>
                <Button onClick={handleCreateQuotation} className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Quotation"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* View Quotation Information Section */}
      <div className="bg-gray-50 p-4 rounded mb-6">
        <h3 className="font-medium mb-4">View Quotation Information</h3>

        <div className="flex justify-end mb-4">
          <Input
            className="w-64"
            placeholder="Search quotations..."
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
              <TableHead>Quotation #</TableHead>
              <TableHead>Customer Name</TableHead>
              <TableHead>Billing Name</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQuotations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                  No quotations found
                </TableCell>
              </TableRow>
            ) : (
              filteredQuotations.map((quotation, index) => (
                <TableRow key={quotation.id}>
                  <TableCell>
                    <input type="checkbox" />
                  </TableCell>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">{quotation.quotationNo}</span>
                  </TableCell>
                  <TableCell>{quotation.customerName}</TableCell>
                  <TableCell>{quotation.billingName}</TableCell>
                  <TableCell>{Number(quotation.totalIncl || 0).toLocaleString()} RWF</TableCell>
                  <TableCell>
                    <span className={getStatusColor(quotation.status || "draft")}>
                      {(quotation.status || "draft").toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell>{quotation.date}</TableCell>
                  <TableCell className="max-w-xs truncate">{quotation.notes}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => handleViewQuotation(quotation)}
                        title="View"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleEditClick(quotation)}
                        title="Edit"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      {quotation.status !== "converted" && (
                        <Button
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                          onClick={() => handleConvertToInvoice(quotation)}
                          title="Convert to Invoice"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => handleDeleteQuotation(quotation.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
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
            Showing 1 to {filteredQuotations.length} of {filteredQuotations.length} entries
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

      {/* View Quotation Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Quotation</DialogTitle>
          </DialogHeader>
          {selectedQuotation && <QuotationTemplate quotationData={selectedQuotation} />}
        </DialogContent>
      </Dialog>

      {/* Edit Quotation Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Quotation</DialogTitle>
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
                        {product.product_type} - {product.bundle} ({product.selling_price.toLocaleString()} RWF)
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
                  min="1"
                />
              </div>
              <div>
                <Label>Unit Price (RWF)</Label>
                <Input
                  type="number"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData((prev) => ({ ...prev, unitPrice: e.target.value }))}
                  placeholder="Enter unit price"
                  min="0"
                />
              </div>
              <div>
                <Label>Discount (%)</Label>
                <Input
                  type="number"
                  value={formData.discount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, discount: e.target.value }))}
                  placeholder="0"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Enter notes..."
                rows={3}
              />
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
                        <TableCell>{Number(item.unitPrice || 0).toLocaleString()}</TableCell>
                        <TableCell>{item.discount}%</TableCell>
                        <TableCell>{Number(item.totalIncl || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="destructive" onClick={() => removeItem(index)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="p-4 text-right font-semibold">Total Amount: {totalAmount.toLocaleString()} RWF</div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false)
                  setEditingQuotation(null)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleEditQuotation} className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Quotation"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
