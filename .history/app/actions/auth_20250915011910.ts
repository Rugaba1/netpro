'use server'

 
import { compare } from 'bcryptjs'
import { sign } from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

 
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export interface LoginResponse {
  success: boolean
  user?: any
  error?: string
  token?: string
}

export async function loginUser(username: string, password: string): Promise<LoginResponse> {
  try {
    // Find user by username or email
    const user = await prisma.users.findFirst({
      where: {
        OR: [
          { username },
          { email: username }
        ]
      },
      include: {
        user_permissions_user_permissions_user_idTousers: {
          select: {
            permission_name: true
          }
        }
      }
    })

    if (!user) {
      return { success: false, error: 'Invalid username or password' }
    }

    // Check if password matches
    const isPasswordValid = await compare(password, user.password)
    if (!isPasswordValid) {
      return { success: false, error: 'Invalid username or password' }
    }

    // Transform user data to match frontend expectations
    const transformedUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.username, // You might want to add first_name field to your schema
      lastName: '', // You might want to add last_name field to your schema
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
        stock: user.user_permissions_user_permissions_user_idTousers.some(
          p => p.permission_name === 'stock_access'
        ),
        cashpower: user.user_permissions_user_permissions_user_idTousers.some(
          p => p.permission_name === 'cashpower_access'
        ),
      },
      status: 'active',
      lastLogin: null,
      createdAt: user.created_at?.toISOString() || new Date().toISOString(),
    }

    // Generate JWT token
    const token = sign(
      { 
        userId: user.id, 
        username: user.username,
        role: transformedUser.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    // Set cookie with the token
    const cookieStore = await cookies()
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 hours
    })

    // Update last login time (you might want to add last_login field to your schema)
    await prisma.users.update({
      where: { id: user.id },
      data: { 
        // If you add last_login field to your schema:
        // last_login: new Date()
        updated_at: new Date()
      }
    })

    return { 
      success: true, 
      user: transformedUser,
      token 
    }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: 'An error occurred during login' }
  }
}

export async function logoutUser(): Promise<void> {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('auth-token')
  } catch (error) {
    console.error('Logout error:', error)
  }
}

export async function getCurrentUser(): Promise<any> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return null
    }

    // Verify token and get user data
    // You would need to implement JWT verification here

    // For now, we'll return a simple check
    // In a real implementation, you would verify the JWT and fetch user data from database
    return null
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}