import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid transaction ID' },
        { status: 400 }
      )
    }

    const transaction = await prisma.cash_power_transaction.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
    
      },
    })

    if (!transaction) {
      return NextResponse.json(
        { success: false, message: 'Transaction not found' },
        { status: 404 }
      )
    }

    const formattedTransaction = {
      id: transaction.id,
      amount: Number(transaction.amount),
      meter_number: transaction.meter_no,
      customer_id: transaction.customer_id,
      customer_name: transaction.customer.name,
      created_at: transaction.created_at,
      updated_at: transaction.updated_at,
      user_id: transaction.user_id,
      
      token: transaction.token,
      units: transaction.units,
      commission: Number(transaction.commission),
      status: transaction.status,
    }

    return NextResponse.json({ 
      success: true, 
      transaction: formattedTransaction 
    })
  } catch (error) {
    console.error('Error fetching transaction:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const { status } = await request.json()

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid transaction ID' },
        { status: 400 }
      )
    }

    const transaction = await prisma.cash_power_transaction.update({
      where: { id },
      data: {
        status: status || undefined,
        updated_at: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Transaction updated successfully',
      transaction: {
        id: transaction.id,
        status: transaction.status,
        updated_at: transaction.updated_at,
      },
    })
  } catch (error) {
    console.error('Error updating transaction:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid transaction ID' },
        { status: 400 }
      )
    }

    await prisma.cash_power_transaction.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Transaction deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting transaction:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}