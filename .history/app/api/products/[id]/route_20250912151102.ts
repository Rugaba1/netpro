import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET single product
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        package_type: true,
        product_type: true,
        Renamedpackage: true,
        users: {
          select: { username: true, email: true }
        },
        invoice_product: {
          include: {
            invoice: {
              include: {
                customer: true
              }
            }
          }
        },
        proforma_product: {
          include: {
            proforma_invoice: {
              include: {
                customer: true
              }
            }
          }
        },
        quotation_product: {
          include: {
            quotation: {
              include: {
                customer: true
              }
            }
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(product)
  } catch (error) {
    return NextResponse.json(
      { error: '