import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        customer: true,
        users: {
          select: { username: true, email: true }
        },
        quotation_product: {
          include: {
            product: {
              include: {
             
                product_type: true
              }
            }
          }
        }
      }
    })

    if (!quotation) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(quotation)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch quotation' },
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
    const { quotation_products, ...quotationData } = body

    const existingQuotation = await prisma.quotation.findUnique({
      where: { id: parseInt(params.id) },
      include: { quotation_product: true }
    })
    
    if (!existingQuotation) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      )
    }

    // First delete existing products
    await prisma.quotation_product.deleteMany({
      where: { quotation_id: parseInt(params.id) }
    })

    // Create new products with proper price calculation
    const productsWithPrices = await Promise.all(
      quotation_products.map(async (pp: any) => {
        const product = await prisma.product.findUnique({
          where: { id: pp.product_id }
        })

        if (!product) {
          throw new Error(`Product with ID ${pp.product_id} not found`)
        }

        const unitPrice = product.net_price || product.price
        const qty = pp.qty || 1
        const discount = pp.discount || 0

        const totalBeforeDiscount = unitPrice * qty
        const discountAmount = totalBeforeDiscount * (discount / 100)
        const finalPrice = totalBeforeDiscount - discountAmount

        return {
          product_id: pp.product_id,
          qty: qty,
          price: finalPrice,
          discount: discount,
          notes: pp.notes || '',
          quotation_id: parseInt(params.id)
        }
      })
    )

    // Create new quotation products
    await prisma.quotation_product.createMany({
      data: productsWithPrices
    })

    // Update the quotation
    const quotation = await prisma.quotation.update({
      where: { id: parseInt(params.id) },
      data: {
        ...quotationData,
        updated_at: new Date()
      },
      include: {
        customer: true,
        users: {
          select: { username: true, email: true }
        },
        quotation_product: {
          include: {
            product: {
              include: {
                product_type: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(quotation)
  } catch (error) {
    console.error('Error updating quotation:', error)
    return NextResponse.json(
      { error: 'Failed to update quotation' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existingQuotation = await prisma.quotation.findUnique({
      where: { id: parseInt(params.id) }
    })
    
    if (!existingQuotation) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      )
    }

    await prisma.quotation.delete({
      where: { id: parseInt(params.id) }
    })

    return NextResponse.json({ 
      message: 'Quotation deleted successfully',
      deletedId: parseInt(params.id)
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete quotation' },
      { status: 500 }
    )
  }
}