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
          customer: true,
          users: {
            select: { username: true, email: true }
          },
          invoice_product: {
            include: {
              product: {
                include: {
                  package_type: true,
                  product_type: true
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
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}

// CREATE invoice with products
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { invoice_products, ...invoiceData } = body

    // Validate required fields
    const requiredFields = ['customer_id', 'amount_to_pay', 'start_date', 'end_date', 'user_id']
    const missingFields = requiredFields.filter(field => !invoiceData[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    if (!invoice_products || invoice_products.length === 0) {
      return NextResponse.json(
        { error: 'Invoice must have at least one product' },
        { status: 400 }
      )
    }

    const invoice = await prisma.invoice.create({
      data: {
        ...invoiceData,
        invoice_product: {
          create: invoice_products.map((ip: any) => ({
            product_id: ip.product_id,
            qty: ip.qty || 1,
            user_id: ip.user_id || invoiceData.user_id
          }))
        }
      },
      include: {
        customer: true,
        users: {
          select: { username: true, email: true }
        },
        invoice_product: {
          include: {
            product: {
              include: {
                package_type: true,
                product_type: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}