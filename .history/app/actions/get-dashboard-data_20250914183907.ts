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
      expiringInvoices
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
      })
    ]);

    // Calculate total revenue from paid invoices
    const revenueData = await prisma.invoice.aggregate({
      where: { status: 'paid' },
      _sum: { amount_paid: true }
    });

    const totalRevenue = revenueData._sum.amount_paid || 0;

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
          monthlyRevenue: monthlyRevenue
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