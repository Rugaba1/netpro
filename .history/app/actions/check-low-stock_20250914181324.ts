'use server';

import { prisma } from '@/lib/prisma';

export async function checkLowStockProducts() {
  try {
    // Find products that are below reorder level or have low quantity
    const lowStockProducts = await prisma.stock_item.findMany({
      where: {
        OR: [
          {
            quantity: {
              lte: prisma.stock_item.fields.reorder_level, // Below reorder level
            },
          },
          {
            quantity: {
              lte: 10, // Or have less than 10 items in stock
            },
          },
        ],
        status: 'active', // Only active products
      },
      include: {
        product: {
          include: {
            Renamedpackage: true,
            product_type: true,
          },
        },
        supplier: true,
        stock_items_category: true,
      },
      orderBy: [
        {
          quantity: 'asc', // Show lowest quantities first
        },
        {
          reorder_level: 'asc',
        },
      ],
    });

    return {
      success: true,
      products: lowStockProducts,
      count: lowStockProducts.length,
    };
  } catch (error) {
    console.error('Error checking low stock products:', error);
    return {
      success: false,
      products: [],
      count: 0,
      error: 'Failed to check low stock products',
    };
  }
}