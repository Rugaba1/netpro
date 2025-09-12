import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const proformaInvoice = await prisma.proforma_invoice.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        customer: true,
        users: {
          select: { username: true, email: true }
        },
        proforma_product: {
          include: {
            product: {
              include: {
                package_type: true,
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
    return NextResponse.json(
      { error: 'Failed to fetch proforma invoice' },
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
    const { proforma_products, ...proformaData } = body

    const existingProforma = await prisma.proforma_invoice.findUnique({
      where: {