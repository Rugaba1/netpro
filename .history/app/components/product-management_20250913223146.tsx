"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios, { isAxiosError } from "axios";

// UI Components
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

// Icons
import { Edit, Trash2, Plus } from "lucide-react";

// Types
import { ProductWithPackage as Product } from "@/types/product";
import {
  product as ProductType,
  Renamedpackage as Package,
  product_type as ProductTypeType,
} from "@/lib/generated/prisma";

// Form Schema
const productFormSchema = z.object({
  package_id: z.string().min(1, "Package type is required"),
  type_id: z.string().min(1, "Product type is required"),
  name: z.string().min(1, "Name is required"),
  price: z.number().min(0, "Wholesale price must be positive"),
  net_price: z.number().min(0, "Selling price must be positive"),
  duration: z.number().min(0, "Duration is required"),
});

const productTypeFormSchema = z.object({
  name: z.string().min(1, "Type name is required"),
});

export default function ProductManagement() {
  // State management
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
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Forms
  const productForm = useForm<z.infer<typeof productFormSchema>>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      package_id: "",
      type_id: "",
      name: "",
      price: 0,
      net_price: 0,
      duration: 0,
    },
  });

  const productTypeForm = useForm<z.infer<typeof productTypeFormSchema>>({
    resolver: zodResolver(productTypeFormSchema),
    defaultValues: {
      name: "",
    },
  });

  // Data fetching functions
  const fetchPackages = async () => {
    try {
      const response = await axios.get("/api/packages");
      if (response.status < 400) {
        setPackages(response.data.packages);
      }
    } catch (error) {
      console.error("Error fetching packages:", error);
      if (isAxiosError(error)) {
        setError(error.response?.data?.message || "Failed to fetch packages");
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  const fetchProductTypes = async () => {
    try {
      const response = await axios.get("/api/product-types");
      if (response.status < 400) {
        setProductTypes(response.data.productTypes ?? []);
      }
    } catch (error) {
      console.error("Error fetching product types:", error);
      if (isAxiosError(error)) {
        setError(
          error.response?.data?.message || "Failed to fetch product types"
        );
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("/api/products");
      if (response.status < 400) {
        setProducts(response.data.products);
        setError(null);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      if (isAxiosError(error)) {
        setError(error.response?.data?.message || "Failed to fetch products");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered products based on search term
  const filteredProducts = products.filter(
    (product) =>
      product.package?.description
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.type.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Form submission handlers
  const handleProductSubmit = async (
    values: z.infer<typeof productFormSchema>
  ) => {
    try {
      const url = editingProduct
        ? `/api/products/${editingProduct.id}`
        : "/api/products";
      const method = editingProduct ? "put" : "post";

      const response = await axios[method](url, {
        ...values,
        package_id: Number(values.package_id),
        type_id: Number(values.type_id),
      });

      if (response.status < 400) {
        productForm.reset();
        setIsAddDialogOpen(false);
        setEditingProduct(null);
        fetchProducts();
      }
    } catch (error) {
      console.error("Error saving product:", error);
      if (isAxiosError(error)) {
        setError(error.response?.data?.message || "Failed to save product");
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  const handleProductTypeSubmit = async (
    values: z.infer<typeof productTypeFormSchema>
  ) => {
    try {
      const response = await axios.post("/api/product-types", values);
      if (response.status < 400) {
        productTypeForm.reset();
        setIsAddProductTypeDialogOpen(false);
        fetchProductTypes();
      }
    } catch (error) {
      console.error("Error adding product type:", error);
      if (isAxiosError(error)) {
        setError(error.response?.data?.message || "Failed to add product type");
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  // Action handlers
  const handleEdit = (product: ProductType) => {
    setEditingProduct(product);
    productForm.reset({
      package_id: product.package_id?.toString() || "",
      type_id: product.type_id?.toString() || "",
      name: product.name,
      price: product.price.toNumber(),
      net_price: product.net_price.toNumber(),
      duration: product.duration,
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        const response = await axios.delete(`/api/products/${id}`);
        if (response.status < 400) {
          fetchProducts();
        }
      } catch (error) {
        console.error("Error deleting product:", error);
        if (isAxiosError(error)) {
          setError(error.response?.data?.message || "Failed to delete product");
        } else {
          setError("An unexpected error occurred");
        }
      }
    }
  };

  // Effects
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchPackages(),
          fetchProducts(),
          fetchProductTypes(),
        ]);
      } catch (error) {
        console.error("Error loading data:", error);
        setError("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isAddDialogOpen) {
      setEditingProduct(null);
      productForm.reset();
    }
  }, [isAddDialogOpen, productForm]);

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

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
          <button
            className="absolute top-0 right-0 p-3"
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* View Products Section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">View Products</CardTitle>
            <div className="flex gap-2">
              <Dialog
                open={isAddProductTypeDialogOpen}
                onOpenChange={setIsAddProductTypeDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    New Type
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add New Product Type</DialogTitle>
                    <DialogDescription>
                      Create a new product type for categorizing products
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...productTypeForm}>
                    <form
                      onSubmit={productTypeForm.handleSubmit(
                        handleProductTypeSubmit
                      )}
                      className="space-y-4"
                    >
                      <FormField
                        control={productTypeForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter type name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsAddProductTypeDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">Add Type</Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-1" />
                    Add New Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingProduct ? "Edit Product" : "Add New Product"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingProduct
                        ? "Update product information"
                        : "Create a new product entry"}
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...productForm}>
                    <form
                      onSubmit={productForm.handleSubmit(handleProductSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={productForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter product name"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={productForm.control}
                        name="package_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Package</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              onOpenChange={fetchPackages}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select package" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {packages.map((pkg) => (
                                  <SelectItem
                                    key={pkg.id}
                                    value={pkg.id.toString()}
                                  >
                                    {pkg.description}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={productForm.control}
                        name="type_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              onOpenChange={fetchProductTypes}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select product type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {productTypes.map((type) => (
                                  <SelectItem
                                    key={type.id}
                                    value={type.id.toString()}
                                  >
                                    {type.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={productForm.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Wholesale Price</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={field.value}
                                  onChange={(e) =>
                                    field.onChange(
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={productForm.control}
                          name="net_price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Selling Price</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={field.value}
                                  onChange={(e) =>
                                    field.onChange(
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={productForm.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration (days)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                step="1"
                                placeholder="0"
                                value={field.value}
                                onChange={(e) =>
                                  field.onChange(
                                    parseInt(e.target.value) || 0
                                  )
                                }
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
                          onClick={() => setIsAddDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">
                          {editingProduct ? "Update Product" : "Add Product"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Controls */}
          <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
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
                className="w-48 md:w-64"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Wholesale Price</TableHead>
                  <TableHead>Selling Price</TableHead>
                  <TableHead>Duration (days)</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading products...
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      {searchTerm
                        ? "No products match your search"
                        : "No products found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts
                    .slice(0, Number.parseInt(showEntries))
                    .map((product, index) => (
                      <TableRow key={product.id} className="hover:bg-gray-50">
                        <TableCell className="text-center">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-medium">
                          {product.name}
                        </TableCell>
                        <TableCell>
                          {product.package?.description || "N/A"}
                        </TableCell>
                        <TableCell>{product.type.name}</TableCell>
                        <TableCell>
                          ${product.price.toNumber().toFixed(2)}
                        </TableCell>
                        <TableCell>
                          ${product.net_price.toNumber().toFixed(2)}
                        </TableCell>
                        <TableCell>{product.duration}</TableCell>
                        <TableCell>
                          <div className="flex justify-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(product)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(product.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
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
          {!isLoading && filteredProducts.length > 0 && (
            <div className="flex justify-between items-center mt-4 flex-wrap gap-4">
              <div className="text-sm text-gray-600">
                Showing 1 to{" "}
                {Math.min(
                  Number.parseInt(showEntries),
                  filteredProducts.length
                )}{" "}
                of {filteredProducts.length} entries
                {searchTerm &&
                  ` (filtered from ${products.length} total entries)`}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}