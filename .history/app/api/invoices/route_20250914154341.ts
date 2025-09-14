import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all invoices
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const customerId = searchParams.get('customerId')
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const skip = (page - 1) * limit

    const where: any = {
      ...(customerId && { customer_id: parseInt(customerId) }),
      ...(userId && { user_id: parseInt(userId) })
    }

    if (startDate && endDate) {
      where.created_at = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: {
            include: {
              company: true
            }
          },
          invoice_stock_item: {
            include: {
              item: {
                include: {
                  product: {
                    include: {
                      Renamedpackage: true,
                      product_type: true
                    }
                  },
                  supplier: true
                }
              }
            }
          }
        },
        orderBy: { created_at: 'desc' }
      }),
      prisma.invoice.count({ where })
    ])

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}


// CREATE invoice with stock items
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { invoice_stock_items, ...invoiceData } = body

    // Validate required fields
    const requiredFields = ['customer_id', 'amount_to_pay', 'start_date', 'end_date']
    const missingFields = requiredFields.filter(field => !invoiceData[field])
    
    if (missingFields.length > 0) {
      console.log(`Missing required fields: ${missingFields.join(', ')}` )
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    if (!invoice_stock_items || invoice_stock_items.length === 0) {
      return NextResponse.json(
        { error: 'Invoice must have at least one stock item' },
        { status: 400 }
      )
    }

    // Calculate total amount if not provided
    if (!invoiceData.amount_to_pay) {
      // You might want to calculate this based on the items
      invoiceData.amount_to_pay = 0
    }

    // Set default status if not provided
    if (!invoiceData.status) {
      invoiceData.status = invoiceData.amount_paid === invoiceData.amount_to_pay 
        ? 'paid' 
        : invoiceData.amount_paid > 0 
          ? 'partial' 
          : 'unpaid'
    }

    const invoice = await prisma.invoice.create({
      data: {
        ...invoiceData,
        invoice_stock_item: {
          create: invoice_stock_items.map((isi: any) => ({
            item_id: isi.item_id,
            qty: isi.qty || 1,
            customer_id: isi.customer_id || invoiceData.customer_id,
            user_id: isi.user_id || invoiceData.user_id
          }))
        }
      },
      include: {
        customer: {
          include: {
            company: true
          }
        },
        invoice_stock_item: {
          include: {
            item: {
              include: {
                product: {
                  include: {
                    Renamedpackage: true,
                    product_type: true
                  }
                },
                supplier: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}