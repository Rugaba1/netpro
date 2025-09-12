"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package, Calendar, BarChart3 } from "lucide-react"

export default function Analytics() {
  const salesData = [
    { month: "Jan", revenue: 12000, orders: 145 },
    { month: "Feb", revenue: 15000, orders: 178 },
    { month: "Mar", revenue: 18000, orders: 210 },
    { month: "Apr", revenue: 16000, orders: 189 },
    { month: "May", revenue: 22000, orders: 267 },
    { month: "Jun", revenue: 25000, orders: 298 },
  ]

  const topCategories = [
    { name: "Electronics", sales: 45000, percentage: 35 },
    { name: "Accessories", sales: 32000, percentage: 25 },
    { name: "Wearables", sales: 28000, percentage: 22 },
    { name: "Cables", sales: 15000, percentage: 12 },
    { name: "Chargers", sales: 8000, percentage: 6 },
  ]

  const recentMetrics = [
    {
      title: "Revenue Growth",
      value: "+23.5%",
      description: "vs last month",
      trend: "up",
      icon: TrendingUp,
    },
    {
      title: "Order Volume",
      value: "+12.3%",
      description: "vs last month",
      trend: "up",
      icon: ShoppingCart,
    },
    {
      title: "Customer Acquisition",
      value: "+8.7%",
      description: "vs last month",
      trend: "up",
      icon: Users,
    },
    {
      title: "Average Order Value",
      value: "-2.1%",
      description: "vs last month",
      trend: "down",
      icon: DollarSign,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Track your business performance and insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {recentMetrics.map((metric) => {
          const Icon = metric.icon
          return (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs text-muted-foreground flex items-center">
                  {metric.trend === "up" ? (
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                  )}
                  <span className={metric.trend === "up" ? "text-green-500" : "text-red-500"}>
                    {metric.description}
                  </span>
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Sales Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Sales Overview
            </CardTitle>
            <CardDescription>Monthly revenue and order trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {salesData.map((data, index) => (
                <div key={data.month} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-2 h-8 bg-blue-500 rounded"
                      style={{
                        height: `${(data.revenue / 25000) * 32}px`,
                      }}
                    ></div>
                    <div>
                      <p className="text-sm font-medium">{data.month}</p>
                      <p className="text-xs text-muted-foreground">{data.orders} orders</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">${data.revenue.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      {index > 0 && (
                        <span
                          className={data.revenue > salesData[index - 1].revenue ? "text-green-500" : "text-red-500"}
                        >
                          {data.revenue > salesData[index - 1].revenue ? "+" : ""}
                          {(
                            ((data.revenue - salesData[index - 1].revenue) / salesData[index - 1].revenue) *
                            100
                          ).toFixed(1)}
                          %
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="mr-2 h-5 w-5" />
              Top Categories
            </CardTitle>
            <CardDescription>Best performing product categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCategories.map((category, index) => (
                <div key={category.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <span className="text-sm font-medium">{category.name}</span>
                    </div>
                    <span className="text-sm font-medium">${category.sales.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${category.percentage}%` }}></div>
                  </div>
                  <p className="text-xs text-muted-foreground">{category.percentage}% of total sales</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Analytics Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Revenue</span>
                <span className="text-sm font-medium">$8,450</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Orders</span>
                <span className="text-sm font-medium">67</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">New Customers</span>
                <span className="text-sm font-medium">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Avg. Order Value</span>
                <span className="text-sm font-medium">$126.12</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Returning Customers</span>
                <span className="text-sm font-medium">68%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Customer Lifetime Value</span>
                <span className="text-sm font-medium">$342</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Churn Rate</span>
                <span className="text-sm font-medium">5.2%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Avg. Session Duration</span>
                <span className="text-sm font-medium">4m 32s</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Total Products</span>
                <span className="text-sm font-medium">1,234</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Low Stock Items</span>
                <span className="text-sm font-medium text-yellow-600">23</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Out of Stock</span>
                <span className="text-sm font-medium text-red-600">5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Inventory Value</span>
                <span className="text-sm font-medium">$89,450</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
