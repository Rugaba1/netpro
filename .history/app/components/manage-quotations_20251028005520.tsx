"use client";

import { useState, useEffect } from "react";
import {
  Eye,
  Edit,
  Trash2,
  FileText,
  Plus,
  Printer,
  Download,
  Search,
  User,
  ShoppingCart,
  DollarSign,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import { formatCurrency } from "@/lib/utils";

interface Customer {
  id: number;
  name: string;
  billing_name: string;
  tin: string;
  phone: string;
  service_number: string;
  company_id?: number;
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

interface QuotationProduct {
  id: number;
  product_id: number;
  qty: number;
  price: number;
  discount: number;
  notes?: string;
  product: Product;
}

interface Quotation {
  id: number;
  customer_id: number;
  created_at: string;
  updated_at: string;
  user_id: number;
  customer: Customer;
  quotation_product: QuotationProduct[];
  users?: {
    username: string;
    email: string;
  };
}

export default function QuotationManagement() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(
    null
  );
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState({
    customer_id: "",

    quotation_products: [] as any[],
  });

  const [editForm, setEditForm] = useState({
    customer_id: "",

    quotation_products: [] as any[],
  });

  const [newProduct, setNewProduct] = useState({
    product_id: "",
    qty: 1,
    discount: 0,
    notes: "",
  });

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [quotationsRes, customersRes, productsRes] = await Promise.all([
          axios.get("/api/quotations"),
          axios.get("/api/customers"),
          axios.get("/api/products"),
        ]);

        setQuotations(quotationsRes.data.quotations);
        setCustomers(customersRes.data.customers);
        setProducts(productsRes.data.products);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredQuotations = quotations.filter(
    (quotation) =>
      quotation.customer.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      quotation.customer.billing_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      quotation.quotation_product.find((item) =>
        item.product.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const handleAddProduct = (isEdit = false) => {
    if (!newProduct.product_id) {
      alert("Please select a product");
      return;
    }

    const selectedProduct = products.find(
      (product) => product.id === parseInt(newProduct.product_id)
    );

    if (!selectedProduct) {
      alert("Selected product not found");
      return;
    }

    const productTotal =
      (selectedProduct.net_price || selectedProduct.price) * newProduct.qty;
    const discountAmount = (productTotal * newProduct.discount) / 100;
    const finalPrice = productTotal - discountAmount;

    const productItem = {
      id: isEdit ? Date.now() : Date.now(), // For edit, we'll use temporary IDs that will be replaced by the backend
      product_id: parseInt(newProduct.product_id),
      qty: newProduct.qty,
      price: finalPrice,
      discount: newProduct.discount,
      notes: newProduct.notes,
      product: selectedProduct,
    };

    if (isEdit) {
      setEditForm((prev) => ({
        ...prev,
        quotation_products: [...prev.quotation_products, productItem],
      }));
    } else {
      setCreateForm((prev) => ({
        ...prev,
        quotation_products: [...prev.quotation_products, productItem],
      }));
    }

    setNewProduct({
      product_id: "",
      qty: 1,
      discount: 0,
      notes: "",
    });
  };

  const handleRemoveProduct = (productId: number, isEdit = false) => {
    if (isEdit) {
      setEditForm((prev) => ({
        ...prev,
        quotation_products: prev.quotation_products.filter(
          (item) => item.id !== productId
        ),
      }));
    } else {
      setCreateForm((prev) => ({
        ...prev,
        quotation_products: prev.quotation_products.filter(
          (item) => item.id !== productId
        ),
      }));
    }
  };

  const handleCreateQuotation = async () => {
    if (!createForm.customer_id || createForm.quotation_products.length === 0) {
      alert("Please select a customer and add at least one product");
      return;
    }

    try {
      const quotationData = {
        customer_id: parseInt(createForm.customer_id),

        quotation_products: createForm.quotation_products.map((item) => ({
          product_id: item.product_id,
          qty: item.qty,
          discount: item.discount,
          notes: item.notes,
        })),
      };

      const response = await axios.post("/api/quotations", quotationData);
      const newQuotation = response.data;

      setQuotations((prev) => [newQuotation, ...prev]);
      setIsCreateDialogOpen(false);
      setCreateForm({
        customer_id: "",

        quotation_products: [],
      });

      alert("Quotation created successfully!");
    } catch (error) {
      console.error("Error creating quotation:", error);
      alert("Failed to create quotation");
    }
  };

  const handleEditQuotation = async () => {
    if (
      !editingQuotation ||
      !editForm.customer_id ||
      editForm.quotation_products.length === 0
    ) {
      alert("Please select a customer and add at least one product");
      return;
    }

    try {
      setIsSubmitting(true);
      const quotationData = {
        customer_id: parseInt(editForm.customer_id),
        quotation_products: editForm.quotation_products.map((item) => ({
          product_id: item.product_id,
          qty: item.qty,
          discount: item.discount,
          notes: item.notes,
        })),
      };

      console.log("Sending update data:", quotationData); // For debugging

      const response = await axios.put(
        `/api/quotations/${editingQuotation.id}`,
        quotationData
      );
      const updatedQuotation = response.data;

      setQuotations((prev) =>
        prev.map((quotation) =>
          quotation.id === updatedQuotation.id ? updatedQuotation : quotation
        )
      );
      setIsEditDialogOpen(false);
      setEditingQuotation(null);

      alert("Quotation updated successfully!");
    } catch (error) {
      console.error("Error updating quotation:", error);
      alert("Failed to update quotation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuotation = async (quotation: Quotation) => {
    if (
      !confirm(`Are you sure you want to delete quotation #${quotation.id}?`)
    ) {
      return;
    }

    try {
      await axios.delete(`/api/quotations/${quotation.id}`);
      setQuotations((prev) => prev.filter((q) => q.id !== quotation.id));
      alert("Quotation deleted successfully!");
    } catch (error) {
      console.error("Error deleting quotation:", error);
      alert("Failed to delete quotation");
    }
  };

  const handleViewQuotation = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setIsViewDialogOpen(true);
  };

  const handleEditClick = (quotation: Quotation) => {
    setEditingQuotation(quotation);
    setEditForm({
      customer_id: quotation.customer_id.toString(),
      quotation_products: quotation.quotation_product.map((item) => ({
        id: item.id,
        product_id: item.product_id,
        qty: item.qty,
        price: item.price,
        discount: item.discount,
        notes: item.notes || "",
        product: item.product,
      })),
    });
    setIsEditDialogOpen(true);
  };

  const handlePrintQuotation = (quotation: Quotation) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Quotation #${quotation.id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .company-info { margin-bottom: 20px; }
          .customer-info { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; }
          .total { text-align: right; font-weight: bold; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>QUOTATION</h1>
          <p>Quote #: ${quotation.id}</p>
          <p>Date: ${new Date(quotation.created_at).toLocaleDateString()}</p>
        </div>

        <div class="company-info">
          <h3>NETPRO</h3>
          <p>Email: info@netpro.com</p>
          <p>Phone: +250 791 000 000</p>
        </div>

        <div class="customer-info">
          <h3>Customer Information</h3>
          <p>Name: ${quotation.customer.name}</p>
          <p>Billing Name: ${quotation.customer.billing_name}</p>
          <p>TIN: ${quotation.customer.tin}</p>
          <p>Phone: ${quotation.customer.phone}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Description</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Discount</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${quotation.quotation_product
              .map(
                (item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.product.name}</td>
                <td>${item.qty}</td>
                <td>RWF ${item.product.net_price || item.product.price}</td>
                <td>${item.discount}%</td>
                <td>RWF ${item.price.toLocaleString()}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <div class="total">
          <h3>Grand Total: ${formatCurrency(quotation.quotation_product
            .reduce((sum, item) => sum + Number(item.price), 0))}
          </h3>
        </div>

        <div class="footer">
          <p>Thank you for your business!</p>
          <p>This quotation is valid for 30 days from the date of issue.</p>
        </div>

        <div class="no-print" style="margin-top: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; cursor: pointer;">
            Print Quotation
          </button>
          <button onclick="window.close()" style="padding: 10px 20px; background: #dc3545; color: white; border: none; cursor: pointer; margin-left: 10px;">
            Close
          </button>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const calculateTotal = (products: any[]) => {
    return products.reduce((sum, item) => sum + Number(item.price), 0);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Quotation Management
          </h1>
          <nav className="text-sm text-gray-500 mt-1">
            <span>Home</span> / <span>Sales</span> / <span>Quotations</span>
          </nav>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <FileText className="mr-2 h-4 w-4" />
          Create Quotation
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Quotations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm">Show</span>
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
              <span className="text-sm">entries</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm">Search:</span>
              <Input
                className="w-64"
                placeholder="Search quotations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Billing Name</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Date Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotations.map((quotation) => {
                  const totalAmount = quotation.quotation_product.reduce(
                    (sum, item) => sum + Number(item.price),
                    0
                  );

                  return (
                    <TableRow key={quotation.id}>
                      <TableCell>#{quotation.id}</TableCell>
                      <TableCell>{quotation.customer.name}</TableCell>
                      <TableCell>{quotation.customer.billing_name}</TableCell>
                      <TableCell>
                        {quotation.quotation_product
                          .map((item) => item.product.name)
                          .join(", ")}
                      </TableCell>
                      <TableCell> { formatCurrency(totalAmount)}</TableCell>
                      <TableCell>
                        {new Date(quotation.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            className="bg-blue-500 hover:bg-blue-600 p-1"
                            onClick={() => handleViewQuotation(quotation)}
                            title="View Quotation"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600 p-1"
                            onClick={() => handleEditClick(quotation)}
                            title="Edit Quotation"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            className="bg-yellow-500 hover:bg-yellow-600 p-1"
                            onClick={() => handlePrintQuotation(quotation)}
                            title="Print Quotation"
                          >
                            <Printer className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="p-1"
                            title="Delete Quotation"
                            onClick={() => handleDeleteQuotation(quotation)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Quotation Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Quotation</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new quotation for your customer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="customer">Customer</Label>
              <Select
                value={createForm.customer_id}
                onValueChange={(value) =>
                  setCreateForm((prev) => ({ ...prev, customer_id: value }))
                }
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

            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Add Products</h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <Label htmlFor="product">Product</Label>
                  <Select
                    value={newProduct.product_id}
                    onValueChange={(value) =>
                      setNewProduct((prev) => ({ ...prev, product_id: value }))
                    }
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
                          {product.name} - RWF{" "}
                          {product.net_price || product.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newProduct.qty}
                    onChange={(e) =>
                      setNewProduct((prev) => ({
                        ...prev,
                        qty: parseInt(e.target.value) || 1,
                      }))
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="discount">Discount (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={newProduct.discount}
                    onChange={(e) =>
                      setNewProduct((prev) => ({
                        ...prev,
                        discount: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={() => handleAddProduct(false)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  placeholder="Additional notes about this product..."
                  value={newProduct.notes}
                  onChange={(e) =>
                    setNewProduct((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {/* Products Table */}
            {createForm.quotation_products.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Selected Products</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {createForm.quotation_products.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.product.name}</TableCell>
                        <TableCell>{item.qty}</TableCell>
                        <TableCell>
                          RWF {item.product.net_price || item.product.price}
                        </TableCell>
                        <TableCell>{item.discount}%</TableCell>
                        <TableCell>RWF {item.price.toLocaleString()}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemoveProduct(item.id, false)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="mt-4 p-3 bg-blue-50 rounded">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">Grand Total</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(calculateTotal(createForm.quotation_products))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateQuotation}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={createForm.quotation_products.length === 0}
            >
              Create Quotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Quotation Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Quotation #{editingQuotation?.id}</DialogTitle>
            <DialogDescription>
              Modify the quotation details for your customer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            
            <div>
              <Label htmlFor="customer">Customer</Label>
              <Select
                value={editForm.customer_id}
                onValueChange={(value) =>
                  setEditForm((prev) => ({ ...prev, customer_id: value }))
                }
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

            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Add Products</h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <Label htmlFor="product">Product</Label>
                  <Select
                    value={newProduct.product_id}
                    onValueChange={(value) =>
                      setNewProduct((prev) => ({ ...prev, product_id: value }))
                    }
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
                          {product.name} - RWF{" "}
                          {product.net_price || product.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newProduct.qty}
                    onChange={(e) =>
                      setNewProduct((prev) => ({
                        ...prev,
                        qty: parseInt(e.target.value) || 1,
                      }))
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="discount">Discount (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={newProduct.discount}
                    onChange={(e) =>
                      setNewProduct((prev) => ({
                        ...prev,
                        discount: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={() => handleAddProduct(true)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  placeholder="Additional notes about this product..."
                  value={newProduct.notes}
                  onChange={(e) =>
                    setNewProduct((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {/* Products Table */}
            {editForm.quotation_products.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Selected Products</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {editForm.quotation_products.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.product.name}</TableCell>
                        <TableCell>{item.qty}</TableCell>
                        <TableCell>
                          RWF {item.product.net_price || item.product.price}
                        </TableCell>
                        <TableCell>{item.discount}%</TableCell>
                        <TableCell>RWF {item.price.toLocaleString()}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemoveProduct(item.id, true)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="mt-4 p-3 bg-blue-50 rounded">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">Grand Total</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(calculateTotal(
                          editForm.quotation_products
                        ))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditQuotation}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={
                editForm.quotation_products.length === 0 || isSubmitting
              }
            >
              {isSubmitting ? "Updating..." : "Update Quotation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Quotation Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quotation Details</DialogTitle>
            <DialogDescription>
              View and manage quotation information.
            </DialogDescription>
          </DialogHeader>

          {selectedQuotation && (
            <div className="space-y-4">
                   <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <img src="/images/netpro-logo.jpeg" alt="NETPRO Logo" className="h-20 w-auto" />
          </div>
          <div className="text-center text-sm leading-relaxed">
            <div className="font-bold text-lg mb-1">NETPRO Ltd</div>
            <div className="mb-1">KG 9, Ave</div>
            <div className="mb-1">P.O. Box 2234 Kgali Rwanda</div>
            <div className="mb-1">Tel: 0786856484 | Email: netprorwanda@gmail.com</div>
            <div>TIN: 106838391</div>
          </div>
        </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Customer Information</Label>
                  <div className="mt-2 space-y-1">
                    <p>
                      <span className="font-medium">Name:</span>{" "}
                      {selectedQuotation.customer.name}
                    </p>
                    <p>
                      <span className="font-medium">Billing Name:</span>{" "}
                      {selectedQuotation.customer.billing_name}
                    </p>
                    <p>
                      <span className="font-medium">TIN:</span>{" "}
                      {selectedQuotation.customer.tin}
                    </p>
                    <p>
                      <span className="font-medium">Phone:</span>{" "}
                      {selectedQuotation.customer.phone}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="font-semibold">Quotation Information</Label>
                  <div className="mt-2 space-y-1">
                    <p>
                      <span className="font-medium">Quote #:</span>{" "}
                      {selectedQuotation.id}
                    </p>
                    <p>
                      <span className="font-medium">Date Created:</span>{" "}
                      {new Date(
                        selectedQuotation.created_at
                      ).toLocaleDateString()}
                    </p>
                    <p>
                      <span className="font-medium">Created By:</span>{" "}
                      {selectedQuotation.users?.username || "System"}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <Label className="font-semibold">Products</Label>
                <Table className="mt-2">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedQuotation.quotation_product.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.product.name}</TableCell>
                        <TableCell>{item.qty}</TableCell>
                        <TableCell>
                          RWF {item.product.net_price || item.product.price}
                        </TableCell>
                        <TableCell>{item.discount}%</TableCell>
                        <TableCell>RWF {item.price.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="bg-gray-50 p-4 rounded">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">Grand Total</p>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    
                    {formatCurrency(selectedQuotation.quotation_product
                      .reduce((sum, item) => sum + Number(item.price), 0))
                      }
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsViewDialogOpen(false)}
            >
              Close
            </Button>
            {selectedQuotation && (
              <Button
                onClick={() => handlePrintQuotation(selectedQuotation)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Quotation
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
