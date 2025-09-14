import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all invoices with relations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const customerId = searchParams.get('customerId') || '';
    
    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: any = {};
    
    if (search) {
      where.OR = [
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { billing_name: { contains: search, mode: 'insensitive' } } },
        { invoice_stock_item: { some: { item: { name: { contains: search, mode: 'insensitive' } } } } },
      ];
    }
    
    if (status) {
      where.status = status;
    }
    
    if (customerId) {
      where.customer_id = parseInt(customerId);
    }

    // Get invoices with relations
    const invoices = await prisma.invoice.findMany({
      where,
      skip,
      take: limit,
      include: {
        customer: {
          include: {
            company: true,
          },
        },
        invoice_stock_item: {
          include: {
            item: {
              include: {
                product: {
                  include: {
                    Renamedpackage:true,
                    product_type: true,
                  },
                },
                supplier: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Get total count for pagination
    const total = await prisma.invoice.count({ where });

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

// POST create a new invoice (individual or consolidated)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      customer_id,
      amount_paid,
      amount_to_pay,
      start_date,
      end_date,
      status,
      payment_method,
      is_consolidated,
      invoice_stock_items
    } = body;

    // Validate required fields
    if (!customer_id || !start_date || !end_date || !invoice_stock_items || invoice_stock_items.length === 0) {
      return NextResponse.json(
        { error: 'Customer, dates, and at least one stock item are required' },
        { status: 400 }
      );
    }

    // Create new invoice with transaction to ensure data consistency
    const invoice = await prisma.$transaction(async (tx) => {
      // Create the invoice
      const newInvoice = await tx.invoice.create({
        data: {
          customer_id: parseInt(customer_id),
          amount_paid: parseFloat(amount_paid) || 0,
          amount_to_pay: parseFloat(amount_to_pay) || 0,
          start_date: new Date(start_date),
          end_date: new Date(end_date),
          status: status || 'unpaid',
          payment_method: payment_method || '',
          is_consolidated: is_consolidated || false,
        },
      });

      // Create invoice stock items
      const invoiceItems = await Promise.all(
        invoice_stock_items.map(async (item: any) => {
          return tx.invoice_stock_item.create({
            data: {
              invoice_id: newInvoice.id,
              item_id: parseInt(item.item_id),
              qty: parseInt(item.qty) || 1,
              
              user_id: parseInt(item.user_id) || 1,  
            },
            include: {
              item: {
                include: {
                  product: true,
                  supplier: true,
                },
              },
            },
          });
        })
      );

      return {
        ...newInvoice,
        invoice_stock_item: invoiceItems,
      };
    });

    // Fetch the complete invoice with all relations
    const completeInvoice = await prisma.invoice.findUnique({
      where: { id: invoice.id },
      include: {
        customer: {
          include: {
            company: true,
          },
        },
        invoice_stock_item: {
          include: {
            item: {
              include: {
                product: {
                  include: {
                    Renamedpackage: true,
                    product_type: true,
                  },
                },
                supplier: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(completeInvoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}