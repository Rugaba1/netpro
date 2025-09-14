import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const packageItem = await prisma.renamedpackage.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        package_type: true,
     
        product: {
          include: {
            product_type: true,
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

    if (!packageItem) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(packageItem)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch package' },
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

    const existingPackage = await prisma.renamedpackage.findUnique({
      where: { id: parseInt(params.id) }
    })
    
    if (!existingPackage) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      )
    }

    const packageItem = await prisma.renamedpackage.update({
      where: { id: parseInt(params.id) },
      data: {
        ...body,
        updated_at: new Date()
      },
      include: {
        package_type: true,
       
      }
    })

    return NextResponse.json(packageItem)
  } catch (error) {
    console.log(error)
    return NextResponse.json(
      { error: 'Failed to update package' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existingPackage = await prisma.renamedpackage.findUnique({
      where: { id: parseInt(params.id) }
    })
    
    if (!existingPackage) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      )
    }

    // Check if package has related products
    const relatedProducts = await prisma.product.count({
      where: { bundle_id: parseInt(params.id) }
    })

    if (relatedProducts > 0) {
      return NextResponse.json(
        { error: 'Cannot delete package with related products' },
        { status: 400 }
      )
    }

    await prisma.renamedpackage.delete({
      where: { id: parseInt(params.id) }
    })

    return NextResponse.json({ 
      message: 'Package deleted successfully',
      deletedId: parseInt(params.id)
    })
  } catch (error) {
    console.log(error)
    return NextResponse.json(
      { error: 'Failed to delete package' },
      { status: 500 }
    )
  }
}