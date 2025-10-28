"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccount } from "@/lib/account-context";
import { useToast } from "@/hooks/use-toast";
import { Eye, Edit, Trash2, Plus, Check, Filter, X, Calendar, AlertCircle } from "lucide-react";
import ProformaTemplate from "./proforma-template";
import axios from "axios";
import { formatCurrency } from "@/lib/utils";

interface Customer {
  id: number;
  name: string;
  billing_name: string;
  tin: string;
  phone: string;
  service_number: string;
  email?: string;
  address?: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  net_price: number;
  duration: number;
  type_id: number;
  package_id?: number;
  product_type?: {
    name: string;
  };
  Renamedpackage?: {
    description: string;
  };
}

interface ProformaProduct {
  id: number;
  product_id: number;
  unitPrice: number;
  qty: number;
  price: number;
  discount: number;
  notes?: string;
  product: Product;
}

interface Proforma {
  id: number;
  status: string;
  customer_id: number;
  created_at: string;
  updated_at: string;
  user_id: number;
  customer: Customer;
  proforma_product: ProformaProduct[];
  amount_to_pay: number;
  users?: {
    username: string;
    email: string;
  };
}

const ManageProforma = () => {
  const [proformas, setProformas] = useState<Proforma[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditProductDialogOpen, setIsEditProductDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedProforma, setSelectedProforma] = useState<Proforma | null>(null);
  const [editingProduct, setEditingProduct] = useState<{proformaId: number, product: ProformaProduct} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  const getProformaTotal = (proforma: Proforma) => {
    return proforma.proforma_product.reduce(
      (sum, item) => sum + Number(item.price),
      0
    );
  };
  
  // Filter states
  const [filters, setFilters] = useState({
    status: "",
    customer: "",
    dateFrom: "",
    dateTo: "",
    amountFrom: "",
    amountTo: "",
  });

  const { updateBalance, addTransaction } = useAccount();
  const { toast } = useToast();

  // Form state for creating new proforma
  const [formData, setFormData] = useState({
    customer_id: "",
    customerName: "",
    billingName: "",
    product_id: "",
    description: "",
    quantity: "1",
    unitPrice: "",
    discount: "0",
    expiryDate: "",
    notes: "",
    amount_to_pay: "0",
    items: [] as any[],
  });

  // Form state for editing individual product
  const [editProductForm, setEditProductForm] = useState({
    qty: "1",
    unitPrice: "",
    discount: "0",
    notes: "",
  });

  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);

  // Fetch data on component mount
  useEffect(() => {
    fetchCustomers();
    fetchProducts();
    fetchProformas();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get("/api/customers");
      setCustomers(response.data.customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast({
        title: "Error",
        description: "Failed to fetch customers",
        variant: "destructive",
      });
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get("/api/products");
      setProducts(response.data.products);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      });
    }
  };

  const fetchProformas = async () => {
    try {
      const response = await axios.get("/api/proforma-invoices");
      setProformas(response.data.proformas);
    } catch (error) {
      console.error("Error fetching proformas:", error);
      toast({
        title: "Error",
        description: "Failed to fetch proformas",
        variant: "destructive",
      });
    }
  };

  const numberToWords = (num: number): string => {
    if (num === 0) return "Zero";
    return `${num.toLocaleString()} Rwandan Francs Only`;
  };

  const calculateItemTotals = (item: any) => {
    const unitPrice = Number.parseFloat(item.unitPrice) || 0;
    const qty = Number.parseInt(item.quantity) || 1;
    const discount = Number.parseFloat(item.discount) || 0;

    const priceAfterDiscount = unitPrice * (1 - discount / 100);
    const priceExclVat = (priceAfterDiscount * qty) / 1.18;
    const vat = priceExclVat * 0.18;
    const totalIncl = priceExclVat + vat;

    return {
      priceExclVat,
      vat,
      totalIncl,
    };
  };

  const calculateTotals = (items: any[]) => {
    let totalExcl = 0;
    let totalVat = 0;

    items.forEach((item) => {
      const { priceExclVat, vat } = calculateItemTotals(item);
      totalExcl += priceExclVat;
      totalVat += vat;
    });

    setSubtotal(totalExcl);
    setTax(totalVat);
    setTotal(totalExcl + totalVat);

    return {
      totalExcl,
      tax: totalVat,
      totalIncl: totalExcl + totalVat,
    };
  };

  const addItem = () => {
    if (!formData.description || !formData.unitPrice) {
      toast({
        title: "Error",
        description: "Please fill in description and unit price fields",
        variant: "destructive",
      });
      return;
    }

    const newItem = {
      description: formData.description,
      quantity: Number.parseInt(formData.quantity) || 1,
      unitPrice: Number.parseFloat(formData.unitPrice) || 0,
      discount: Number.parseFloat(formData.discount) || 0,
    };

    const totals = calculateItemTotals(newItem);
    const itemWithTotals = { ...newItem, ...totals };

    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, itemWithTotals],
      description: "",
      unitPrice: "",
      quantity: "1",
      discount: "0",
      product_id: "",
    }));

    const newItems = [...formData.items, itemWithTotals];
    calculateTotals(newItems);
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, items: newItems }));
    calculateTotals(newItems);
  };

  const handleCreateProforma = async () => {
    if (!formData.customer_id || formData.items.length === 0) {
      toast({
        title: "Error",
        description: "Please select a customer and add at least one item",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      const proformaData = {
        customer_id: parseInt(formData.customer_id),
        amount_to_pay: formData.items.reduce((sum, item) => sum + item.totalIncl, 0),
        proforma_products: formData.items.map((item, index) => ({
          product_id: products.find((p) => p.name === item.description)?.id || 0,
          qty: item.quantity,
          unitPrice: item.unitPrice,
          price: item.totalIncl,
          discount: item.discount,
          description: item.description,
          notes: item.notes || item.description,
        })),
      };

      const response = await axios.post("/api/proforma-invoices", proformaData);
      const newProforma = response.data;

      setProformas((prev) => [...prev, newProforma]);
      setIsCreateDialogOpen(false);
      resetForm();

      toast({
        title: "Success",
        description: "Proforma created successfully",
      });
    } catch (error) {
      console.error("Error creating proforma:", error);
      toast({
        title: "Error",
        description: "Failed to create proforma",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Edit individual product functionality
  const handleEditProductClick = (proformaId: number, product: ProformaProduct) => {
    setEditingProduct({proformaId, product});
    setEditProductForm({
      qty: product.qty.toString(),
      unitPrice: (product.unitPrice || product.product.net_price || product.product.price).toString(),
      discount: product.discount.toString(),
      notes: product.notes || "",
    });
    setIsEditProductDialogOpen(true);
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    try {
      setIsLoading(true);

      const { qty, unitPrice, discount, notes } = editProductForm;
      const qtyNum = Number.parseInt(qty) || 1;
      const unitPriceNum = Number.parseFloat(unitPrice) || 0;
      const discountNum = Number.parseFloat(discount) || 0;
      
      // Calculate new price
      const priceAfterDiscount = unitPriceNum * (1 - discountNum / 100);
      const priceExclVat = (priceAfterDiscount * qtyNum) / 1.18;
      const vat = priceExclVat * 0.18;
      const totalIncl = priceExclVat + vat;

      // Update the product in the proforma
      await axios.put(`/api/proforma-invoices/${editingProduct.proformaId}/products/${editingProduct.product.id}`, {
        qty: qtyNum,
        unitPrice: unitPriceNum,
        discount: discountNum,
        price: totalIncl,
        notes,
      });

      // Update local state
      setProformas(prev => prev.map(proforma => {
        if (proforma.id === editingProduct.proformaId) {
          const updatedProducts = proforma.proforma_product.map(item => {
            if (item.id === editingProduct.product.id) {
              return {
                ...item,
                qty: qtyNum,
                unitPrice: unitPriceNum,
                discount: discountNum,
                price: totalIncl,
                notes,
              };
            }
            return item;
          });
          
          // Recalculate total amount
          const amount_to_pay = updatedProducts.reduce((sum, item) => sum + Number(item.price), 0);
          
          return {
            ...proforma,
            proforma_product: updatedProducts,
            amount_to_pay,
          };
        }
        return proforma;
      }));

      setIsEditProductDialogOpen(false);
      setEditingProduct(null);

      toast({
        title: "Success",
        description: "Product updated successfully",
      });
    } catch (error) {
      console.error("Error updating product:", error);
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewProforma = (proforma: Proforma) => {
    setSelectedProforma(proforma);
    setIsViewDialogOpen(true);
  };

  // Enhanced Delete with confirmation
  const handleDeleteProforma = async (proforma: Proforma) => {
    const confirmMessage = `Are you sure you want to delete Proforma #${proforma.id} for ${proforma.customer.name}? This action cannot be undone.`;
    
    if (!confirm(confirmMessage)) return;

    try {
      setIsLoading(true);
      await axios.delete(`/api/proforma-invoices/${proforma.id}`);
      
      setProformas((prev) => prev.filter((p) => p.id !== proforma.id));
      
      toast({
        title: "Success",
        description: `Proforma #${proforma.id} deleted successfully`,
      });
    } catch (error) {
      console.error("Error deleting proforma:", error);
      toast({
        title: "Error",
        description: "Failed to delete proforma",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced Status Management
  const handleStatusChange = async (proforma: Proforma, newStatus: string) => {
    try {
      setIsLoading(true);

      if (newStatus === "paid") {
        // Calculate total amount from proforma products
        const totalAmount = proforma.proforma_product.reduce(
          (sum, item) => sum + Number(item.price),
          0
        );

        updateBalance(totalAmount);
        addTransaction({
          type: "proforma_payment",
          amount: totalAmount,
          description: `Proforma #${proforma.id} payment received - ${proforma.customer.name}`,
          proformaId: proforma.id,
        });
      }

      // Update proforma status in the database
      await axios.patch(`/api/proforma-invoices/${proforma.id}`, {
        status: newStatus,
      });

      setProformas((prev) =>
        prev.map((p) => (p.id === proforma.id ? { ...p, status: newStatus } : p))
      );

      toast({
        title: "Success",
        description: `Proforma status updated to ${newStatus.toUpperCase()}`,
      });
    } catch (error) {
      console.error("Error updating proforma status:", error);
      toast({
        title: "Error",
        description: "Failed to update proforma status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find((c) => c.id.toString() === customerId);
    if (customer) {
      setFormData((prev) => ({
        ...prev,
        customer_id: customerId,
        customerName: customer.name,
        billingName: customer.billing_name,
      }));
    }
  };

  const handleProductChange = (productId: string) => {
    const product = products.find((p) => p.id.toString() === productId);
    if (product) {
      setFormData((prev) => ({
        ...prev,
        product_id: productId,
        description: product.name,
        unitPrice: (product.net_price || product.price).toString(),
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: "",
      customerName: "",
      billingName: "",
      product_id: "",
      description: "",
      quantity: "1",
      unitPrice: "",
      discount: "0",
      expiryDate: "",
      notes: "",
      items: [],
      amount_to_pay: "0",
    });
    setSubtotal(0);
    setTax(0);
    setTotal(0);
  };

  // Enhanced Filtering
  const clearFilters = () => {
    setFilters({
      status: "",
      customer: "",
      dateFrom: "",
      dateTo: "",
      amountFrom: "",
      amountTo: "",
    });
  };

  const filteredProformas = proformas.filter((proforma) => {
    // Search term filter
    const matchesSearch = !searchTerm || 
      proforma.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proforma.customer.billing_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proforma.id.toString().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus = !filters.status || proforma.status === filters.status;

    // Customer filter
    const matchesCustomer = !filters.customer || 
      proforma.customer.name.toLowerCase().includes(filters.customer.toLowerCase());

    // Date range filter
    const proformaDate = new Date(proforma.created_at);
    const matchesDateFrom = !filters.dateFrom || proformaDate >= new Date(filters.dateFrom);
    const matchesDateTo = !filters.dateTo || proformaDate <= new Date(filters.dateTo);

    // Amount range filter
    const proformaTotal = getProformaTotal(proforma);
    const matchesAmountFrom = !filters.amountFrom || proformaTotal >= Number(filters.amountFrom);
    const matchesAmountTo = !filters.amountTo || proformaTotal <= Number(filters.amountTo);

    return matchesSearch && matchesStatus && matchesCustomer && 
           matchesDateFrom && matchesDateTo && matchesAmountFrom && matchesAmountTo;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500 text-white px-2 py-1 rounded text-xs";
      case "sent":
        return "bg-blue-500 text-white px-2 py-1 rounded text-xs";
      case "paid":
        return "bg-green-500 text-white px-2 py-1 rounded text-xs";
      case "expired":
        return "bg-red-500 text-white px-2 py-1 rounded text-xs";
      case "cancelled":
        return "bg-gray-500 text-white px-2 py-1 rounded text-xs";
      default:
        return "bg-gray-500 text-white px-2 py-1 rounded text-xs";
    }
  };

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "sent", label: "Sent" },
    { value: "paid", label: "Paid" },
    { value: "expired", label: "Expired" },
    { value: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <nav className="text-sm text-gray-500 mb-2">
            🏠 Home / Invoices / Manage Proforma Invoices
          </nav>
          <h1 className="text-2xl font-semibold">Manage Proforma Invoices</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
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
                    <Label htmlFor="customer_id">Customer</Label>
                    <Select
                      value={formData.customer_id}
                      onValueChange={handleCustomerChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem
                            key={customer.id}
                            value={customer.id.toString()}
                          >
                            {customer.name} - {customer.billing_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="billingName">Billing Name</Label>
                    <Input
                      value={formData.billingName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          billingName: e.target.value,
                        }))
                      }
                      placeholder="Billing name"
                    />
                  </div>
                </div>

                {/* Product Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Product</Label>
                    <Select
                      value={formData.product_id}
                      onValueChange={handleProductChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem
                            key={product.id}
                            value={product.id.toString()}
                          >
                            {product.name} - {" "}
                            {formatCurrency(product.net_price || product.price)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
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
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          quantity: e.target.value,
                        }))
                      }
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <Label>Unit Price (RWF)</Label>
                    <Input
                      type="number"
                      value={formData.unitPrice}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          unitPrice: e.target.value,
                        }))
                      }
                      placeholder="Enter unit price"
                    />
                  </div>
                  <div>
                    <Label>Discount (%)</Label>
                    <Input
                      type="number"
                      value={formData.discount}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          discount: e.target.value,
                        }))
                      }
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    placeholder="Enter notes..."
                    rows={2}
                  />
                </div>

                {/* Add Item Button */}
                <Button
                  type="button"
                  onClick={addItem}
                  className="bg-green-600 hover:bg-green-700"
                >
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
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>
                              {Number(item.unitPrice).toFixed(2)}
                            </TableCell>
                            <TableCell>{item.discount}%</TableCell>
                            <TableCell>
                              {Number(item.totalIncl).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => removeItem(index)}
                              >
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
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={handleCreateProforma}
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating..." : "Create Proforma"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Enhanced Filters Section */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded mb-6 border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Filters</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="text-gray-600"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label>Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Customer</Label>
              <Input
                placeholder="Search customer..."
                value={filters.customer}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, customer: e.target.value }))
                }
              />
            </div>

            <div>
              <Label>Date From</Label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))
                }
              />
            </div>

            <div>
              <Label>Date To</Label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, dateTo: e.target.value }))
                }
              />
            </div>

            <div>
              <Label>Amount From (RWF)</Label>
              <Input
                type="number"
                placeholder="Min amount..."
                value={filters.amountFrom}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, amountFrom: e.target.value }))
                }
              />
            </div>

            <div>
              <Label>Amount To (RWF)</Label>
              <Input
                type="number"
                placeholder="Max amount..."
                value={filters.amountTo}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, amountTo: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredProformas.length} of {proformas.length} proformas
          </div>
        </div>
      )}

      {/* View Proforma Invoice Information Section */}
      <div className="bg-gray-50 p-4 rounded mb-6">
        <h3 className="font-medium mb-4">View Proforma Invoice Information</h3>

        <div className="flex justify-end mb-4">
          <Input
            className="w-64"
            placeholder="Search by ID, customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Proforma #</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead>Billing Name</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProformas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="h-8 w-8 text-gray-400" />
                      <span className="text-gray-500">No proformas found</span>
                      {(searchTerm || Object.values(filters).some(f => f)) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSearchTerm("");
                            clearFilters();
                          }}
                        >
                          Clear all filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProformas.map((proforma, index) => (
                  <TableRow key={proforma.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <span className="bg-yellow-600 text-white px-2 py-1 rounded text-xs">
                        #{proforma.id}
                      </span>
                    </TableCell>
                    <TableCell>{proforma.customer.name}</TableCell>
                    <TableCell>{proforma.customer.billing_name}</TableCell>
                    <TableCell>
                      RWF {getProformaTotal(proforma).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={proforma.status || "pending"}
                        onValueChange={(newStatus) => handleStatusChange(proforma, newStatus)}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue>
                            <span className={getStatusColor(proforma.status || "pending")}>
                              {(proforma.status || "pending").toUpperCase()}
                            </span>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              <span className={getStatusColor(status.value)}>
                                {status.label.toUpperCase()}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        {new Date(proforma.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => handleViewProforma(proforma)}
                          title="View Proforma"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => handleDeleteProforma(proforma)}
                          title="Delete Proforma"
                          disabled={proforma.status === "paid" || isLoading}
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
        </div>
      </div>

      {/* View Proforma Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Proforma #{selectedProforma?.id}</DialogTitle>
          </DialogHeader>
          {selectedProforma && (
            <div>
              <ProformaTemplate
                proformaData={{
                  id: selectedProforma.id.toString(),
                  proformaNo: `#${selectedProforma.id}`,
                  customerId: selectedProforma.customer_id.toString(),
                  customerName: selectedProforma.customer.name,
                  billingName: selectedProforma.customer.billing_name,
                  date: new Date(
                    selectedProforma.created_at
                  ).toLocaleDateString(),
                  validUntil: new Date(
                    selectedProforma.created_at
                  ).toLocaleDateString(),
                  expiryDate: new Date(
                    selectedProforma.created_at
                  ).toLocaleDateString(),
                  status: selectedProforma.status as any,
                  currency: "RWF",
                  totalExcl: getProformaTotal(selectedProforma) / 1.18,
                  tax:
                    getProformaTotal(selectedProforma) -
                    getProformaTotal(selectedProforma) / 1.18,
                  totalDiscount: 0,
                  totalIncl: getProformaTotal(selectedProforma),
                  amountInLetters: numberToWords(
                    getProformaTotal(selectedProforma)
                  ),
                  notes: "",
                  items: selectedProforma.proforma_product.map((item, index) => ({
                    no: index + 1,
                    description: item.product.name,
                    qty: item.qty,
                    unitPrice: Number(
                      item.unitPrice || item.product.net_price || item.product.price
                    ),
                    discount: item.discount,
                    priceExclVat: Number(item.price) / 1.18,
                    vat: Number(item.price) - Number(item.price) / 1.18,
                    totalIncl: Number(item.price),
                  })),
                }}
              />
              
              {/* Product Edit Section */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Products</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedProforma.proforma_product.map((product, index) => (
                      <TableRow key={product.id}>
                        <TableCell>{product.product.name}</TableCell>
                        <TableCell>{product.qty}</TableCell>
                        <TableCell>RWF {Number(product.unitPrice || product.product.net_price || product.product.price).toFixed(2)}</TableCell>
                        <TableCell>{product.discount}%</TableCell>
                        <TableCell>RWF {Number(product.price).toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleEditProductClick(selectedProforma.id, product)}
                            title="Edit Product"
                            disabled={selectedProforma.status === "paid"}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={isEditProductDialogOpen} onOpenChange={setIsEditProductDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Edit Product in Proforma #{editingProduct?.proformaId}
            </DialogTitle>
          </DialogHeader>
          
          {editingProduct && (
            <div className="space-y-4">
              <div>
                <Label>Product</Label>
                <Input 
                  value={editingProduct.product.product.name} 
                  disabled 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    value={editProductForm.qty}
                    onChange={(e) =>
                      setEditProductForm((prev) => ({
                        ...prev,
                        qty: e.target.value,
                      }))
                    }
                    placeholder="1"
                  />
                </div>
                <div>
                  <Label>Unit Price (RWF)</Label>
                  <Input
                    type="number"
                    value={editProductForm.unitPrice}
                    onChange={(e) =>
                      setEditProductForm((prev) => ({
                        ...prev,
                        unitPrice: e.target.value,
                      }))
                    }
                    placeholder="Enter unit price"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Discount (%)</Label>
                  <Input
                    type="number"
                    value={editProductForm.discount}
                    onChange={(e) =>
                      setEditProductForm((prev) => ({
                        ...prev,
                        discount: e.target.value,
                      }))
                    }
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Total</Label>
                  <Input
                    value={(
                      (Number(editProductForm.unitPrice) || 0) * 
                      (Number(editProductForm.qty) || 1) * 
                      (1 - (Number(editProductForm.discount) || 0) / 100)
                    ).toFixed(2)}
                    disabled
                  />
                </div>
              </div>
              
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={editProductForm.notes}
                  onChange={(e) =>
                    setEditProductForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="Enter notes..."
                  rows={2}
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditProductDialogOpen(false);
                    setEditingProduct(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateProduct}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? "Updating..." : "Update Product"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageProforma;