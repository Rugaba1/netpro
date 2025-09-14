import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const typeId = searchParams.get('typeId')
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * limit

    const where: any = {
      ...(typeId && { type_id: parseInt(typeId) }),
      ...(search && {
        OR: [
          { 
            package_type: {
              name: { contains: search, mode: 'insensitive' }
            }
          },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    }

    const [packages, total] = await Promise.all([
      prisma.renamedpackage.findMany({
        where,
        skip,
        take: limit,
        include: {
          package_type: true,
        
          product: {
            include: {
              product_type: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      }),
      prisma.renamedpackage.count({ where })
    ])

    return NextResponse.json({
      packages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch packages' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const requiredFields = ['type_id', 'description']
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    const packageItem = await prisma.renamedpackage.create({
      data: { ...body , type_id: parseInt(body.type_id) },
      include: {
        package_type: true,
       
      }
    })
    
    return NextResponse.json(packageItem, { status: 201 })
  } catch (error) {
    console.log(error)
    return NextResponse.json(
      { error: 'Failed to create package' },
      { status: 500 }
    )
  }
}