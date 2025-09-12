"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, Trash2, Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import axios from "axios"
import { isAxiosError } from "axios"
import { customer } from "@/lib/generated/prisma"

const formSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  billingName: z.string().min(1, "Billing name is required"),
  tin: z.string().min(1, "TIN is required"),
  phone: z.string().min(1, "Phone is required"),
  serviceNumber: z.string().min(1, "Service number is required"),
})

export default function CustomerManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showEntries, setShowEntries] = useState("10")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const[ isLoading, setIsLoading] = useState(false);

  const [customers, setCustomers] = useState<customer[]>([])
  const getCustomers = async () => {
    try {
      const resp= await axios.get("/customers")
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

     

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "",
      billingName: "",
      tin: "",
      phone: "",
      serviceNumber: "",
    },
  })

  const filteredCustomers = customers.filter(
    (customer) =>
      customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer?.billing_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer?.tin.includes(searchTerm) ||
      customer?.phone.includes(searchTerm) ||
      customer?.service_number.includes(searchTerm),
  )

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log(values)
    setIsAddDialogOpen(false)
    form.reset()
  }

  const handleEdit = (customer) => {
    setEditingCustomer(customer)
    form.reset({
      customerName: customer.customerName,
      billingName: customer.billingName,
      tin: customer.tin,
      phone: customer.phone,
      serviceNumber: customer.serviceNumber,
    })
  }

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this customer?")) {
      console.log("Delete customer:", id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manage Customers</h1>
          <nav className="text-sm text-gray-600 mt-1">
            <span>Home</span> / <span>Customers</span> / <span className="text-gray-400">Manage Customers</span>
          </nav>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add New Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
              <DialogDescription>Create a new customer entry</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter customer name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="billingName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billing Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter billing name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TIN</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter TIN" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="serviceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter service number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Customer</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* View Customers Section */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">View Customers Info</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Controls */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm">Show</span>
              <Select value={showEntries} onValueChange={setShowEntries}>
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
              <span className="text-sm">entries</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm">Search:</span>
              <Input
                className="w-64"
                placeholder=""
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-12 text-center">No</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Billing Name</TableHead>
                  <TableHead>TIN</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Service Number</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.slice(0, Number.parseInt(showEntries)).map((customer, index) => (
                  <TableRow key={customer.id} className="hover:bg-gray-50">
                    <TableCell className="text-center">{index + 1}</TableCell>
                    <TableCell className="font-medium">{customer.customerName}</TableCell>
                    <TableCell>{customer.billingName}</TableCell>
                    <TableCell>{customer.tin}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>{customer.serviceNumber}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center space-x-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 text-xs"
                              onClick={() => handleEdit(customer)}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                              <DialogTitle>Edit Customer</DialogTitle>
                              <DialogDescription>Update customer information</DialogDescription>
                            </DialogHeader>
                            <Form {...form}>
                              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                  control={form.control}
                                  name="customerName"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Customer Name</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Enter customer name" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="billingName"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Billing Name</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Enter billing name" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="tin"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>TIN</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Enter TIN" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="phone"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Phone</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Enter phone number" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="serviceNumber"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Service Number</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Enter service number" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <div className="flex justify-end space-x-2">
                                  <Button type="button" variant="outline" onClick={() => setEditingCustomer(null)}>
                                    Cancel
                                  </Button>
                                  <Button type="submit">Update Customer</Button>
                                </div>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="px-2 py-1 text-xs"
                          onClick={() => handleDelete(customer.id)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-600">Showing 1 to 10 of 10 entries</div>
            <div className="flex space-x-1">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button size="sm" className="bg-blue-600 text-white">
                1
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
