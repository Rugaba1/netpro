import { type NextRequest, NextResponse } from "next/server"

// Mock database - in production, this would connect to MySQL
const quotations = [
  {
    id: "1",
    quotationNo: "QUO-20250627-001",
    customerId: 1,
    customerName: "RUGABA Innocent Gilbert",
    billingName: "RCD CORPORATION Ltd",
    date: "2025-06-27",
    validUntil: "2025-07-27",
    status: "draft",
    currency: "RWF",
    totalExcl: 21186.44,
    tax: 3813.56,
    totalDiscount: 0,
    totalIncl: 25000.0,
    amountInLetters: "Twenty Five Thousand Rwandan Francs Only",
    notes: "Internet service quotation",
    items: [
      {
        no: 1,
        description: "Internet Service - 20Mbps",
        qty: 1,
        unitPrice: 25000,
        discount: 0,
        priceExclVat: 21186.44,
        vat: 3813.56,
        totalIncl: 25000,
      },
    ],
  },
]

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const data = await request.json()

    const quotationIndex = quotations.findIndex((q) => q.id === id)
    if (quotationIndex === -1) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 })
    }

    // Process items and calculate totals
    const processedItems = data.items.map((item: any, index: number) => ({
      no: index + 1,
      description: item.description,
      qty: Number(item.qty) || 1,
      unitPrice: Number(item.unitPrice) || 0,
      discount: Number(item.discount) || 0,
      priceExclVat: item.priceExclVat,
      vat: item.vat,
      totalIncl: item.totalIncl,
    }))

    const totals = processedItems.reduce(
      (acc: any, item: any) => {
        acc.totalExcl += item.priceExclVat
        acc.tax += item.vat
        acc.totalDiscount += (item.unitPrice * item.qty * item.discount) / 100
        acc.totalIncl += item.totalIncl
        return acc
      },
      { totalExcl: 0, tax: 0, totalDiscount: 0, totalIncl: 0 },
    )

    const updatedQuotation = {
      ...quotations[quotationIndex],
      customerId: Number(data.customerId),
      customerName: data.customerName,
      billingName: data.billingName,
      ...totals,
      amountInLetters: `${Math.floor(totals.totalIncl).toLocaleString()} Rwandan Francs Only`,
      notes: data.notes || "",
      items: processedItems,
    }

    quotations[quotationIndex] = updatedQuotation

    return NextResponse.json(updatedQuotation)
  } catch (error) {
    console.error("Error updating quotation:", error)
    return NextResponse.json({ error: "Failed to update quotation" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const quotationIndex = quotations.findIndex((q) => q.id === id)
    if (quotationIndex === -1) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 })
    }

    quotations.splice(quotationIndex, 1)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting quotation:", error)
    return NextResponse.json({ error: "Failed to delete quotation" }, { status: 500 })
  }
}
