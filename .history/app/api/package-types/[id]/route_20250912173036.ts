import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const packageType = await prisma.package_type.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        users: {
          select: { username: true, email: true }
        },
        product: {
          include: {
            product_type: true
          }
        },
        Renamedpackage: {
          include: {
            product: true
          }
        }
      }
    })

    if (!packageType) {
      return NextResponse.json(
        { error: 'Package type not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(packageType)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch package type' },
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

    const existingPackageType = await prisma.package_type.findUnique({
      where: { id: parseInt(params.id) }
    })
    
    if (!existingPackageType) {
      return NextResponse.json(
        { error: 'Package type not found' },
        { status: 404 }
      )
    }

    const packageType = await prisma.package_type.update({
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

    return NextResponse.json(packageType)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update package type' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existingPackageType = await prisma.package_type.findUnique({
      where: { id: parseInt(params.id) }
    })
    
    if (!existingPackageType) {
      return NextResponse.json(
        { error: 'Package type not found' },
        { status: 404 }
      )
    }

    // Check if package type has related products
    const relatedProducts = await prisma.product.count({
      where: { package_type_id: parseInt(params.id) }
    })

    // Check if package type has related packages
    const relatedPackages = await prisma.renamedpackage.count({
      where: { type_id: parseInt(params.id) }
    })

    if (relatedProducts > 0 || relatedPackages > 0) {
      return NextResponse.json(
        { error: 'Cannot delete package type with related products or packages' },
        { status: 400 }
      )
    }

    await prisma.package_type.delete({
      where: { id: parseInt(params.id) }
    })

    return NextResponse.json({ 
      message: 'Package type deleted successfully',
      deletedId: parseInt(params.id)
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete package type' },
      { status: 500 }
    )
  }
}