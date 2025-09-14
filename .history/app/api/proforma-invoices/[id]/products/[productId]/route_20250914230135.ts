import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  req: NextRequest, 
  { params }: { params: { id: string, productId: string } }
) {
  try {
    const proformaId = parseInt(params.id)
    const productId = parseInt(params.productId)
    const body = await req.json()
    const { qty, unitPrice, discount, notes } = body

    // Check if proforma exists
    const existingProforma = await prisma.proforma_invoice.findUnique({
      where: { id: proformaId },
      include: { proforma_product: true }
    })

    if (!existingProforma) {
      return NextResponse.json(
        { error: 'Proforma invoice not found' },
        { status: 404 }
      )
    }

    // Check if product exists in the proforma
    const existingProduct = await prisma.proforma_product.findFirst({
      where: { 
        id: productId,
        proforma_id: proformaId 
      }
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found in this proforma' },
        { status: 404 }
      )
    }

    // Calculate new price
    const qtyNum = Number(qty) || 1
    const unitPriceNum = Number(unitPrice) || 0
    const discountNum = Number(discount) || 0

    const totalBeforeDiscount = unitPriceNum * qtyNum
    const discountAmount = totalBeforeDiscount * (discountNum / 100)
    const finalPrice = totalBeforeDiscount - discountAmount

    // Update the product
    const updatedProduct = await prisma.proforma_product.update({
      where: { id: productId },
      data: {
        qty: qtyNum,
        unitPrice: unitPriceNum,
        discount: discountNum,
        price: finalPrice,
        notes: notes || ''
      },
      include: {
        product: {
          include: {
            Renamedpackage: true,
            product_type: true
          }
        }
      }
    })

    // Recalculate the total amount for the proforma
    const allProducts = await prisma.proforma_product.findMany({
      where: { proforma_id: proformaId }
    })

    const totalAmount = allProducts.reduce((sum, product) => sum + Number(product.price), 0)

    // Update the proforma total
    await prisma.proforma_invoice.update({
      where: { id: proformaId },
      data: { amount_to_pay: totalAmount }
    })

    // Get the updated proforma with all relationships
    const updatedProforma = await prisma.proforma_invoice.findUnique({
      where: { id: proformaId },
      include: {
        customer: true,
        users: {
          select: { username: true, email: true }
        },
        proforma_product: {
          include: {
            product: {
              include: {
                Renamedpackage: true,
                product_type: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(updatedProforma)
  } catch (error) {
    console.error('Error updating proforma product:', error)
    return NextResponse.json(
      { error: 'Failed to update proforma product' },
      { status: 500 }
    )
  }
}