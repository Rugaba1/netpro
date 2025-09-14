"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, TrendingUp, DollarSign, Users, Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { generateReport } from "../actions/generate-report";
import { formatCurrency } from "@/lib/utils";

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
}

export default function Reports() {
  const [reportType, setReportType] = useState("income");
  const [dateRange, setDateRange] = useState("monthly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load initial report when component mounts
    generateInitialReport();
  }, []);

  const generateInitialReport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await generateReport({
        reportType: 'income',
        dateRange: 'monthly'
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
        dateRange,
        startDate,
        endDate
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

  const exportReport = (format: string) => {
    console.log("Exporting report as:", format, reportData);
    // Here you would implement the export functionality
    // This could generate PDF/Excel using the reportData
  };

  const getKeyMetrics = () => {
    if (!reportData) return [];

    switch (reportData.type) {
      case 'income':
        return [
          {
            title: "Total Revenue",
            value: formatCurrency(reportData.totalIncome || 0),
            change: "+12.5% from last month",
            icon: DollarSign,
            color: "text-green-600"
          }
        ];
      case 'expenses':
        return [
          {
            title: "Total Expenses",
            value: formatCurrency(reportData.totalExpenses || 0),
            change: "+5.2% from last month",
            icon: TrendingUp,
            color: "text-red-600"
          }
        ];
      case 'sales':
        return [
          {
            title: "Total Sales",
            value: formatCurrency(reportData.totalSales || 0),
            change: "+15.3% from last month",
            icon: DollarSign,
            color: "text-blue-600"
          }
        ];
      case 'cashpower':
        return [
          {
            title: "Total Commission",
            value: formatCurrency(reportData.totalCommission || 0),
            change: "+8.7% from last month",
            icon: DollarSign,
            color: "text-purple-600"
          },
          {
            title: "Total Amount",
            value: formatCurrency(reportData.totalAmount || 0),
            change: "+12.1% from last month",
            icon: TrendingUp,
            color: "text-orange-600"
          }
        ];
      case 'customer':
        return [
          {
            title: "Total Customers",
            value: reportData.totalCustomers?.toString() || "0",
            change: "+8.7% from last month",
            icon: Users,
            color: "text-blue-600"
          },
          {
            title: "Active Customers",
            value: reportData.activeCustomers?.toString() || "0",
            change: "+5.2% from last month",
            icon: Users,
            color: "text-green-600"
          },
          {
            title: "New Customers",
            value: reportData.newCustomers?.toString() || "0",
            change: "+12.3% from last month",
            icon: Users,
            color: "text-purple-600"
          }
        ];
      case 'inventory':
        return [
          {
            title: "Total Items",
            value: reportData.totalItems?.toString() || "0",
            change: "In stock",
            icon: FileText,
            color: "text-blue-600"
          },
          {
            title: "Low Stock",
            value: reportData.lowStockCount?.toString() || "0",
            change: "Needs attention",
            icon: TrendingUp,
            color: "text-orange-600"
          },
          {
            title: "Out of Stock",
            value: reportData.outOfStockCount?.toString() || "0",
            change: "Urgent restock needed",
            icon: TrendingUp,
            color: "text-red-600"
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
            <Tooltip formatter={(value: number) => [formatCurrency(value), ""]} />
            <Bar dataKey="value" fill="#3B82F6" name="Value" />
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
          outerRadius={80}
          dataKey="value"
          label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
        >
          {reportData.categoryData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => formatCurrency(value)} />
      </PieChart>
    );
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
          <Button variant="outline" onClick={() => exportReport("pdf")} disabled={!reportData}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={() => exportReport("excel")} disabled={!reportData}>
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
                  <SelectItem value="income">Income Report</SelectItem>
                  <SelectItem value="expenses">Expense Report</SelectItem>
                  <SelectItem value="sales">Sales Report</SelectItem>
                  <SelectItem value="inventory">Inventory Report</SelectItem>
                  <SelectItem value="cashpower">Cashpower Report</SelectItem>
                  <SelectItem value="customer">Customer Report</SelectItem>
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

            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
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
                        <p className={`text-sm ${metric.color}`}>{metric.change}</p>
                      </div>
                      <IconComponent className="w-8 h-8 opacity-70" />
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
                    {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    {renderChart()}
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
                    {renderPieChart()}
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}