import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        package_type: true,
        product_type: true,
        Renamedpackage: true,
        users: {
          select: { username: true, email: true }
        },
        invoice_product: {
          include: {
            invoice: {
              include: {
                customer: true
              }
            }
          }
        },
        proforma_product: {
          include: {
            proforma_invoice: {
              include: {
                customer: true
              }
            }
          }
        },
        quotation_product: {
          include: {
            quotation: {
              include: {
                customer: true
              }
            }
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(product)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()

    const existingProduct = await prisma.product.findUnique({
      where: { id: parseInt(params.id) }
    })
    
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const product = await prisma.product.update({
      where: { id: parseInt(params.id) },
      data: {
        ...body,
        updated_at: new Date()
      },
      include: {
        package_type: true,
        product_type: true,
        Renamedpackage: true,
        users: {
          select: { username: true, email: true }
        }
      }
    })

    return NextResponse.json(product)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existingProduct = await prisma.product.findUnique({
      where: { id: parseInt(params.id) }
    })
    
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const relatedInvoiceProducts = await prisma.invoice_product.count({
      where: { product_id: parseInt(params.id) }
    })
    
    const relatedProformaProducts = await prisma.proforma_product.count({
      where: { product_id: parseInt(params.id) }
    })
    
    const relatedQuotationProducts = await prisma.quotation_product.count({
      where: { product_id: parseInt(params.id) }
    })

    if (relatedInvoiceProducts > 0 || relatedProformaProducts > 0 || relatedQuotationProducts > 0) {
      return NextResponse.json(
        { error: 'Cannot delete product with related records' },
        { status: 400 }
      )
    }

    await prisma.product.delete({
      where: { id: parseInt(params.id) }
    })

    return NextResponse.json({ 
      message: 'Product deleted successfully',
      deletedId: parseInt(params.id)
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}