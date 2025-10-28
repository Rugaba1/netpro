'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, TrendingUp, DollarSign, Users, Loader2, Package, ShoppingCart, Zap, AlertTriangle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { generateReport } from "../actions/generate-report";
import { formatCurrency } from "@/lib/utils";
import * as XLSX from 'xlsx';

interface ReportData {
  totalIncome?: number;
  totalExpenses?: number;
  totalSales?: number;
  totalCommission?: number;
  totalAmount?: number;
  totalCustomers?: number;
  activeCustomers?: number;
  newCustomers?: number;
  totalItems?: number;
  lowStockCount?: number;
  outOfStockCount?: number;
  monthlyData?: any[];
  categoryData?: any[];
  type: string;
  detailedData?: any[];
  summary?: any;
  [key: string]: any;
}

interface Metric {
  title: string;
  value: string | number;
  change?: string;
  icon: any;
  color: string;
  description?: string;
}

export default function Reports() {
  const [reportType, setReportType] = useState("sales");
  const [dateRange, setDateRange] = useState("monthly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set default dates (last 30 days)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
    
    generateInitialReport(start, end);
  }, []);

  const generateInitialReport = async (start: Date, end: Date) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await generateReport({
        reportType: 'sales',
        dateRange: 'custom',
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
      });

      if (result.success && result.data) {
        setReportData(result.data);
      } else {
        setError(result.error || "Failed to generate report");
      }
    } catch (err) {
      setError("An error occurred while generating the report");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateReportHandler = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await generateReport({
        reportType,
        dateRange: dateRange === 'custom' ? 'custom' : dateRange,
        startDate: dateRange === 'custom' ? startDate : undefined,
        endDate: dateRange === 'custom' ? endDate : undefined
      });

      if (result.success && result.data) {
        setReportData(result.data);
      } else {
        setError(result.error || "Failed to generate report");
      }
    } catch (err) {
      setError("An error occurred while generating the report");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!reportData) return;

    try {
      const workbook = XLSX.utils.book_new();
      
      // Summary Sheet
      const summaryData = [
        ['Report Type', reportType.toUpperCase() + ' REPORT'],
        ['Date Range', `${startDate} to ${endDate}`],
        ['Generated On', new Date().toLocaleDateString()],
        [''],
        ['KEY METRICS', ''],
        ...getKeyMetrics().map(metric => [metric.title, metric.value, metric.description || ''])
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      // Detailed Data Sheet
      if (reportData.detailedData && reportData.detailedData.length > 0) {
        const detailedData = reportData.detailedData.map((item: any) => {
          // Flatten nested objects for Excel
          const flatItem = { ...item };
          if (item.customer) flatItem.customerName = item.customer.name;
          if (item.product) flatItem.productName = item.product.name;
          if (item.supplier) flatItem.supplierName = item.supplier.name;
          return flatItem;
        });
        const detailedSheet = XLSX.utils.json_to_sheet(detailedData);
        XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Detailed Data');
      }

      // Monthly Data Sheet
      if (reportData.monthlyData && reportData.monthlyData.length > 0) {
        const monthlySheet = XLSX.utils.json_to_sheet(reportData.monthlyData);
        XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Monthly Trends');
      }

      // Category Data Sheet
      if (reportData.categoryData && reportData.categoryData.length > 0) {
        const categorySheet = XLSX.utils.json_to_sheet(reportData.categoryData);
        XLSX.utils.book_append_sheet(workbook, categorySheet, 'Categories');
      }

      // Generate filename
      const filename = `${reportType}_report_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Export
      XLSX.writeFile(workbook, filename);
      
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      setError('Failed to export Excel file');
    }
  };

  const getKeyMetrics = (): Metric[] => {
    if (!reportData) return [];

    switch (reportData.type) {
      case 'income':
        return [
          {
            title: "Total Revenue",
            value: formatCurrency(reportData.totalIncome || 0),
            icon: DollarSign,
            color: "text-green-600",
            description: "Total income from paid invoices"
          },
          {
            title: "Paid Invoices",
            value: reportData.paidInvoices || 0,
            icon: FileText,
            color: "text-blue-600",
            description: "Number of paid invoices"
          },
          {
            title: "Pending Invoices",
            value: reportData.pendingInvoices || 0,
            icon: AlertTriangle,
            color: "text-orange-600",
            description: "Invoices awaiting payment"
          },
          {
            title: "Total Receivable",
            value: formatCurrency(reportData.totalReceivable || 0),
            icon: DollarSign,
            color: "text-red-600",
            description: "Outstanding invoice amounts"
          }
        ];
      case 'expenses':
        return [
          {
            title: "Total Expenses",
            value: formatCurrency(reportData.totalExpenses || 0),
            icon: TrendingUp,
            color: "text-red-600",
            description: "Total procurement costs"
          },
          {
            title: "Items Procured",
            value: reportData.stockItems?.length || 0,
            icon: Package,
            color: "text-orange-600",
            description: "Stock items added"
          },
          {
            title: "Avg Item Cost",
            value: formatCurrency((reportData.totalExpenses || 0) / (reportData.stockItems?.length || 1)),
            icon: DollarSign,
            color: "text-yellow-600",
            description: "Average cost per item"
          }
        ];
      case 'sales':
        return [
          {
            title: "Total Sales",
            value: formatCurrency(reportData.totalSales || 0),
            icon: DollarSign,
            color: "text-blue-600",
            description: "Total sales revenue"
          },
          {
            title: "Items Sold",
            value: reportData.totalItemsSold || 0,
            icon: ShoppingCart,
            color: "text-green-600",
            description: "Total quantity sold"
          },
          {
            title: "Transactions",
            value: reportData.totalTransactions || 0,
            icon: FileText,
            color: "text-purple-600",
            description: "Number of sales"
          },
          {
            title: "Avg Transaction",
            value: formatCurrency(reportData.averageTransaction || 0),
            icon: TrendingUp,
            color: "text-orange-600",
            description: "Average sale value"
          }
        ];
      case 'inventory':
        return [
          {
            title: "Total Items",
            value: reportData.totalItems || 0,
            icon: Package,
            color: "text-blue-600",
            description: "Items in inventory"
          },
          {
            title: "Low Stock",
            value: reportData.lowStockCount || 0,
            icon: AlertTriangle,
            color: "text-orange-600",
            description: "Items below reorder level"
          },
          {
            title: "Out of Stock",
            value: reportData.outOfStockCount || 0,
            icon: AlertTriangle,
            color: "text-red-600",
            description: "Items with zero stock"
          },
          {
            title: "Total Value",
            value: formatCurrency(reportData.totalValue || 0),
            icon: DollarSign,
            color: "text-green-600",
            description: "Total inventory value"
          }
        ];
      case 'cashpower':
        return [
          {
            title: "Total Amount",
            value: formatCurrency(reportData.totalAmount || 0),
            icon: DollarSign,
            color: "text-blue-600",
            description: "Total cashpower sales"
          },
          {
            title: "Total Commission",
            value: formatCurrency(reportData.totalCommission || 0),
            icon: TrendingUp,
            color: "text-green-600",
            description: "Commission earned"
          },
          {
            title: "Success Rate",
            value: `${reportData.successRate?.toFixed(1) || 0}%`,
            icon: Zap,
            color: "text-purple-600",
            description: "Successful transactions"
          },
          {
            title: "Transactions",
            value: reportData.totalTransactions || 0,
            icon: FileText,
            color: "text-orange-600",
            description: "Total transactions"
          }
        ];
      case 'customer':
        return [
          {
            title: "Total Customers",
            value: reportData.totalCustomers || 0,
            icon: Users,
            color: "text-blue-600",
            description: "All customers"
          },
          {
            title: "Active Customers",
            value: reportData.activeCustomers || 0,
            icon: Users,
            color: "text-green-600",
            description: "Customers with transactions"
          },
          {
            title: "New Customers",
            value: reportData.newCustomers || 0,
            icon: Users,
            color: "text-purple-600",
            description: "Newly registered"
          },
          {
            title: "Inactive Customers",
            value: reportData.inactiveCustomers || 0,
            icon: Users,
            color: "text-red-600",
            description: "No recent activity"
          }
        ];
      case 'products':
        return [
          {
            title: "Total Products",
            value: reportData.totalProducts || 0,
            icon: Package,
            color: "text-blue-600",
            description: "All products"
          },
          {
            title: "Active Products",
            value: reportData.activeProducts || 0,
            icon: ShoppingCart,
            color: "text-green-600",
            description: "Products with sales"
          },
          {
            title: "Total Revenue",
            value: formatCurrency(reportData.totalRevenue || 0),
            icon: DollarSign,
            color: "text-purple-600",
            description: "Product sales revenue"
          },
          {
            title: "Top Categories",
            value: reportData.categoryPerformance?.length || 0,
            icon: TrendingUp,
            color: "text-orange-600",
            description: "Product categories"
          }
        ];
      default:
        return [];
    }
  };

  const renderChart = () => {
    if (!reportData || !reportData.monthlyData) return null;

    switch (reportData.type) {
      case 'income':
      case 'expenses':
      case 'sales':
        return (
          <BarChart data={reportData.monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value: number) => [formatCurrency(value), "Amount"]} />
            <Legend />
            <Bar dataKey="value" fill="#3B82F6" name="Amount" />
          </BarChart>
        );
      case 'cashpower':
        return (
          <BarChart data={reportData.monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value: number) => [formatCurrency(value), "Amount"]} />
            <Legend />
            <Bar dataKey="amount" fill="#3B82F6" name="Total Amount" />
            <Bar dataKey="commission" fill="#10B981" name="Commission" />
          </BarChart>
        );
      default:
        return null;
    }
  };

  const renderPieChart = () => {
    if (!reportData || !reportData.categoryData) return null;

    return (
      <PieChart>
        <Pie
          data={reportData.categoryData}
          cx="50%"
          cy="50%"
          outerRadius={100}
          dataKey="value"
          label={({ name, value }) => `${name}: ${formatCurrency(typeof value === 'number' ? value : 0)}`}
        >
          {reportData.categoryData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => formatCurrency(value)} />
        <Legend />
      </PieChart>
    );
  };

  const renderDetailedTable = () => {
    if (!reportData || !reportData.detailedData) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle>Detailed Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {getTableHeaders().map(header => (
                    <TableHead key={header}>{header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.detailedData.slice(0, 10).map((item, index) => (
                  <TableRow key={index}>
                    {getTableRow(item).map((cell, cellIndex) => (
                      <TableCell key={cellIndex}>{cell}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  };

  const getTableHeaders = () => {
    if (!reportData) return [];
    
    switch (reportData.type) {
      case 'sales':
        return ['Date', 'Customer', 'Items', 'Total Amount', 'Status'];
      case 'income':
        return ['Invoice ID', 'Customer', 'Amount Paid', 'Date', 'Status'];
      case 'inventory':
        return ['Item Name', 'Category', 'Quantity', 'Min Level', 'Status'];
      case 'cashpower':
        return ['Customer', 'Amount', 'Commission', 'Date', 'Status'];
      default:
        return ['Name', 'Value', 'Details'];
    }
  };

  const getTableRow = (item: any) => {
    switch (reportData?.type) {
      case 'sales':
        return [
          new Date(item.sale_date).toLocaleDateString(),
          item.customer?.name || 'N/A',
          item.SaleItem?.length || 0,
          formatCurrency(Number(item.total_price)),
          'Completed'
        ];
      case 'income':
        return [
          `INV-${item.id}`,
          item.customer?.name || 'N/A',
          formatCurrency(Number(item.amount_paid)),
          new Date(item.created_at).toLocaleDateString(),
          item.status
        ];
      case 'inventory':
        return [
          item.name,
          item.stock_items_category?.name || 'N/A',
          item.quantity,
          item.min_level,
          item.quantity === 0 ? 'Out of Stock' : item.quantity <= item.reorder_level ? 'Low Stock' : 'In Stock'
        ];
      case 'cashpower':
        return [
          item.customer?.name || 'N/A',
          formatCurrency(Number(item.amount)),
          formatCurrency(Number(item.commission || 0)),
          new Date(item.created_at).toLocaleDateString(),
          item.status || 'Completed'
        ];
      default:
        return [item.name || 'N/A', item.value || 'N/A', item.details || 'N/A'];
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Reports & Analytics</h1>
            <p className="text-gray-600">Generate comprehensive business reports and analytics</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Generating report...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-gray-600">Generate comprehensive business reports and analytics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToExcel} disabled={!reportData}>
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Report Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales Report</SelectItem>
                  <SelectItem value="income">Income Report</SelectItem>
                  <SelectItem value="expenses">Expense Report</SelectItem>
                  <SelectItem value="inventory">Inventory Report</SelectItem>
                  <SelectItem value="cashpower">Cashpower Report</SelectItem>
                  <SelectItem value="customer">Customer Report</SelectItem>
                  <SelectItem value="products">Product Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dateRange === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date</label>
                  <Input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)} 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">End Date</label>
                  <Input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)} 
                  />
                </div>
              </>
            )}
          </div>

          <div className="mt-4">
            <Button onClick={generateReportHandler} className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileText className="w-4 h-4 mr-2" />
              )}
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {reportData && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {getKeyMetrics().map((metric, index) => {
              const IconComponent = metric.icon;
              return (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                        <p className="text-2xl font-bold">{metric.value}</p>
                        {metric.description && (
                          <p className="text-xs text-gray-500 mt-1">{metric.description}</p>
                        )}
                      </div>
                      <IconComponent className={`w-8 h-8 ${metric.color}`} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Main Chart */}
            {reportData.monthlyData && reportData.monthlyData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    {renderChart() ?? <></>}
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Pie Chart for Categories */}
            {reportData.categoryData && reportData.categoryData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Distribution by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    {renderPieChart() ?? <></>}
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Detailed Table */}
          {renderDetailedTable()}
        </>
      )}
    </div>
  );
}