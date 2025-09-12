import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const typeId = searchParams.get('typeId')
    const packageTypeId = searchParams.get('packageTypeId')
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * limit

    const where: any = {
      ...(typeId && { type_id: parseInt(typeId) }),
      ...(packageTypeId && { package_type_id: parseInt(packageTypeId) }),
      ...(search && {
        OR: [
          { 
            package_type: {
              name: { contains: search, mode: 'insensitive' }
            }
          },
          {
            product_type: {
              name: { contains: search, mode: 'insensitive' }
            }
          }
        ]
      })
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          package_type: true,
          product_type: true,
          Renamedpackage: true,
          users: {
            select: { username: true, email: true }
          }
        },
        orderBy: { created_at: 'desc' }
      }),
      prisma.product.count({ where })
    ])

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const requiredFields = ['package_type_id', 'price', 'net_price', 'duration', 'type_id', 'user_id']
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    const product = await prisma.product.create({
      data: body,
      include: {
        package_type: true,
        product_type: true,
        Renamedpackage: true,
        users: {
          select: { username: true, email: true }
        }
      }
    })
    
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}