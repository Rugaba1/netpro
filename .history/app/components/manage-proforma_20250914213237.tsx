"use client";

import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAccount } from "@/lib/account-context";
import { useToast } from "@/hooks/use-toast";
import { Eye, Edit, Trash2, Plus, Check } from "lucide-react";
import ProformaTemplate from "./proforma-template";
import axios from "axios";

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
  qty: number;
  price: number;
  discount: number;
  notes?: string;
  product: Product;
}

interface Proforma {
  id: number;
  status: string,
  customer_id: number;
  created_at: string;
  updated_at: string;
  user_id: number;
  customer: Customer;
  proforma_product: ProformaProduct[];
  amount_paid:number,
  amount_to_pay:number,
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedProforma, setSelectedProforma] = useState<Proforma | null>(null);
  const [editingProforma, setEditingProforma] = useState<Proforma | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { updateBalance, addTransaction } = useAccount();
  const { toast } = useToast();

  // Form state
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
    amount_paid: "0",
     amount_to_pay: "0",
    items: [] as any[],
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
      amount_paid: parseFloat(formData.amount_paid) || 0.00,
        amount_to_pay: total - (parseFloat(formData.items.reduce((acc, item) => acc + item.totalIncl, 0)) || 0.00),
        proforma_products: formData.items.map((item, index) => ({
          product_id: products.find(p => p.name === item.description)?.id || 0,
          qty: item.quantity,
          price: item.totalIncl,
          discount: item.discount,
          notes: item.description,
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

  const handleViewProforma = (proforma: Proforma) => {
    setSelectedProforma(proforma);
    setIsViewDialogOpen(true);
  };

  const handleEditClick = (proforma: Proforma) => {
    setEditingProforma(proforma);
    setFormData({
      customer_id: proforma.customer_id.toString(),
      customerName: proforma.customer.name,
      billingName: proforma.customer.billing_name,
      product_id: "",
      description: "",
      quantity: "1",
      unitPrice: "",
      discount: "0",
      expiryDate: "",
      notes: "",
      items: proforma.proforma_product.map((item, index) => ({
        description: item.product.name,
        quantity: item.qty,
        unitPrice: Number(item.product.net_price || item.product.price),
        discount: item.discount,
        priceExclVat: Number(item.price) / 1.18,
        vat: Number(item.price) - (Number(item.price) / 1.18),
        totalIncl: Number(item.price),
      })),
      amount_paid:proforma.amount_paid.toString() ,
      amount_to_pay: proforma.amount_to_pay.toString(),
    });
    calculateTotals(proforma.proforma_product.map(item => ({
      quantity: item.qty,
      unitPrice: Number(item.product.net_price || item.product.price),
      discount: item.discount,
    })));
    setIsEditDialogOpen(true);
  };

  const handleDeleteProforma = async (id: number) => {
    if (!confirm("Are you sure you want to delete this proforma?")) return;

    try {
      await axios.delete(`/api/proforma-invoices/${id}`);
      setProformas((prev) => prev.filter((p) => p.id !== id));
      toast({
        title: "Success",
        description: "Proforma deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting proforma:", error);
      toast({
        title: "Error",
        description: "Failed to delete proforma",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsPaid = async (proforma: Proforma) => {
    try {
      // Calculate total amount from proforma products
      const totalAmount = proforma.proforma_product.reduce((sum, item) => sum + Number(item.price), 0);
      
      updateBalance(totalAmount);
      addTransaction({
        type: "proforma_payment",
        amount: totalAmount,
        description: `Proforma #${proforma.id} payment received - ${proforma.customer.name}`,
        proformaId: proforma.id,
      });

      // Update proforma status in the database
      await axios.put(`/api/proforma-invoices/${proforma.id}`, { status: "paid" });

      setProformas((prev) => prev.map((p) => p.id === proforma.id ? { ...p, status: "paid" } : p));

      toast({
        title: "Success",
        description: "Proforma marked as paid successfully",
      });
    } catch (error) {
      console.error("Error marking proforma as paid:", error);
      toast({
        title: "Error",
        description: "Failed to mark proforma as paid",
        variant: "destructive",
      });
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

      amount_paid: "0",
      amount_to_pay: "0",
    });
    setSubtotal(0);
    setTax(0);
    setTotal(0);
  };

  const filteredProformas = proformas.filter(
    (proforma) =>
      proforma.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proforma.customer.billing_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proforma.id.toString().includes(searchTerm.toLowerCase())
  );

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
      default:
        return "bg-gray-500 text-white px-2 py-1 rounded text-xs";
    }
  };

  const getProformaTotal = (proforma: Proforma) => {
    return proforma.proforma_product.reduce((sum, item) => sum + Number(item.price), 0);
  };

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
                  <Label htmlFor="customer_id">Customer</Label>
                  <Select value={formData.customer_id} onValueChange={handleCustomerChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
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
                    onChange={(e) => setFormData((prev) => ({ ...prev, billingName: e.target.value }))}
                    placeholder="Billing name"
                  />
                </div>
              </div>

              {/* Product Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Product</Label>
                  <Select value={formData.product_id} onValueChange={handleProductChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name} - RWF {product.net_price || product.price}
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
                  <Label>Amount Paid(RWF)</Label>
                  <Input
                    type="number"
                    value={formData.amount_paid}
                    onChange={(e) => setFormData((prev) => ({ ...prev, amount_paid: e.target.value }))}
                    placeholder="Enter amount paid"
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

              {/* Notes */}
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Enter notes..."
                  rows={2}
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
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{Number(item.unitPrice).toFixed(2)}</TableCell>
                          <TableCell>{item.discount}%</TableCell>
                          <TableCell>{Number(item.totalIncl).toFixed(2)}</TableCell>
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
              <TableHead>No</TableHead>
              <TableHead>Proforma #</TableHead>
              <TableHead>Customer Name</TableHead>
              <TableHead>Billing Name</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProformas.map((proforma, index) => (
              <TableRow key={proforma.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  <span className="bg-yellow-600 text-white px-2 py-1 rounded text-xs">#{proforma.id}</span>
                </TableCell>
                <TableCell>{proforma.customer.name}</TableCell>
                <TableCell>{proforma.customer.billing_name}</TableCell>
                <TableCell>
                  RWF {getProformaTotal(proforma).toLocaleString()}
                </TableCell>
                <TableCell>
                  <span className={getStatusColor(proforma.status || "pending")}>
                    {(proforma.status || "pending").toUpperCase()}
                  </span>
                </TableCell>
                <TableCell>{new Date(proforma.created_at).toLocaleDateString()}</TableCell>
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
      </div>

      {/* View Proforma Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Proforma</DialogTitle>
          </DialogHeader>
          {selectedProforma && (
            <ProformaTemplate 
              proformaData={{
                id: selectedProforma.id.toString(),
                proformaNo: `#${selectedProforma.id}`,
                customerId: selectedProforma.customer_id.toString(),
                customerName: selectedProforma.customer.name,
                billingName: selectedProforma.customer.billing_name,
                date: new Date(selectedProforma.created_at).toLocaleDateString(),
                validUntil: new Date(selectedProforma.created_at).toLocaleDateString(),
                expiryDate: new Date(selectedProforma.created_at).toLocaleDateString(),
                status: selectedProforma.status as any,
                currency: "RWF",
                totalExcl: getProformaTotal(selectedProforma) / 1.18,
                tax: getProformaTotal(selectedProforma) - (getProformaTotal(selectedProforma) / 1.18),
                totalDiscount: 0,
                totalIncl: getProformaTotal(selectedProforma),
                amountInLetters: numberToWords(getProformaTotal(selectedProforma)),
                notes: "",
                items: selectedProforma.proforma_product.map((item, index) => ({
                  no: index + 1,
                  description: item.product.name,
                  qty: item.qty,
                  unitPrice: Number(item.product.net_price || item.product.price),
                  discount: item.discount,
                  priceExclVat: Number(item.price) / 1.18,
                  vat: Number(item.price) - (Number(item.price) / 1.18),
                  totalIncl: Number(item.price),
                }))
              }} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageProforma;