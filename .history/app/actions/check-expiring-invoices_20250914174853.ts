'use server';

import { prisma } from '@/lib/prisma';

export async function checkExpiringInvoices() {
  try {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    // Find invoices that expire in the next 3 days and are not paid
    const expiringInvoices = await prisma.master_invoice.findMany({
      where: {
        end_date: {
          lte: threeDaysFromNow,
          gte: new Date(), // Ensure it's not already expired
        },
        status: {
          not: 'paid', // Only show notifications for unpaid or partially paid invoices
        },
      },
      include: {
        customer: true,
        company: true,
        invoice_items: {
          include: {
            item: true,
          },
        },
      },
      orderBy: {
        end_date: 'asc',
      },
    });

    return {
      success: true,
      invoices: expiringInvoices,
      count: expiringInvoices.length,
    };
  } catch (error) {
    console.error('Error checking expiring invoices:', error);
    return {
      success: false,
      invoices: [],
      count: 0,
      error: 'Failed to check expiring invoices',
    };
  }
}