"use client"
import { Button } from "@/components/ui/button"
import { Printer, Download } from "lucide-react"

interface InvoiceItem {
  no: number
  description: string
  qty: number
  unitPrice: number
  priceExclVat: number
  vat: number
  totalIncl: number
  customerName?: string // Optional for consolidated invoices
}

interface InvoiceData {
  invoiceNo: string
  date: string
  startingDate: string
  expiredDate: string
  currency: string
  billTo: string
  items: InvoiceItem[]
  totalExcl: number
  tax: number
  subTotal: number
  discount: number
  totalIncl: number
  paidAmountInLetters: string
}

interface InvoiceTemplateProps {
  invoiceData: InvoiceData
}

export default function InvoiceTemplate({ invoiceData }: InvoiceTemplateProps) {
  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    console.log("Downloading PDF...")
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      {/* Action Buttons */}
      <div className="flex justify-end gap-2 mb-4 print:hidden">
        <Button onClick={handlePrint} variant="outline">
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
        <Button onClick={handleDownload} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
      </div>

      {/* Main Invoice Container */}
      <div className="bg-white border-2 border-black p-6">
        {/* Header with Logo and Company Info */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <img src="/images/netpro-logo.jpeg" alt="NETPRO Logo" className="h-20 w-auto" />
          </div>
          <div className="text-center text-sm leading-relaxed">
            <div className="font-bold text-lg mb-1">NETPRO Ltd</div>
            <div className="mb-1">KG 9, Ave</div>
            <div className="mb-1">P.O. Box 2234 Kgali Rwanda</div>
            <div className="mb-1">Tel: 0786856484 | Email: netprorwanda@gmail.com</div>
            <div>TIN: 106838391</div>
          </div>
        </div>

        {/* Horizontal Line */}
        <hr className="border-t-2 border-black mb-6" />

        {/* Invoice Title */}
        <div className="mb-6">
          <div className="border-2 border-black py-3">
            <h1 className="text-3xl font-bold text-blue-600 text-center">INVOICE</h1>
          </div>
        </div>

        {/* Bill To and Invoice Details */}
        <div className="flex justify-between mb-6">
          <div>
            <span className="font-bold">Bill To:</span>
            <span className="ml-8">{invoiceData.billTo}</span>
          </div>
          <div className="text-right space-y-1 text-sm">
            <div className="flex justify-between min-w-[200px]">
              <span className="font-bold">Invoice No:</span>
              <span>{invoiceData.invoiceNo}</span>
            </div>
            <div className="flex justify-between min-w-[200px]">
              <span className="font-bold">Date:</span>
              <span>{invoiceData.date}</span>
            </div>
            <div className="flex justify-between min-w-[200px]">
              <span className="font-bold">Starting Date:</span>
              <span>{invoiceData.startingDate}</span>
            </div>
            <div className="flex justify-between min-w-[200px]">
              <span className="font-bold">Expired Date:</span>
              <span>{invoiceData.expiredDate}</span>
            </div>
            <div className="flex justify-between min-w-[200px]">
              <span className="font-bold">Currency:</span>
              <span>{invoiceData.currency}</span>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-6">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="bg-blue-600 text-white px-2 py-2 text-center text-sm font-bold">No</th>
                {invoiceData.items.some((item) => item.customerName) && (
                  <th className="bg-blue-600 text-white px-2 py-2 text-center text-sm font-bold">Customer</th>
                )}
                <th className="bg-blue-600 text-white px-2 py-2 text-center text-sm font-bold">Item Description</th>
                <th className="bg-blue-600 text-white px-2 py-2 text-center text-sm font-bold">Qty</th>
                <th className="bg-blue-600 text-white px-2 py-2 text-center text-sm font-bold">Unity Price</th>
                <th className="bg-blue-600 text-white px-2 py-2 text-center text-sm font-bold">Price (VAT-Excl)</th>
                <th className="bg-blue-600 text-white px-2 py-2 text-center text-sm font-bold">Tax (VAT)</th>
                <th className="bg-blue-600 text-white px-2 py-2 text-center text-sm font-bold">Total (Incl)</th>
              </tr>
            </thead>
            <tbody>
              {invoiceData.items.map((item) => (
                <tr key={item.no}>
                  <td className="px-2 py-2 text-center text-sm">{item.no}</td>
                  {invoiceData.items.some((item) => item.customerName) && (
                    <td className="px-2 py-2 text-sm font-medium">{item.customerName || ""}</td>
                  )}
                  <td className="px-2 py-2 text-sm">{item.description}</td>
                  <td className="px-2 py-2 text-center text-sm">{item.qty}</td>
                  <td className="px-2 py-2 text-right text-sm">
                    {item.unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-2 py-2 text-right text-sm">
                    {item.priceExclVat.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-2 py-2 text-right text-sm">
                    {item.vat.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-2 py-2 text-right text-sm">
                    {item.totalIncl.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Horizontal Line */}
        <hr className="border-t border-black mb-4" />

        {/* Totals */}
        <div className="flex justify-end mb-6">
          <div className="w-80 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="font-bold">Total (Excl) :</span>
              <span>{invoiceData.totalExcl.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold">Tax :</span>
              <span>{invoiceData.tax.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold">Sub-Total :</span>
              <span>{invoiceData.subTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold">Discount :</span>
              <span>{invoiceData.discount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between border-t border-black pt-1 font-bold">
              <span>Total (Incl) :</span>
              <span>{invoiceData.totalIncl.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Amount in Letters */}
        <div className="mb-4">
          <p className="text-sm">
            <span className="font-bold">The Paid Amount in Letters: </span>
            <span>{invoiceData.paidAmountInLetters}</span>
          </p>
        </div>

        {/* Payment Terms */}
        <div className="mb-6">
          <h3 className="font-bold text-sm mb-2">Payment Terms:</h3>
          <p className="text-sm">
            * Please submit the proof of your payment to the reception or by email to avoid confusion. (For Transfer or
            Bank deposit)
          </p>
        </div>

        {/* Footer */}
        <div className="text-center border-t-2 border-black pt-4 mb-4">
          <p className="text-sm font-bold">Prepared by Accountant</p>
        </div>

        {/* Print Button */}
        <div className="text-center">
          <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2">
            Print Invoice
          </Button>
        </div>
      </div>
    </div>
  )
}
