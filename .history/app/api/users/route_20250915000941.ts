import { NextRequest, NextResponse } from 'next/server'
 
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'

// GET /api/users - Get all users with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const status = searchParams.get('status') || ''

    let whereClause: any = {}

    if (search) {
      whereClause.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (role && role !== 'all') {
      // For role-based filtering, we'll need to check user_permissions
      // This is a simplified approach - you might need to adjust based on your actual permission structure
      whereClause.user_permissions_user_permissions_user_idTousers = {
        some: {
          permission_name: role === 'admin' ? 'admin_access' : 'user_access'
        }
      }
    }

    if (status && status !== 'all') {
      // You'll need to add a status field to your users model or handle this differently
      // For now, we'll skip status filtering as it's not in your schema
    }

    const users = await prisma.users.findMany({
      where: whereClause,
      include: {
        user_permissions_user_permissions_user_idTousers: {
          select: {
            permission_name: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    // Transform the data to match your frontend expectations
    const transformedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.username, // You might want to add first_name and last_name fields to your schema
      lastName: '', // You might want to add first_name and last_name fields to your schema
      phone: '', // You might want to add phone field to your schema
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
      status: 'active', // You might want to add status field to your schema
      lastLogin: null, // You might want to add last_login field to your schema
      createdAt: user.created_at?.toISOString() || new Date().toISOString(),
      createdBy: null // You might want to track who created the user
    }))

    return NextResponse.json({ success: true, users: transformedUsers })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      username,
      email,
      firstName,
      lastName,
      phone,
      role,
      permissions,
      status
    } = body

    // Check if user already exists
    const existingUser = await prisma.users.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this username or email already exists' },
        { status: 400 }
      )
    }

    // Hash password (default password: password123)
    const hashedPassword = await hash('password123', 12)

    // Create user
    const newUser = await prisma.users.create({
      data: {
        username,
        email,
        password: hashedPassword,
        created_at: new Date(),
        updated_at: new Date(),
        first_name:firstName,
        last_name:lastName,
        status,
        phone}
    })

    // Create permissions based on role
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
          user_id: newUser.id,
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
            user_id: newUser.id,
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
      message: 'User created successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        firstName: firstName || newUser.username,
        lastName: lastName || '',
        phone: phone || '',
        role,
        permissions,
        status: status || 'active',
        lastLogin: null,
        createdAt: newUser.created_at?.toISOString() || new Date().toISOString(),
        createdBy: null
      }
    })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    )
  }
}