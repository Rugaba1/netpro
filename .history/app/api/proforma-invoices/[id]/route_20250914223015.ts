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