// app/api/stock-categories/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - Fetch all stock categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    const whereClause = userId ? { user_id: parseInt(userId) } : {}

    const categories = await prisma.stock_items_category.findMany({
      where: whereClause,
      include: {
        users: true,
        stock_item: true,
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      categories,
      count: categories.length
    })
  } catch (error) {
    console.error('Error fetching stock categories:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch stock categories',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST - Create new stock category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name} = body

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

    // Check if category with same name already exists for this user
    const existingCategory = await prisma.stock_items_category.findFirst({
      where: {
        name: name.trim(),
      }
    })

    if (existingCategory) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Category with this name already exists' 
        },
        { status: 409 }
      )
    }

    // Create new category
    const category = await prisma.stock_items_category.create({
      data: {
        name: name.trim(),
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: {
        users: true,
        stock_item: true,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Stock category created successfully',
      category
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating stock category:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to create stock category',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}