import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'

// GET a specific supplier by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid supplier ID' },
        { status: 400 }
      );
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
          },
        },
        stock_item: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(supplier);
  } catch (error) {
    console.error('Error fetching supplier:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supplier' },
      { status: 500 }
    );
  }
}

// PUT update a supplier
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid supplier ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, tin, phone, user_id } = body;

    // Check if supplier exists
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!existingSupplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }

    // Check if TIN is being changed to one that already exists
    if (tin && tin !== existingSupplier.tin) {
      const supplierWithSameTIN = await prisma.supplier.findUnique({
        where: { tin },
      });

      if (supplierWithSameTIN) {
        return NextResponse.json(
          { error: 'Another supplier with this TIN already exists' },
          { status: 400 }
        );
      }
    }

    // Update supplier
    const updatedSupplier = await prisma.supplier.update({
      where: { id },
      data: {
        name: name || existingSupplier.name,
        tin: tin || existingSupplier.tin,
        phone: phone || existingSupplier.phone,
        user_id: user_id ? parseInt(user_id) : existingSupplier.user_id,
        updated_at: new Date(),
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

    return NextResponse.json(updatedSupplier);
  } catch (error) {
    console.error('Error updating supplier:', error);
    return NextResponse.json(
      { error: 'Failed to update supplier' },
      { status: 500 }
    );
  }
}

// DELETE a supplier
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid supplier ID' },
        { status: 400 }
      );
    }

    // Check if supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        stock_item: true,
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }

    // Check if supplier has stock items
    if (supplier.stock_item && supplier.stock_item.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete supplier with associated stock items',
          details: `This supplier has ${supplier.stock_item.length} stock item(s) associated with it.`
        },
        { status: 400 }
      );
    }

    // Delete supplier
    await prisma.supplier.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Supplier deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return NextResponse.json(
      { error: 'Failed to delete supplier' },
      { status: 500 }
    );
  }
}