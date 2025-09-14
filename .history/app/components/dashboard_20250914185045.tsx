"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  Package, 
  ShoppingCart, 
  FileText, 
  Boxes, 
  Truck,
  FileBarChart,
  DollarSign,
  Calendar,
  AlertTriangle,
  TrendingUp
} from "lucide-react";
import { getDashboardData } from "../actions/get-dashboard-data";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface DashboardData {
  totals: {
    customers: number;
    packages: number;
    products: number;
    reports: number;
    invoices: number;
    stockItems: number;
    suppliers: number;
    quotations: number;
    proformaInvoices: number;
    revenue: number;
    monthlyRevenue: number;
  };
  recentInvoices: any[];
  lowStockItems: any[];
  expiringInvoices: any[];
}

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getDashboardData();
        
        if (result.success && result.data) {
          setDashboardData(result.data);
        } else {
          setError(result.error || "Failed to load dashboard data");
        }
      } catch (err) {
        setError("An error occurred while fetching data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = [
    {
      title: "Total Customers",
      value: dashboardData?.totals.customers.toString() || "0",
      color: "bg-blue-500",
      icon: <Users className="h-8 w-8 text-white opacity-90" />,
      change: "+12% this month"
    },
    {
      title: "Total Packages",
      value: dashboardData?.totals.packages.toString() || "0",
      color: "bg-red-500",
      icon: <Package className="h-8 w-8 text-white opacity-90" />,
      change: "+5% this month"
    },
    {
      title: "Total Products",
      value: dashboardData?.totals.products.toString() || "0",
      color: "bg-orange-500",
      icon: <ShoppingCart className="h-8 w-8 text-white opacity-90" />,
      change: "+8% this month"
    },
    {
      title: "Total Revenue",
      value: formatCurrency(dashboardData?.totals.revenue || 0),
      color: "bg-green-500",
      icon: <DollarSign className="h-8 w-8 text-white opacity-90" />,
      change: `+${formatCurrency(dashboardData?.totals.monthlyRevenue || 0)} this month`
    },
    {
      title: "Total Invoices",
      value: dashboardData?.totals.invoices.toString() || "0",
      color: "bg-purple-500",
      icon: <FileText className="h-8 w-8 text-white opacity-90" />,
      change: "+15% this month"
    },
    {
      title: "Stock Items",
      value: dashboardData?.totals.stockItems.toString() || "0",
      color: "bg-indigo-500",
      icon: <Boxes className="h-8 w-8 text-white opacity-90" />,
      change: `${dashboardData?.lowStockItems.length || 0} low stock`
    }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg shadow-lg overflow-hidden animate-pulse">
              <div className="p-6 h-32"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to your NETPRO management dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => (
          <Card key={stat.title} className={`rounded-lg shadow-lg overflow-hidden`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-2xl font-bold  mb-1">{stat.value}</div>
                  <div className=" text-sm font-medium opacity-90 mb-2">{stat.title}</div>
                  <div className="  text-xs opacity-80">{stat.change}</div>
                </div>
                <div className={`ml-4 flex items-center justify-center text-${stat.color}`}>{stat.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Dashboard Sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Invoices */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Invoices</h2>
            <FileText className="h-5 w-5 text-gray-500" />
          </div>
          <div className="space-y-3">
            {dashboardData?.recentInvoices.slice(0, 5).map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium text-sm">#{invoice.id}</p>
                  <p className="text-xs text-gray-600">{invoice.customer?.name || 'Unknown'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatCurrency(invoice.amount_paid)}</p>
                  <p className="text-xs text-gray-600">
                    {new Date(invoice.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            {(!dashboardData?.recentInvoices || dashboardData.recentInvoices.length === 0) && (
              <p className="text-gray-500 text-center py-4">No recent invoices</p>
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Low Stock Alert</h2>
            <AlertTriangle className="h-5 w-5 text-orange-500" />
          </div>
          <div className="space-y-3">
            {dashboardData?.lowStockItems.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-orange-50 rounded">
                <div>
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-gray-600">{item.supplier?.name || 'No supplier'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-orange-600">{item.quantity} left</p>
                  <p className="text-xs text-gray-600">Reorder at: {item.reorder_level}</p>
                </div>
              </div>
            ))}
            {(!dashboardData?.lowStockItems || dashboardData.lowStockItems.length === 0) && (
              <p className="text-gray-500 text-center py-4">All items are well stocked</p>
            )}
          </div>
        </div>
      </div>

      {/* Expiring Invoices */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Expiring Invoices</h2>
          <Calendar className="h-5 w-5 text-red-500" />
        </div>
        <div className="space-y-3">
          {dashboardData?.expiringInvoices.slice(0, 5).map((invoice) => {
            const daysLeft = Math.ceil(
              (new Date(invoice.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );
            
            return (
              <div key={invoice.id} className="flex items-center justify-between p-3 bg-red-50 rounded">
                <div>
                  <p className="font-medium text-sm">
                    {invoice.customer?.name || invoice.company?.name || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-600">Due in {daysLeft} days</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-red-600">
                    {formatCurrency(invoice.amount_to_pay - invoice.amount_paid)} due
                  </p>
                  <p className="text-xs text-gray-600">
                    {new Date(invoice.end_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
          })}
          {(!dashboardData?.expiringInvoices || dashboardData.expiringInvoices.length === 0) && (
            <p className="text-gray-500 text-center py-4">No expiring invoices</p>
          )}
        </div>
      </div>
    </div>
  );
}