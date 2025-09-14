import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET single invoice
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(params.id) },
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
            },
            users: {
              select: { username: true, email: true }
            }
          }
        }
      }
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(invoice)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    )
  }
}

// UPDATE invoice
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { invoice_products, ...invoiceData } = body

    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: parseInt(params.id) }
    })
    
    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    const invoice = await prisma.invoice.update({
      where: { id: parseInt(params.id) },
      data: {
        ...invoiceData,
        updated_at: new Date()
      },
      include: {
        customer: true,
        users: {
          select: { username: true, email: true }
        },
        invoice_product: {
          include: {
            product: true
          }
        }
      }
    })

    return NextResponse.json(invoice)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    )
  }
}

// DELETE invoice
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: parseInt(params.id) }
    })
    
    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    await prisma.invoice.delete({
      where: { id: parseInt(params.id) }
    })

    return NextResponse.json({ 
      message: 'Invoice deleted successfully',
      deletedId: parseInt(params.id)
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    )
  }
}