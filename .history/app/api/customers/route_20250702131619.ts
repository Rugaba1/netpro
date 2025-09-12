import { NextResponse } from "next/server"

// Real customer data matching the screenshot exactly
const customers = [
  {
    id: 1,
    customerName: "RUGABA Innocent Gilbert",
    billingName: "RCD CORPORATION Ltd",
    tin: "112765478",
    phone: "0780765548",
    serviceNumber: "0776345214",
    email: "rugaba@rcd.com",
    address: "Kigali, Rwanda",
    status: "active",
  },
  {
    id: 2,
    customerName: "NSHIMYUMUREMYI Boniface",
    billingName: "RIESCO Ltd",
    tin: "122433221",
    phone: "0788606201",
    serviceNumber: "0776345299",
    email: "boniface@riesco.com",
    address: "Kigali, Rwanda",
    status: "active",
  },
  {
    id: 3,
    customerName: "TUYISHIME Alain Serge",
    billingName: "ERR CORP",
    tin: "155243777",
    phone: "0788955247",
    serviceNumber: "0776345756",
    email: "alain@errcorp.com",
    address: "Kigali, Rwanda",
    status: "active",
  },
  {
    id: 4,
    customerName: "Muhorane Eric",
    billingName: "DISACCO",
    tin: "108364757",
    phone: "0786646456",
    serviceNumber: "0771178450",
    email: "eric@disacco.com",
    address: "Kigali, Rwanda",
    status: "active",
  },
  {
    id: 5,
    customerName: "Muhire Egide",
    billingName: "Sinotrack",
    tin: "108483784",
    phone: "0794374367",
    serviceNumber: "0771347763",
    email: "egide@sinotrack.com",
    address: "Kigali, Rwanda",
    status: "active",
  },
  {
    id: 6,
    customerName: "RUGAJU Leogan",
    billingName: "RBA",
    tin: "777777779",
    phone: "0780765548",
    serviceNumber: "0771645293",
    email: "leogan@rba.com",
    address: "Kigali, Rwanda",
    status: "active",
  },
  {
    id: 7,
    customerName: "Nshuti Bosco",
    billingName: "Shaoman Ltd",
    tin: "108589505",
    phone: "0787791893",
    serviceNumber: "0771047484",
    email: "bosco@shaoman.com",
    address: "Kigali, Rwanda",
    status: "active",
  },
  {
    id: 8,
    customerName: "KBS Ltd",
    billingName: "Hakizimana Yves",
    tin: "999999999",
    phone: "0784874747",
    serviceNumber: "0000000000",
    email: "yves@kbs.com",
    address: "Kigali, Rwanda",
    status: "active",
  },
  {
    id: 9,
    customerName: "Ngango Bernard",
    billingName: "Nil Ltd",
    tin: "888888888",
    phone: "0737638788",
    serviceNumber: "0771123026",
    email: "bernard@nil.com",
    address: "Kigali, Rwanda",
    status: "active",
  },
  {
    id: 10,
    customerName: "Kagabo Maurice",
    billingName: "Spiro Ltd",
    tin: "103894874",
    phone: "0784747374",
    serviceNumber: "0771007482",
    email: "maurice@spiro.com",
    address: "Kigali, Rwanda",
    status: "active",
  },
]

export async function GET() {
  try {
    return NextResponse.json(customers)
  } catch (error) {
    console.error("Error fetching customers:", error)
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const newCustomer = {
      id: Math.max(...customers.map((c) => c.id)) + 1,
      ...body,
      email: body.email || `${body.customerName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
      address: "Kigali, Rwanda",
      status: "active",
    }
    customers.push(newCustomer)
    return NextResponse.json(newCustomer)
  } catch (error) {
    console.error("Error creating customer:", error)
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 })
  }
}
