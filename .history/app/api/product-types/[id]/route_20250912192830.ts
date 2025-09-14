import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productType = await prisma.product_type.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        users: {
          select: { username: true, email: true }
        },
        product: {
          include: {
            package_type: true,
            Renamedpackage: true,
            invoice_product: {
              include: {
                invoice: {
                  include: {
                    customer: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!productType) {
      return NextResponse.json(
        { error: 'Product type not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(productType)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch product type' },
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

    const existingProductType = await prisma.product_type.findUnique({
      where: { id: parseInt(params.id) }
    })
    
    if (!existingProductType) {
      return NextResponse.json(
        { error: 'Product type not found' },
        { status: 404 }
      )
    }

    const productType = await prisma.product_type.update({
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

    return NextResponse.json(productType)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update product type' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existingProductType = await prisma.product_type.findUnique({
      where: { id: parseInt(params.id) }
    })
    
    if (!existingProductType) {
      return NextResponse.json(
        { error: 'Product type not found' },
        { status: 404 }
      )
    }

    // Check if product type has related products
    const relatedProducts = await prisma.product.count({
      where: { type_id: parseInt(params.id) }
    })

    if (relatedProducts > 0) {
      return NextResponse.json(
        { error: 'Cannot delete product type with related products' },
        { status: 400 }
      )
    }

    await prisma.product_type.delete({
      where: { id: parseInt(params.id) }
    })

    return NextResponse.json({ 
      message: 'Product type deleted successfully',
      deletedId: parseInt(params.id)
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete product type' },
      { status: 500 }
    )
  }
}