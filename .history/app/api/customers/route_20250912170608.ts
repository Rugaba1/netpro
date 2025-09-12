import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all customers with pagination and filtering
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const userId = searchParams.get('userId')

    const skip = (page - 1) * limit

    const where = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { billing_name: { contains: search, mode: 'insensitive' } },
          { tin: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { service_number: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(userId && { user_id: parseInt(userId) })
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        include: {
          users: {
            select: { username: true, email: true }
          },
          _count: {
            select: {
              invoice: true,
              proforma_invoice: true,
              quotation: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      }),
      prisma.customer.count({ where })
    ])

    return NextResponse.json({
      customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

// CREATE new customer
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log("Request Body:", body) // Debugging line
    
    // Validate required fields
    const requiredFields = ['name', 'billing_name', 'tin', 'phone', 'service_number', 'user_id']
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    const customer = await prisma.customer.create({
      data: {
        name: body.name,
        billing_name: body.billing_name,
        tin: body.tin,
        phone: body.phone,
        service_number: body.service_number,
        user_id: body.user_id
      },
      include: {
        users: {
          select: { username: true, email: true }
        }
      }
    })
    
    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error("Error creating customer:", error) // Debugging line
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    )
  }
}