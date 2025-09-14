import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all products in a specific bundle
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bundle = await prisma.renamedpackage.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        product: {
          include: {
            product_type: true,
            package_type: true,
            users: {
              select: { username: true, email: true }
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

    return NextResponse.json(bundle.product)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch bundle products' },
      { status: 500 }
    )
  }
}

// ADD products to a bundle
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { productIds } = body

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: 'Product IDs array is required' },
        { status: 400 }
      )
    }

    // Check if bundle exists
    const existingBundle = await prisma.renamedpackage.findUnique({
      where: { id: parseInt(params.id) }
    })
    
    if (!existingBundle) {
      return NextResponse.json(
        { error: 'Bundle not found' },
        { status: 404 }
      )
    }

    // Update products to add them to the bundle
    const updatedProducts = await prisma.product.updateMany({
      where: {
        id: { in: productIds.map(id => parseInt(id)) }
      },
      data: {
        bundle_id: parseInt(params.id),
        updated_at: new Date()
      }
    })

    // Get the updated products with their details
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds.map(id => parseInt(id)) }
      },
      include: {
        product_type: true,
        package_type: true,
        users: {
          select: { username: true, email: true }
        }
      }
    })

    return NextResponse.json({
      message: `${updatedProducts.count} products added to bundle successfully`,
      products
    }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to add products to bundle' },
      { status: 500 }
    )
  }
}

// REMOVE products from a bundle
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url)
    const productIds = searchParams.get('productIds')?.split(',').map(id => parseInt(id)) || []

    if (productIds.length === 0) {
      return NextResponse.json(
        { error: 'Product IDs are required' },
        { status: 400 }
      )
    }

    // Check if bundle exists
    const existingBundle = await prisma.renamedpackage.findUnique({
      where: { id: parseInt(params.id) }
    })
    
    if (!existingBundle) {
      return NextResponse.json(
        { error: 'Bundle not found' },
        { status: 404 }
      )
    }

    // Remove products from the bundle (set bundle_id to null)
    const updatedProducts = await prisma.product.updateMany({
      where: {
        id: { in: productIds },
        bundle_id: parseInt(params.id)
      },
      data: {
        bundle_id: null,
        updated_at: new Date()
      }
    })

    return NextResponse.json({
      message: `${updatedProducts.count} products removed from bundle successfully`,
      removedCount: updatedProducts.count
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to remove products from bundle' },
      { status: 500 }
    )
  }
}