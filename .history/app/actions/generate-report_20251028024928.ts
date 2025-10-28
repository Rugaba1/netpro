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
      case 'products':
        reportData = await generateProductReport(dateFrom, dateTo);
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
  // Get all invoices within date range
  const invoices = await prisma.invoice.findMany({
    where: {
      created_at: {
        gte: dateFrom,
        lte: dateTo
      }
    },
    include: {
      customer: true,
      invoice_stock_item: {
        include: {
          item: {
            include: {
              product: true
            }
          }
        }
      }
    },
    orderBy: {
      created_at: 'desc'
    }
  });

  const paidInvoices = invoices.filter(inv => inv.status === 'paid');
  const pendingInvoices = invoices.filter(inv => inv.status === 'pending');

  const totalIncome = paidInvoices.reduce((sum, invoice) => {
    return sum + Number(invoice.amount_paid);
  }, 0);

  const totalReceivable = pendingInvoices.reduce((sum, invoice) => {
    return sum + (Number(invoice.amount_to_pay) - Number(invoice.amount_paid));
  }, 0);

  const monthlyData = await getMonthlyInvoiceData(dateFrom, dateTo);
  const customerData = await getCustomerIncomeData(dateFrom, dateTo);

  return {
    totalIncome,
    totalReceivable,
    paidInvoices: paidInvoices.length,
    pendingInvoices: pendingInvoices.length,
    invoices,
    monthlyData,
    customerData,
    type: 'income'
  };
}

async function generateExpenseReport(dateFrom: Date, dateTo: Date) {
  // Get stock items added in date range (as procurement expense)
  const stockItems = await prisma.stock_item.findMany({
    where: {
      created_at: {
        gte: dateFrom,
        lte: dateTo
      }
    },
    include: {
      supplier: true,
      product: true,
      stock_items_category: true
    }
  });

  // Calculate total procurement cost (estimated)
  const totalExpenses = stockItems.reduce((sum, item) => {
    // Use product price as procurement cost estimate
    const cost = Number(item.product?.price || 10000) * item.quantity;
    return sum + cost;
  }, 0);

  const monthlyData = await getMonthlyExpenseData(dateFrom, dateTo);
  const supplierData = await getSupplierExpenseData(dateFrom, dateTo);

  return {
    totalExpenses,
    stockItems,
    monthlyData,
    supplierData,
    type: 'expenses'
  };
}

async function generateSalesReport(dateFrom: Date, dateTo: Date) {
  const saleTransactions = await prisma.saleTransaction.findMany({
    where: {
      sale_date: {
        gte: dateFrom,
        lte: dateTo
      }
    },
    include: {
      customer: true,
      SaleItem: {
        include: {
          item: {
            include: {
              product: true,
              stock_items_category: true
            }
          }
        }
      }
    },
    orderBy: {
      sale_date: 'desc'
    }
  });

  const totalSales = saleTransactions.reduce((sum, transaction) => {
    return sum + Number(transaction.total_price);
  }, 0);

  const totalItemsSold = saleTransactions.reduce((sum, transaction) => {
    return sum + transaction.SaleItem.reduce((itemSum, item) => itemSum + item.qty, 0);
  }, 0);

  // Category sales data
  const categorySales: Record<string, number> = {};
  saleTransactions.forEach(transaction => {
    transaction.SaleItem.forEach(item => {
      const category = item.item.stock_items_category?.name || 'Uncategorized';
      const value = Number(item.total_price);
      categorySales[category] = (categorySales[category] || 0) + value;
    });
  });

  const monthlyData = await getMonthlySalesData(dateFrom, dateTo);
  const categoryData = Object.entries(categorySales).map(([name, value]) => ({
    name,
    value,
    color: getColorForCategory(name)
  }));

  return {
    totalSales,
    totalItemsSold,
    totalTransactions: saleTransactions.length,
    averageTransaction: totalSales / saleTransactions.length,
    saleTransactions,
    monthlyData,
    categoryData,
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

  const lowStock = inventory.filter(item => item.quantity <= item.reorder_level && item.quantity > 0);
  const outOfStock = inventory.filter(item => item.quantity === 0);
  const healthyStock = inventory.filter(item => item.quantity > item.reorder_level);

  const totalValue = inventory.reduce((sum, item) => {
    return sum + (Number(item.product?.price || 0) * item.quantity);
  }, 0);

  // Category distribution
  const categoryData = inventory.reduce((acc: Record<string, number>, item) => {
    const category = item.stock_items_category.name;
    acc[category] = (acc[category] || 0) + item.quantity;
    return acc;
  }, {});

  return {
    totalItems: inventory.length,
    lowStockCount: lowStock.length,
    outOfStockCount: outOfStock.length,
    healthyStockCount: healthyStock.length,
    totalValue,
    inventory,
    lowStock,
    outOfStock,
    categoryData: Object.entries(categoryData).map(([name, value]) => ({
      name,
      value,
      color: getColorForCategory(name)
    })),
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

  const successfulTransactions = cashpowerTransactions.filter(t => t.status === 'success');
  const failedTransactions = cashpowerTransactions.filter(t => t.status === 'failed');

  const monthlyData = await getMonthlyCashpowerData(dateFrom, dateTo);

  return {
    totalCommission,
    totalAmount,
    totalTransactions: cashpowerTransactions.length,
    successfulTransactions: successfulTransactions.length,
    failedTransactions: failedTransactions.length,
    successRate: (successfulTransactions.length / cashpowerTransactions.length) * 100,
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
      },
      SaleTransaction: {
        where: {
          sale_date: {
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

  const newCustomers = customers.filter(customer => 
    customer.created_at && customer.created_at >= dateFrom && customer.created_at <= dateTo
  );

  const activeCustomers = customers.filter(customer => 
    customer.invoice.length > 0 || customer.SaleTransaction.length > 0
  );

  // Customer value analysis
  const customerValue = customers.map(customer => {
    const invoiceValue = customer.invoice.reduce((sum, inv) => sum + Number(inv.amount_paid), 0);
    const salesValue = customer.SaleTransaction.reduce((sum, sale) => sum + Number(sale.total_price), 0);
    return {
      customer,
      totalValue: invoiceValue + salesValue,
      transactionCount: customer.invoice.length + customer.SaleTransaction.length
    };
  });

  const topCustomers = customerValue
    .filter(cv => cv.totalValue > 0)
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 10);

  return {
    totalCustomers: customers.length,
    activeCustomers: activeCustomers.length,
    newCustomers: newCustomers.length,
    inactiveCustomers: customers.length - activeCustomers.length,
    topCustomers,
    customers: customerValue,
    type: 'customer'
  };
}

async function generateProductReport(dateFrom: Date, dateTo: Date) {
  const products = await prisma.product.findMany({
    include: {
      product_type: true,
      Renamedpackage: true,
      stock_item: {
        include: {
          SaleItem: {
            where: {
              created_at: {
                gte: dateFrom,
                lte: dateTo
              }
            }
          }
        }
      }
    }
  });

  const productPerformance = products.map(product => {
    const totalSales = product.stock_item.reduce((sum, stockItem) => {
      return sum + stockItem.SaleItem.reduce((itemSum, saleItem) => 
        itemSum + Number(saleItem.total_price), 0
      );
    }, 0);

    const totalUnitsSold = product.stock_item.reduce((sum, stockItem) => {
      return sum + stockItem.SaleItem.reduce((itemSum, saleItem) => 
        itemSum + saleItem.qty, 0
      );
    }, 0);

    return {
      product,
      totalSales,
      totalUnitsSold,
      revenuePerUnit: totalUnitsSold > 0 ? totalSales / totalUnitsSold : 0
    };
  });

  const topProducts = productPerformance
    .filter(pp => pp.totalSales > 0)
    .sort((a, b) => b.totalSales - a.totalSales);

  const categoryPerformance = products.reduce((acc: Record<string, any>, product) => {
    const type = product.product_type.name;
    if (!acc[type]) {
      acc[type] = { totalSales: 0, totalUnits: 0, products: 0 };
    }
    const performance = productPerformance.find(pp => pp.product.id === product.id);
    acc[type].totalSales += performance?.totalSales || 0;
    acc[type].totalUnits += performance?.totalUnitsSold || 0;
    acc[type].products += 1;
    return acc;
  }, {});

  return {
    totalProducts: products.length,
    activeProducts: productPerformance.filter(pp => pp.totalSales > 0).length,
    totalRevenue: productPerformance.reduce((sum, pp) => sum + pp.totalSales, 0),
    topProducts: topProducts.slice(0, 10),
    categoryPerformance: Object.entries(categoryPerformance).map(([name, data]) => ({
      name,
      value: data.totalSales,
      units: data.totalUnits,
      products: data.products,
      color: getColorForCategory(name)
    })),
    productPerformance,
    type: 'products'
  };
}

// Helper functions for monthly data
async function getMonthlySalesData(dateFrom: Date, dateTo: Date) {
  const sales = await prisma.saleTransaction.findMany({
    where: {
      sale_date: {
        gte: dateFrom,
        lte: dateTo
      }
    },
    select: {
      sale_date: true,
      total_price: true
    }
  });

  const monthlyData: Record<string, number> = {};
  sales.forEach(sale => {
    const month = sale.sale_date.toLocaleString('default', { month: 'short', year: 'numeric' });
    monthlyData[month] = (monthlyData[month] || 0) + Number(sale.total_price);
  });

  return Object.entries(monthlyData).map(([month, value]) => ({ month, value }));
}

async function getMonthlyInvoiceData(dateFrom: Date, dateTo: Date) {
  const invoices = await prisma.invoice.findMany({
    where: {
      created_at: {
        gte: dateFrom,
        lte: dateTo
      },
      status: 'paid'
    },
    select: {
      created_at: true,
      amount_paid: true
    }
  });

  const monthlyData: Record<string, number> = {};
  invoices.forEach(invoice => {
    if (!invoice.created_at) return;
    const month = invoice.created_at.toLocaleString('default', { month: 'short', year: 'numeric' });
    monthlyData[month] = (monthlyData[month] || 0) + Number(invoice.amount_paid);
  });

  return Object.entries(monthlyData).map(([month, value]) => ({ month, value }));
}

async function getMonthlyCashpowerData(dateFrom: Date, dateTo: Date) {
  const transactions = await prisma.cash_power_transaction.findMany({
    where: {
      created_at: {
        gte: dateFrom,
        lte: dateTo
      }
    },
    select: {
      created_at: true,
      amount: true,
      commission: true
    }
  });

  const monthlyData: Record<string, { amount: number; commission: number }> = {};
  transactions.forEach(transaction => {
    if (!transaction.created_at) return;
    const month = transaction.created_at.toLocaleString('default', { month: 'short', year: 'numeric' });
    if (!monthlyData[month]) {
      monthlyData[month] = { amount: 0, commission: 0 };
    }
    monthlyData[month].amount += Number(transaction.amount);
    monthlyData[month].commission += Number(transaction.commission || 0);
  });

  return Object.entries(monthlyData).map(([month, data]) => ({
    month,
    amount: data.amount,
    commission: data.commission
  }));
}

async function getMonthlyExpenseData(dateFrom: Date, dateTo: Date) {
  const stockItems = await prisma.stock_item.findMany({
    where: {
      created_at: {
        gte: dateFrom,
        lte: dateTo
      }
    },
    include: {
      product: true
    }
  });

  const monthlyData: Record<string, number> = {};
  stockItems.forEach(item => {
    if (!item.created_at) return;
    const month = item.created_at.toLocaleString('default', { month: 'short', year: 'numeric' });
    const cost = Number(item.product?.price || 10000) * item.quantity;
    monthlyData[month] = (monthlyData[month] || 0) + cost;
  });

  return Object.entries(monthlyData).map(([month, value]) => ({ month, value }));
}

async function getCustomerIncomeData(dateFrom: Date, dateTo: Date) {
  const invoices = await prisma.invoice.findMany({
    where: {
      created_at: {
        gte: dateFrom,
        lte: dateTo
      },
      status: 'paid'
    },
    include: {
      customer: true
    }
  });

  const customerData: Record<string, number> = {};
  invoices.forEach(invoice => {
    const customerName = invoice.customer.name;
    customerData[customerName] = (customerData[customerName] || 0) + Number(invoice.amount_paid);
  });

  return Object.entries(customerData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
}

async function getSupplierExpenseData(dateFrom: Date, dateTo: Date) {
  const stockItems = await prisma.stock_item.findMany({
    where: {
      created_at: {
        gte: dateFrom,
        lte: dateTo
      }
    },
    include: {
      supplier: true,
      product: true
    }
  });

  const supplierData: Record<string, number> = {};
  stockItems.forEach(item => {
    const supplierName = item.supplier.name;
    const cost = Number(item.product?.price || 10000) * item.quantity;
    supplierData[supplierName] = (supplierData[supplierName] || 0) + cost;
  });

  return Object.entries(supplierData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
}

function getColorForCategory(category: string): string {
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];
  const index = Math.abs(category.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % colors.length;
  return colors[index];
}