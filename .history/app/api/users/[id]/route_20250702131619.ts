import { type NextRequest, NextResponse } from "next/server"

// Mock database - replace with actual database
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
]

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = Number.parseInt(params.id)
    const user = mockUsers.find((u) => u.id === userId)

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user,
    })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch user" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = Number.parseInt(params.id)
    const body = await request.json()
    const { username, email, firstName, lastName, phone, role, permissions, status } = body

    const userIndex = mockUsers.findIndex((u) => u.id === userId)
    if (userIndex === -1) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Check if username or email already exists (excluding current user)
    const existingUser = mockUsers.find(
      (user) => user.id !== userId && (user.username === username || user.email === email),
    )

    if (existingUser) {
      return NextResponse.json({ success: false, error: "Username or email already exists" }, { status: 400 })
    }

    // Update user
    mockUsers[userIndex] = {
      ...mockUsers[userIndex],
      username,
      email,
      firstName,
      lastName,
      phone: phone || "",
      role,
      permissions,
      status,
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user: mockUsers[userIndex],
    })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ success: false, error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = Number.parseInt(params.id)
    const userIndex = mockUsers.findIndex((u) => u.id === userId)

    if (userIndex === -1) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Prevent deleting admin user
    if (mockUsers[userIndex].role === "admin" && mockUsers[userIndex].id === 1) {
      return NextResponse.json({ success: false, error: "Cannot delete system administrator" }, { status: 400 })
    }

    mockUsers.splice(userIndex, 1)

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ success: false, error: "Failed to delete user" }, { status: 500 })
  }
}
