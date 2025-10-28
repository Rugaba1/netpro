import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Fetch all sales with related data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const [sales, total] = await Promise.all([
      prisma.saleTransaction.findMany({
        skip,
        take: limit,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          SaleItem: {
            include: {
              item: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      }),
      prisma.saleTransaction.count(),
    ])

    return NextResponse.json({
      sales,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching sales:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sales' },
      { status: 500 }
    )
  }
}

// POST - Create new sale and update stock
export async function POST(request: NextRequest) {
  try {
    const { customer_id, sale_date, items } = await request.json()

    // Validate input
    if (!customer_id || !sale_date || !items || !items.length) {
      return NextResponse.json(
        { error: 'Customer ID, sale date, and items are required' },
        { status: 400 }
      )
    }

    // Calculate total price
    const total_price = items.reduce(
      (sum: number, item: any) => sum + (item.unit_price * item.qty),
      0
    )

    // Create sale transaction with items and update stock in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create sale transaction
      const saleTransaction = await tx.saleTransaction.create({
        data: {
          customer_id,
          total_price,
          sale_date: new Date(sale_date),
          SaleItem: {
            create: items.map((item: any) => ({
              item_id: item.item_id,
              qty: item.qty,
              unit_price: item.unit_price,
              total_price: item.unit_price * item.qty,
            })),
          },
        },
        include: {
          SaleItem: {
            include: {
              item: true,
            },
          },
        },
      })

      // 2. Update stock quantities
      for (const item of items) {
        await tx.stock_item.update({
          where: { id: item.item_id },
          data: {
            quantity: {
              decrement: item.qty,
            },
          },
        })
      }

      return saleTransaction
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating sale:', error)
    return NextResponse.json(
      { error: 'Failed to create sale' },
      { status: 500 }
    )
  }
}