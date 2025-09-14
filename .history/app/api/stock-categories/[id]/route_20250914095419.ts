// app/api/stock-categories/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// GET - Fetch single stock category
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = parseInt(params.id)

    if (isNaN(categoryId)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid category ID' 
        },
        { status: 400 }
      )
    }

    const category = await prisma.stock_items_category.findUnique({
      where: { id: categoryId },
      include: {
        users: true,
        stock_item: {
          include: {
            supplier: true,
            product: true
          }
        },
      }
    })

    if (!category) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Stock category not found' 
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      category
    })
  } catch (error) {
    console.error('Error fetching stock category:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch stock category',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PUT - Update stock category
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = parseInt(params.id)
    const body = await request.json()
    const { name, user_id } = body

    if (isNaN(categoryId)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid category ID' 
        },
        { status: 400 }
      )
    }

    // Validation
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Category name is required' 
        },
        { status: 400 }
      )
    }

    if (name.length > 100) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Category name must be less than 100 characters' 
        },
        { status: 400 }
      )
    }

    // Check if category exists
    const existingCategory = await prisma.stock_items_category.findUnique({
      where: { id: categoryId }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Stock category not found' 
        },
        { status: 404 }
      )
    }

    // Check if another category with same name already exists for this user
    const duplicateCategory = await prisma.stock_items_category.findFirst({
      where: {
        name: name.trim(),
        user_id: user_id || null,
        NOT: { id: categoryId }
      }
    })

    if (duplicateCategory) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Category with this name already exists' 
        },
        { status: 409 }
      )
    }

    // Update category
    const updatedCategory = await prisma.stock_items_category.update({
      where: { id: categoryId },
      data: {
        name: name.trim(),
        user_id: user_id || null,
        updated_at: new Date(),
      },
      include: {
        users: true,
        stock_item: true,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Stock category updated successfully',
      category: updatedCategory
    })
  } catch (error) {
    console.error('Error updating stock category:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update stock category',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE - Delete stock category
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = parseInt(params.id)

    if (isNaN(categoryId)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid category ID' 
        },
        { status: 400 }
      )
    }

    // Check if category exists
    const existingCategory = await prisma.stock_items_category.findUnique({
      where: { id: categoryId },
      include: {
        stock_item: true
      }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Stock category not found' 
        },
        { status: 404 }
      )
    }

    // Check if category is being used by stock items
    if (existingCategory.stock_item.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Cannot delete category. It is being used by ${existingCategory.stock_item.length} stock item(s)` 
        },
        { status: 409 }
      )
    }

    // Delete category
    await prisma.stock_items_category.delete({
      where: { id: categoryId }
    })

    return NextResponse.json({
      success: true,
      message: 'Stock category deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting stock category:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to delete stock category',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}