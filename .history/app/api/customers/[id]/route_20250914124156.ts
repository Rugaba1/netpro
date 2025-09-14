import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/customers/[id] - Get a specific customer
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        company: true,
        users: true,
      },
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ customer })
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    )
  }
}

// PUT /api/customers/[id] - Update a customer
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: parseInt(params.id) },
    })

    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Check if service number is being changed to one that already exists
    if (service_number !== existingCustomer.service_number) {
      const customerWithSameServiceNumber = await prisma.customer.findFirst({
        where: { service_number },
      })

      if (customerWithSameServiceNumber) {
        return NextResponse.json(
          { error: 'Another customer with this service number already exists' },
          { status: 409 }
        )
      }
    }

    const customer = await prisma.customer.update({
      where: { id: parseInt(params.id) },
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

    return NextResponse.json({ customer })
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    )
  }
}

// DELETE /api/customers/[id] - Delete a customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        invoice: true,
        proforma_invoice: true,
        quotation: true,
        cash_power_transaction: true,
      },
    })

    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

 
    const hasRelatedRecords = 
      existingCustomer.invoice.length > 0 ||
      existingCustomer.proforma_invoice.length > 0 ||
      existingCustomer.quotation.length > 0 ||
      existingCustomer.cash_power_transaction.length > 0

    if (hasRelatedRecords) {
      return NextResponse.json(
        { 
          error: 'Cannot delete customer with associated records. Please delete related records first.' 
        },
        { status: 409 }
      )
    }

    await prisma.customer.delete({
      where: { id: parseInt(params.id) },
    })

    return NextResponse.json(
      { message: 'Customer deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    )
  }
}