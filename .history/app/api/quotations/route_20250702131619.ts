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

export async function GET() {
  try {
    return NextResponse.json(quotations)
  } catch (error) {
    console.error("Error fetching quotations:", error)
    return NextResponse.json({ error: "Failed to fetch quotations" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Generate quotation number
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const timestamp = Date.now().toString().slice(-3)
    const quotationNo = `QUO-${year}${month}${day}-${timestamp}`

    // Calculate totals
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

    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + 30)

    const newQuotation = {
      id: Date.now().toString(),
      quotationNo,
      customerId: Number(data.customerId),
      customerName: data.customerName,
      billingName: data.billingName,
      date: new Date().toISOString().split("T")[0],
      validUntil: validUntil.toISOString().split("T")[0],
      status: "draft",
      currency: "RWF",
      ...totals,
      amountInLetters: `${Math.floor(totals.totalIncl).toLocaleString()} Rwandan Francs Only`,
      notes: data.notes || "",
      items: processedItems,
    }

    quotations.push(newQuotation)

    return NextResponse.json(newQuotation, { status: 201 })
  } catch (error) {
    console.error("Error creating quotation:", error)
    return NextResponse.json({ error: "Failed to create quotation" }, { status: 500 })
  }
}
