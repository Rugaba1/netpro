"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Edit, Trash2, Plus, Search, Home, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

import axios, { isAxiosError } from "axios"
import { customer as Customer } from "@/lib/generated/prisma"
export default function ManageCustomers() {
   
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [entriesPerPage, setEntriesPerPage] = useState("10")
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

    const [customers, setCustomers] = useState<Customer[]>([])
  const getCustomers = async () => {
    try {
      const resp= await axios.get("/api/customers")
      if(resp.status==200){
        setCustomers(resp.data.customers)
      }else{
        console.error("Error fetching customers:", resp.statusText)
      }

      
    } catch (error) {
      if (isAxiosError(error)) {
        console.error("Error fetching customers:", error.response?.data)
      } else {
        console.error("Unexpected error fetching customers:", error)
      }
    }
  }

  useEffect(() => {
    getCustomers().finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    const filtered = customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.billing_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.tin.includes(searchTerm) ||
        customer.phone.includes(searchTerm) ||
        customer.service_number.includes(searchTerm),
    )
    setFilteredCustomers(filtered)
    setCurrentPage(1)
  }, [searchTerm, customers])

  const handleAddCustomer =async (customerData: Partial<Customer>) => {
    const newCustomer: Customer = {
      id: customers.length + 1,
      name: customerData.name || "",
      billing_name: customerData.billing_name || "",
      tin: customerData.tin || "",
      phone: customerData.phone || "",
      service_number: customerData.service_number || "",
      created_at:  customerData?.created_at??null,
      updated_at: customerData.updated_at ?? null,
      user_id: customerData.user_id??-1 , 
    }

  try {
    await axios.post("/api/customers", newCustomer).then((resp)=>{
      if(resp.status==201){
        setCustomers([...customers, newCustomer])
        setIsAddModalOpen(false)
        toast({
          title: "Success",
          description: "Customer added successfully",
        })
      }else{
        console.error("Error adding customer:", resp.statusText)
      }
    })
  } catch (error) {
    if (isAxiosError(error)) {
      console.error("Error adding customer:", error.response?.data)
    } else {
      console.error("Unexpected error adding customer:", error)
    } 
  }
  }

  const handleEditCustomer = (customerData: Partial<Customer>) => {
    if (!selectedCustomer) return

    const updatedCustomers = customers.map((customer) =>
      customer.id === selectedCustomer.id ? { ...customer, ...customerData } : customer,
    )

    setCustomers(updatedCustomers)
    setIsEditModalOpen(false)
    setSelectedCustomer(null)
    toast({
      title: "Success",
      description: "Customer updated successfully",
    })
  }

  const handleDeleteCustomer = (customerId: number) => {
    if (confirm("Are you sure you want to delete this customer?")) {
      setCustomers(customers.filter((customer) => customer.id !== customerId))
      toast({
        title: "Success",
        description: "Customer deleted successfully",
      })
    }
  }

  const openEditModal = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsEditModalOpen(true)
  }

  // Pagination
  const totalEntries = filteredCustomers.length
  const entriesPerPageNum = Number.parseInt(entriesPerPage)
  const totalPages = Math.ceil(totalEntries / entriesPerPageNum)
  const startIndex = (currentPage - 1) * entriesPerPageNum
  const endIndex = startIndex + entriesPerPageNum
  const currentEntries = filteredCustomers.slice(startIndex, endIndex)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Manage Customers</h1>
            {/* Breadcrumb */}
            <nav className="flex items-center space-x-2 text-sm text-gray-500 mt-2">
              <Home className="h-4 w-4" />
              <span>Home</span>
              <ChevronRight className="h-4 w-4" />
              <span>Customers</span>
              <ChevronRight className="h-4 w-4" />
              <span className="text-gray-900">Manage Customers</span>
            </nav>
          </div>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add New Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
              </DialogHeader>
              <CustomerForm onSubmit={handleAddCustomer} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="p-6">
        {/* View Customers Info Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">View Customers Info</h2>
          </div>

          <div className="p-6">
            {/* Controls */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-2">
                <Label className="text-sm text-gray-700">Show</Label>
                <Select value={entriesPerPage} onValueChange={setEntriesPerPage}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <Label className="text-sm text-gray-700">entries</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Label className="text-sm text-gray-700">Search:</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-12 text-center border-r border-gray-200">No</TableHead>
                    <TableHead className="border-r border-gray-200">Customer Name</TableHead>
                    <TableHead className="border-r border-gray-200">Billing Name</TableHead>
                    <TableHead className="border-r border-gray-200">TIN</TableHead>
                    <TableHead className="border-r border-gray-200">Phone</TableHead>
                    <TableHead className="border-r border-gray-200">Service Number</TableHead>
                    <TableHead className="text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Loading customers...
                      </TableCell>
                    </TableRow>
                  ) : currentEntries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No customers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentEntries.map((customer, index) => (
                      <TableRow key={customer.id} className="hover:bg-gray-50">
                        <TableCell className="text-center border-r border-gray-200">{startIndex + index + 1}</TableCell>
                        <TableCell className="font-medium border-r border-gray-200">{customer.name}</TableCell>
                        <TableCell className="border-r border-gray-200">{customer.billing_name}</TableCell>
                        <TableCell className="border-r border-gray-200">{customer.tin}</TableCell>
                        <TableCell className="border-r border-gray-200">{customer.phone}</TableCell>
                        <TableCell className="border-r border-gray-200">{customer.service_number}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center space-x-2">
                            <Button
                              size="sm"
                              onClick={() => openEditModal(customer)}
                              className="bg-cyan-500 hover:bg-cyan-600 text-white px-3 py-1 text-xs"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteCustomer(customer.id)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-xs"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to {Math.min(endIndex, totalEntries)} of {totalEntries} entries
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button variant="outline" size="sm" className="bg-blue-600 text-white">
                  {currentPage}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          {selectedCustomer && <CustomerForm customer={selectedCustomer} onSubmit={handleEditCustomer} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Customer Form Component
function CustomerForm({
  customer,
  onSubmit,
}: {
  customer?: Customer
  onSubmit: (data: Partial<Customer>) => void
}) {
  const [formData, setFormData] = useState({
    name: customer?.name || "",
    billing_name: customer?.billing_name || "",
    tin: customer?.tin || "",
    phone: customer?.phone || "",
    serviceNumber: customer?.service_number || "",
 
    
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="customerName">Customer Name *</Label>
          <Input
            id="customerName"
            value={formData.customerName}
            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="billingName">Billing  *</Label>
          <Input
            id="billingName"
            value={formData.billingName}
            onChange={(e) => setFormData({ ...formData, billingName: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="tin">TIN *</Label>
          <Input
            id="tin"
            value={formData.tin}
            onChange={(e) => setFormData({ ...formData, tin: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone *</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="serviceNumber">Service Number *</Label>
          <Input
            id="serviceNumber"
            value={formData.serviceNumber}
            onChange={(e) => setFormData({ ...formData, serviceNumber: e.target.value })}
            required
          />
        </div>
       
      </div>

  

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          {customer ? "Update Customer" : "Add Customer"}
        </Button>
      </div>
    </form>
  )
}
