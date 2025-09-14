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
      where: { id: parseInt(params.id) }
    })
    
    if (!existingQuotation) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      )
    }

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
            product: true
          }
        }
      }
    })

    return NextResponse.json(quotation)
  } catch (error) {
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