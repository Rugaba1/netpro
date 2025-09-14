import { NextRequest, NextResponse } from 'next/server'
 
import { hash } from 'bcryptjs'
 import { prisma } from '@/lib/prisma'

// GET /api/users/[id] - Get a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id)

    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        user_permissions_user_permissions_user_idTousers: {
          select: {
            permission_name: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Transform the data to match your frontend expectations
    const transformedUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.username,
      lastName: '',
      phone: '',
      role: user.user_permissions_user_permissions_user_idTousers.some(
        p => p.permission_name === 'admin_access'
      ) ? 'admin' : 'user',
      permissions: {
        dashboard: user.user_permissions_user_permissions_user_idTousers.some(
          p => p.permission_name === 'dashboard_access'
        ),
        customers: user.user_permissions_user_permissions_user_idTousers.some(
          p => p.permission_name === 'customers_access'
        ),
        products: user.user_permissions_user_permissions_user_idTousers.some(
          p => p.permission_name === 'products_access'
        ),
        packages: user.user_permissions_user_permissions_user_idTousers.some(
          p => p.permission_name === 'packages_access'
        ),
        invoices: user.user_permissions_user_permissions_user_idTousers.some(
          p => p.permission_name === 'invoices_access'
        ),
        quotations: user.user_permissions_user_permissions_user_idTousers.some(
          p => p.permission_name === 'quotations_access'
        ),
        proformas: user.user_permissions_user_permissions_user_idTousers.some(
          p => p.permission_name === 'proformas_access'
        ),
        reports: user.user_permissions_user_permissions_user_idTousers.some(
          p => p.permission_name === 'reports_access'
        ),
        settings: user.user_permissions_user_permissions_user_idTousers.some(
          p => p.permission_name === 'settings_access'
        ),
        users: user.user_permissions_user_permissions_user_idTousers.some(
          p => p.permission_name === 'users_access'
        ),
      },
      status: 'active',
      lastLogin: null,
      createdAt: user.created_at?.toISOString() || new Date().toISOString(),
      createdBy: null
    }

    return NextResponse.json({ success: true, user: transformedUser })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// PUT /api/users/[id] - Update a user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id)
    const body = await request.json()
    const {
      username,
      email,
      password,
      firstName,
      lastName,
      phone,
      role,
      permissions,
      status
    } = body

    // Check if user exists
    const existingUser = await prisma.users.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if username or email already exists for another user
    const userWithSameCreds = await prisma.users.findFirst({
      where: {
        AND: [
          { id: { not: userId } },
          {
            OR: [
              { username },
              { email }
            ]
          }
        ]
      }
    })

    if (userWithSameCreds) {
      return NextResponse.json(
        { success: false, error: 'Username or email already exists' },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: any = {
      username,
      email,
      updated_at: new Date(),
    }

    // Only update password if provided
    if (password) {
      updateData.password = await hash(password, 12)
    }

    // Update user
    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: updateData
    })

    // Delete existing permissions
    await prisma.user_permissions.deleteMany({
      where: { user_id: userId }
    })

    // Create new permissions based on role
    const permissionData = []
    
    if (role === 'admin') {
      // Admin gets all permissions
      const allPermissions = [
        'dashboard_access',
        'customers_access',
        'products_access',
        'packages_access',
        'invoices_access',
        'quotations_access',
        'proformas_access',
        'reports_access',
        'settings_access',
        'users_access',
        'admin_access'
      ]
      
      for (const permission of allPermissions) {
        permissionData.push({
          user_id: userId,
          permission_name: permission,
          granted_by_user_id: 1, // Assuming user ID 1 is the super admin
          created_at: new Date(),
          updated_at: new Date()
        })
      }
    } else {
      // User gets specific permissions
      for (const [key, value] of Object.entries(permissions)) {
        if (value) {
          permissionData.push({
            user_id: userId,
            permission_name: `${key}_access`,
            granted_by_user_id: 1, // Assuming user ID 1 is the super admin
            created_at: new Date(),
            updated_at: new Date()
          })
        }
      }
    }

    // Create user permissions
    if (permissionData.length > 0) {
      await prisma.user_permissions.createMany({
        data: permissionData
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        firstName: firstName || updatedUser.username,
        lastName: lastName || '',
        phone: phone || '',
        role,
        permissions,
        status: status || 'active',
        lastLogin: null,
        createdAt: updatedUser.created_at?.toISOString() || new Date().toISOString(),
        createdBy: null
      }
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - Delete a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id)

    // Check if user exists
    const existingUser = await prisma.users.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent deletion of super admin (assuming ID 1 is super admin)
    if (userId === 1) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete super admin' },
        { status: 400 }
      )
    }

    // Delete user permissions first
    await prisma.user_permissions.deleteMany({
      where: { user_id: userId }
    })

    // Delete user
    await prisma.users.delete({
      where: { id: userId }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'User deleted successfully' 
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}