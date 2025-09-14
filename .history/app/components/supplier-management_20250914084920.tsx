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
import { Supplier } from "@/lib/generated/prisma";

// Form Schema
const supplierFormSchema = z.object({
  name: z.string().min(1, "Supplier name is required"),
  tin: z.string().min(1, "TIN is required"),
  phone: z.string().min(1, "Phone number is required"),
  user_id: z.string().optional(),
});

export default function SupplierManagement() {
  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [showEntries, setShowEntries] = useState("10");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form
  const supplierForm = useForm<z.infer<typeof supplierFormSchema>>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: "",
      tin: "",
      phone: "",
      user_id: "",
    },
  });

  // Data fetching function
  const fetchSuppliers = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("/api/suppliers");
      if (response.status < 400) {
        setSuppliers(response.data.suppliers);
        setError(null);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      if (isAxiosError(error)) {
        setError(error.response?.data?.message || "Failed to fetch suppliers");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered suppliers based on search term
  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.tin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Form submission handler
  const handleSupplierSubmit = async (
    values: z.infer<typeof supplierFormSchema>
  ) => {
    try {
      const url = editingSupplier
        ? `/api/suppliers/${editingSupplier.id}`
        : "/api/suppliers";
      const method = editingSupplier ? "put" : "post";

      const payload = {
        ...values,
        user_id: values.user_id ? Number(values.user_id) : null,
      };

      const response = await axios[method](url, payload);

      if (response.status < 400) {
        supplierForm.reset();
        setIsAddDialogOpen(false);
        setEditingSupplier(null);
        fetchSuppliers();
      }
    } catch (error) {
      console.error("Error saving supplier:", error);
      if (isAxiosError(error)) {
        setError(error.response?.data?.message || "Failed to save supplier");
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  // Action handlers
  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    supplierForm.reset({
      name: supplier.name,
      tin: supplier.tin,
      phone: supplier.phone,
      user_id: supplier.user_id?.toString() || "",
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this supplier?")) {
      try {
        const response = await axios.delete(`/api/suppliers/${id}`);
        if (response.status < 400) {
          fetchSuppliers();
        }
      } catch (error) {
        console.error("Error deleting supplier:", error);
        if (isAxiosError(error)) {
          setError(error.response?.data?.message || "Failed to delete supplier");
        } else {
          setError("An unexpected error occurred");
        }
      }
    }
  };

  // Effects
  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isAddDialogOpen) {
      setEditingSupplier(null);
      supplierForm.reset();
    }
  }, [isAddDialogOpen, supplierForm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Supplier Management
          </h1>
          <nav className="text-sm text-gray-600 mt-1">
            <span>Home</span> / <span>Suppliers</span> /{" "}
            <span className="text-gray-400">Manage Suppliers</span>
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

      {/* View Suppliers Section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">View Suppliers</CardTitle>
            <div className="flex gap-2">
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-1" />
                    Add New Supplier
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingSupplier ? "Edit Supplier" : "Add New Supplier"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingSupplier
                        ? "Update supplier information"
                        : "Create a new supplier entry"}
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...supplierForm}>
                    <form
                      onSubmit={supplierForm.handleSubmit(handleSupplierSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={supplierForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Supplier Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter supplier name"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={supplierForm.control}
                        name="tin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>TIN (Tax Identification Number)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter TIN"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={supplierForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter phone number"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={supplierForm.control}
                        name="user_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>User ID (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Enter user ID"
                                value={field.value}
                                onChange={(e) => field.onChange(e.target.value)}
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
                          {editingSupplier ? "Update Supplier" : "Add Supplier"}
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
                placeholder="Search suppliers..."
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
                  <TableHead>Supplier Name</TableHead>
                  <TableHead>TIN</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading suppliers...
                    </TableCell>
                  </TableRow>
                ) : filteredSuppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      {searchTerm
                        ? "No suppliers match your search"
                        : "No suppliers found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSuppliers
                    .slice(0, Number.parseInt(showEntries))
                    .map((supplier, index) => (
                      <TableRow key={supplier.id} className="hover:bg-gray-50">
                        <TableCell className="text-center">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-medium">
                          {supplier.name}
                        </TableCell>
                        <TableCell>{supplier.tin}</TableCell>
                        <TableCell>{supplier.phone}</TableCell>
                        <TableCell>{supplier.user_id || "N/A"}</TableCell>
                        <TableCell>
                          <div className="flex justify-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(supplier)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(supplier.id)}
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
          {!isLoading && filteredSuppliers.length > 0 && (
            <div className="flex justify-between items-center mt-4 flex-wrap gap-4">
              <div className="text-sm text-gray-600">
                Showing 1 to{" "}
                {Math.min(
                  Number.parseInt(showEntries),
                  filteredSuppliers.length
                )}{" "}
                of {filteredSuppliers.length} entries
                {searchTerm &&
                  ` (filtered from ${suppliers.length} total entries)`}
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