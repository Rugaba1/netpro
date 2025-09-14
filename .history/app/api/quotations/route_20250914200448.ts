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

    const [quotations, total] = await Promise.all([
      prisma.quotation.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: true,
          users: {
            select: { username: true, email: true }
          },
          quotation_product: {
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
      prisma.quotation.count({ where })
    ])

    // Convert Decimal objects to numbers
    const serializedQuotations = convertDecimalsToNumbers(quotations)

    return NextResponse.json({
      quotations: serializedQuotations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching quotations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quotations' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { quotation_products, ...quotationData } = body

    const requiredFields = ['customer_id', 'user_id']
    const missingFields = requiredFields.filter(field => !quotationData[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    if (!quotation_products || quotation_products.length === 0) {
      return NextResponse.json(
        { error: 'Quotation must have at least one product' },
        { status: 400 }
      )
    }

    // Calculate prices for each product
    const productsWithPrices = await Promise.all(
      quotation_products.map(async (qp: any) => {
        const product = await prisma.product.findUnique({
          where: { id: qp.product_id },
          include: {
            Renamedpackage: true,
            product_type: true
          }
        });

        if (!product) {
          throw new Error(`Product with ID ${qp.product_id} not found`);
        }

        const unitPrice = Number(product.net_price || product.price);
        const totalBeforeDiscount = unitPrice * (qp.qty || 1);
        const discountAmount = totalBeforeDiscount * ((qp.discount || 0) / 100);
        const finalPrice = totalBeforeDiscount - discountAmount;

        return {
          product_id: qp.product_id,
          qty: qp.qty || 1,
          price: finalPrice,
          discount: qp.discount || 0,
          notes: qp.notes || '',
        };
      })
    );

    // First create the quotation
    const quotation = await prisma.quotation.create({
      data: {
        customer_id: parseInt(quotationData.customer_id),
        user_id: parseInt(quotationData.user_id),
        // Add other quotation fields if they exist in your schema
        ...(quotationData.notes && { notes: quotationData.notes }),
        ...(quotationData.status && { status: quotationData.status }),
        // Add other fields as needed
      }
    });

    // Then create the quotation products
    const quotationProducts = await Promise.all(
      productsWithPrices.map(productData =>
        prisma.quotation_product.create({
          data: {
            quotation_id: quotation.id,
            ...productData
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
      )
    );

    // Fetch the complete quotation with all relations
    const completeQuotation = await prisma.quotation.findUnique({
      where: { id: quotation.id },
      include: {
        customer: true,
        users: {
          select: { username: true, email: true }
        },
        quotation_product: {
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

    if (!completeQuotation) {
      throw new Error('Failed to fetch created quotation');
    }

    // Convert Decimal objects to numbers
    const serializedQuotation = convertDecimalsToNumbers(completeQuotation);

    return NextResponse.json(serializedQuotation, { status: 201 })
  } catch (error) {
    console.error('Error creating quotation:', error)
    return NextResponse.json(
      { error: 'Failed to create quotation' },
      { status: 500 }
    )
  }
}