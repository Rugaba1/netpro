"use client"

import { useEffect, useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { PackageWithType } from "@/types/package"
import { Renamedpackage } from "@/lib/generated/prisma"
import { package_type } from "@/lib/generated/prisma"
import axios, {isAxiosError} from "axios"
import { add } from "date-fns"
const formSchema = z.object({
  type_id: z.string().min(1, "Package type is required"),
  description: z.string().min(1, "Package description is required"),
})

export default function ManagePackages() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showEntries, setShowEntries] = useState("10")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState<Renamedpackage|null>(null)
  const [packageTypes, setPackageTypes] = useState<package_type[]>([])
  const[newPackageType, setNewPackageType] = useState<package_type|null>(null)

  const [packages, setPackages] = useState<PackageWithType[]>([])
  const [newPackage, setNewPackage] = useState<Renamedpackage | null>(null)
  const addNewPackageType =async ( ) => {
   try {
   const response = await axios.post('/api/package-types', newPackageType)
   if(response.status < 400) {
     setPackageTypes([...packageTypes, response.data.packageType])
     setNewPackageType(null)
   }
   } catch (error) {
      if (isAxiosError(error)) {
        console.error('Error response:', error.response);
      } else {
        console.error('Unexpected error:', error);
      }
   }
  }

 
  const getPackageTypes = async () => {
    try {
      const response = await axios.get('/api/package-types')
      setPackageTypes(response.data.packageTypes)
      if(response.status < 400) {
        setPackageTypes(response.data.packageTypes)
      }

    } catch (error) {
      if (isAxiosError(error)) {
        console.error('Error response:', error.response);
      } else {
        console.error('Unexpected error:', error);
      }
      
    }
  }
  const getPackages= async() => {
    try {
      const response = await axios.get('/api/packages')
      if(response.status < 400) {
        setPackages(response.data.packages)
      }

    } catch (error) {
      if (isAxiosError(error)) {
        console.error('Error response:', error.response);
      } else {
        console.error('Unexpected error:', error);
      }
      
    }
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type_id: "",
      description: "",
    },
  })

  const filteredPackages = packages.filter(
    (pkg) =>
      pkg.package_type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
       try {
    const response = await axios.post('/api/packages',  values)
    if(response.status < 400) {
      setPackages([...packages, response.data.package])
      setNewPackage(null)
       setIsAddDialogOpen(false)
    form.reset()
    }
    } catch (error) {
       if (isAxiosError(error)) {
         console.error('Error response:', error.response);
       } else {
         console.error('Unexpected error:', error);
       }
    }
    
   
  }

  const handleEdit = (pkg:Renamedpackage) => {
    setEditingPackage(pkg)
    form.reset({
      type_id: pkg.type_id.toString(),
      description: pkg.description,
    })
  }

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this package?")) {
      console.log("Delete package:", id)
    }
  }


  useEffect(() => {
    Promise.all([getPackageTypes(), getPackages()])
  }, [])
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manage Package</h1>
          <nav className="text-sm text-gray-600 mt-1">
            <span>Home</span> / <span>Packages</span> / <span className="text-gray-400">Manage Package</span>
          </nav>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add New Package
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Package</DialogTitle>
              <DialogDescription>Create a new package entry</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="type_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Package Type</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value)
                          }}
                          value={field.value}
                          onOpenChange={() => getPackageTypes()}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select package type" />
                          </SelectTrigger>
                          <SelectContent>
                            {packageTypes.map((type) => (
                              <SelectItem key={type.id} value={type.id.toString()}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Package Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter package description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Package</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* View Package Info Section */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">View Package Info</CardTitle>
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
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>Package-Type</TableHead>
                  <TableHead>Package-Description</TableHead>
                  <TableHead>Creation Date</TableHead>
                  <TableHead>Updation Date</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPackages.slice(0, Number.parseInt(showEntries)).map((pkg, index) => (
                  <TableRow key={pkg.id} className="hover:bg-gray-50">
                    <TableCell className="text-center">{index + 1}</TableCell>
                    <TableCell className="font-medium">{pkg.package_type.name}</TableCell>
                    <TableCell>{pkg.description}</TableCell>
                    <TableCell>{pkg.created_at?.toISOString(  )}</TableCell>
                    <TableCell>{pkg.updated_at?.toISOString()}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center space-x-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 text-xs"
                              onClick={() => handleEdit(pkg)}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                              <DialogTitle>Edit Package</DialogTitle>
                              <DialogDescription>Update package information</DialogDescription>
                            </DialogHeader>
                            <Form {...form}>
                              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                  control={form.control}
                                  name="type_id"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Package Type</FormLabel>
                                      <FormControl>
                                        <Select
                                          onValueChange={(value) => {
                                            field.onChange(value)
                                          }}
                                          value={field.value}
                                          onOpenChange={() => getPackageTypes()}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select package type" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {packageTypes.map((type) => (
                                              <SelectItem key={type.id} value={type.id.toString()}>
                                                {type.name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="description"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Package Description</FormLabel>
                                      <FormControl>
                                        <Textarea placeholder="Enter package description" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <div className="flex justify-end space-x-2">
                                  <Button type="button" variant="outline" onClick={() => setEditingPackage(null)}>
                                    Cancel
                                  </Button>
                                  <Button type="submit">Update Package</Button>
                                </div>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="px-2 py-1 text-xs"
                          onClick={() => handleDelete(pkg.id)}
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
            <div className="text-sm text-gray-600">Showing 1 to 6 of 6 entries</div>
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
