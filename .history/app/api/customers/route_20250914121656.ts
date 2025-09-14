import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { tr } from 'zod/v4/locales'

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
          company:true,
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
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, billing_name, tin, phone, service_number, company_id, user_id } = body

    // Validate required fields
    if (!name || !billing_name || !tin || !phone || !service_number) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if service number already exists
    const existingCustomer = await prisma.customer.findFirst({
      where: { service_number },
    })

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Customer with this service number already exists' },
        { status: 409 }
      )
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        billing_name,
        tin,
        phone,
        service_number,
        company_id: company_id ? parseInt(company_id) : null,
        user_id: user_id ? parseInt(user_id) : null,
      },
      include: {
        company: true,
      },
    })

    return NextResponse.json({ customer }, { status: 201 })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    )
  }
}