"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2 } from "lucide-react"
import InvoiceTemplate from "./invoice-template"

interface InvoiceItem {
  no: number
  description: string
  qty: number
  unitPrice: number
  priceExclVat: number
  vat: number
  totalIncl: number
}

export default function InvoiceGenerator() {
  const [showPreview, setShowPreview] = useState(false)
  const [invoiceData, setInvoiceData] = useState({
    invoiceNo: "",
    date: new Date().toISOString().split("T")[0],
    startingDate: new Date().toISOString().split("T")[0],
    expiredDate: "",
    currency: "RWF",
    billTo: "",
    items: [] as InvoiceItem[],
    totalExcl: 0,
    tax: 0,
    subTotal: 0,
    discount: 0,
    totalIncl: 0,
    paidAmountInLetters: "",
  })

  const [currentItem, setCurrentItem] = useState({
    description: "",
    qty: 1,
    unitPrice: 0,
  })

  const vatRate = 0.18 // 18% VAT

  const calculateItemTotals = (qty: number, unitPrice: number) => {
    const totalIncl = qty * unitPrice
    const priceExclVat = totalIncl / (1 + vatRate)
    const vat = totalIncl - priceExclVat

    return {
      priceExclVat: Math.round(priceExclVat * 100) / 100,
      vat: Math.round(vat * 100) / 100,
      totalIncl: Math.round(totalIncl * 100) / 100,
    }
  }

  const addItem = () => {
    if (!currentItem.description || currentItem.qty <= 0 || currentItem.unitPrice <= 0) {
      alert("Please fill in all item details")
      return
    }

    const calculations = calculateItemTotals(currentItem.qty, currentItem.unitPrice)

    const newItem: InvoiceItem = {
      no: invoiceData.items.length + 1,
      description: currentItem.description,
      qty: currentItem.qty,
      unitPrice: currentItem.unitPrice,
      ...calculations,
    }

    const updatedItems = [...invoiceData.items, newItem]
    updateTotals(updatedItems)

    setCurrentItem({
      description: "",
      qty: 1,
      unitPrice: 0,
    })
  }

  const removeItem = (index: number) => {
    const updatedItems = invoiceData.items.filter((_, i) => i !== index)
    // Renumber items
    const renumberedItems = updatedItems.map((item, i) => ({ ...item, no: i + 1 }))
    updateTotals(renumberedItems)
  }

  const updateTotals = (items: InvoiceItem[]) => {
    const totalExcl = items.reduce((sum, item) => sum + item.priceExclVat, 0)
    const tax = items.reduce((sum, item) => sum + item.vat, 0)
    const subTotal = totalExcl + tax
    const totalIncl = subTotal - invoiceData.discount

    setInvoiceData((prev) => ({
      ...prev,
      items,
      totalExcl: Math.round(totalExcl * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      subTotal: Math.round(subTotal * 100) / 100,
      totalIncl: Math.round(totalIncl * 100) / 100,
    }))
  }

  const numberToWords = (num: number): string => {
    // Simplified number to words conversion for demonstration
    // In production, you'd want a more comprehensive implementation
    const ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"]
    const teens = [
      "ten",
      "eleven",
      "twelve",
      "thirteen",
      "fourteen",
      "fifteen",
      "sixteen",
      "seventeen",
      "eighteen",
      "nineteen",
    ]
    const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]

    if (num === 0) return "zero"
    if (num < 10) return ones[num]
    if (num < 20) return teens[num - 10]
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? " " + ones[num % 10] : "")
    if (num < 1000)
      return ones[Math.floor(num / 100)] + " hundred" + (num % 100 !== 0 ? " " + numberToWords(num % 100) : "")
    if (num < 1000000)
      return (
        numberToWords(Math.floor(num / 1000)) + " thousand" + (num % 1000 !== 0 ? " " + numberToWords(num % 1000) : "")
      )

    return num.toString() // Fallback for very large numbers
  }

  const generateInvoice = () => {
    if (!invoiceData.invoiceNo || !invoiceData.billTo || invoiceData.items.length === 0) {
      alert("Please fill in all required fields and add at least one item")
      return
    }

    const amountInWords = numberToWords(Math.floor(invoiceData.totalIncl)) + " Rwandan Francs"

    setInvoiceData((prev) => ({
      ...prev,
      paidAmountInLetters: amountInWords,
    }))

    setShowPreview(true)
  }

  if (showPreview) {
    return (
      <div>
        <div className="mb-4 print:hidden">
          <Button onClick={() => setShowPreview(false)} variant="outline">
            ← Back to Editor
          </Button>
        </div>
        <InvoiceTemplate invoiceData={invoiceData} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Invoice Generator</h1>
        <p className="text-gray-600">Create professional invoices for NETPRO services</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Invoice Details */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="invoiceNo">Invoice Number</Label>
                <Input
                  id="invoiceNo"
                  value={invoiceData.invoiceNo}
                  onChange={(e) => setInvoiceData((prev) => ({ ...prev, invoiceNo: e.target.value }))}
                  placeholder="58"
                />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={invoiceData.currency}
                  onValueChange={(value) => setInvoiceData((prev) => ({ ...prev, currency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RWF">RWF</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={invoiceData.date}
                  onChange={(e) => setInvoiceData((prev) => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="startingDate">Starting Date</Label>
                <Input
                  id="startingDate"
                  type="date"
                  value={invoiceData.startingDate}
                  onChange={(e) => setInvoiceData((prev) => ({ ...prev, startingDate: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="expiredDate">Expired Date</Label>
              <Input
                id="expiredDate"
                type="date"
                value={invoiceData.expiredDate}
                onChange={(e) => setInvoiceData((prev) => ({ ...prev, expiredDate: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="billTo">Bill To</Label>
              <Textarea
                id="billTo"
                value={invoiceData.billTo}
                onChange={(e) => setInvoiceData((prev) => ({ ...prev, billTo: e.target.value }))}
                placeholder="Hakizimana Yves"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Add Items */}
        <Card>
          <CardHeader>
            <CardTitle>Add Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="description">Item Description</Label>
              <Input
                id="description"
                value={currentItem.description}
                onChange={(e) => setCurrentItem((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="120Mbps"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="qty">Quantity</Label>
                <Input
                  id="qty"
                  type="number"
                  min="1"
                  value={currentItem.qty}
                  onChange={(e) => setCurrentItem((prev) => ({ ...prev, qty: Number.parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div>
                <Label htmlFor="unitPrice">Unit Price (Incl. VAT)</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={currentItem.unitPrice}
                  onChange={(e) =>
                    setCurrentItem((prev) => ({ ...prev, unitPrice: Number.parseFloat(e.target.value) || 0 }))
                  }
                />
              </div>
            </div>

            <Button onClick={addItem} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Items List */}
      {invoiceData.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Invoice Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-3 py-2 text-left">No</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Description</th>
                    <th className="border border-gray-300 px-3 py-2 text-center">Qty</th>
                    <th className="border border-gray-300 px-3 py-2 text-right">Unit Price</th>
                    <th className="border border-gray-300 px-3 py-2 text-right">Total (Incl)</th>
                    <th className="border border-gray-300 px-3 py-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.items.map((item, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 px-3 py-2">{item.no}</td>
                      <td className="border border-gray-300 px-3 py-2">{item.description}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">{item.qty}</td>
                      <td className="border border-gray-300 px-3 py-2 text-right">
                        {item.unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-right">
                        {item.totalIncl.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        <Button size="sm" variant="destructive" onClick={() => removeItem(index)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-end">
              <div className="w-80 space-y-2">
                <div className="flex justify-between">
                  <span className="font-semibold">Total (Excl VAT):</span>
                  <span>{invoiceData.totalExcl.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">VAT (18%):</span>
                  <span>{invoiceData.tax.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between border-t pt-2 font-bold text-lg">
                  <span>Total (Incl VAT):</span>
                  <span>{invoiceData.totalIncl.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate Invoice */}
      <div className="flex justify-center">
        <Button onClick={generateInvoice} size="lg" className="bg-blue-600 hover:bg-blue-700">
          Generate Invoice Preview
        </Button>
      </div>
    </div>
  )
}
