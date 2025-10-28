"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Plus,
  Zap,
  DollarSign,
  Users,
  TrendingUp,
  Loader2,
  X,
  CheckCircle,
  Download,
  Filter,
  Eye,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import {
  cash_power_transaction as CashpowerTransactionType,
  customer as Customer,
} from "@/lib/generated/prisma";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

interface CashpowerTransaction extends CashpowerTransactionType {
  customer: Customer;
}

// Status Dialog Component
function StatusDialog({
  transaction,
  open,
  onOpenChange,
  onStatusUpdate,
}: {
  transaction: CashpowerTransaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdate: () => void;
}) {
  const [selectedStatus, setSelectedStatus] = useState(
    transaction?.status || ""
  );
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (transaction) {
      setSelectedStatus(transaction.status || "");
    }
  }, [transaction]);

  const handleStatusChange = async () => {
    if (!transaction || selectedStatus === transaction.status) {
      onOpenChange(false);
      return;
    }

    setUpdating(true);
    try {
      const response = await axios.patch(`/api/cashpower/${transaction.id}`, {
        status: selectedStatus,
      });

      if (response.data.success) {
        toast.success("Transaction status updated successfully!");
        onStatusUpdate();
        onOpenChange(false);
      } else {
        toast.error(response.data.message || "Failed to update status");
      }
    } catch (error: any) {
      console.error("Error updating transaction status:", error);
      toast.error(
        error.response?.data?.message || "Failed to update transaction status"
      );
    } finally {
      setUpdating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "failed":
        return <X className="w-5 h-5 text-red-500" />;
      case "pending":
        return <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />;
      default:
        return <Eye className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "failed":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
          <DialogDescription>
            View and update the status of this cashpower transaction.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Transaction Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Transaction ID</Label>
              <p className="text-sm mt-1">{transaction.id}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Customer</Label>
              <p className="text-sm mt-1">{transaction.customer.name}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Meter Number</Label>
              <p className="text-sm font-mono mt-1">{transaction.meter_no}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Amount</Label>
              <p className="text-sm mt-1">
                RWF {parseFloat(transaction.amount.toString()).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Units</Label>
              <p className="text-sm mt-1">
                {transaction.units?.toFixed(1) || "N/A"} kWh
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Commission</Label>
              <p className="text-sm mt-1 text-green-600">
                RWF{" "}
                {parseFloat(
                  (transaction.commission ?? 0).toString()
                ).toLocaleString()}
              </p>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Token</Label>
            <p className="text-sm font-mono bg-gray-100 p-2 rounded mt-1">
              {transaction.token || "N/A"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Date</Label>
              <p className="text-sm mt-1">
                {transaction.created_at
                  ? new Date(transaction.created_at).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Current Status</Label>
              <div className="flex items-center mt-1">
                <Badge
                  className={`${getStatusColor(
                    transaction.status || "unknown"
                  )} text-white flex items-center gap-1`}
                >
                  {getStatusIcon(transaction.status || "unknown")}
                  {(transaction.status || "Unknown").charAt(0).toUpperCase() +
                    (transaction.status || "Unknown").slice(1)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Status Update Section */}
          <div className="border-t pt-4 mt-2">
            <Label htmlFor="status" className="text-sm font-medium">
              Update Status
            </Label>
            <Select
              value={selectedStatus}
              onValueChange={setSelectedStatus}
              disabled={updating}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updating}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleStatusChange}
            disabled={selectedStatus === transaction.status || updating}
          >
            {updating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Update Status
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CashpowerManagement() {
  const [transactions, setTransactions] = useState<CashpowerTransaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<CashpowerTransaction | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: "",
    meter_number: "",
    amount: "",
    commission: 0.5,
    token: "",
    units: 0,
  });

  useEffect(() => {
    fetchTransactions();
    fetchCustomers();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/cashpower`);
      setTransactions(response.data.transactions || []);
    } catch (error) {
      console.error("Error fetching cashpower transactions:", error);
      toast.error("Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`/api/customers`);
      setCustomers(response.data.customers || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to fetch customers");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await axios.post(`/api/cashpower`, {
        customer_id: parseInt(formData.customer_id),
        meter_number: formData.meter_number,
        amount: parseFloat(formData.amount),
        token: formData.token,
        commission: formData.commission,
        units: parseFloat(formData.units.toString()),
      });

      if (response.data.success) {
        toast.success("Transaction created successfully!");
        setDialogOpen(false);
        setFormData({
          customer_id: "",
          meter_number: "",
          amount: "",
          commission: 0.5,
          token: "",
          units: 0,
        });
        fetchTransactions();
      } else {
        toast.error(response.data.message || "Failed to create transaction");
      }
    } catch (error: any) {
      console.error("Error creating transaction:", error);
      toast.error(
        error.response?.data?.message || "Failed to create transaction"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find((c) => c.id.toString() === customerId);
    setFormData((prev) => ({
      ...prev,
      customer_id: customerId,
    }));
  };

  const exportTransactions = () => {
    // Simple export to CSV function
    const headers =
      "Customer,Meter Number,Amount,Units,Token,Commission,Status,Date\n";
    const csvContent = transactions
      .map(
        (t) =>
          `"${t.customer.name}",${t.meter_no},${t.amount},${t.units},${t.token},${t.commission},${t.status},${t.created_at}`
      )
      .join("\n");

    const blob = new Blob([headers + csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cashpower_transactions.csv";
    a.click();
    URL.revokeObjectURL(url);

    toast.success("Transactions exported successfully");
  };

  const handleViewTransaction = (transaction: CashpowerTransaction) => {
    setSelectedTransaction(transaction);
    setStatusDialogOpen(true);
  };

  const filteredTransactions = transactions.filter(
    (transaction) =>
      transaction.customer.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.meter_no.includes(searchTerm) ||
      (transaction.token && transaction.token.includes(searchTerm))
  );

  const totalTransactions = transactions.length;
  const totalAmount = transactions.reduce(
    (sum, t) => sum + parseFloat(t.amount.toString()),
    0
  );
  const totalCommission = transactions.reduce(
    (sum, t) => sum + parseFloat((t?.commission ?? 0).toString()),
    0
  );
  const completedTransactions = transactions.filter(
    (t) => t.status === "completed"
  ).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "failed":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin mr-2" />
        <div className="text-lg">Loading cashpower data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Cashpower Management</h1>
          <p className="text-gray-600">
            Manage electricity token transactions and commissions
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Transactions
                </p>
                <p className="text-2xl font-bold">{totalTransactions}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Amount
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalAmount)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Commission
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalCommission)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold">{completedTransactions}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by customer name, meter number, or token..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filter
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={exportTransactions}
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between">
            <CardTitle>Cashpower Transactions</CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Transaction
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Cashpower Transaction</DialogTitle>
                  <DialogDescription>
                    Enter the details for the new electricity token purchase.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="customer_id">Customer</Label>
                      <Select
                        value={formData.customer_id}
                        onValueChange={handleCustomerSelect}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem
                              key={customer.id}
                              value={customer.id.toString()}
                            >
                              {customer.name} - {customer.phone}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="meter_number">Meter Number</Label>
                      <Input
                        id="meter_number"
                        name="meter_number"
                        value={formData.meter_number}
                        onChange={handleInputChange}
                        placeholder="Enter meter number"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="amount">Amount (RWF)</Label>
                      <Input
                        id="amount"
                        name="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.amount}
                        onChange={handleInputChange}
                        placeholder="Enter amount"
                        required
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="token">Token</Label>
                      <Input
                        id="token"
                        name="token"
                        value={formData.token}
                        onChange={handleInputChange}
                        placeholder="Enter Token"
                        required
                      />
                      <div className="grid gap-2">
                        <Label htmlFor="units">Units</Label>
                        <Input
                          id="units"
                          name="units"
                          value={formData.units}
                          onChange={handleInputChange}
                          placeholder="Enter units"
                          required
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="commission">Commission</Label>
                        <Input
                          id="commission"
                          name="commission"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.commission}
                          onChange={handleInputChange}
                          placeholder="Enter commission"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Create Transaction
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No transactions found.{" "}
              {searchTerm && "Try adjusting your search."}
            </div>
          ) : (
            <>
              <div className="text-sm text-gray-600 mb-4">
                Showing {filteredTransactions.length} of {transactions.length}{" "}
                transactions
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Meter Number</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Units</TableHead>
                      <TableHead>Token</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {transaction.customer.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {transaction.id}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">
                          {transaction.meter_no}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(
                            parseFloat(transaction.amount.toString())
                          )}
                        </TableCell>
                        <TableCell>
                          {transaction.units?.toFixed(1) || "N/A"} kWh
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-sm bg-gray-100 p-2 rounded">
                            {transaction.token || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell className="text-green-600 font-medium">
                          {formatCurrency(
                            parseFloat((transaction.commission ?? 0).toString())
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${getStatusColor(
                              transaction?.status ?? "unknown"
                            )} text-white`}
                          >
                            {(transaction?.status ?? "Unknown")
                              .charAt(0)
                              .toUpperCase() +
                              (transaction?.status ?? "Unknown").slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {transaction.created_at
                            ? new Date(
                                transaction.created_at
                              ).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0"
                              onClick={() => handleViewTransaction(transaction)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Status Dialog */}
      <StatusDialog
        transaction={selectedTransaction}
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        onStatusUpdate={fetchTransactions}
      />
    </div>
  );
}
