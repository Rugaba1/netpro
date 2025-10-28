'use server';
import { prisma } from '@/lib/prisma';

export async function getCurrentStockValue() {
  try {
   
    
    const stockItems = await prisma.stock_item.findMany({
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
    const totalStockValue = await prisma.stock_item.findMany({
       
      include:{
        product: true,
      }
    });

    return  
  } catch (error) {
    console.error('Error fetching stock items:', error);
    return  {
      success: false,
      products: [],
      total: 0,
      error: 'Failed to fetch stock items',}
  }
}