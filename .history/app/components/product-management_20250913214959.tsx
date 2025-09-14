"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProductWithPackage as Product } from "@/types/product";
import {
  product as ProductType,
  Renamedpackage as Package,
  product_type as ProductTypeType,
} from "@/lib/generated/prisma";
import axios, { isAxiosError } from "axios";

const formSchema = z.object({
  package_id: z.string().min(1, "Package type is required"),
  type_id: z.string().min(1, "Product type is required"),
  name: z.string().min(1, "name is required"),
  price: z.number().min(0, "Wholesale price must be positive"),
  net_price: z.number().min(0, "Selling price must be positive"),
  duration: z.number().min(1, "Duration is required"),
});

export default function ProductManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showEntries, setShowEntries] = useState("10");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAddProductTypeDialogOpen, setIsAddProductTypeDialogOpen] =
    useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductType | null>(
    null
  );
  const [productTypes, setProductTypes] = useState<ProductTypeType[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [typeName, setTypeName] = useState("");

  const [products, setProducts] = useState<Product[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      package_id: "",
      type_id: "",
      name: "",
      price: 0,
      net_price: 0,
      duration: 0,
    },
  });

  const getPackages = async () => {
    try {
      const response = await axios.get("/api/packages");
      if (response.status < 400) {
        setPackages(response.data.packages);
      }
    } catch (error) {
      if (isAxiosError(error)) {
        console.error("Error response:", error.response);
      } else {
        console.error("Unexpected error:", error);
      }
    }
  };

  const getProductTypes = async () => {
    try {
      const response = await axios.get("/api/product-types");
      if (response.status < 400) {
        setProductTypes(response.data.productTypes ?? []);
      }
    } catch (error) {
      if (isAxiosError(error)) {
        console.error("Error response:", error.response);
      } else {
        console.error("Unexpected error:", error);
      }
    }
  };

  const getProducts = async () => {
    try {
      const response = await axios.get("/api/products");
      if (response.status < 400) {
        setProducts(response.data.products);
      }
    } catch (error) {
      if (isAxiosError(error)) {
        console.error("Error response:", error.response);
      } else {
        console.error("Unexpected error:", error);
      }
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.package?.description
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log(values);
    setIsAddDialogOpen(false);
    form.reset();
  };

  const handleEdit = (product: ProductType) => {
    setEditingProduct(product);
    form.reset({
      package_id: product.package_id?.toString() || "",
      type_id: product.type_id?.toString() || "",

      price: product.price.toNumber(),
      net_price: product.net_price.toNumber(),
      duration: product.duration,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      console.log("Delete product:", id);
    }
  };

  const handleTypeAdd = async () => {
    try {
      const response = await axios.post("/api/product-types", {
        name: typeName,
      });
      if (response.status < 400) {
        setTypeName("");
        getProductTypes();
        setIsAddProductTypeDialogOpen(false);
      }
    } catch (error) {
      if (isAxiosError(error)) {
        console.error("Error response:", error.response);
      } else {
        console.error("Unexpected error:", error);
      }
    }
  };

  useEffect(() => {
    Promise.all([getPackages(), getProducts(), getProductTypes()]);
  }, []);
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Product Management
          </h1>
          <nav className="text-sm text-gray-600 mt-1">
            <span>Home</span> / <span>Products</span> /{" "}
            <span className="text-gray-400">Manage Products</span>
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
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Add New Product
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                  <DialogDescription>
                    Create a new product entry
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="package_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Package</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                              }}
                              value={field.value?.toString()}
                              onOpenChange={() => getPackages()}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select package" />
                              </SelectTrigger>
                              <SelectContent>
                                {packages.map((type) => (
                                  <SelectItem
                                    key={type.id}
                                    value={type.id.toString()}
                                  >
                                    {type.description}
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
                      name="type_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Type</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                              }}
                              value={field.value?.toString()}
                              onOpenChange={() => getProductTypes()}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select Type" />
                              </SelectTrigger>
                              <SelectContent>
                                {productTypes?.map((type) => (
                                  <SelectItem
                                    key={type.id}
                                    value={type.id.toString()}
                                  >
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

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Wholesale Price</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(+e.target.value)
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="net_price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Selling Price</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(+e.target.value)
                                }
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
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">Add Product</Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <Dialog
              open={isAddProductTypeDialogOpen}
              onOpenChange={setIsAddProductTypeDialogOpen}
            >
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                   New Type
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add new type</DialogTitle>
                  <DialogDescription>
                    Create a new product type
                  </DialogDescription>
                </DialogHeader>

                <Input
                  placeholder="Enter type name"
                  onChange={(e) => setTypeName(e.target.value)}
                />

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddProductTypeDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" onClick={handleTypeAdd}>
                    Add Type
                  </Button>
                </div>
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
                  <TableHead>Package</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Wholesales Price</TableHead>
                  <TableHead>Selling Price</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts
                  .slice(0, Number.parseInt(showEntries))
                  .map((product, index) => (
                    <TableRow key={product.id} className="hover:bg-gray-50">
                      <TableCell className="text-center">{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        {product.package?.description}
                      </TableCell>
                      <TableCell>{product.type.name}</TableCell>
                      <TableCell>{product.price.toNumber()}</TableCell>
                      <TableCell>{product.net_price.toNumber()}</TableCell>
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
                                <DialogDescription>
                                  Update product information
                                </DialogDescription>
                              </DialogHeader>
                              <Form {...form}>
                                <form
                                  onSubmit={form.handleSubmit(onSubmit)}
                                  className="space-y-4"
                                >
                                  <FormField
                                    control={form.control}
                                    name="package_id"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Package</FormLabel>
                                        <FormControl>
                                          <Select
                                            onValueChange={(value) => {
                                              field.onChange(value);
                                            }}
                                            value={field.value?.toString()}
                                            onOpenChange={() => getPackages()}
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select package" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {packages.map((type) => (
                                                <SelectItem
                                                  key={type.id}
                                                  value={type.id.toString()}
                                                >
                                                  {type.description}
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
                                    name="type_id"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Product Type</FormLabel>
                                        <FormControl>
                                          <Select
                                            onValueChange={(value) => {
                                              field.onChange(value);
                                            }}
                                            value={field.value?.toString()}
                                            onOpenChange={() =>
                                              getProductTypes()
                                            }
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {productTypes?.map((type) => (
                                                <SelectItem
                                                  key={type.id}
                                                  value={type.id.toString()}
                                                >
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

                                  <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                      control={form.control}
                                      name="price"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Wholesale Price</FormLabel>
                                          <FormControl>
                                            <Input
                                              type="number"
                                              placeholder="0"
                                              {...field}
                                              onChange={(e) =>
                                                field.onChange(+e.target.value)
                                              }
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={form.control}
                                      name="net_price"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Selling Price</FormLabel>
                                          <FormControl>
                                            <Input
                                              type="number"
                                              placeholder="0"
                                              {...field}
                                              onChange={(e) =>
                                                field.onChange(+e.target.value)
                                              }
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
                                          <Input
                                            placeholder="Enter duration"
                                            {...field}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <div className="flex justify-end space-x-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => setEditingProduct(null)}
                                    >
                                      Cancel
                                    </Button>
                                    <Button type="submit">
                                      Update Product
                                    </Button>
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
              Showing 1 to{" "}
              {Math.min(Number.parseInt(showEntries), filteredProducts.length)}{" "}
              of {filteredProducts.length} entries
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
  );
}
