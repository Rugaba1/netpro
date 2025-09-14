import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
// GET /api/companies - Get all companies
export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      include: {
        customer: true,
      },
      orderBy: {
        name: 'asc',
      },
    })
    return NextResponse.json({ companies })
  } catch (error) {
    console.error('Error fetching companies:', error)
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    )
  }
}

// POST /api/companies - Create a new company
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, tin, phone, email, address } = body

    // Validate required fields
    if (!name || !tin || !phone || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if TIN already exists
    const existingCompany = await prisma.company.findUnique({
      where: { tin },
    })

    if (existingCompany) {
      return NextResponse.json(
        { error: 'Company with this TIN already exists' },
        { status: 409 }
      )
    }

    const company = await prisma.company.create({
      data: {
        name,
        tin,
        phone,
        email,
        address,
      },
    })

    return NextResponse.json({ company }, { status: 201 })
  } catch (error) {
    console.error('Error creating company:', error)
    return NextResponse.json(
      { error: 'Failed to create company' },
      { status: 500 }
    )
  }
}