import { type NextRequest, NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'

 export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const proformaId = parseInt(params.id)

    const proformaInvoice = await prisma.proforma_invoice.findUnique({
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

    if (!proformaInvoice) {
      return NextResponse.json(
        { error: 'Proforma invoice not found' },
        { status: 404 }
      )
    }

   

    return NextResponse.json(proformaInvoice)
  } catch (error) {
    console.error('Error fetching proforma invoice:', error)
    return NextResponse.json(
      { error: 'Failed to fetch proforma invoice' },
      { status: 500 }
    )
  }
}



export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const proformaId = parseInt(params.id)

    // Check if proforma exists
    const existingProforma = await prisma.proforma_invoice.findUnique({
      where: { id: proformaId }
    })

    if (!existingProforma) {
      return NextResponse.json(
        { error: 'Proforma invoice not found' },
        { status: 404 }
      )
    }

    // Delete proforma products first (due to foreign key constraints)
    await prisma.proforma_product.deleteMany({
      where: { proforma_id: proformaId }
    })

    // Delete proforma
    await prisma.proforma_invoice.delete({
      where: { id: proformaId }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Proforma invoice deleted successfully' 
    })
  } catch (error) {
    console.error('Error deleting proforma invoice:', error)
    return NextResponse.json(
      { error: 'Failed to delete proforma invoice' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const proformaId = parseInt(params.id)
    const body = await req.json()
    const { proforma_products, ...proformaData } = body

    // Check if proforma exists
    const existingProforma = await prisma.proforma_invoice.findUnique({
      where: { id: proformaId }
    })

    if (!existingProforma) {
      return NextResponse.json(
        { error: 'Proforma invoice not found' },
        { status: 404 }
      )
    }

    // First delete existing products
    await prisma.proforma_product.deleteMany({
      where: { proforma_id: proformaId }
    });

    // Use the unit price provided by the user
    const productsWithPrices = proforma_products.map((pp: any) => {
      const unitPrice = Number(pp.unitPrice) || 0;
      const qty = pp.qty || 1;
      const discount = pp.discount || 0;

      const totalBeforeDiscount = unitPrice * qty;
      const discountAmount = totalBeforeDiscount * (discount / 100);
      const finalPrice = totalBeforeDiscount - discountAmount;

      return {
        product_id: pp.product_id,
        qty: qty,
        price: finalPrice,
        discount: discount,
        description: pp.description || '',
        notes: pp.notes || '',
        user_id: pp.user_id || proformaData.user_id || existingProforma.user_id
      };
    });

    const proformaInvoice = await prisma.proforma_invoice.update({
      where: { id: proformaId },
      data: {
        ...proformaData,
        proforma_product: {
          create: productsWithPrices
        }
      },
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
    });

 

    return NextResponse.json(proformaInvoice)
  } catch (error) {
    console.error('Error updating proforma invoice:', error)
    return NextResponse.json(
      { error: 'Failed to update proforma invoice' },
      { status: 500 }
    )
  }
}


export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const proformaId = parseInt(params.id)
    const body = await req.json()
    const { proforma_products, status, ...proformaData } = body

    // Check if proforma exists
    const existingProforma = await prisma.proforma_invoice.findUnique({
      where: { id: proformaId }
    })

    if (!existingProforma) {
      return NextResponse.json(
        { error: 'Proforma invoice not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = { ...proformaData };
    
    // Only include status if provided
    if (status) {
      updateData.status = status;
    }

    // Handle product updates if provided
    if (proforma_products) {
      // First delete existing products
      await prisma.proforma_product.deleteMany({
        where: { proforma_id: proformaId }
      });

      // Then add new products
      updateData.proforma_product = {
        create: proforma_products.map((pp: any) => {
          const unitPrice = Number(pp.unitPrice) || 0;
          const qty = pp.qty || 1;
          const discount = pp.discount || 0;

          const totalBeforeDiscount = unitPrice * qty;
          const discountAmount = totalBeforeDiscount * (discount / 100);
          const finalPrice = totalBeforeDiscount - discountAmount;

          return {
            product_id: pp.product_id,
            qty: qty,
            price: finalPrice,
            discount: discount,
            description: pp.description || '',
            notes: pp.notes || '',
            user_id: pp.user_id || existingProforma.user_id
          };
        })
      };
    }

    const proformaInvoice = await prisma.proforma_invoice.update({
      where: { id: proformaId },
      data: updateData,
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
    });

   

    return NextResponse.json(proformaInvoice)
  } catch (error) {
    console.error('Error updating proforma invoice:', error)
    return NextResponse.json(
      { error: 'Failed to update proforma invoice' },
      { status: 500 }
    )
  }
}