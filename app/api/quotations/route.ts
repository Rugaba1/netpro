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

    const [quotations, total] = await Promise.all([
      prisma.quotation.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: true,
          users: {
            select: { username: true, email: true }
          },
          quotation_product: {
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
      prisma.quotation.count({ where })
    ])

    return NextResponse.json({
      quotations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch quotations' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { quotation_products, ...quotationData } = body

    const requiredFields = ['customer_id', 'user_id']
    const missingFields = requiredFields.filter(field => !quotationData[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    if (!quotation_products || quotation_products.length === 0) {
      return NextResponse.json(
        { error: 'Quotation must have at least one product' },
        { status: 400 }
      )
    }

    const quotation = await prisma.quotation.create({
      data: {
        ...quotationData,
        quotation_product: {
          create: quotation_products.map((qp: any) => ({
            product_id: qp.product_id,
            qty: qp.qty || 1,
            price: qp.price,
            discount: qp.discount || 0,
            notes: qp.notes,
            user_id: qp.user_id || quotationData.user_id
          }))
        }
      },
      include: {
        customer: true,
        users: {
          select: { username: true, email: true }
        },
        quotation_product: {
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

    return NextResponse.json(quotation, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create quotation' },
      { status: 500 }
    )
  }
}