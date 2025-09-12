"use client"
import { Button } from "@/components/ui/button"
import { Printer, Download } from "lucide-react"

interface QuotationItem {
  no: number
  description: string
  qty: number
  unitPrice: number
  discount: number
  priceExclVat: number
  vat: number
  totalIncl: number
}

interface QuotationData {
  quotationNo: string
  date: string
  validUntil: string
  currency: string
  billTo?: string
  customerName: string
  billingName?: string
  items: QuotationItem[]
  totalExcl: number
  tax: number
  totalDiscount: number
  totalIncl: number
  amountInLetters: string
  notes?: string
}

interface QuotationTemplateProps {
  quotationData: QuotationData
}

export default function QuotationTemplate({ quotationData }: QuotationTemplateProps) {
  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    console.log("Downloading PDF...")
  }

  const safeNumber = (value: any) => Number(value || 0)

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

      {/* Main Quotation Container */}
      <div className="bg-white border-2 border-black p-6">
        {/* Header with Logo and Company Info */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <img src="/images/netpro-logo.jpeg" alt="NETPRO Logo" className="h-20 w-auto" />
          </div>
          <div className="text-center text-sm leading-relaxed">
            <div className="font-bold text-lg mb-1">NETPRO Ltd</div>
            <div className="mb-1">KG 9, Ave</div>
            <div className="mb-1">P.O. Box 2234 Kigali Rwanda</div>
            <div className="mb-1">Tel: 0786856484 | Email: netprorwanda@gmail.com</div>
            <div>TIN: 106838391</div>
          </div>
        </div>

        {/* Horizontal Line */}
        <hr className="border-t-2 border-black mb-6" />

        {/* Quotation Title */}
        <div className="mb-6">
          <div className="border-2 border-black py-3">
            <h1 className="text-3xl font-bold text-green-600 text-center">QUOTATION</h1>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex justify-end mb-4">
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded font-semibold text-sm">
            {quotationData.quotationNo} SENT
          </div>
        </div>

        {/* Bill To and Quotation Details */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div className="space-y-2">
            <div>
              <span className="font-bold">Bill To:</span>
              <span className="ml-2">{quotationData.billTo || quotationData.billingName}</span>
            </div>
            <div>
              <span className="font-bold">Customer:</span>
              <span className="ml-2">{quotationData.customerName}</span>
            </div>
          </div>
          <div className="text-right space-y-1 text-sm">
            <div className="flex justify-between min-w-[250px]">
              <span className="font-bold">Quotation No:</span>
              <span>{quotationData.quotationNo}</span>
            </div>
            <div className="flex justify-between min-w-[250px]">
              <span className="font-bold">Date:</span>
              <span>{quotationData.date}</span>
            </div>
            <div className="flex justify-between min-w-[250px]">
              <span className="font-bold">Valid Until:</span>
              <span>{quotationData.validUntil}</span>
            </div>
            <div className="flex justify-between min-w-[250px]">
              <span className="font-bold">Currency:</span>
              <span>{quotationData.currency}</span>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-6">
          <table className="w-full border-collapse border border-black">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="border border-black px-2 py-2 text-center text-sm font-bold">No</th>
                <th className="border border-black px-2 py-2 text-center text-sm font-bold">Item Description</th>
                <th className="border border-black px-2 py-2 text-center text-sm font-bold">Qty</th>
                <th className="border border-black px-2 py-2 text-center text-sm font-bold">Unit Price</th>
                <th className="border border-black px-2 py-2 text-center text-sm font-bold">Discount</th>
                <th className="border border-black px-2 py-2 text-center text-sm font-bold">Price (VAT-Excl)</th>
                <th className="border border-black px-2 py-2 text-center text-sm font-bold">Tax (VAT)</th>
                <th className="border border-black px-2 py-2 text-center text-sm font-bold">Total (Incl)</th>
              </tr>
            </thead>
            <tbody>
              {(quotationData.items || []).map((item) => (
                <tr key={item.no}>
                  <td className="border border-black px-2 py-2 text-center text-sm">{item.no}</td>
                  <td className="border border-black px-2 py-2 text-sm">{item.description}</td>
                  <td className="border border-black px-2 py-2 text-center text-sm">{item.qty}</td>
                  <td className="border border-black px-2 py-2 text-right text-sm">
                    {safeNumber(item.unitPrice).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="border border-black px-2 py-2 text-center text-sm">
                    {safeNumber(item.discount).toFixed(2)}%
                  </td>
                  <td className="border border-black px-2 py-2 text-right text-sm">
                    {safeNumber(item.priceExclVat).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="border border-black px-2 py-2 text-right text-sm">
                    {safeNumber(item.vat).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="border border-black px-2 py-2 text-right text-sm">
                    {safeNumber(item.totalIncl).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Section */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div className="text-sm">
            <div className="font-bold">Total Items: {(quotationData.items || []).length}</div>
          </div>
          <div className="text-right space-y-1 text-sm">
            <div className="flex justify-between min-w-[250px]">
              <span className="font-bold">Subtotal (Excl):</span>
              <span>{safeNumber(quotationData.totalExcl).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between min-w-[250px]">
              <span className="font-bold">Tax (18%):</span>
              <span>{safeNumber(quotationData.tax).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between min-w-[250px]">
              <span className="font-bold">Total Discount:</span>
              <span>
                {safeNumber(quotationData.totalDiscount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between min-w-[250px] border-t border-black pt-1 font-bold">
              <span>Total (Incl):</span>
              <span>{safeNumber(quotationData.totalIncl).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Amount in Letters */}
        <div className="mb-6">
          <p className="text-sm">
            <span className="font-bold">The Total Amount in Letters: </span>
            <span>{quotationData.amountInLetters}</span>
          </p>
        </div>

        {/* Terms & Conditions */}
        <div className="mb-6">
          <h3 className="font-bold text-sm mb-2">Terms & Conditions:</h3>
          <div className="text-sm space-y-1">
            <p>* This is a quotation and not a tax invoice.</p>
            <p>* Prices are valid until {quotationData.validUntil}.</p>
            <p>* Payment terms: 50% advance, 50% on delivery.</p>
            <p>* Delivery time: 7-14 business days after confirmation.</p>
            <p>* Please confirm your order within the validity period.</p>
          </div>
          {quotationData.notes && (
            <div className="mt-3">
              <p className="text-sm">
                <span className="font-bold">Additional Notes: </span>
                {quotationData.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center border-t-2 border-black pt-4 mb-4">
          <p className="text-sm font-bold">Prepared by Accountant</p>
          <p className="text-xs text-gray-600 mt-1">This is a computer-generated quotation</p>
        </div>

        {/* Print Button */}
        <div className="text-center">
          <Button onClick={handlePrint} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2">
            Print Quotation
          </Button>
        </div>
      </div>
    </div>
  )
}
