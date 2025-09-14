import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { convertDecimalsToNumbers } from '@/lib/utils'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const customerId = searchParams.get('customerId')
    const userId = searchParams.get('userId')

    const skip = (page - 1) * limit

    const where: any = {
      ...(customerId && { customer_id: parseInt(customerId) }),
      ...(userId && { user_id: parseInt(userId) })
    }

    const [proformaInvoices, total] = await Promise.all([
      prisma.proforma_invoice.findMany({
        where,
        skip,
        take: limit,
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
        },
        orderBy: { created_at: 'desc' }
      }),
      prisma.proforma_invoice.count({ where })
    ])

  

    return NextResponse.json({
      proformas:  proformaInvoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching proforma invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch proforma invoices' },
      { status: 500 }
    )
  }
}


export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { proforma_products, ...proformaData } = body

    // Validate required fields
    const requiredFields = ['customer_id']
    const missingFields = requiredFields.filter(field => !proformaData[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    if (!proforma_products || proforma_products.length === 0) {
      return NextResponse.json(
        { error: 'Proforma invoice must have at least one product' },
        { status: 400 }
      )
    }

    // Calculate prices for each product
    const productsWithPrices = await Promise.all(
      proforma_products.map(async (pp: any) => {
        const product = await prisma.product.findUnique({
          where: { id: pp.product_id },
          include: {
            Renamedpackage: true,
            product_type: true
          }
        });

        if (!product) {
          throw new Error(`Product with ID ${pp.product_id} not found`);
        }

        const unitPrice = Number(pp.unitPrice) || 0;
        const totalBeforeDiscount = unitPrice * (pp.qty || 1);
        const discountAmount = totalBeforeDiscount * ((pp.discount || 0) / 100);
        const finalPrice = totalBeforeDiscount - discountAmount;

        return {
          product_id: pp.product_id,
          qty: pp.qty || 1,
          price: finalPrice,
          discount: pp.discount || 0,
          description: pp.description || product.name,
          notes: pp.notes || '',
          user_id: pp.user_id || proformaData.user_id
        };
      })
    );

    const proformaInvoice = await prisma.proforma_invoice.create({
      data: {
        customer_id: parseInt(proformaData.customer_id),
        status: proformaData.status || 'Pending',
     
        amount_to_pay: proformaData.amount_to_pay,
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

    // Convert Decimal objects to numbers
    const serializedProforma = convertDecimalsToNumbers(proformaInvoice);

    return NextResponse.json(serializedProforma, { status: 201 })
  } catch (error) {
    console.error('Error creating proforma invoice:', error)
    return NextResponse.json(
      { error: 'Failed to create proforma invoice' },
      { status: 500 }
    )
  }
}