'use server';

import { prisma } from '@/lib/prisma';

export async function getDashboardData() {
  try {
    // Get counts for all major entities
    const [
      totalCustomers,
      totalPackages,
      totalProducts,
      totalReports,
      totalInvoices,
      totalStockItems,
      totalSuppliers,
      totalQuotations,
      totalProformaInvoices,
      recentInvoices,
      lowStockItems,
      expiringInvoices,
      totalMonthlyRevenue,
      totalSales
    ] = await Promise.all([
      // Basic counts
      prisma.customer.count(),
      prisma.renamedpackage.count(),
      prisma.product.count(),
      prisma.invoice.count({ where: { status: 'paid' } }), // Using paid invoices as "reports"
      
      // Additional counts for more comprehensive dashboard
      prisma.invoice.count(),
      prisma.stock_item.count(),
      prisma.supplier.count(),
      prisma.quotation.count(),
      prisma.proforma_invoice.count(),
      
      // Recent invoices (last 7 days)
      prisma.invoice.findMany({
        where: {
          created_at: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
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
        },
        take: 5
      }),
      
      // Low stock items
      prisma.stock_item.findMany({
        where: {
          OR: [
            { quantity: { lte: 10 } },
            { 
              AND: [
                { reorder_level: { gt: 0 } },
                { quantity: { lte: prisma.stock_item.fields.reorder_level } }
              ]
            }
          ]
        },
        include: {
          product: true,
          supplier: true
        },
        orderBy: {
          quantity: 'asc'
        },
        take: 5
      }),
      
      // Invoices expiring soon (within 3 days)
      prisma.master_invoice.findMany({
        where: {
          end_date: {
            lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            gte: new Date()
          },
          status: {
            not: 'paid'
          }
        },
        include: {
          customer: true,
          company: true
        },
        take: 5
      }),
      (async () => {
        const invoiceAgg = await prisma.invoice.aggregate({
          where: { status: 'paid', created_at: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
          _sum: { amount_paid: true }
        });
        const saleAgg = await prisma.saleTransaction.aggregate({
          where: { created_at: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
          _sum: { total_price: true }
        });
        const invoiceSum = invoiceAgg._sum.amount_paid
          ? typeof invoiceAgg._sum.amount_paid.toNumber === 'function'
            ? invoiceAgg._sum.amount_paid.toNumber()
            : Number(invoiceAgg._sum.amount_paid)
          : 0;
        const saleSum = saleAgg._sum.total_price
          ? typeof saleAgg._sum.total_price.toNumber === 'function'
            ? saleAgg._sum.total_price.toNumber()
            : Number(saleAgg._sum.total_price)
          : 0;
        return invoiceSum + saleSum;
      })(),
      prisma.saleTransaction.aggregate({
        _sum: { total_price: true }
      }).then(res => {
        return res._sum.total_price
          ? typeof res._sum.total_price.toNumber === 'function'
            ? res._sum.total_price.toNumber()
            : Number(res._sum.total_price)
          : 0;
      })
    ]);

    // Calculate total revenue from paid invoices
    const invoiceAggregate = await prisma.invoice.aggregate({
      where: { status: 'paid' },
      _sum: { amount_paid: true }
    });
    const saleTransactionAggregate = await prisma.saleTransaction.aggregate({
      _sum: { total_price: true }
    });

    const invoiceAmountPaid =
      invoiceAggregate._sum.amount_paid
        ? typeof invoiceAggregate._sum.amount_paid.toNumber === 'function'
          ? invoiceAggregate._sum.amount_paid.toNumber()
          : Number(invoiceAggregate._sum.amount_paid)
        : 0;

    const saleTransactionTotalPrice =
      saleTransactionAggregate._sum.total_price
        ? typeof saleTransactionAggregate._sum.total_price.toNumber === 'function'
          ? saleTransactionAggregate._sum.total_price.toNumber()
          : Number(saleTransactionAggregate._sum.total_price)
        : 0;

    const totalRevenue = invoiceAmountPaid + saleTransactionTotalPrice;

    // Calculate monthly revenue
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);

    const monthlyRevenueData = await prisma.invoice.aggregate({
      where: { 
        status: 'paid',
        created_at: { gte: currentMonthStart }
      },
      _sum: { amount_paid: true }
    });

    const monthlyRevenue = monthlyRevenueData._sum.amount_paid || 0;

    return {
      success: true,
      data: {
        totals: {
          customers: totalCustomers,
          packages: totalPackages,
          products: totalProducts,
          reports: totalReports,
          invoices: totalInvoices,
          stockItems: totalStockItems,
          suppliers: totalSuppliers,
          quotations: totalQuotations,
          proformaInvoices: totalProformaInvoices,
          revenue: totalRevenue,
          monthlyRevenue: monthlyRevenue,
          monthlySales:totalMonthlyRevenue,
          totalSales: totalSales
        },
        recentInvoices,
        lowStockItems,
        expiringInvoices
      }
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return {
      success: false,
      error: 'Failed to fetch dashboard data',
      data: null
    };
  }
}