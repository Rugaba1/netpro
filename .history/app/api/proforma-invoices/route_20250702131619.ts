import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    // Simulate fetching proformas from database
    const proformas = [
      {
        id: 1,
        proformaNumber: "PRO-20250626-001",
        customerName: "Ngango Bernard",
        billingName: "Nil Ltd",
        totalAmount: "424800.00",
        status: "sent",
        createdDate: "2025-06-26",
        expiryDate: "2025-07-26",
      },
    ]

    return NextResponse.json(proformas)
  } catch (error) {
    console.error("Error fetching proformas:", error)
    return NextResponse.json({ error: "Failed to fetch proformas" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Generate proforma number
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const timestamp = Date.now().toString().slice(-4)
    const proformaNumber = `PRO-${year}${month}${day}-${timestamp}`

    // Simulate saving to database
    const savedProforma = {
      id: Date.now(),
      proformaNumber,
      ...data,
      createdDate: new Date().toISOString().split("T")[0],
    }

    // In a real application, you would:
    // 1. Validate the data
    // 2. Insert into proforma_invoices table
    // 3. Insert items into proforma_items table
    // 4. Return the saved proforma

    console.log("Saving proforma to database:", savedProforma)

    return NextResponse.json(savedProforma, { status: 201 })
  } catch (error) {
    console.error("Error creating proforma:", error)
    return NextResponse.json({ error: "Failed to create proforma" }, { status: 500 })
  }
}
