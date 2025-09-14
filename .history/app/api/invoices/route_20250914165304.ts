import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all invoices
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const customerId = searchParams.get('customerId')
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const invoiceType = searchParams.get('type') // 'individual' or 'consolidated'

    const skip = (page - 1) * limit

    const where: any = {
      ...(customerId && { customer_id: parseInt(customerId) }),
      ...(userId && { user_id: parseInt(userId) }),
      ...(invoiceType && { invoice_type: invoiceType })
    }

    if (startDate && endDate) {
      where.created_at = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const [invoices, total] = await Promise.all([
      prisma.master_invoice.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: {
            include: {
              company: true
            }
          },
          company: true,
          users: true,
          invoice_items: {
            include: {
              item: {
                include: {
                  product: {
                    include: {
                      Renamedpackage: true,
                      product_type: true
                    }
                  },
                  supplier: true
                }
              },
              customer: true
            }
          },
          child_invoices: {
            include: {
              customer: true,
              invoice_stock_item: {
                include: {
                  item: {
                    include: {
                      product: {
                        include: {
                          Renamedpackage: true,
                          product_type: true
                        }
                      },
                      supplier: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: { created_at: 'desc' }
      }),
      prisma.master_invoice.count({ where })
    ])

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}


// CREATE invoice with new structure
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { invoice_items, is_consolidated, company_id, ...invoiceData } = body

    // Validate required fields based on invoice type
    if (is_consolidated) {
      // For consolidated invoices, company_id is required
      if (!company_id) {
        return NextResponse.json(
          { error: 'Company ID is required for consolidated invoices' },
          { status: 400 }
        )
      }
    } else {
      // For individual invoices, customer_id is required
      if (!invoiceData.customer_id) {
        return NextResponse.json(
          { error: 'Customer ID is required for individual invoices' },
          { status: 400 }
        )
      }
    }

    if (!invoice_items || invoice_items.length === 0) {
      return NextResponse.json(
        { error: 'Invoice must have at least one item' },
        { status: 400 }
      )
    }

    // Calculate total amount
    const amount_to_pay = invoice_items.reduce((total: number, item: any) => {
      return total + (parseFloat(item.unit_price) * (item.qty || 1))
    }, 0)

    // Set default status based on payment
    const amount_paid = parseFloat(invoiceData.amount_paid) || 0
    const status = amount_paid === amount_to_pay 
      ? 'paid' 
      : amount_paid > 0 
        ? 'partial' 
        : 'unpaid'

    const invoice = await prisma.master_invoice.create({
      data: {
        ...invoiceData,
        amount_to_pay,
        amount_paid,
        status,
        invoice_type: is_consolidated ? 'consolidated' : 'individual',
        company_id: is_consolidated ? parseInt(company_id) : null,
        customer_id: is_consolidated ? null : parseInt(invoiceData.customer_id),
        billing_name: invoiceData.billing_name || '',
        invoice_items: {
          create: invoice_items.map((item: any) => ({
            item_id: item.item_id,
            customer_id: item.customer_id || invoiceData.customer_id,
            qty: item.qty || 1,
            unit_price: parseFloat(item.unit_price),
            total_price: parseFloat(item.unit_price) * (item.qty || 1),
           
          }))
        }
      },
      include: {
        customer: {
          include: {
            company: true
          }
        },
        company: true,
        users: true,
        invoice_items: {
          include: {
            item: {
              include: {
                product: {
                  include: {
                    Renamedpackage: true,
                    product_type: true
                  }
                },
                supplier: true
              }
            },
            customer: true
          }
        }
      }
    })

    // Optionally create child invoices for consolidated invoices
    if (is_consolidated) {
      await createChildInvoices(invoice, invoice_items)
    }

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}

// Helper function to create child invoices for consolidated invoices
async function createChildInvoices(masterInvoice: any, invoiceItems: any[]) {
  try {
    // Group items by customer
    const itemsByCustomer: { [key: string]: any[] } = {}
    
    invoiceItems.forEach(item => {
      if (item.customer_id) {
        if (!itemsByCustomer[item.customer_id]) {
          itemsByCustomer[item.customer_id] = []
        }
        itemsByCustomer[item.customer_id].push(item)
      }
    })

    // Create individual invoices for each customer
    for (const [customerId, items] of Object.entries(itemsByCustomer)) {
      const customerTotal = items.reduce((total: number, item: any) => {
        return total + (parseFloat(item.unit_price) * (item.qty || 1))
      }, 0)

      const customerInvoice = await prisma.invoice.create({
        data: {
          master_invoice_id: masterInvoice.id,
          customer_id: parseInt(customerId),
          amount_to_pay: customerTotal,
          amount_paid: 0, // Initially unpaid
          start_date: masterInvoice.start_date,
          end_date: masterInvoice.end_date,
          status: 'unpaid',
          payment_method: '',
          user_id: masterInvoice.user_id,
          invoice_stock_item: {
            create: items.map((item: any) => ({
              item_id: item.item_id,
              qty: item.qty || 1,
              user_id: item.user_id || masterInvoice.user_id
            }))
          }
        },
        include: {
          customer: true,
          invoice_stock_item: {
            include: {
              item: {
                include: {
                  product: {
                    include: {
                      Renamedpackage: true,
                      product_type: true
                    }
                  },
                  supplier: true
                }
              }
            }
          }
        }
      })
    }
  } catch (error) {
    console.error('Error creating child invoices:', error)
    // Don't throw error here as master invoice was created successfully
  }
}