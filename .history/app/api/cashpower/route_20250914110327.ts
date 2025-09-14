import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const transactions = await prisma.cash_power_transaction.findMany({
      include: {
        customer: {
          select: {
            name: true,
          },
        },
       
      },
      orderBy: {
        created_at: 'desc',
      },
    })

    const formattedTransactions = transactions.map((transaction) => ({
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
    }))

    return NextResponse.json({ 
      success: true, 
      transactions: formattedTransactions 
    })
  } catch (error) {
    console.error('Error fetching cashpower transactions:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { customer_id, meter_number, amount, token, commission} = await request.json()

    // Validate required fields
    if (!customer_id || !meter_number || !amount) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required fields: customer_id, meter_number, amount' 
        },
        { status: 400 }
      )
    }

 
    
   
    
    // Calculate units (example calculation)
    const units = parseFloat(amount) / 100

    const transaction = await prisma.cash_power_transaction.create({
      data: {
        amount: parseFloat(amount),
        meter_no: meter_number,
        customer_id: parseInt(customer_id),
    
        token,
        units: Math.round(units),
        commission,
        status: 'completed',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Transaction created successfully',
      transaction: {
        id: transaction.id,
        amount: Number(transaction.amount),
        meter_number: transaction.meter_no,
        customer_id: transaction.customer_id,
        created_at: transaction.created_at,
        token: transaction.token,
        units: transaction.units,
        commission: Number(transaction.commission),
        status: transaction.status,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating cashpower transaction:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}