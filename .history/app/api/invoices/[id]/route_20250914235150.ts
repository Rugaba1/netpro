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
         invoice_stock_item: {
          include: {
            product: {
              include: {
                Renamedpackage: true,
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
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const invoiceId = parseInt(params.id)
    const body = await req.json()
    const { invoice_items, ...invoiceData } = body

    // Check if invoice exists
    const existingInvoice = await prisma.master_invoice.findUnique({
      where: { id: invoiceId }
    })

    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Update status based on payment
    if (invoiceData.amount_paid !== undefined) {
      const amount_paid = parseFloat(invoiceData.amount_paid)
      const amount_to_pay = parseFloat(invoiceData.amount_to_pay || existingInvoice.amount_to_pay.toString())
      invoiceData.status = amount_paid === amount_to_pay 
        ? 'paid' 
        : amount_paid > 0 
          ? 'partial' 
          : 'unpaid'
    }

    const invoice = await prisma.master_invoice.update({
      where: { id: invoiceId },
      data: invoiceData,
      include: {
        customer: {
          include: {
            company: true
          }
        },
        company: true,
        users: true,
        invoice_items: {
          include: {
            item: {
              include: {
                product: {
                  include: {
                    Renamedpackage: true,
                    product_type: true
                  }
                },
                supplier: true
              }
            },
            customer: true
          }
        },
        child_invoices: {
          include: {
            customer: true,
            invoice_stock_item: {
              include: {
                item: {
                  include: {
                    product: {
                      include: {
                        Renamedpackage: true,
                        product_type: true
                      }
                    },
                    supplier: true
                  }
                }
              }
            }
          }
        }
      }
    })

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error updating invoice:', error)
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
    const existingInvoice = await prisma.master_invoice.findUnique({
      where: { id: parseInt(params.id) }
    })
    
    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    await prisma.master_invoice.delete({
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