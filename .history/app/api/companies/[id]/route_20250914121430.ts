import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
// GET /api/companies/[id] - Get a specific company
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const company = await prisma.company.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        customer: true,
      },
    })

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ company })
  } catch (error) {
    console.error('Error fetching company:', error)
    return NextResponse.json(
      { error: 'Failed to fetch company' },
      { status: 500 }
    )
  }
}

// PUT /api/companies/[id] - Update a company
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if company exists
    const existingCompany = await prisma.company.findUnique({
      where: { id: parseInt(params.id) },
    })

    if (!existingCompany) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    // Check if TIN is being changed to one that already exists
    if (tin !== existingCompany.tin) {
      const companyWithSameTIN = await prisma.company.findUnique({
        where: { tin },
      })

      if (companyWithSameTIN) {
        return NextResponse.json(
          { error: 'Another company with this TIN already exists' },
          { status: 409 }
        )
      }
    }

    const company = await prisma.company.update({
      where: { id: parseInt(params.id) },
      data: {
        name,
        tin,
        phone,
        email,
        address,
      },
    })

    return NextResponse.json({ company })
  } catch (error) {
    console.error('Error updating company:', error)
    return NextResponse.json(
      { error: 'Failed to update company' },
      { status: 500 }
    )
  }
}

// DELETE /api/companies/[id] - Delete a company
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if company exists
    const existingCompany = await prisma.company.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        customer: true,
      },
    })

    if (!existingCompany) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    // Check if company has customers
    if (existingCompany.customer.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete company with associated customers. Please reassign or delete customers first.' 
        },
        { status: 409 }
      )
    }

    await prisma.company.delete({
      where: { id: parseInt(params.id) },
    })

    return NextResponse.json(
      { message: 'Company deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting company:', error)
    return NextResponse.json(
      { error: 'Failed to delete company' },
      { status: 500 }
    )
  }
}