"use client";

import { useState, useEffect } from "react";
import {
  Eye,
  Edit,
  RefreshCw,
  Trash2,
  FileText,
  Plus,
  Trash,
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
import InvoiceTemplate from "./invoice-template";
import { useAccount } from "@/lib/account-context";
import {
  invoice as Invoice,
  invoice_stock_item as InvoiceStockItem,
  Renamedpackage as Package,
  product_type as ProductType,
  customer as Customer,
  company as Company,
  product as Product,
  stock_item as StockItem,
  supplier as Supplier,
} from "@/lib/generated/prisma";
import axios from "axios";

interface StockItemWithRelations extends StockItem {
  product: ProductWithPackageAndType;
  supplier: Supplier;
}

interface CustomerWithCompany extends Customer {
  company: Company | null;
}

interface InvoiceStockItemWithProduct extends InvoiceStockItem {
  item: StockItemWithRelations;
}
interface ProductWithPackageAndType extends Product {
  package: Package;
  product_type: ProductType;
}
interface InvoiceWithRelations extends Invoice {
  customer: CustomerWithCompany;
  invoice_stock_item: InvoiceStockItemWithProduct[];
}

interface CompanyWithCustomers extends Company {
  customers: CustomerWithCompany[];
}

const convertNumberToWords = (num: number): string => {
  const ones = [
    "",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
  ];
  const teens = [
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen",
  ];
  const tens = [
    "",
    "",
    "twenty",
    "thirty",
    "forty",
    "fifty",
    "sixty",
    "seventy",
    "eighty",
    "ninety",
  ];
  const thousands = ["", "thousand", "million", "billion"];

  if (num === 0) return "zero";

  const convertHundreds = (n: number): string => {
    let result = "";
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + " hundred ";
      n %= 100;
    }
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + " ";
      n %= 10;
    } else if (n >= 10) {
      result += teens[n - 10] + " ";
      return result;
    }
    if (n > 0) {
      result += ones[n] + " ";
    }
    return result;
  };

  let result = "";
  let thousandIndex = 0;

  while (num > 0) {
    if (num % 1000 !== 0) {
      result =
        convertHundreds(num % 1000) + thousands[thousandIndex] + " " + result;
    }
    num = Math.floor(num / 1000);
    thousandIndex++;
  }

  return result.trim();
};

export default function ManageInvoice() {
  const [invoices, setInvoices] = useState<InvoiceWithRelations[]>([]);
  const [customers, setCustomers] = useState<CustomerWithCompany[]>([]);
  const [items, setItems] = useState<StockItemWithRelations[]>([]);
  const [companies, setCompanies] = useState<CompanyWithCustomers[]>([]);
  const [isConsolidatedMode, setIsConsolidatedMode] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyWithCustomers | null>(null);
  const [companyCustomers, setCompanyCustomers] = useState<CustomerWithCompany[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const { updateBalance, addTransaction } = useAccount();

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [invoicesRes, customersRes, itemsRes, companiesRes] = await Promise.all([
          axios.get('/api/invoices'),
          axios.get('/api/customers'),
          axios.get('/api/stock-items'),
          axios.get('/api/companies')
        ]);

        setInvoices(invoicesRes.data.invoices);
        setCustomers(customersRes.data.customers);
        setItems(itemsRes.data.stockItems);
        
        // Process companies to include their customers
        const companiesWithCustomers = companiesRes.data.map((company: Company) => ({
          ...company,
          customers: customersRes.data.filter((customer: CustomerWithCompany) => 
            customer.company_id === company.id
          )
        }));
        setCompanies(companiesWithCustomers);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer.billing_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoice_stock_item.find((item) =>
        item.item.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      (invoice.customer.company && invoice.customer.company.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      invoice.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.payment_method.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [viewInvoice, setViewInvoice] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [pendingInvoice, setPendingInvoice] = useState<any>(null);

  const [createForm, setCreateForm] = useState({
    customerName: "",
    billingName: "",
    item: "",
    paidAmount: "",
    startDate: new Date().toISOString().split("T")[0],
    expireDate: "",
    invoiceItems: [],
    selectedCustomer: "",
    isConsolidated: false,
    pricing: 0,
  });

  const [paymentForm, setPaymentForm] = useState({
    paymentMethod: "",
    paidAmount: "",
  });

  const getUniqueCompanies = () => {
    return companies;
  };

  const handleCompanySelect = (companyId: string) => {
    const companyIdNum = parseInt(companyId);
    const company = companies.find(comp => comp.id === companyIdNum) || null;
    const companyCustomersList = company ? company.customers : [];
    
    setSelectedCompany(company);
    setCompanyCustomers(companyCustomersList);
    setCreateForm((prev) => ({
      ...prev,
      billingName: company?.name || "",
      isConsolidated: true,
      customerName: "",
      selectedCustomer: "",
    }));
  };

  const handleAddConsolidatedItem = () => {
    if (!createForm.selectedCustomer || !createForm.item) {
      alert("Please select a customer and item");
      return;
    }

    const selectedCustomer = customers.find(
      (c) => c.id === Number.parseInt(createForm.selectedCustomer)
    );
    const selectedItem = items.find(
      (item) => item.id === Number.parseInt(createForm.item)
    );

    if (!selectedCustomer || !selectedItem) {
      alert("Selected customer or item not found");
      return;
    }

    const paidAmount = Number.parseFloat(createForm.paidAmount) || 0;
    const newItem = {
      id: Date.now(),
      customerName: selectedCustomer.name,
      name: selectedItem.name,
      amountToPay: selectedItem.product.net_price || selectedItem.product.price,
      paidAmount: paidAmount,
      duration: selectedItem.product.duration?.toString() || "N/A",
      type: selectedItem.product.product_type?.name || "product",
    };

    setCreateForm((prev: any) => ({
      ...prev,
      invoiceItems: [...prev.invoiceItems, newItem],
      item: "",
      paidAmount: "",
    }));
  };

  const handleViewInvoice = (invoice: InvoiceWithRelations) => {
    const items = invoice.invoice_stock_item.map((item, index) => ({
      no: index + 1,
      description: item.item.name,
      qty: item.qty,
      unitPrice: Number(item.item.product.net_price || item.item.product.price),
      priceExclVat: Number(item.item.product.net_price || item.item.product.price) / 1.18,
      vat: Number(item.item.product.net_price || item.item.product.price) - (Number(item.item.product.net_price || item.item.product.price) / 1.18),
      totalIncl: Number(item.item.product.net_price || item.item.product.price) * item.qty,
    }));

    const totalExcl = items.reduce((sum, item) => sum + item.priceExclVat * item.qty, 0);
    const tax = items.reduce((sum, item) => sum + item.vat * item.qty, 0);
    const totalIncl = items.reduce((sum, item) => sum + item.totalIncl, 0);

    const invoiceData = {
      invoiceNo: invoice.id.toString(),
      date: invoice.created_at?.toString().split('T')[0] || new Date().toISOString().split('T')[0],
      startingDate: invoice.start_date.toString().split('T')[0],
      expiredDate: invoice.end_date.toString().split('T')[0],
      currency: "RWF",
      billTo: invoice.customer.billing_name || invoice.customer.name,
      items: items,
      totalExcl: Math.round(totalExcl * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      subTotal: Math.round(totalIncl * 100) / 100,
      discount: 0,
      totalIncl: Math.round(totalIncl * 100) / 100,
      paidAmountInLetters: convertNumberToWords(Math.floor(totalIncl)) + " Rwandan Francs",
    };

    setViewInvoice(invoiceData);
    setIsViewDialogOpen(true);
  };

  const handleAddItem = () => {
    if (!createForm.item) {
      alert("Please select an item");
      return;
    }

    const selectedItem = items.find(
      (item) => item.id === Number.parseInt(createForm.item)
    );
    if (!selectedItem) {
      alert("Selected item not found");
      return;
    }

    const paidAmount = Number.parseFloat(createForm.paidAmount) || 0;
    const newItem = {
      id: Date.now(),
      name: selectedItem.name,
      amountToPay: selectedItem.product.net_price || selectedItem.product.price,
      paidAmount: paidAmount,
      duration: selectedItem.product.duration?.toString() || "N/A",
      type: selectedItem.product.product_type?.name || "product",
    };

    setCreateForm((prev:any) => ({
      ...prev,
      invoiceItems: [...prev.invoiceItems, newItem],
      item: "",
      paidAmount: "",
    }));
  };

  const handleRemoveItem = (itemId: number) => {
    setCreateForm((prev) => ({
      ...prev,
      invoiceItems: prev.invoiceItems.filter((item: any) => item.id !== itemId),
    }));
  };

  const handleCreateInvoice = async () => {
    if (createForm.isConsolidated) {
      if (!selectedCompany || createForm.invoiceItems.length === 0) {
        alert("Please select a company and add at least one item");
        return;
      }
    } else {
      if (
        !createForm.customerName ||
        !createForm.billingName ||
        createForm.invoiceItems.length === 0
      ) {
        alert("Please fill in all required fields and add at least one item");
        return;
      }
    }

    // Calculate total amount
    const totalAmount = createForm.invoiceItems.reduce(
      (sum: number, item: any) => sum + item.amountToPay,
      0
    );
    const totalPaid = createForm.invoiceItems.reduce(
      (sum: number, item: any) => sum + item.paidAmount,
      0
    );

    // Create invoice data for API
    const invoiceData = {
      customer_id: createForm.isConsolidated 
        ? Number.parseInt(createForm.selectedCustomer) 
        : Number.parseInt(createForm.customerName),
      amount_paid: totalPaid,
      amount_to_pay: totalAmount,
      start_date: new Date(createForm.startDate),
      end_date: new Date(createForm.expireDate),
      status: totalPaid === 0 ? "unpaid" : totalPaid >= totalAmount ? "paid" : "partial",
      payment_method: "", // Will be set in payment dialog
      invoice_stock_items: createForm.invoiceItems.map((item: any, index: number) => ({
        item_id: items.find(i => i.name === item.name)?.id || 0,
        qty: 1,
        user_id: 1 // Replace with actual user ID from context
      }))
    };

    try {
      // Create invoice via API
      const response = await axios.post('/api/invoices', invoiceData);
      const newInvoice = response.data;

      // Set as pending invoice for payment processing
      setPendingInvoice({
        ...newInvoice,
        customerName: createForm.isConsolidated 
          ? customers.find(c => c.id === Number.parseInt(createForm.selectedCustomer))?.name || ""
          : customers.find(c => c.id === Number.parseInt(createForm.customerName))?.name || "",
        billingName: createForm.billingName,
        productType: createForm.invoiceItems.map((item: any) => item.name).join(", "),
        amountToPay: totalAmount.toString(),
        paidAmount: totalPaid.toString(),
        remainedAmount: (totalAmount - totalPaid).toString(),
        startedDate: createForm.startDate,
        expiredDate: createForm.expireDate,
        isConsolidated: createForm.isConsolidated,
      });

      setPaymentForm({ 
        paymentMethod: "", 
        paidAmount: totalPaid.toString() 
      });
      setIsCreateDialogOpen(false);
      setIsPaymentDialogOpen(true);
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Failed to create invoice');
    }
  };

  const handleFinalizeInvoice = async () => {
    if (!paymentForm.paymentMethod) {
      alert("Please select a payment method");
      return;
    }

    try {
      // Update invoice with payment method and final amount
      const response = await axios.put(`/api/invoices/${pendingInvoice.id}`, {
        payment_method: paymentForm.paymentMethod,
        amount_paid: Number.parseFloat(paymentForm.paidAmount),
        status: Number.parseFloat(paymentForm.paidAmount) === 0
          ? "unpaid"
          : Number.parseFloat(paymentForm.paidAmount) >= Number.parseFloat(pendingInvoice.amountToPay)
          ? "paid"
          : "partial"
      });

      const updatedInvoice = response.data;

      // Update local state
      setInvoices((prev) => [...prev, updatedInvoice]);

      // Update account balance if payment was made
      const paidAmount = Number.parseFloat(paymentForm.paidAmount);
      if (paidAmount > 0) {
        updateBalance(paidAmount);
        addTransaction({
          type: "payment",
          amount: paidAmount,
          description: `Payment received for Invoice #${pendingInvoice.id} - ${pendingInvoice.customerName}`,
          invoiceId: pendingInvoice.id,
          paymentMethod: paymentForm.paymentMethod,
        });
      }

      setIsPaymentDialogOpen(false);
      setPendingInvoice(null);
      setCreateForm({
        customerName: "",
        billingName: "",
        item: "",
        pricing:0,
        paidAmount: "",
        startDate: new Date().toISOString().split("T")[0],
        expireDate: "",
        invoiceItems: [],
        selectedCustomer: "",
        isConsolidated: false,
      });
    } catch (error) {
      console.error('Error finalizing invoice:', error);
      alert('Failed to finalize invoice');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "partial":
        return "bg-yellow-100 text-yellow-800";
      case "unpaid":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(
      (c) => c.id === Number.parseInt(customerId)
    );
    setCreateForm((prev) => ({
      ...prev,
      customerName: customerId,
      billingName: customer?.billing_name || customer?.name || "",
    }));
  };

  const handleItemChange = (itemId: string) => {
    const selectedItem = items.find(
      (item) => item.id === Number.parseInt(itemId)
    );
    setCreateForm((prev:any) => ({
      ...prev,
      item: itemId,
      pricing: selectedItem ? (selectedItem.product.net_price || selectedItem.product.price).toString() : "",
    }));
  };

  const handleStartDateChange = (date: string) => {
    setCreateForm((prev) => ({
      ...prev,
      startDate: date,
    }));
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Manage Invoice
          </h1>
          <nav className="text-sm text-gray-500 mt-1">
            <span>Home</span> / <span>Invoice</span> /{" "}
            <span>Manage Invoice</span>
          </nav>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <FileText className="mr-2 h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>View Invoice Info</CardTitle>
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
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Customer-Name</TableHead>
                  <TableHead>Billing-Name</TableHead>
                  <TableHead>Product-Type</TableHead>
                  <TableHead>Payment-Method</TableHead>
                  <TableHead>Amount-To-Pay</TableHead>
                  <TableHead>Paid-Amount</TableHead>
                  <TableHead>Remained-Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started-Date</TableHead>
                  <TableHead>Expired-Date</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice, index) => (
                  <TableRow key={invoice.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="min-w-[150px]">
                      {invoice.customer.name}
                    </TableCell>
                    <TableCell className="min-w-[150px]">
                      {invoice.customer.billing_name}
                    </TableCell>
                    <TableCell className="min-w-[200px]">
                      {invoice.invoice_stock_item.map(item => item.item.name).join(", ")}
                    </TableCell>
                    <TableCell>{invoice.payment_method}</TableCell>
                    <TableCell>{invoice.amount_to_pay.toString()}</TableCell>
                    <TableCell>{invoice.amount_paid.toString()}</TableCell>
                    <TableCell>{(invoice.amount_to_pay.toNumber() - invoice.amount_paid.toNumber()).toString()}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{invoice.start_date.toString().split('T')[0]}</TableCell>
                    <TableCell>{invoice.end_date.toString().split('T')[0]}</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          className="bg-blue-500 hover:bg-blue-600 p-1"
                          onClick={() => handleViewInvoice(invoice)}
                          title="View Invoice"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          className="bg-cyan-500 hover:bg-cyan-600 p-1"
                          title="Edit Invoice"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 p-1"
                          title="Renew Invoice"
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="p-1"
                          title="Delete Invoice"
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
        </CardContent>
      </Card>

      {/* Create Invoice Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Invoice Type Selection */}
            <div className="flex gap-4 p-4 border rounded">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="invoiceType"
                  checked={!createForm.isConsolidated}
                  onChange={() =>
                    setCreateForm((prev) => ({
                      ...prev,
                      isConsolidated: false,
                      billingName: "",
                      customerName: "",
                    }))
                  }
                />
                <span>Individual Invoice</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="invoiceType"
                  checked={createForm.isConsolidated}
                  onChange={() =>
                    setCreateForm((prev) => ({
                      ...prev,
                      isConsolidated: true,
                      customerName: "",
                    }))
                  }
                />
                <span>Consolidated Invoice (Same Company)</span>
              </label>
            </div>

            {/* Individual Invoice Fields */}
            {!createForm.isConsolidated && (
              <>
                <div>
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Select
                    value={createForm.customerName}
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
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="billingName">Billing Name</Label>
                  <Input
                    id="billingName"
                    value={createForm.billingName}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        billingName: e.target.value,
                      }))
                    }
                  />
                </div>
              </>
            )}

            {/* Consolidated Invoice Fields */}
            {createForm.isConsolidated && (
              <>
                <div>
                  <Label htmlFor="company">Select Company</Label>
                  <Select
                    value={selectedCompany?.id?.toString() || ""}
                    onValueChange={handleCompanySelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Company" />
                    </SelectTrigger>
                    <SelectContent>
                      {getUniqueCompanies().map((company) => (
                        <SelectItem key={company.id} value={company.id.toString()}>
                          {company.name} ({company.customers.length} customers)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCompany && (
                  <div>
                    <Label htmlFor="selectedCustomer">
                      Select Customer from {selectedCompany.name}
                    </Label>
                    <Select
                      value={createForm.selectedCustomer}
                      onValueChange={(value) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          selectedCustomer: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {companyCustomers.map((customer) => (
                          <SelectItem
                            key={customer.id}
                            value={customer.id.toString()}
                          >
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}

            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={createForm.startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="item">Item</Label>
              <Select
                value={createForm.item}
                onValueChange={handleItemChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Item" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id.toString()}>
                      {item.name} - {item.product.net_price.toNumber() || item.product.price.toNumber()} RWF
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="pricing">Pricing</Label>
              <Input
                id="pricing"
                type="number"
                value={createForm.pricing }
                readOnly
                className="bg-gray-50"
              />
            </div>

            <div>
              <Label htmlFor="paidAmount">Paid Amount</Label>
              <Input
                id="paidAmount"
                type="number"
                value={createForm.paidAmount}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    paidAmount: e.target.value,
                  }))
                }
              />
            </div>

            <Button
              onClick={
                createForm.isConsolidated
                  ? handleAddConsolidatedItem
                  : handleAddItem
              }
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>

            {/* Items Table */}
            {createForm.invoiceItems.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Items</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {createForm.isConsolidated && (
                        <TableHead>Customer</TableHead>
                      )}
                      <TableHead>Items</TableHead>
                      <TableHead>Amount To Pay</TableHead>
                      <TableHead>Paid Amount</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {createForm.invoiceItems.map((item: any) => (
                      <TableRow key={item.id}>
                        {createForm.isConsolidated && (
                          <TableCell className="font-medium">
                            {item.customerName}
                          </TableCell>
                        )}
                        <TableCell>{item.name}</TableCell>
                        <TableCell>
                          {item.amountToPay.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {item.paidAmount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              item.type === "service" ? "default" : "secondary"
                            }
                          >
                            {item.duration}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <Trash className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="mt-4 p-3 bg-blue-50 rounded">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p>
                        <strong>Total Amount:</strong>{" "}
                        {createForm.invoiceItems
                          .reduce((sum: number, item: any) => sum + item.amountToPay, 0)
                          .toLocaleString()}{" "}
                        RWF
                      </p>
                      <p>
                        <strong>Total Paid:</strong>{" "}
                        {createForm.invoiceItems
                          .reduce((sum: number, item: any) => sum + item.paidAmount, 0)
                          .toLocaleString()}{" "}
                        RWF
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    *{" "}
                    {createForm.isConsolidated
                      ? "Consolidated invoice for multiple customers under same company"
                      : "Individual customer invoice"}
                  </p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={handleCreateInvoice}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Create Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Method Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              Select payment method and confirm payment amount
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={paymentForm.paymentMethod}
                onValueChange={(value) =>
                  setPaymentForm((prev) => ({ ...prev, paymentMethod: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                  <SelectItem value="Bank">Bank Transfer</SelectItem>
                  <SelectItem value="Card">Credit/Debit Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="finalPaidAmount">Paid Amount</Label>
              <Input
                id="finalPaidAmount"
                type="number"
                value={paymentForm.paidAmount}
                onChange={(e) =>
                  setPaymentForm((prev) => ({
                    ...prev,
                    paidAmount: e.target.value,
                  }))
                }
              />
            </div>
            {pendingInvoice && (
              <div className="bg-gray-50 p-3 rounded">
                <p>
                  <strong>Total Amount:</strong> {pendingInvoice.amountToPay}
                </p>
                <p>
                  <strong>Paid Amount:</strong> {paymentForm.paidAmount}
                </p>
                <p>
                  <strong>Remaining:</strong>{" "}
                  {(
                    Number.parseFloat(pendingInvoice.amountToPay) -
                    Number.parseFloat(paymentForm.paidAmount || "0")
                  ).toFixed(2)}
                </p>
                <p>
                  <strong>Service Period:</strong> {pendingInvoice.startedDate}{" "}
                  to {pendingInvoice.expiredDate}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPaymentDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFinalizeInvoice}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Finalize Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Invoice Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
            <DialogDescription>
              Professional NETPRO invoice format
            </DialogDescription>
          </DialogHeader>
          {viewInvoice && <InvoiceTemplate invoiceData={viewInvoice} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}