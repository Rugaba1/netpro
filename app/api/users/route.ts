import { type NextRequest, NextResponse } from "next/server"

// Mock database connection - replace with actual database
const mockUsers = [
  {
    id: 1,
    username: "admin",
    email: "admin@netpro.com",
    firstName: "System",
    lastName: "Administrator",
    phone: "+250788123456",
    role: "admin",
    permissions: {
      dashboard: true,
      customers: true,
      products: true,
      packages: true,
      invoices: true,
      quotations: true,
      proformas: true,
      reports: true,
      settings: true,
      users: true,
    },
    status: "active",
    lastLogin: "2024-01-15T10:30:00Z",
    createdAt: "2024-01-01T00:00:00Z",
    createdBy: null,
  },
  {
    id: 2,
    username: "john.doe",
    email: "john@netpro.com",
    firstName: "John",
    lastName: "Doe",
    phone: "+250788234567",
    role: "user",
    permissions: {
      dashboard: true,
      customers: true,
      products: false,
      packages: false,
      invoices: true,
      quotations: true,
      proformas: false,
      reports: false,
      settings: false,
      users: false,
    },
    status: "active",
    lastLogin: "2024-01-14T15:45:00Z",
    createdAt: "2024-01-02T00:00:00Z",
    createdBy: 1,
  },
  {
    id: 3,
    username: "jane.smith",
    email: "jane@netpro.com",
    firstName: "Jane",
    lastName: "Smith",
    phone: "+250788345678",
    role: "user",
    permissions: {
      dashboard: true,
      customers: true,
      products: true,
      packages: true,
      invoices: false,
      quotations: false,
      proformas: false,
      reports: false,
      settings: false,
      users: false,
    },
    status: "active",
    lastLogin: "2024-01-13T09:20:00Z",
    createdAt: "2024-01-03T00:00:00Z",
    createdBy: 1,
  },
  {
    id: 4,
    username: "mike.wilson",
    email: "mike@netpro.com",
    firstName: "Mike",
    lastName: "Wilson",
    phone: "+250788456789",
    role: "user",
    permissions: {
      dashboard: true,
      customers: false,
      products: false,
      packages: false,
      invoices: true,
      quotations: true,
      proformas: true,
      reports: false,
      settings: false,
      users: false,
    },
    status: "inactive",
    lastLogin: "2024-01-10T14:30:00Z",
    createdAt: "2024-01-04T00:00:00Z",
    createdBy: 1,
  },
  {
    id: 5,
    username: "sarah.johnson",
    email: "sarah@netpro.com",
    firstName: "Sarah",
    lastName: "Johnson",
    phone: "+250788567890",
    role: "user",
    permissions: {
      dashboard: true,
      customers: true,
      products: false,
      packages: false,
      invoices: false,
      quotations: false,
      proformas: false,
      reports: true,
      settings: false,
      users: false,
    },
    status: "suspended",
    lastLogin: "2024-01-08T11:15:00Z",
    createdAt: "2024-01-05T00:00:00Z",
    createdBy: 1,
  },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const role = searchParams.get("role")
    const status = searchParams.get("status")

    let filteredUsers = [...mockUsers]

    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase()
      filteredUsers = filteredUsers.filter(
        (user) =>
          user.firstName.toLowerCase().includes(searchLower) ||
          user.lastName.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          user.username.toLowerCase().includes(searchLower),
      )
    }

    if (role && role !== "all") {
      filteredUsers = filteredUsers.filter((user) => user.role === role)
    }

    if (status && status !== "all") {
      filteredUsers = filteredUsers.filter((user) => user.status === status)
    }

    return NextResponse.json({
      success: true,
      users: filteredUsers,
      total: filteredUsers.length,
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, email, firstName, lastName, phone, role, permissions, status } = body

    // Validate required fields
    if (!username || !email || !firstName || !lastName || !role) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Check if username or email already exists
    const existingUser = mockUsers.find((user) => user.username === username || user.email === email)

    if (existingUser) {
      return NextResponse.json({ success: false, error: "Username or email already exists" }, { status: 400 })
    }

    // Create new user
    const newUser = {
      id: Math.max(...mockUsers.map((u) => u.id)) + 1,
      username,
      email,
      firstName,
      lastName,
      phone: phone || "",
      role,
      permissions: permissions || {
        dashboard: true,
        customers: false,
        products: false,
        packages: false,
        invoices: false,
        quotations: false,
        proformas: false,
        reports: false,
        settings: false,
        users: false,
      },
      status: status || "active",
      lastLogin: null,
      createdAt: new Date().toISOString(),
      createdBy: 1, // Current user ID
    }

    mockUsers.push(newUser)

    return NextResponse.json({
      success: true,
      message: "User created successfully",
      user: newUser,
    })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ success: false, error: "Failed to create user" }, { status: 500 })
  }
}
