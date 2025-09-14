"use client";

import { useState } from "react";
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

interface StockItemWithRelations extends StockItem{

  product: ProductWithPackageAndType;
  supplier: Supplier;
}
interface CustomerWithCompany extends Customer {
  company: Company;
}
interface ProductWithPackageAndType extends Product {
  package: Package;
  product_type: ProductType;
}
interface InvoiceStockItemWithProduct extends InvoiceStockItem {
  product: ProductWithPackageAndType;
}
interface InvoiceWithRelations extends Invoice {
  customer: CustomerWithCompany;
  invoice_stock_item: InvoiceStockItemWithProduct[];

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

// Helper function to calculate expiry date
const calculateExpiryDate = (startDate: string, duration: string): string => {
  if (!startDate || !duration) return "";

  const start = new Date(startDate);
  const durationMatch = duration.match(/(\d+)\s*(day|month|year)s?/i);

  if (!durationMatch) return "";

  const amount = Number.parseInt(durationMatch[1]);
  const unit = durationMatch[2].toLowerCase();

  switch (unit) {
    case "day":
      start.setDate(start.getDate() + amount);
      break;
    case "month":
      start.setMonth(start.getMonth() + amount);
      break;
    case "year":
      start.setFullYear(start.getFullYear() + amount);
      break;
  }

  return start.toISOString().split("T")[0];
};

export default function ManageInvoice() {
  const [invoices, setInvoices] = useState<InvoiceWithRelations[]>([]);

  const [customers, setCustomers] = useState<CustomerWithCompany[]>([]);
 
  const [items, setItems] = useState<Sto>([]);

  const [isConsolidatedMode, setIsConsolidatedMode] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [companyCustomers, setCompanyCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const { updateBalance, addTransaction } = useAccount();

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.billingName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.productType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get products filtered by selected package
  const getFilteredProducts = () => {
    if (!createForm.package) return [];
    return products.filter(
      (product) => product.packageId === Number.parseInt(createForm.package)
    );
  };

  // Get items filtered by selected product
  const getFilteredItems = () => {
    if (!createForm.product) return [];
    return items.filter(
      (item) => item.productId === Number.parseInt(createForm.product)
    );
  };

  // Get selected item details
  const getSelectedItem = () => {
    if (!createForm.item) return null;
    return items.find((item) => item.id === Number.parseInt(createForm.item));
  };

  const [viewInvoice, setViewInvoice] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [pendingInvoice, setPendingInvoice] = useState(null);

  const [createForm, setCreateForm] = useState({
    customerName: "",
    billingName: "",
    package: "",
    product: "",
    item: "",
    pricing: "",
    paidAmount: "",
    startDate: new Date().toISOString().split("T")[0],
    expireDate: "",
    invoiceItems: [],
    selectedCustomer: "", // For consolidated invoices
    isConsolidated: false,
  });

  const [paymentForm, setPaymentForm] = useState({
    paymentMethod: "",
    paidAmount: "",
  });

  const getUniqueCompanies = () => {
    const companies = [...new Set(customers.map((c) => c.billingName))];
    return companies.map((company) => ({
      name: company,
      customers: customers.filter((c) => c.billingName === company),
    }));
  };

  const handleCompanySelect = (companyName) => {
    const companyCustomersList = customers.filter(
      (c) => c.billingName === companyName
    );
    setSelectedCompany(companyName);
    setCompanyCustomers(companyCustomersList);
    setCreateForm((prev) => ({
      ...prev,
      billingName: companyName,
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
    const selectedItem = getSelectedItem();

    if (!selectedCustomer || !selectedItem) {
      alert("Selected customer or item not found");
      return;
    }

    const paidAmount = Number.parseFloat(createForm.paidAmount) || 0;
    const newItem = {
      id: Date.now(),
      customerName: selectedCustomer.name,
      name: selectedItem.name,
      amountToPay: selectedItem.price,
      paidAmount: paidAmount,
      duration: selectedItem.duration,
      type: selectedItem.type,
    };

    setCreateForm((prev) => ({
      ...prev,
      invoiceItems: [...prev.invoiceItems, newItem],
      selectedCustomer: "",
      item: "",
      pricing: "",
      paidAmount: "",
      package: "",
      product: "",
    }));
  };

  const handleViewInvoice = (invoice) => {
    let items = [];

    if (invoice.id === 58) {
      items = [
        {
          no: 1,
          description: "120Mbps",
          qty: 1,
          unitPrice: 40000.0,
          priceExclVat: 33898.31,
          vat: 6101.69,
          totalIncl: 40000.0,
          customerName: "Hakizimana Yves",
        },
        {
          no: 2,
          description: "Galaxy S21",
          qty: 1,
          unitPrice: 1000.0,
          priceExclVat: 847.46,
          vat: 152.54,
          totalIncl: 1000.0,
          customerName: "Hakizimana Yves",
        },
        {
          no: 3,
          description: "B315-22s",
          qty: 1,
          unitPrice: 85000.0,
          priceExclVat: 72033.9,
          vat: 12966.1,
          totalIncl: 85000.0,
          customerName: "Hakizimana Yves",
        },
      ];
    } else {
      // Check if this is a consolidated invoice
      const isConsolidated =
        invoice.isConsolidated || invoice.customerName.includes(",");

      if (isConsolidated && invoice.productType.includes(":")) {
        // Handle new consolidated invoice format with "Customer: Product" format
        const productEntries = invoice.productType.split(", ");
        const totalAmount = Number.parseFloat(invoice.amountToPay);

        items = productEntries.map((entry, index) => {
          const [customerName, productName] = entry.split(": ");
          const itemAmount = totalAmount / productEntries.length; // Distribute evenly for demo

          return {
            no: index + 1,
            description: productName.trim(),
            qty: 1,
            unitPrice: itemAmount,
            priceExclVat: itemAmount / 1.18,
            vat: itemAmount - itemAmount / 1.18,
            totalIncl: itemAmount,
            customerName: customerName.trim(),
          };
        });
      } else if (isConsolidated) {
        // Handle old consolidated invoice format
        const customers = invoice.customerName.split(", ");
        const products = invoice.productType.split(", ");
        const totalAmount = Number.parseFloat(invoice.amountToPay);

        items = products.map((product, index) => {
          const itemAmount = totalAmount / products.length;
          return {
            no: index + 1,
            description: product.trim(),
            qty: 1,
            unitPrice: itemAmount,
            priceExclVat: itemAmount / 1.18,
            vat: itemAmount - itemAmount / 1.18,
            totalIncl: itemAmount,
            customerName: customers[index] || customers[0],
          };
        });
      } else {
        // Single customer invoice - NO customerName field
        const totalAmount = Number.parseFloat(invoice.amountToPay);
        items = [
          {
            no: 1,
            description: invoice.productType,
            qty: 1,
            unitPrice: totalAmount,
            priceExclVat: totalAmount / 1.18,
            vat: totalAmount - totalAmount / 1.18,
            totalIncl: totalAmount,
            // No customerName for individual invoices
          },
        ];
      }
    }

    const totalExcl = items.reduce((sum, item) => sum + item.priceExclVat, 0);
    const tax = items.reduce((sum, item) => sum + item.vat, 0);
    const totalIncl = items.reduce((sum, item) => sum + item.totalIncl, 0);

    const invoiceData = {
      invoiceNo: invoice.id.toString(),
      date: "2025-06-03",
      startingDate: invoice.startedDate,
      expiredDate: invoice.expiredDate,
      currency: "RWF",
      billTo: invoice.billingName, // Always bill to company name
      items: items,
      totalExcl: Math.round(totalExcl * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      subTotal: Math.round(totalIncl * 100) / 100,
      discount: 0,
      totalIncl: Math.round(totalIncl * 100) / 100,
      paidAmountInLetters:
        convertNumberToWords(Math.floor(totalIncl)) + " Rwandan Francs",
    };

    setViewInvoice(invoiceData);
    setIsViewDialogOpen(true);
  };

  const handleAddItem = () => {
    if (!createForm.item) {
      alert("Please select an item");
      return;
    }

    const selectedItem = getSelectedItem();
    if (!selectedItem) {
      alert("Selected item not found");
      return;
    }

    const paidAmount = Number.parseFloat(createForm.paidAmount) || 0;
    const newItem = {
      id: Date.now(),
      name: selectedItem.name,
      amountToPay: selectedItem.price,
      paidAmount: paidAmount,
      duration: selectedItem.duration,
      type: selectedItem.type,
    };

    setCreateForm((prev) => ({
      ...prev,
      invoiceItems: [...prev.invoiceItems, newItem],
      item: "",
      pricing: "",
      paidAmount: "",
    }));
  };

  const handleRemoveItem = (itemId) => {
    setCreateForm((prev) => ({
      ...prev,
      invoiceItems: prev.invoiceItems.filter((item) => item.id !== itemId),
    }));
  };

  const handleCreateInvoice = () => {
    if (createForm.isConsolidated) {
      // For consolidated invoices, check if we have items and billing name
      if (!createForm.billingName || createForm.invoiceItems.length === 0) {
        alert("Please select a company and add at least one item");
        return;
      }
    } else {
      // For individual invoices, check normal fields
      if (
        !createForm.customerName ||
        !createForm.billingName ||
        createForm.invoiceItems.length === 0
      ) {
        alert("Please fill in all required fields and add at least one item");
        return;
      }
    }

    // Calculate expiry date based on service items (ignore hardware items)
    const serviceItems = createForm.invoiceItems.filter(
      (item) => item.type === "service"
    );
    let calculatedExpiryDate = createForm.startDate;

    if (serviceItems.length > 0) {
      // Use the longest duration among service items
      const durations = serviceItems.map((item) => {
        const match = item.duration.match(/(\d+)\s*(day|month|year)s?/i);
        if (!match) return 0;
        const amount = Number.parseInt(match[1]);
        const unit = match[2].toLowerCase();

        // Convert to days for comparison
        switch (unit) {
          case "day":
            return amount;
          case "month":
            return amount * 30;
          case "year":
            return amount * 365;
          default:
            return 0;
        }
      });

      const maxDurationInDays = Math.max(...durations);
      const expiryDate = new Date(createForm.startDate);
      expiryDate.setDate(expiryDate.getDate() + maxDurationInDays);
      calculatedExpiryDate = expiryDate.toISOString().split("T")[0];
    }

    const totalAmount = createForm.invoiceItems.reduce(
      (sum, item) => sum + item.amountToPay,
      0
    );
    const totalPaid = createForm.invoiceItems.reduce(
      (sum, item) => sum + item.paidAmount,
      0
    );

    // Handle customer name differently for consolidated vs individual invoices
    let customerName = "";
    let productType = "";

    if (createForm.isConsolidated) {
      // For consolidated invoices, list all customers
      const uniqueCustomers = [
        ...new Set(createForm.invoiceItems.map((item) => item.customerName)),
      ];
      customerName = uniqueCustomers.join(", ");
      productType = createForm.invoiceItems
        .map((item) => `${item.customerName}: ${item.name}`)
        .join(", ");
    } else {
      // For individual invoices, use the selected customer
      customerName =
        customers.find((c) => c.id === Number.parseInt(createForm.customerName))
          ?.name || "";
      productType = createForm.invoiceItems.map((item) => item.name).join(", ");
    }

    const newInvoice = {
      id: Date.now(),
      customerName: customerName,
      billingName: createForm.billingName,
      productType: productType,
      paymentMethod: "",
      amountToPay: totalAmount.toString(),
      paidAmount: totalPaid.toString(),
      remainedAmount: (totalAmount - totalPaid).toString(),
      startedDate: createForm.startDate,
      expiredDate: calculatedExpiryDate,
      status:
        totalPaid === 0
          ? "unpaid"
          : totalPaid >= totalAmount
          ? "paid"
          : "partial",
      isConsolidated: createForm.isConsolidated, // Add flag to track consolidated invoices
    };

    setPendingInvoice(newInvoice);
    setPaymentForm({ paymentMethod: "", paidAmount: totalPaid.toString() });
    setIsCreateDialogOpen(false);
    setIsPaymentDialogOpen(true);
  };

  const handleFinalizeInvoice = () => {
    if (!paymentForm.paymentMethod) {
      alert("Please select a payment method");
      return;
    }

    const finalInvoice = {
      ...pendingInvoice,
      paymentMethod: paymentForm.paymentMethod,
      paidAmount: paymentForm.paidAmount,
      remainedAmount: (
        Number.parseFloat(pendingInvoice.amountToPay) -
        Number.parseFloat(paymentForm.paidAmount)
      ).toString(),
    };

    const paidAmount = Number.parseFloat(paymentForm.paidAmount);
    const totalAmount = Number.parseFloat(pendingInvoice.amountToPay);

    finalInvoice.status =
      paidAmount === 0
        ? "unpaid"
        : paidAmount >= totalAmount
        ? "paid"
        : "partial";

    // Update account balance and add transaction
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

    setInvoices((prev) => [...prev, finalInvoice]);
    setIsPaymentDialogOpen(false);
    setPendingInvoice(null);
    setCreateForm({
      customerName: "",
      billingName: "",
      package: "",
      product: "",
      item: "",
      pricing: "",
      paidAmount: "",
      startDate: new Date().toISOString().split("T")[0],
      expireDate: "",
      invoiceItems: [],
      selectedCustomer: "",
      isConsolidated: false,
    });
  };

  const getStatusColor = (status) => {
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

  const handleCustomerChange = (customerId) => {
    const customer = customers.find(
      (c) => c.id === Number.parseInt(customerId)
    );
    setCreateForm((prev) => ({
      ...prev,
      customerName: customerId,
      billingName: customer?.billingName || "",
    }));
  };

  const handlePackageChange = (packageId) => {
    setCreateForm((prev) => ({
      ...prev,
      package: packageId,
      product: "", // Reset product when package changes
      item: "", // Reset item when package changes
      pricing: "",
    }));
  };

  const handleProductChange = (productId) => {
    setCreateForm((prev) => ({
      ...prev,
      product: productId,
      item: "", // Reset item when product changes
      pricing: "",
    }));
  };

  const handleItemChange = (itemId) => {
    const selectedItem = items.find(
      (item) => item.id === Number.parseInt(itemId)
    );
    setCreateForm((prev) => ({
      ...prev,
      item: itemId,
      pricing: selectedItem ? selectedItem.price.toString() : "",
    }));
  };

  const handleStartDateChange = (date) => {
    setCreateForm((prev) => ({
      ...prev,
      startDate: date,
    }));
  };

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
                      {invoice.customerName}
                    </TableCell>
                    <TableCell className="min-w-[150px]">
                      {invoice.billingName}
                    </TableCell>
                    <TableCell className="min-w-[200px]">
                      {invoice.productType}
                    </TableCell>
                    <TableCell>{invoice.paymentMethod}</TableCell>
                    <TableCell>{invoice.amountToPay}</TableCell>
                    <TableCell>{invoice.paidAmount}</TableCell>
                    <TableCell>{invoice.remainedAmount}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{invoice.startedDate}</TableCell>
                    <TableCell>{invoice.expiredDate}</TableCell>
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
                    value={selectedCompany}
                    onValueChange={handleCompanySelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Company" />
                    </SelectTrigger>
                    <SelectContent>
                      {getUniqueCompanies().map((company) => (
                        <SelectItem key={company.name} value={company.name}>
                          {company.name} ({company.customers.length} customers)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCompany && (
                  <div>
                    <Label htmlFor="selectedCustomer">
                      Select Customer from {selectedCompany}
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
              <Label htmlFor="package">Package</Label>
              <Select
                value={createForm.package}
                onValueChange={handlePackageChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Package" />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id.toString()}>
                      {pkg.name} {pkg.type === "hardware" && "(Hardware)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="product">Product</Label>
              <Select
                value={createForm.product}
                onValueChange={handleProductChange}
                disabled={!createForm.package}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Product" />
                </SelectTrigger>
                <SelectContent>
                  {getFilteredProducts().map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="item">Item</Label>
              <Select
                value={createForm.item}
                onValueChange={handleItemChange}
                disabled={!createForm.product}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Item" />
                </SelectTrigger>
                <SelectContent>
                  {getFilteredItems().map((item) => (
                    <SelectItem key={item.id} value={item.id.toString()}>
                      {item.name} - {item.price.toLocaleString()} RWF
                      {item.duration !== "lifetime" && ` (${item.duration})`}
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
                value={createForm.pricing}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    pricing: e.target.value,
                  }))
                }
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
                    {createForm.invoiceItems.map((item) => (
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

                {/* Show totals and expiry calculation */}
                <div className="mt-4 p-3 bg-blue-50 rounded">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p>
                        <strong>Total Amount:</strong>{" "}
                        {createForm.invoiceItems
                          .reduce((sum, item) => sum + item.amountToPay, 0)
                          .toLocaleString()}{" "}
                        RWF
                      </p>
                      <p>
                        <strong>Total Paid:</strong>{" "}
                        {createForm.invoiceItems
                          .reduce((sum, item) => sum + item.paidAmount, 0)
                          .toLocaleString()}{" "}
                        RWF
                      </p>
                    </div>
                    <div>
                      <p>
                        <strong>Calculated Expiry Date:</strong>{" "}
                        {(() => {
                          const serviceItems = createForm.invoiceItems.filter(
                            (item) => item.type === "service"
                          );
                          if (serviceItems.length === 0)
                            return "No service items (Hardware only)";

                          const durations = serviceItems.map((item) => {
                            const match = item.duration.match(
                              /(\d+)\s*(day|month|year)s?/i
                            );
                            if (!match) return 0;
                            const amount = Number.parseInt(match[1]);
                            const unit = match[2].toLowerCase();

                            switch (unit) {
                              case "day":
                                return amount;
                              case "month":
                                return amount * 30;
                              case "year":
                                return amount * 365;
                              default:
                                return 0;
                            }
                          });

                          const maxDurationInDays = Math.max(...durations);
                          const expiryDate = new Date(createForm.startDate);
                          expiryDate.setDate(
                            expiryDate.getDate() + maxDurationInDays
                          );
                          return expiryDate.toISOString().split("T")[0];
                        })()}
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
