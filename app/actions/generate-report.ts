'use server';

import { prisma } from '@/lib/prisma';

interface ReportFilters {
  reportType: string;
  dateRange: string;
  startDate?: string;
  endDate?: string;
}

export async function generateReport(filters: ReportFilters) {
  try {
    const { reportType, dateRange, startDate, endDate } = filters;
    
    // Calculate date range based on selection
    let dateFrom: Date;
    let dateTo: Date = new Date();

    switch (dateRange) {
      case 'daily':
        dateFrom = new Date();
        dateFrom.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - 7);
        break;
      case 'monthly':
        dateFrom = new Date();
        dateFrom.setMonth(dateFrom.getMonth() - 1);
        break;
      case 'quarterly':
        dateFrom = new Date();
        dateFrom.setMonth(dateFrom.getMonth() - 3);
        break;
      case 'yearly':
        dateFrom = new Date();
        dateFrom.setFullYear(dateFrom.getFullYear() - 1);
        break;
      case 'custom':
        dateFrom = startDate ? new Date(startDate) : new Date();
        dateTo = endDate ? new Date(endDate) : new Date();
        break;
      default:
        dateFrom = new Date();
        dateFrom.setMonth(dateFrom.getMonth() - 1);
    }

    let reportData: any = null;

    switch (reportType) {
      case 'income':
        reportData = await generateIncomeReport(dateFrom, dateTo);
        break;
      case 'expenses':
        reportData = await generateExpenseReport(dateFrom, dateTo);
        break;
      case 'sales':
        reportData = await generateSalesReport(dateFrom, dateTo);
        break;
      case 'inventory':
        reportData = await generateInventoryReport();
        break;
      case 'cashpower':
        reportData = await generateCashpowerReport(dateFrom, dateTo);
        break;
      case 'customer':
        reportData = await generateCustomerReport(dateFrom, dateTo);
        break;
      default:
        throw new Error('Invalid report type');
    }

    return {
      success: true,
      data: reportData,
      filters: {
        reportType,
        dateRange,
        startDate: dateFrom.toISOString().split('T')[0],
        endDate: dateTo.toISOString().split('T')[0]
      }
    };
  } catch (error) {
    console.error('Error generating report:', error);
    return {
      success: false,
      error: 'Failed to generate report',
      data: null
    };
  }
}

async function generateIncomeReport(dateFrom: Date, dateTo: Date) {
  // Get paid invoices within date range
  const paidInvoices = await prisma.invoice.findMany({
    where: {
      status: 'paid',
      created_at: {
        gte: dateFrom,
        lte: dateTo
      }
    },
    include: {
      customer: true,
      invoice_stock_item: {
        include: {
          item: true
        }
      }
    },
    orderBy: {
      created_at: 'desc'
    }
  });

  // Calculate total income
  const totalIncome = paidInvoices.reduce((sum, invoice) => {
    return sum + Number(invoice.amount_paid);
  }, 0);

  // Group by month for chart data
  const monthlyData = await getMonthlyData(dateFrom, dateTo, 'income');

  return {
    totalIncome,
    invoices: paidInvoices,
    monthlyData,
    type: 'income'
  };
}

async function generateExpenseReport(dateFrom: Date, dateTo: Date) {
  // This would typically come from your expense tracking system
  // For now, we'll use a placeholder or you can integrate with your expense records
  const expenses = await prisma.stock_item.findMany({
    where: {
      created_at: {
        gte: dateFrom,
        lte: dateTo
      }
    },
    include: {
      supplier: true
    }
  });

  const totalExpenses = expenses.reduce((sum, item) => {
    // Assuming cost is stored somewhere, this is a placeholder
    return sum + (Number(item.quantity) * 10000); // Example calculation
  }, 0);

  const monthlyData = await getMonthlyData(dateFrom, dateTo, 'expenses');

  return {
    totalExpenses,
    expenses,
    monthlyData,
    type: 'expenses'
  };
}

async function generateSalesReport(dateFrom: Date, dateTo: Date) {
  const salesData = await prisma.invoice_stock_item.findMany({
    where: {
      created_at: {
        gte: dateFrom,
        lte: dateTo
      }
    },
    include: {
      item: {
        include: {
          product: true,
          stock_items_category:true
        }
      },
      invoice: {
        include: {
          customer: true
        }
      },
      
    },
    orderBy: {
      created_at: 'desc'
    }
  });

  // Group by category
  const categoryData = salesData.reduce((acc: any, item) => {
    const category = item.item.stock_items_category?.name || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += Number(item.item.product?.price || 0) * item.qty;
    return acc;
  }, {});

  const monthlyData = await getMonthlyData(dateFrom, dateTo, 'sales');

  return {
    totalSales: salesData.reduce((sum, item) => sum + (Number(item.item.product?.price || 0) * item.qty), 0),
    salesData,
    categoryData: Object.entries(categoryData).map(([name, value]) => ({
      name,
      value: Number(value),
      color: getColorForCategory(name)
    })),
    monthlyData,
    type: 'sales'
  };
}

async function generateInventoryReport() {
  const inventory = await prisma.stock_item.findMany({
    include: {
      product: true,
      supplier: true,
      stock_items_category: true
    },
    orderBy: {
      quantity: 'asc'
    }
  });

  const lowStock = inventory.filter(item => item.quantity <= item.reorder_level);
  const outOfStock = inventory.filter(item => item.quantity === 0);

  return {
    totalItems: inventory.length,
    lowStockCount: lowStock.length,
    outOfStockCount: outOfStock.length,
    inventory,
    lowStock,
    outOfStock,
    type: 'inventory'
  };
}

async function generateCashpowerReport(dateFrom: Date, dateTo: Date) {
  const cashpowerTransactions = await prisma.cash_power_transaction.findMany({
    where: {
      created_at: {
        gte: dateFrom,
        lte: dateTo
      }
    },
    include: {
      customer: true
    },
    orderBy: {
      created_at: 'desc'
    }
  });

  const totalCommission = cashpowerTransactions.reduce((sum, transaction) => {
    return sum + Number(transaction.commission || 0);
  }, 0);

  const totalAmount = cashpowerTransactions.reduce((sum, transaction) => {
    return sum + Number(transaction.amount);
  }, 0);

  const monthlyData = await getMonthlyData(dateFrom, dateTo, 'cashpower');

  return {
    totalCommission,
    totalAmount,
    transactions: cashpowerTransactions,
    monthlyData,
    type: 'cashpower'
  };
}

async function generateCustomerReport(dateFrom: Date, dateTo: Date) {
  const customers = await prisma.customer.findMany({
    include: {
      company: true,
      invoice: {
        where: {
          created_at: {
            gte: dateFrom,
            lte: dateTo
          }
        }
      }
    },
    orderBy: {
      created_at: 'desc'
    }
  });

  // Calculate customer activity
  const activeCustomers = customers.filter(customer => customer.invoice.length > 0);
  const newCustomers = customers.filter(customer => 
    customer.created_at >= dateFrom && customer.created_at <= dateTo
  );

  return {
    totalCustomers: customers.length,
    activeCustomers: activeCustomers.length,
    newCustomers: newCustomers.length,
    customers,
    type: 'customer'
  };
}

async function getMonthlyData(dateFrom: Date, dateTo: Date, type: string) {
  // Generate monthly data for charts
  const months = [];
  const current = new Date(dateFrom);
  
  while (current <= dateTo) {
    months.push(new Date(current));
    current.setMonth(current.getMonth() + 1);
  }

  const monthlyData = await Promise.all(
    months.map(async (month) => {
      const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

      let value = 0;

      switch (type) {
        case 'income':
          const monthInvoices = await prisma.invoice.aggregate({
            where: {
              status: 'paid',
              created_at: {
                gte: monthStart,
                lte: monthEnd
              }
            },
            _sum: {
              amount_paid: true
            }
          });
          value = Number(monthInvoices._sum.amount_paid || 0);
          break;
        case 'sales':
          const monthSales = await prisma.invoice_stock_item.aggregate({
            where: {
              created_at: {
                gte: monthStart,
                lte: monthEnd
              }
            },
            _sum: {
              // This would need to be calculated based on your pricing
            }
          });
          // Simplified calculation
          value = Math.random() * 100000;
          break;
        // Add other types as needed
      }

      return {
        month: month.toLocaleString('default', { month: 'short' }),
        value: value
      };
    })
  );

  return monthlyData;
}

function getColorForCategory(category: string): string {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  const index = category.charCodeAt(0) % colors.length;
  return colors[index];
}