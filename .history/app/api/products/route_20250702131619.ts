import { NextResponse } from "next/server"

// Sample product data
const products = [
  {
    id: 1,
    package_id: 1,
    product_type: "Internet Service",
    bundle: "20Mbps Unlimited",
    wholesales_price: 20000,
    selling_price: 25000,
    duration: "Monthly",
    status: "active",
  },
  {
    id: 2,
    package_id: 1,
    product_type: "Internet Service",
    bundle: "50Mbps Unlimited",
    wholesales_price: 40000,
    selling_price: 50000,
    duration: "Monthly",
    status: "active",
  },
  {
    id: 3,
    package_id: 1,
    product_type: "Internet Service",
    bundle: "100Mbps Unlimited",
    wholesales_price: 75000,
    selling_price: 95000,
    duration: "Monthly",
    status: "active",
  },
  {
    id: 4,
    package_id: 2,
    product_type: "Hardware",
    bundle: "Router TP-Link",
    wholesales_price: 15000,
    selling_price: 20000,
    duration: "One-time",
    status: "active",
  },
  {
    id: 5,
    package_id: 2,
    product_type: "Hardware",
    bundle: "Modem 4G",
    wholesales_price: 25000,
    selling_price: 35000,
    duration: "One-time",
    status: "active",
  },
  {
    id: 6,
    package_id: 3,
    product_type: "Installation",
    bundle: "Home Installation",
    wholesales_price: 8000,
    selling_price: 12000,
    duration: "One-time",
    status: "active",
  },
  {
    id: 7,
    package_id: 3,
    product_type: "Installation",
    bundle: "Office Installation",
    wholesales_price: 15000,
    selling_price: 20000,
    duration: "One-time",
    status: "active",
  },
  {
    id: 8,
    package_id: 4,
    product_type: "Support",
    bundle: "Technical Support",
    wholesales_price: 5000,
    selling_price: 8000,
    duration: "Monthly",
    status: "active",
  },
]

export async function GET() {
  try {
    return NextResponse.json(products)
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}
