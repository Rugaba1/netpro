import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET single customer by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        users: {
          select: { username: true, email: true }
        },
        invoice: {
          include: {
            invoice_product: {
              include: {
                product: true
              }
            }
          }
        },
        proforma_invoice: {
          include: {
            proforma_product: {
              include: {
                product: true
              }
            }
          }
        },
        quotation: {
          include: {
            quotation_product: {
              include: {
                product: true
              }
            }
          }
        }
      }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(customer)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    )
  }
}

// UPDATE customer
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    
    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: parseInt(params.id) }
    })
    
    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    const customer = await prisma.customer.update({
      where: { id: parseInt(params.id) },
      data: {
        ...body,
        updated_at: new Date()
      },
      include: {
        users: {
          select: { username: true, email: true }
        }
      }
    })
    
    return NextResponse.json(customer)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    )
  }
}

// DELETE customer
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: parseInt(params.id) }
    })
    
    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Check if customer has related records
    const relatedInvoices = await prisma.invoice.count({
      where: { customer_id: parseInt(params.id) }
    })
    
    const relatedProformas = await prisma.proforma_invoice.count({
      where: { customer_id: parseInt(params.id) }
    })
    
    const relatedQuotations = await prisma.quotation.count({
      where: { customer_id: parseInt(params.id) }
    })

    if (relatedInvoices > 0 || relatedProformas > 0 || relatedQuotations > 0) {
      return NextResponse.json(
        { error: 'Cannot delete customer with related records' },
        { status: 400 }
      )
    }

    await prisma.customer.delete({
      where: { id: parseInt(params.id) }
    })
    
    return NextResponse.json({ 
      message: 'Customer deleted successfully',
      deletedId: parseInt(params.id)
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    )
  }
}