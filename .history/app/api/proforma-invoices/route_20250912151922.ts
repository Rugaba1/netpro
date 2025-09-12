import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const customerId = searchParams.get('customerId')
    const userId = searchParams.get('userId')

    const skip = (page - 1) * limit

    const where: any = {
      ...(customerId && { customer_id: parseInt(customerId) }),
      ...(userId && { user_id: parseInt(userId) })
    }

    const [proformaInvoices, total] = await Promise.all([
      prisma.proforma_invoice.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: true,
          users: {
            select: { username: true, email: true }
          },
          proforma_product: {
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
      prisma.proforma_invoice.count({ where })
    ])

    return NextResponse.json({
      proformaInvoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch proforma invoices' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { proforma_products, ...proformaData } = body

    const requiredFields = ['customer_id', 'start_date', 'end_date', 'user_id']
    const missingFields = requiredFields.filter(field => !proformaData[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    if (!proforma_products || proforma_products.length === 0) {
      return NextResponse.json(
        { error: 'Proforma invoice must have at least one product' },
        { status: 400 }
      )
    }

    const proformaInvoice = await prisma.proforma_invoice.create({
      data: {
        ...proformaData,
        proforma_product: {
          create: proforma_products.map((pp: any) => ({
            product_id: pp.product_id,
            qty: pp.qty || 1,
            price: pp.price,
            description: pp.description,
            notes: pp.notes,
            discount: pp.discount || 0,
            user_id: pp.user_id || proformaData.user_id
          }))
        }
      },
      include: {
        customer: true,
        users: {
          select: { username: true, email: true }
        },
        proforma_product: {
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

    return NextResponse.json(proformaInvoice, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create proforma invoice' },
      { status: 500 }
    )
  }
}