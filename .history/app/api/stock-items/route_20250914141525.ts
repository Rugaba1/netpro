import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stock_item_status } from '@/lib/generated/prisma';

// GET all stock items with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const supplierId = searchParams.get('supplierId') || '';
    const status = searchParams.get('status') as stock_item_status || undefined;
    const lowStock = searchParams.get('lowStock') === 'true';
    
    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { product: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    
    if (categoryId) {
      where.category_id = parseInt(categoryId);
    }
    
    if (supplierId) {
      where.supplier_id = parseInt(supplierId);
    }
    
    if (status) {
      where.status = status;
    }
    
    if (lowStock) {
      where.quantity = {
        lte: prisma.stock_item.fields.reorder_level
      };
    }

    // Get stock items with relations
    const stockItems = await prisma.stock_item.findMany({
      where,
      skip,
      take: limit,
      include: {
        stock_items_category: true,
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
        product: {
          
          include: {
            Renamedpackage: true,
            product_type: true,
          }
        },
        users: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Get total count for pagination
    const total = await prisma.stock_item.count({ where });

    return NextResponse.json({
      stockItems,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching stock items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock items' },
      { status: 500 }
    );
  }
}

// POST create a new stock item
export async function POST(request: NextRequest) {
  try {
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
    } = body;

    // Validate required fields
    if (!name || !category_id || !supplier_id  ) {
      return NextResponse.json(
        { error: 'Name, category, supplier, and user are required' },
        { status: 400 }
      );
    }

    // Create new stock item
    const stockItem = await prisma.stock_item.create({
      data: {
        name,
        category_id: parseInt(category_id),
        status: status || 'active',
        product_id: product_id ? parseInt(product_id) : null,
        quantity: quantity ? parseInt(quantity) : 0,
        supplier_id: parseInt(supplier_id),
        min_level: min_level ? parseInt(min_level) : 0,
        reorder_level: reorder_level ? parseInt(reorder_level) : 0,
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

    return NextResponse.json(stockItem, { status: 201 });
  } catch (error) {
    console.error('Error creating stock item:', error);
    return NextResponse.json(
      { error: 'Failed to create stock item' },
      { status: 500 }
    );
  }
}