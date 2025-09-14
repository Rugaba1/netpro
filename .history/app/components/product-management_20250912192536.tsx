"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, Trash2 } from "lucide-react"
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
import { ProductWithPackage as Product } from "@/types/product"

const formSchema = z.object({
  packageType: z.string().min(1, "Package type is required"),
  productType: z.string().min(1, "Product type is required"),
  bundle: z.string().min(1, "Bundle is required"),
  wholesalePrice: z.number().min(0, "Wholesale price must be positive"),
  sellingPrice: z.number().min(0, "Selling price must be positive"),
  duration: z.string().min(1, "Duration is required"),
})

export default function ProductManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showEntries, setShowEntries] = useState("10")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const [products, setProducts] = useState<Product[]>([])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      packageType: "",
      productType: "",
      bundle: "",
      wholesalePrice: 0,
      sellingPrice: 0,
      duration: "",
    },
  })

  const filteredProducts = products.filter(
    (product) =>
      product.packageT.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.productType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.bundle.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log(values)
    setIsAddDialogOpen(false)
    form.reset()
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    form.reset({
      packageType: product.packageType,
      productType: product.productType,
      bundle: product.bundle,
      wholesalePrice: product.wholesalePrice,
      sellingPrice: product.sellingPrice,
      duration: product.duration,
    })
  }

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      console.log("Delete product:", id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Product Management</h1>
          <nav className="text-sm text-gray-600 mt-1">
            <span>Home</span> / <span>Products</span> / <span className="text-gray-400">Manage Products</span>
          </nav>
        </div>
      </div>

      {/* View Products Section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">View Products</CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">Add New Product</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                  <DialogDescription>Create a new product entry</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="packageType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Package Type</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter package type" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="productType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Type</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter product type" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bundle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bundle</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter bundle" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="wholesalePrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Wholesale Price</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(+e.target.value)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="sellingPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Selling Price</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(+e.target.value)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter duration" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Add Product</Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
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
                  <TableHead>Package Type</TableHead>
                  <TableHead>Product-Type</TableHead>
                  <TableHead>Bundle</TableHead>
                  <TableHead>Wholesales Price</TableHead>
                  <TableHead>Selling Price</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.slice(0, Number.parseInt(showEntries)).map((product, index) => (
                  <TableRow key={product.id} className="hover:bg-gray-50">
                    <TableCell className="text-center">{index + 1}</TableCell>
                    <TableCell className="font-medium">{product.packageType}</TableCell>
                    <TableCell>{product.productType}</TableCell>
                    <TableCell>{product.bundle}</TableCell>
                    <TableCell>{product.wholesalePrice}</TableCell>
                    <TableCell>{product.sellingPrice}</TableCell>
                    <TableCell>{product.duration}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center space-x-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 text-xs"
                              onClick={() => handleEdit(product)}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                              <DialogTitle>Edit Product</DialogTitle>
                              <DialogDescription>Update product information</DialogDescription>
                            </DialogHeader>
                            <Form {...form}>
                              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                  control={form.control}
                                  name="packageType"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Package Type</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Enter package type" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="productType"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Product Type</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Enter product type" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="bundle"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Bundle</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Enter bundle" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                  <FormField
                                    control={form.control}
                                    name="wholesalePrice"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Wholesale Price</FormLabel>
                                        <FormControl>
                                          <Input
                                            type="number"
                                            placeholder="0"
                                            {...field}
                                            onChange={(e) => field.onChange(+e.target.value)}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name="sellingPrice"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Selling Price</FormLabel>
                                        <FormControl>
                                          <Input
                                            type="number"
                                            placeholder="0"
                                            {...field}
                                            onChange={(e) => field.onChange(+e.target.value)}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                                <FormField
                                  control={form.control}
                                  name="duration"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Duration</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Enter duration" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <div className="flex justify-end space-x-2">
                                  <Button type="button" variant="outline" onClick={() => setEditingProduct(null)}>
                                    Cancel
                                  </Button>
                                  <Button type="submit">Update Product</Button>
                                </div>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="px-2 py-1 text-xs"
                          onClick={() => handleDelete(product.id)}
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
            <div className="text-sm text-gray-600">
              Showing 1 to {Math.min(Number.parseInt(showEntries), filteredProducts.length)} of{" "}
              {filteredProducts.length} entries
            </div>
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
