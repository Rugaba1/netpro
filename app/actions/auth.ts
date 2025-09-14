'use server'

 
import { compare } from 'bcryptjs'
 
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
      firstName: user.first_name, 
      lastName: user.last_name, 
      phone: user.phone,  
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

 

   
    await prisma.users.update({
      where: { id: user.id },
      data: { 
         
        updated_at: new Date()
      }
    })
    console.log(transformedUser)

    return { 
      success: true, 
      user: transformedUser,
      
    }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: 'An error occurred during login' }
  }
}

 