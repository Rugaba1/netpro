import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'
// GET all suppliers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    // Build where clause for search
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { tin: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    // Get suppliers with pagination and search
    const suppliers = await prisma.supplier.findMany({
      where,
      skip,
      take: limit,
      include: {
        users: {
          select: {
            id: true,
            email: true,
          },
        },
        stock_item: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Get total count for pagination
    const total = await prisma.supplier.count({ where });

    return NextResponse.json({
      suppliers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    );
  }
}

// POST create a new supplier
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, tin, phone, user_id } = body;

    // Validate required fields
    if (!name || !tin || !phone) {
      return NextResponse.json(
        { error: 'Name, TIN, and phone are required' },
        { status: 400 }
      );
    }

    // Check if supplier with same TIN already exists
    const existingSupplier = await prisma.supplier.findUnique({
      where: { tin },
    });

    if (existingSupplier) {
      return NextResponse.json(
        { error: 'Supplier with this TIN already exists' },
        { status: 400 }
      );
    }

    // Create new supplier
    const supplier = await prisma.supplier.create({
      data: {
        name,
        tin,
        phone,
        user_id: user_id ? parseInt(user_id) : null,
      },
      include: {
        users: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    console.error('Error creating supplier:', error);
    return NextResponse.json(
      { error: 'Failed to create supplier' },
      { status: 500 }
    );
  }
}