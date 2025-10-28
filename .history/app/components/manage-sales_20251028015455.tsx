'use client'

import { useState, useEffect } from 'react'
import { createSale, getStockItems, getCustomers, deleteSale, type CreateSaleInput, type SaleItemInput } from '@/app/actions/sale-action'
import SalesList from './SalesList'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

import { product as Product } from '@/lib/generated/prisma'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface StockItem {
  id: number
  name: string
  quantity: number
  price: number,
  product: Product,

  stock_items_category: {
    name: string
  }
}

interface Customer {
  id: number
  name: string
  phone: string
  service_number: string
}

export default function SaleManagement() {
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [saleItems, setSaleItems] = useState<SaleItemInput[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<string>('')
  const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [pendingSaleData, setPendingSaleData] = useState<CreateSaleInput | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [itemsResult, customersResult] = await Promise.all([
        getStockItems(),
        getCustomers()
      ])

      if (itemsResult.success && itemsResult.data) {
        setStockItems(
          itemsResult.data.map((item: any) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            product: item.product,
            price: item.price ?? 0,
            stock_items_category: {
              name: item.stock_items_category?.name ?? ''
            }
          }))
        )
      }
      if (customersResult.success) setCustomers(customersResult.data ?? [])
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const addSaleItem = () => {
    setSaleItems([...saleItems, { item_id: 0, qty: 1, unit_price: 0 }])
  }

  const updateSaleItem = (index: number, field: keyof SaleItemInput, value: any) => {
    const updatedItems = [...saleItems]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    
    // Auto-calculate unit price if item is selected
    if (field === 'item_id' && value) {
      const selectedItem = stockItems.find(item => item.id === parseInt(value))
      if (selectedItem) {
        updatedItems[index].unit_price = Number(selectedItem.product.net_price)
      }
    }
    
    setSaleItems(updatedItems)
  }

  const removeSaleItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index))
  }

  const calculateTotal = () => {
    return saleItems.reduce((total, item) => total + (item.unit_price * item.qty), 0)
  }

  const calculateItemTotal = (item: SaleItemInput) => {
    return item.unit_price * item.qty
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!selectedCustomer || saleItems.length === 0) {
      setMessage({ type: 'error', text: 'Please select a customer and add at least one item' })
      return
    }

    // Validate quantities and items
    for (const item of saleItems) {
      if (!item.item_id || item.item_id === 0) {
        setMessage({ type: 'error', text: 'Please select an item for all sale items' })
        return
      }

      const stockItem = stockItems.find(si => si.id === item.item_id)
      if (!stockItem) {
        setMessage({ type: 'error', text: 'Selected item not found in stock' })
        return
      }

      if (item.qty > stockItem.quantity) {
        setMessage({ 
          type: 'error', 
          text: `Insufficient stock for ${stockItem.name}. Available: ${stockItem.quantity}` 
        })
        return
      }

      if (item.qty <= 0) {
        setMessage({ type: 'error', text: 'Quantity must be greater than 0' })
        return
      }

      if (item.unit_price < 0) {
        setMessage({ type: 'error', text: 'Unit price cannot be negative' })
        return
      }
    }

    const saleData: CreateSaleInput = {
      customer_id: parseInt(selectedCustomer),
      sale_date: saleDate,
      items: saleItems
    }

    // Show confirmation dialog instead of immediately submitting
    setPendingSaleData(saleData)
    setShowConfirmation(true)
  }

  const confirmSale = async () => {
    if (!pendingSaleData) return

    setIsLoading(true)
    setShowConfirmation(false)

    const result = await createSale(pendingSaleData)

    if (result.success) {
      setMessage({ type: 'success', text: 'Sale created successfully!' })
      // Reset form
      setSaleItems([])
      setSelectedCustomer('')
      setSaleDate(new Date().toISOString().split('T')[0])
      setPendingSaleData(null)
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to create sale' })
    }

    setIsLoading(false)
  }

  const cancelSale = () => {
    setShowConfirmation(false)
    setPendingSaleData(null)
  }

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === parseInt(customerId))
    return customer ? `${customer.name} (${customer.phone})` : 'Unknown Customer'
  }

  const getItemName = (itemId: number) => {
    const item = stockItems.find(i => i.id === itemId)
    return item ? item.name : 'Unknown Item'
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sale Management</h1>
          <p className="text-muted-foreground">Create and manage sales transactions</p>
        </div>
      </div>

      {message && (
        <Alert variant={message.type === 'success' ? 'default' : 'destructive'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Create New Sale</CardTitle>
          <CardDescription>
            Add customer information and sale items to create a new transaction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="customer">Customer *</Label>
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.name} - {customer.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="saleDate">Sale Date *</Label>
                <Input
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <Label className="text-base">Sale Items</Label>
                  <p className="text-sm text-muted-foreground">Add products to this sale</p>
                </div>
                <Button type="button" onClick={addSaleItem} variant="outline">
                  Add Item
                </Button>
              </div>

              {saleItems.map((item, index) => (
                <Card key={index} className="p-4">
                  <CardContent className="p-0">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                      <div className="md:col-span-5 space-y-2">
                        <Label htmlFor={`item-${index}`}>Item *</Label>
                        <Select
                          value={item.item_id.toString()}
                          onValueChange={(value) => updateSaleItem(index, 'item_id', parseInt(value))}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select an item" />
                          </SelectTrigger>
                          <SelectContent>
                            {stockItems.map((stockItem) => (
                              <SelectItem key={stockItem.id} value={stockItem.id.toString()}>
                                <div className="flex justify-between w-full">
                                  <span>{stockItem.name}</span>
                                  <Badge variant="secondary" className="ml-2">
                                    Stock: {stockItem.quantity}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <Label htmlFor={`qty-${index}`}>Quantity *</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => updateSaleItem(index, 'qty', parseInt(e.target.value))}
                          placeholder="Qty"
                          required
                        />
                      </div>

                      <div className="md:col-span-3 space-y-2">
                        <Label htmlFor={`price-${index}`}>Unit Price *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          
                          value={item.unit_price}
                          onChange={(e) => updateSaleItem(index, 'unit_price', parseFloat(e.target.value))}
                          placeholder="Unit Price"
                          required
                        />
                      </div>

                      <div className="md:col-span-1 space-y-2">
                        <Label>Total</Label>
                        <div className="h-10 flex items-center justify-center font-medium text-sm border rounded-md bg-muted/50">
                          ${calculateItemTotal(item).toFixed(2)}
                        </div>
                      </div>

                      <div className="md:col-span-1 space-y-2">
                        <Label>&nbsp;</Label>
                        <Button
                          type="button"
                          onClick={() => removeSaleItem(index)}
                          variant="destructive"
                          size="sm"
                          className="w-full"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {saleItems.length > 0 && (
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total Amount:</span>
                    <span className="text-2xl font-bold text-primary">
                      ${calculateTotal().toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={isLoading || saleItems.length === 0 || !selectedCustomer}
                className="min-w-32"
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Processing...
                  </>
                ) : (
                  'Create Sale'
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSaleItems([])
                  setSelectedCustomer('')
                  setMessage(null)
                }}
                disabled={isLoading}
              >
                Clear Form
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <SalesList />

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Sale</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to create this sale? This action will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Create a new sale transaction</li>
                <li>Update stock quantities</li>
                <li>Generate a sales receipt</li>
              </ul>
              
              {pendingSaleData && (
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <div className="font-semibold">Sale Summary:</div>
                  <div className="text-sm mt-2">
                    <div><strong>Customer:</strong> {getCustomerName(pendingSaleData.customer_id.toString())}</div>
                    <div><strong>Date:</strong> {new Date(pendingSaleData.sale_date).toLocaleDateString()}</div>
                    <div><strong>Items:</strong> {pendingSaleData.items.length}</div>
                    <div><strong>Total:</strong> ${pendingSaleData.items.reduce((sum, item) => sum + (item.unit_price * item.qty), 0).toFixed(2)}</div>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelSale}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSale} className="bg-green-600 hover:bg-green-700">
              Confirm Sale
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}