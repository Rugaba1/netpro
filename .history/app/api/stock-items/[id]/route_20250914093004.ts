import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stock_item_status } from '@/lib/generated/prisma';

// GET a specific stock item by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid stock item ID' },
        { status: 400 }
      );
    }

    const stockItem = await prisma.stock_item.findUnique({
      where: { id },
      include: {
        stock_items_category: true,
        supplier: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
        users: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!stockItem) {
      return NextResponse.json(
        { error: 'Stock item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(stockItem);
  } catch (error) {
    console.error('Error fetching stock item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock item' },
      { status: 500 }
    );
  }
}

// PUT update a stock item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid stock item ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { 
      name, 
      category_id, 
      status, 
      product_id, 
      quantity, 
      supplier_id, 
      min_level, 
      reorder_level, 
      user_id 
    } = body;

    // Check if stock item exists
    const existingStockItem = await prisma.stock_item.findUnique({
      where: { id },
    });

    if (!existingStockItem) {
      return NextResponse.json(
        { error: 'Stock item not found' },
        { status: 404 }
      );
    }

    // Update stock item
    const updatedStockItem = await prisma.stock_item.update({
      where: { id },
      data: {
        name: name || existingStockItem.name,
        category_id: category_id ? parseInt(category_id) : existingStockItem.category_id,
        status: status || existingStockItem.status,
        product_id: product_id ? parseInt(product_id) : existingStockItem.product_id,
        quantity: quantity !== undefined ? parseInt(quantity) : existingStockItem.quantity,
        supplier_id: supplier_id ? parseInt(supplier_id) : existingStockItem.supplier_id,
        min_level: min_level !== undefined ? parseInt(min_level) : existingStockItem.min_level,
        reorder_level: reorder_level !== undefined ? parseInt(reorder_level) : existingStockItem.reorder_level,
        user_id: user_id ? parseInt(user_id) : existingStockItem.user_id,
        updated_at: new Date(),
      },
      include: {
        stock_items_category: true,
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(updatedStockItem);
  } catch (error) {
    console.error('Error updating stock item:', error);
    return NextResponse.json(
      { error: 'Failed to update stock item' },
      { status: 500 }
    );
  }
}

// DELETE a stock item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid stock item ID' },
        { status: 400 }
      );
    }

    // Check if stock item exists
    const stockItem = await prisma.stock_item.findUnique({
      where: { id },
    });

    if (!stockItem) {
      return NextResponse.json(
        { error: 'Stock item not found' },
        { status: 404 }
      );
    }

    // Delete stock item
    await prisma.stock_item.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Stock item deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting stock item:', error);
    return NextResponse.json(
      { error: 'Failed to delete stock item' },
      { status: 500 }
    );
  }
}