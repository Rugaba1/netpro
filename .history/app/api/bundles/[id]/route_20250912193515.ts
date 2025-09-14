import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bundle = await prisma.renamedpackage.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        package_type: {
          include: {
            users: {
              select: { username: true, email: true }
            }
          }
        },
        users: {
          select: { username: true, email: true }
        },
        product: {
          include: {
            product_type: true,
            package_type: true,
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
        }
      }
    })

    if (!bundle) {
      return NextResponse.json(
        { error: 'Bundle not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(bundle)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch bundle' },
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

    const existingBundle = await prisma.renamedpackage.findUnique({
      where: { id: parseInt(params.id) }
    })
    
    if (!existingBundle) {
      return NextResponse.json(
        { error: 'Bundle not found' },
        { status: 404 }
      )
    }

    const bundle = await prisma.renamedpackage.update({
      where: { id: parseInt(params.id) },
      data: {
        ...body,
        updated_at: new Date()
      },
      include: {
        package_type: {
          include: {
            users: {
              select: { username: true, email: true }
            }
          }
        },
        users: {
          select: { username: true, email: true }
        }
      }
    })

    return NextResponse.json(bundle)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update bundle' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existingBundle = await prisma.renamedpackage.findUnique({
      where: { id: parseInt(params.id) }
    })
    
    if (!existingBundle) {
      return NextResponse.json(
        { error: 'Bundle not found' },
        { status: 404 }
      )
    }

    // Check if bundle has related products
    const relatedProducts = await prisma.product.count({
      where: { bundle_id: parseInt(params.id) }
    })

    if (relatedProducts > 0) {
      return NextResponse.json(
        { error: 'Cannot delete bundle with related products. Please remove products from this bundle first.' },
        { status: 400 }
      )
    }

    await prisma.renamedpackage.delete({
      where: { id: parseInt(params.id) }
    })

    return NextResponse.json({ 
      message: 'Bundle deleted successfully',
      deletedId: parseInt(params.id)
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete bundle' },
      { status: 500 }
    )
  }
}