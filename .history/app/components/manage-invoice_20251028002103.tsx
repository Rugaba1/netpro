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
  X,
  ChevronDown,
  ChevronUp,
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
import { Checkbox } from "@/components/ui/checkbox";
import InvoiceTemplate from "./invoice-template";
import { useAccount } from "@/lib/account-context";
import {
  invoice_item as InvoiceStockItem,
  Renamedpackage as Package,
  product_type as ProductType,
  customer as Customer,
  company as Company,
  product as Product,
  stock_item as StockItem,
  supplier as Supplier,
  master_invoice as Invoice,
} from "@/lib/generated/prisma";
import axios from "axios";
import { formatCurrency } from "@/lib/utils";

interface StockItemWithRelations extends StockItem {
  product: ProductWithPackageAndType;
  supplier: Supplier;
}

interface CustomerWithCompany extends Customer {
  company: Company | null;
}

interface InvoiceStockItemWithProduct extends InvoiceStockItem {
  item: StockItemWithRelations;
  customer: Customer;
}
interface ProductWithPackageAndType extends Product {
  package: Package;
  product_type: ProductType;
}

interface CompanyWithCustomers extends Company {
  customers: CustomerWithCompany[];
}

interface ConsolidatedCustomer {
  id: number;
  name: string;
  billingName: string;
  items: ConsolidatedItem[];
}

interface ConsolidatedItem {
  id: number;
  name: string;
  amountToPay: number;
  paidAmount: number;
  duration: string;
  type: string;
}

// Replace the existing interfaces with these new ones

interface InvoiceWithRelations extends Invoice {
  customer?: CustomerWithCompany;
  company?: Company;
  invoice_items: InvoiceStockItemWithProduct[];
  master_invoice?: Invoice;
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
  const [selectedCompany, setSelectedCompany] =
    useState<CompanyWithCustomers | null>(null);
  const [companyCustomers, setCompanyCustomers] = useState<
    CustomerWithCompany[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCustomers, setExpandedCustomers] = useState<number[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
  const [consolidatedCustomers, setConsolidatedCustomers] = useState<
    ConsolidatedCustomer[]
  >([]);

  const { updateBalance, addTransaction } = useAccount();

  // Fetch data from API
  useEffect(() => {
    fetchInvoices();
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [customersRes, itemsRes, companiesRes] =
          await Promise.all([
            axios.get("/api/customers"),
            axios.get("/api/stock-items"),
            axios.get("/api/companies"),
          ]);

        setCustomers(customersRes.data.customers);
        setItems(itemsRes.data.stockItems);

        const companiesWithCustomers = companiesRes.data.companies.map(
          (company: any) => ({
            ...company,
            customers: company.customer,
          })
        );
        setCompanies(companiesWithCustomers);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await axios.get("/api/invoices");
      setInvoices(response.data.invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }
  };

  const filteredInvoices = invoices.filter(
    (invoice) =>
      (invoice.customer &&
        (invoice.customer?.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
          invoice.customer.billing_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()))) ||
      invoice.invoice_items.find((item) =>
        item.item.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      (invoice.company &&
        invoice.company.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      invoice.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.payment_method.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const [viewInvoice, setViewInvoice] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [pendingInvoice, setPendingInvoice] = useState<any>(null);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceWithRelations | null>(null);
  const [deletingInvoice, setDeletingInvoice] = useState<InvoiceWithRelations | null>(null);
  const [statusInvoice, setStatusInvoice] = useState<InvoiceWithRelations | null>(null);

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

  const [editForm, setEditForm] = useState({
    billingName: "",
    paidAmount: "",
    startDate: "",
    expireDate: "",
    status: "",
    paymentMethod: "",
  });

  const [statusForm, setStatusForm] = useState({
    status: "",
    paymentMethod: "",
    paidAmount: "",
  });

  const [paymentForm, setPaymentForm] = useState({
    paymentMethod: "",
    paidAmount: "",
  });

  const getUniqueCompanies = () => {
    return companies;
  };
  const calculateRemainingDays = (endDate: Date | string): number => {
    const end = typeof endDate === "string" ? new Date(endDate) : endDate;
    const today = new Date();

    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const timeDiff = end.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    return daysDiff;
  };
  const handleCompanySelect = (companyId: string) => {
    const companyIdNum = parseInt(companyId);
    const company = companies.find((comp) => comp.id === companyIdNum) || null;
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

    // Initialize consolidated customers
    const initialConsolidatedCustomers = companyCustomersList.map(
      (customer) => ({
        id: customer.id,
        name: customer.name,
        billingName: customer.billing_name || customer.name,
        items: [],
      })
    );
    setConsolidatedCustomers(initialConsolidatedCustomers);
    setSelectedCustomers(companyCustomersList.map((c) => c.id));
  };

  const toggleCustomerExpansion = (customerId: number) => {
    setExpandedCustomers((prev) =>
      prev.includes(customerId)
        ? prev.filter((id) => id !== customerId)
        : [...prev, customerId]
    );
  };

  const toggleCustomerSelection = (customerId: number) => {
    setSelectedCustomers((prev) =>
      prev.includes(customerId)
        ? prev.filter((id) => id !== customerId)
        : [...prev, customerId]
    );
  };

  const handleAddItemToCustomer = (customerId: number) => {
    const customer = consolidatedCustomers.find((c) => c.id === customerId);
    if (!customer || !createForm.item) {
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

    setConsolidatedCustomers((prev: any) =>
      prev.map((customer: any) =>
        customer.id === customerId
          ? { ...customer, items: [...customer.items, newItem] }
          : customer
      )
    );

    setCreateForm((prev: any) => ({
      ...prev,
      item: "",
      paidAmount: "",
      pricing: 0,
    }));
  };

  const handleRemoveItemFromCustomer = (customerId: number, itemId: number) => {
    setConsolidatedCustomers((prev) =>
      prev.map((customer) =>
        customer.id === customerId
          ? {
              ...customer,
              items: customer.items.filter((item) => item.id !== itemId),
            }
          : customer
      )
    );
  };

  const handleViewInvoice = (invoice: InvoiceWithRelations) => {
    const items = invoice.invoice_items.map((item, index) => ({
      no: index + 1,
      description: item.item.product.name + " (" + item.customer.name + ")",
      qty: item.qty,
      unitPrice: Number(item.item.product.price),
      priceExclVat: Number(item.item.product.price) / 1.18,
      vat:
        Number(item.item.product.price) -
        Number(item.item.product.price) / 1.18,
      totalIncl: Number(item.item.product.price) * item.qty,
    }));

    const totalExcl = items.reduce(
      (sum, item) => sum + item.priceExclVat * item.qty,
      0
    );
    const tax = items.reduce((sum, item) => sum + item.vat * item.qty, 0);
    const totalIncl = items.reduce((sum, item) => sum + item.totalIncl, 0);

    const invoiceData = {
      invoiceNo: invoice.id.toString(),
      date: invoice.start_date.toString().split("T")[0],
      startingDate: invoice.start_date.toString().split("T")[0],
      expiredDate: invoice.end_date.toString().split("T")[0],
      currency: "RWF",
      billTo: invoice?.customer?.billing_name,
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

  const handleEditInvoice = (invoice: InvoiceWithRelations) => {
    setEditingInvoice(invoice);
    setEditForm({
      billingName: invoice.billing_name || "",
      paidAmount: invoice.amount_paid.toString(),
      startDate: new Date(invoice.start_date).toISOString().split("T")[0],
      expireDate: new Date(invoice.end_date).toISOString().split("T")[0],
      status: invoice.status,
      paymentMethod: invoice.payment_method || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateInvoice = async () => {
    if (!editingInvoice) return;

    try {
      const response = await axios.put(`/api/invoices/${editingInvoice.id}`, {
        billing_name: editForm.billingName,
        amount_paid: parseFloat(editForm.paidAmount),
        start_date: new Date(editForm.startDate),
        end_date: new Date(editForm.expireDate),
        status: editForm.status,
        payment_method: editForm.paymentMethod,
      });

      setInvoices(prev => prev.map(inv => 
        inv.id === editingInvoice.id ? response.data : inv
      ));
      
      setIsEditDialogOpen(false);
      setEditingInvoice(null);
      alert("Invoice updated successfully!");
    } catch (error) {
      console.error("Error updating invoice:", error);
      alert("Failed to update invoice");
    }
  };

  const handleDeleteInvoice = (invoice: InvoiceWithRelations) => {
    setDeletingInvoice(invoice);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingInvoice) return;

    try {
      await axios.delete(`/api/invoices/${deletingInvoice.id}`);
      setInvoices(prev => prev.filter(inv => inv.id !== deletingInvoice.id));
      setIsDeleteDialogOpen(false);
      setDeletingInvoice(null);
      alert("Invoice deleted successfully!");
    } catch (error) {
      console.error("Error deleting invoice:", error);
      alert("Failed to delete invoice");
    }
  };

  const handleChangeStatus = (invoice: InvoiceWithRelations) => {
    setStatusInvoice(invoice);
    setStatusForm({
      status: invoice.status,
      paymentMethod: invoice.payment_method || "",
      paidAmount: invoice.amount_paid.toString(),
    });
    setIsStatusDialogOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!statusInvoice) return;

    try {
      const response = await axios.put(`/api/invoices/${statusInvoice.id}`, {
        status: statusForm.status,
        payment_method: statusForm.paymentMethod,
        amount_paid: parseFloat(statusForm.paidAmount),
      });

      setInvoices(prev => prev.map(inv => 
        inv.id === statusInvoice.id ? response.data : inv
      ));
      
      setIsStatusDialogOpen(false);
      setStatusInvoice(null);
      alert("Invoice status updated successfully!");
    } catch (error) {
      console.error("Error updating invoice status:", error);
      alert("Failed to update invoice status");
    }
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

    setCreateForm((prev: any) => ({
      ...prev,
      invoiceItems: [...prev.invoiceItems, newItem],
      item: "",
      paidAmount: "",
      pricing: 0,
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
      const hasItems = consolidatedCustomers.some(
        (customer) =>
          selectedCustomers.includes(customer.id) && customer.items.length > 0
      );

      if (!selectedCompany || !hasItems) {
        alert(
          "Please select a company and add at least one item to at least one customer"
        );
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
    let totalAmount = 0;
    let totalPaid = 0;

    if (createForm.isConsolidated) {
      consolidatedCustomers.forEach((customer) => {
        if (selectedCustomers.includes(customer.id)) {
          customer.items.forEach((item) => {
            totalAmount += item.amountToPay;
            totalPaid += item.paidAmount;
          });
        }
      });
    } else {
      totalAmount = createForm.invoiceItems.reduce(
        (sum: number, item: any) => sum + item.amountToPay,
        0
      );
      totalPaid = createForm.invoiceItems.reduce(
        (sum: number, item: any) => sum + item.paidAmount,
        0
      );
    }

    // Prepare invoice items for API
    const invoice_items = createForm.isConsolidated
      ? consolidatedCustomers.flatMap((customer) =>
          selectedCustomers.includes(customer.id)
            ? customer.items.map((item: any) => {
                const stockItem = items.find((i) => i.name === item.name);
                return {
                  item_id: stockItem?.id || 0,
                  customer_id: customer.id,
                  qty: 1,
                  unit_price: item.amountToPay,
                  total_price: item.amountToPay,
               
                };
              })
            : []
        )
      : createForm.invoiceItems.map((item: any) => {
          const stockItem = items.find((i) => i.name === item.name);
          return {
            item_id: stockItem?.id || 0,
            customer_id: parseInt(createForm.customerName),
            qty: 1,
            unit_price: item.amountToPay,
            total_price: item.amountToPay,
            user_id: 1, // Replace with actual user ID
          };
        });

    // Create invoice data for API
    const invoiceData = {
      is_consolidated: createForm.isConsolidated,
      company_id: createForm.isConsolidated ? selectedCompany?.id : null,
      customer_id: createForm.isConsolidated
        ? null
        : parseInt(createForm.customerName),
      billing_name: createForm.billingName,
      amount_paid: totalPaid,
      amount_to_pay: totalAmount,
      start_date: new Date(createForm.startDate),
      end_date: new Date(createForm.expireDate),
      status:
        totalPaid === 0
          ? "unpaid"
          : totalPaid >= totalAmount
          ? "paid"
          : "partial",
      payment_method: "",
      invoice_items: invoice_items,
    };

    try {
      // Create invoice via API
      const response = await axios.post("/api/invoices", invoiceData);
      const newInvoice = response.data;

      // Set as pending invoice for payment processing
      setPendingInvoice({
        ...newInvoice,
        customerName: createForm.isConsolidated
          ? selectedCompany?.name || ""
          : customers.find(
              (c) => c.id === Number.parseInt(createForm.customerName)
            )?.name || "",
        billingName: createForm.billingName,
        productType: createForm.isConsolidated
          ? consolidatedCustomers
              .flatMap((c) => c.items.map((i) => i.name))
              .join(", ")
          : createForm.invoiceItems.map((item: any) => item.name).join(", "),
        amountToPay: totalAmount.toString(),
        paidAmount: totalPaid.toString(),
        remainedAmount: (totalAmount - totalPaid).toString(),
        startedDate: createForm.startDate,
        expiredDate: createForm.expireDate,
        isConsolidated: createForm.isConsolidated,
      });

      setPaymentForm({
        paymentMethod: "",
        paidAmount: totalPaid.toString(),
      });
      setIsCreateDialogOpen(false);
      setIsPaymentDialogOpen(true);
    } catch (error) {
      console.error("Error creating invoice:", error);
      alert("Failed to create invoice");
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
        status:
          Number.parseFloat(paymentForm.paidAmount) === 0
            ? "unpaid"
            : Number.parseFloat(paymentForm.paidAmount) >=
              Number.parseFloat(pendingInvoice.amount_to_pay)
            ? "paid"
            : "partial",
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
        pricing: 0,
        paidAmount: "",
        startDate: new Date().toISOString().split("T")[0],
        expireDate: "",
        invoiceItems: [],
        selectedCustomer: "",
        isConsolidated: false,
      });
      setConsolidatedCustomers([]);
      setSelectedCustomers([]);
      setExpandedCustomers([]);
    } catch (error) {
      console.error("Error finalizing invoice:", error);
      alert("Failed to finalize invoice");
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
    setCreateForm((prev: any) => ({
      ...prev,
      item: itemId,
      pricing: selectedItem
        ? (
            selectedItem.product.net_price || selectedItem.product.price
          ).toString()
        : "",
    }));
  };

  const handleStartDateChange = (date: string) => {
    setCreateForm((prev) => ({
      ...prev,
      startDate: date,
    }));
  };

  const handleExpireDateChange = (date: string) => {
    setCreateForm((prev) => ({
      ...prev,
      expireDate: date,
    }));
  };

  const calculateConsolidatedTotals = () => {
    let totalAmount = 0;
    let totalPaid = 0;

    consolidatedCustomers.forEach((customer) => {
      if (selectedCustomers.includes(customer.id)) {
        customer.items.forEach((item) => {
          totalAmount += Number(item.amountToPay);
          totalPaid += Number(item.paidAmount);
        });
      }
    });

    return { totalAmount, totalPaid };
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">Loading...</div>
    );
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
                  <TableHead>Remaining Days</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice, index) => {
                   const remainingDays = calculateRemainingDays(invoice.end_date);
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="min-w-[150px]">
                        {invoice.invoice_type === "consolidated"
                          ? invoice.company?.name || "Consolidated"
                          : invoice.customer?.name || "N/A"}
                      </TableCell>
                      <TableCell className="min-w-[150px]">
                        {invoice.billing_name}
                      </TableCell>
                      <TableCell className="min-w-[200px]">
                        {invoice.invoice_items
                          .map((item) => item.item.name)
                          .join(", ")}
                      </TableCell>
                      <TableCell>{invoice.payment_method}</TableCell>
                      <TableCell className="p-1 bg-red-800 rounded-md text-center font-bold">{formatCurrency(Number(invoice.amount_to_pay))}</TableCell>
                      <TableCell>{formatCurrency(Number(invoice.amount_paid))}</TableCell>
                      <TableCell>
                        {formatCurrency((
                          parseFloat(invoice.amount_to_pay.toString()) -
                          parseFloat(invoice.amount_paid.toString())
                        ))}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(invoice.start_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(invoice.end_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            remainingDays < 0
                              ? "destructive"
                              : remainingDays < 7
                              ? "secondary"
                              : "outline"
                          }
                          className={`w-full text-center p-2`+`${
                            remainingDays < 0
                              ? "bg-red-100 text-red-800"
                              : remainingDays < 7
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                              
                          }}`}
                        >
                          {remainingDays < 0
                            ? `Expired ${Math.abs(remainingDays)} days ago`
                            : `${remainingDays} days left`}
                        </Badge>
                      </TableCell>
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
                            className="bg-green-500 hover:bg-green-600 p-1"
                            onClick={() => handleEditInvoice(invoice)}
                            title="Edit Invoice"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            className="bg-yellow-500 hover:bg-yellow-600 p-1"
                            onClick={() => handleChangeStatus(invoice)}
                            title="Change Status"
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            className="bg-red-500 hover:bg-red-600 p-1"
                            onClick={() => handleDeleteInvoice(invoice)}
                            title="Delete Invoice"
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

      {/* Create Invoice Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                  <Label htmlFor="startDate">Expire Date</Label>
                  <Input
                    id="expireDate"
                    type="date"
                    value={createForm.expireDate}
                    onChange={(e) => handleExpireDateChange(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                            {item.name} -{" "}
                            {String(item.product.net_price ?? item.product.price)} RWF
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
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
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
                  onClick={handleAddItem}
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
                            <TableCell>{item.name}</TableCell>
                            <TableCell>
                              {formatCurrency(item.amountToPay) }
                            </TableCell>
                            <TableCell>
                              {formatCurrency(item.paidAmount) }
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  item.type === "service"
                                    ? "default"
                                    : "secondary"
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
                            {formatCurrency(
                              createForm.invoiceItems.reduce(
                                (sum: number, item: any) =>
                                  sum + item.amountToPay,
                                0
                              )
                            )}{" "}
                            
                          </p>
                          <p>
                            <strong>Total Paid:</strong>{" "}
                            {formatCurrency(createForm.invoiceItems
                              .reduce(
                                (sum: number, item: any) =>
                                  sum + item.paidAmount,
                                0
                              ))
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
                        <SelectItem
                          key={company.id}
                          value={company.id.toString()}
                        >
                          {company.name} ({company.customers.length} customers)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCompany && (
                  <>
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
                      <Label htmlFor="startDate">Expire Date</Label>
                      <Input
                        id="expireDate"
                        type="date"
                        value={createForm.expireDate}
                        onChange={(e) => handleExpireDateChange(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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
                              <SelectItem
                                key={item.id}
                                value={item.id.toString()}
                              >
                                {item.name} -{" "}
                                {String(item.product.net_price ?? item.product.price)}{" "}
                                RWF
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
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>
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

                    <div className="border rounded p-4">
                      <h3 className="font-semibold mb-3">Company Customers</h3>
                      <div className="space-y-2">
                        {consolidatedCustomers.map((customer) => (
                          <div key={customer.id} className="border rounded">
                            <div className="flex items-center p-3 bg-gray-50">
                              <Checkbox
                                checked={selectedCustomers.includes(
                                  customer.id
                                )}
                                onCheckedChange={() =>
                                  toggleCustomerSelection(customer.id)
                                }
                                className="mr-3"
                              />
                              <div
                                className="flex-1 flex items-center justify-between cursor-pointer"
                                onClick={() =>
                                  toggleCustomerExpansion(customer.id)
                                }
                              >
                                <div>
                                  <span className="font-medium">
                                    {customer.name}
                                  </span>
                                  <span className="text-sm text-gray-500 ml-2">
                                    ({customer.items.length} items)
                                  </span>
                                </div>
                                {expandedCustomers.includes(customer.id) ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </div>
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleAddItemToCustomer(customer.id)
                                }
                                disabled={!createForm.item}
                                className="ml-2"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>

                            {expandedCustomers.includes(customer.id) && (
                              <div className="p-3">
                                {customer.items.length > 0 ? (
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Items</TableHead>
                                        <TableHead>Amount To Pay</TableHead>
                                        <TableHead>Paid Amount</TableHead>
                                        <TableHead>Duration</TableHead>
                                        <TableHead>Action</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {customer.items.map((item) => (
                                        <TableRow key={item.id}>
                                          <TableCell>{item.name}</TableCell>
                                          <TableCell>
                                            {formatCurrency(item.amountToPay)}
                                          </TableCell>
                                          <TableCell>
                                            {formatCurrency(item.paidAmount)}
                                          </TableCell>
                                          <TableCell>
                                            <Badge
                                              variant={
                                                item.type === "service"
                                                  ? "default"
                                                  : "secondary"
                                              }
                                            >
                                              {item.duration}
                                            </Badge>
                                          </TableCell>
                                          <TableCell>
                                            <Button
                                              size="sm"
                                              variant="destructive"
                                              onClick={() =>
                                                handleRemoveItemFromCustomer(
                                                  customer.id,
                                                  item.id
                                                )
                                              }
                                            >
                                              <Trash className="h-3 w-3" />
                                            </Button>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                ) : (
                                  <p className="text-sm text-gray-500 text-center py-3">
                                    No items added yet
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 p-3 bg-blue-50 rounded">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p>
                              <strong>Total Amount:</strong>{" "}
                              {formatCurrency(calculateConsolidatedTotals().totalAmount)}
                            </p>
                            <p>
                              <strong>Total Paid:</strong>{" "}
                              {formatCurrency(calculateConsolidatedTotals().totalPaid)}
                            </p>
                          </div>
                          <div>
                            <p>
                              <strong>Selected Customers:</strong>{" "}
                              {selectedCustomers.length} of{" "}
                              {consolidatedCustomers.length}
                            </p>
                            <p>
                              <strong>Total Items:</strong>{" "}
                              {consolidatedCustomers.reduce(
                                (sum, customer) =>
                                  selectedCustomers.includes(customer.id)
                                    ? sum + customer.items.length
                                    : sum,
                                0
                              )}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                          * Consolidated invoice for multiple customers under
                          same company
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setConsolidatedCustomers([]);
                setSelectedCustomers([]);
                setExpandedCustomers([]);
              }}
            >
              Close
            </Button>
            <Button
              onClick={handleCreateInvoice}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={
                createForm.isConsolidated
                  ? !selectedCompany ||
                    consolidatedCustomers.filter(
                      (c) =>
                        selectedCustomers.includes(c.id) && c.items.length > 0
                    ).length === 0
                  : createForm.invoiceItems.length === 0
              }
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
               
            </DialogDescription>
          </DialogHeader>
          {viewInvoice && <InvoiceTemplate invoiceData={viewInvoice} />}
        </DialogContent>
      </Dialog>

      {/* Edit Invoice Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="billingName">Billing Name</Label>
              <Input
                id="billingName"
                value={editForm.billingName}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, billingName: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="paidAmount">Paid Amount</Label>
              <Input
                id="paidAmount"
                type="number"
                value={editForm.paidAmount}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, paidAmount: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={editForm.startDate}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, startDate: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="expireDate">Expire Date</Label>
              <Input
                id="expireDate"
                type="date"
                value={editForm.expireDate}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, expireDate: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(value) =>
                  setEditForm((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={editForm.paymentMethod}
                onValueChange={(value) =>
                  setEditForm((prev) => ({ ...prev, paymentMethod: value }))
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
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateInvoice}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Update Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this invoice? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Status Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Invoice Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={statusForm.status}
                onValueChange={(value) =>
                  setStatusForm((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={statusForm.paymentMethod}
                onValueChange={(value) =>
                  setStatusForm((prev) => ({ ...prev, paymentMethod: value }))
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
              <Label htmlFor="paidAmount">Paid Amount</Label>
              <Input
                id="paidAmount"
                type="number"
                value={statusForm.paidAmount}
                onChange={(e) =>
                  setStatusForm((prev) => ({ ...prev, paidAmount: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsStatusDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateStatus}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}