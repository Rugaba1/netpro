import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * limit

    const where: any = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } }
        ]
      })
    }

    const [packageTypes, total] = await Promise.all([
      prisma.package_type.findMany({
        where,
        skip,
        take: limit,
        include: {
          users: {
            select: { username: true, email: true }
          },
          product: {
            include: {
              product_type: true
            }
          },
          Renamedpackage: {
            include: {
              product: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      }),
      prisma.package_type.count({ where })
    ])

    return NextResponse.json({
      packageTypes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch package types' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const requiredFields = ['name']
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    const packageType = await prisma.package_type.create({
      data: body,
      include: {
        users: {
          select: { username: true, email: true }
        }
      }
    })
    
    return NextResponse.json(packageType, { status: 201 })
  } catch (error) {
    console.log(error)
    return NextResponse.json(
      { error: 'Failed to create package type' },
      { status: 500 }
    )
  }
}