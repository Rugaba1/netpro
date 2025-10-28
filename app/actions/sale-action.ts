'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

 

export type SaleItemInput = {
  item_id: number
  qty: number
  unit_price: number
}

export type CreateSaleInput = {
  customer_id: number
  sale_date: string
  items: SaleItemInput[]
}

// Create sale with stock update
export async function createSale(data: CreateSaleInput) {
  try {
    const total_price = data.items.reduce(
      (sum, item) => sum + (item.unit_price * item.qty),
      0
    )

    const result = await prisma.$transaction(async (tx) => {
      // Check stock availability first
      for (const item of data.items) {
        const stockItem = await tx.stock_item.findUnique({
          where: { id: item.item_id },
        })

        if (!stockItem) {
          throw new Error(`Item with ID ${item.item_id} not found`)
        }

        if (stockItem.quantity < item.qty) {
          throw new Error(`Insufficient stock for ${stockItem.name}. Available: ${stockItem.quantity}, Requested: ${item.qty}`)
        }
      }

      // Create sale transaction
      const saleTransaction = await tx.saleTransaction.create({
        data: {
          customer_id: data.customer_id,
          total_price,
          sale_date: new Date(data.sale_date),
          SaleItem: {
            create: data.items.map((item) => ({
              item_id: item.item_id,
              qty: item.qty,
              unit_price: item.unit_price,
              total_price: item.unit_price * item.qty,
            })),
          },
        },
        include: {
          customer: true,
          SaleItem: {
            include: {
              item: true,
            },
          },
        },
      })

      // Update stock quantities
      for (const item of data.items) {
        await tx.stock_item.update({
          where: { id: item.item_id },
          data: {
            quantity: {
              decrement: item.qty,
            },
          },
        })
      }

      return saleTransaction
    })

    revalidatePath('/sales')
    return { success: true, data: result }
  } catch (error) {
    console.error('Error creating sale:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create sale' 
    }
  }
}

// Get sale by ID
export async function getSaleById(id: number) {
  try {
    const sale = await prisma.saleTransaction.findUnique({
      where: { id },
      include: {
        customer: true,
        SaleItem: {
          include: {
            item: {
              include: {
                stock_items_category: true,
              },
            },
          },
        },
      },
    })

    return { success: true, data: sale }
  } catch (error) {
    console.error('Error fetching sale:', error)
    return { success: false, error: 'Failed to fetch sale' }
  }
}

// Delete sale and restore stock
export async function deleteSale(id: number) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Get sale items first to restore stock
      const sale = await tx.saleTransaction.findUnique({
        where: { id },
        include: {
          SaleItem: true,
        },
      })

      if (!sale) {
        throw new Error('Sale not found')
      }

      // Restore stock quantities
      for (const item of sale.SaleItem) {
        await tx.stock_item.update({
          where: { id: item.item_id },
          data: {
            quantity: {
              increment: item.qty,
            },
          },
        })
      }

      // Delete sale (SaleItems will be deleted automatically due to CASCADE)
      return await tx.saleTransaction.delete({
        where: { id },
      })
    })

    revalidatePath('/sales')
    return { success: true, data: result }
  } catch (error) {
    console.error('Error deleting sale:', error)
    return { success: false, error: 'Failed to delete sale' }
  }
}

// Get available stock items
export async function getStockItems() {
  try {
    const items = await prisma.stock_item.findMany({
      where: {
        quantity: {
          gt: 0,
        },
        status: 'active',
      },
      include: {
        stock_items_category: true,
        product: true,
      },
      
      orderBy: {
        name: 'asc',
      },
    })

    return { success: true, data: items }
  } catch (error) {
    console.error('Error fetching stock items:', error)
    return { success: false, error: 'Failed to fetch stock items' }
  }
}

// Get customers
export async function getCustomers() {
  try {
    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        service_number: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return { success: true, data: customers }
  } catch (error) {
    console.error('Error fetching customers:', error)
    return { success: false, error: 'Failed to fetch customers' }
  }
}