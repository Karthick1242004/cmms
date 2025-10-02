"use client";

import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Plus, Trash2, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

import type { StockTransactionFormData, StockTransactionItem } from "@/types/stock-transaction";
import type { Part } from "@/types/part";
import type { Location } from "@/types/location";
import type { Asset } from "@/types/asset";
import type { Employee } from "@/types/employee";

import { usePartsStore } from "@/stores/parts-store";
import { useLocationsStore } from "@/stores/locations-store";
import { useAssetsStore } from "@/stores/assets-store";
import { useEmployeesStore } from "@/stores/employees-store";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

// Form validation schema with business rules
const stockTransactionFormSchema = z.object({
  transactionType: z.enum(['receipt', 'issue', 'transfer', 'adjustment', 'scrap'], {
    required_error: "Transaction type is required",
    invalid_type_error: "Please select a valid transaction type",
  }),
  transactionDate: z.date({
    required_error: "Transaction date is required",
    invalid_type_error: "Please select a valid date",
  }).refine((date) => date <= new Date(), {
    message: "Transaction date cannot be in the future",
  }),
  referenceNumber: z.string()
    .max(50, "Reference number cannot exceed 50 characters")
    .optional(),
  description: z.string()
    .min(1, "Description is required")
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description cannot exceed 500 characters"),
  
  // New vendor and procurement fields
  materialCode: z.string()
    .max(50, "Material code cannot exceed 50 characters")
    .optional(),
  purchaseOrderNumber: z.string()
    .max(50, "Purchase order number cannot exceed 50 characters")
    .optional(),
  vendorName: z.string()
    .max(200, "Vendor name cannot exceed 200 characters")
    .optional(),
  vendorContact: z.string()
    .max(100, "Vendor contact cannot exceed 100 characters")
    .optional(),
    
  sourceLocation: z.string()
    .max(200, "Source location cannot exceed 200 characters")
    .optional(),
  destinationLocation: z.string()
    .max(200, "Destination location cannot exceed 200 characters")
    .optional(),
  supplier: z.string()
    .max(200, "Supplier name cannot exceed 200 characters")
    .optional(),
  recipient: z.string()
    .max(200, "Recipient name cannot exceed 200 characters")
    .optional(),
  recipientType: z.enum(['employee', 'department', 'work_order', 'asset', 'other'], {
    invalid_type_error: "Please select a valid recipient type",
  }).optional(),
  assetId: z.string().optional(),
  assetName: z.string()
    .max(200, "Asset name cannot exceed 200 characters")
    .optional(),
  workOrderId: z.string().optional(),
  workOrderNumber: z.string()
    .max(50, "Work order number cannot exceed 50 characters")
    .optional(),
  items: z.array(z.object({
    partId: z.string().min(1, "Part is required"),
    partNumber: z.string()
      .min(1, "Part number is required")
      .max(50, "Part number cannot exceed 50 characters"),
    partName: z.string()
      .min(1, "Part name is required")
      .max(200, "Part name cannot exceed 200 characters"),
    quantity: z.number({
      required_error: "Quantity is required",
      invalid_type_error: "Quantity must be a valid number",
    })
      .min(0.01, "Quantity must be greater than 0")
      .max(999999, "Quantity cannot exceed 999,999"),
    unitCost: z.number({
      invalid_type_error: "Unit cost must be a valid number",
    })
      .min(0, "Unit cost cannot be negative")
      .max(999999, "Unit cost cannot exceed $999,999")
      .optional(),
    totalCost: z.number({
      invalid_type_error: "Total cost must be a valid number",
    })
      .min(0, "Total cost cannot be negative")
      .optional(),
    fromLocation: z.string()
      .max(200, "From location cannot exceed 200 characters")
      .optional(),
    toLocation: z.string()
      .max(200, "To location cannot exceed 200 characters")
      .optional(),
    notes: z.string()
      .max(500, "Notes cannot exceed 500 characters")
      .optional(),
  }))
    .min(1, "At least one item is required")
    .max(50, "Cannot exceed 50 items per transaction"),
  priority: z.enum(['low', 'normal', 'high', 'urgent'], {
    required_error: "Priority is required",
    invalid_type_error: "Please select a valid priority",
  }),
  notes: z.string()
    .max(1000, "Notes cannot exceed 1000 characters")
    .optional(),
  internalNotes: z.string()
    .max(1000, "Internal notes cannot exceed 1000 characters")
    .optional(),
}).refine((data) => {
  // Business rule: Receipt transactions must have a supplier
  if (data.transactionType === 'receipt' && !data.supplier) {
    return false;
  }
  return true;
}, {
  message: "Supplier is required for receipt transactions",
  path: ["supplier"],
}).refine((data) => {
  // Business rule: Issue transactions must have a recipient or destination
  if (data.transactionType === 'issue' && !data.recipient && !data.destinationLocation) {
    return false;
  }
  return true;
}, {
  message: "Recipient or destination location is required for issue transactions",
  path: ["recipient"],
}).refine((data) => {
  // Business rule: Transfer transactions must have both source and destination
  if (data.transactionType === 'transfer' && 
      (!data.sourceLocation || !data.destinationLocation)) {
    return false;
  }
  return true;
}, {
  message: "Both source and destination locations are required for transfer transactions",
  path: ["destinationLocation"],
}).refine((data) => {
  // Business rule: Source and destination cannot be the same for transfers
  if (data.transactionType === 'transfer' && 
      data.sourceLocation === data.destinationLocation) {
    return false;
  }
  return true;
}, {
  message: "Source and destination locations must be different",
  path: ["destinationLocation"],
});

type FormData = z.infer<typeof stockTransactionFormSchema>;

interface StockTransactionFormProps {
  initialData?: Partial<StockTransactionFormData>;
  onSubmit: (data: StockTransactionFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function StockTransactionForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: StockTransactionFormProps) {
  const { user } = useAuthStore();
  const { parts, fetchParts } = usePartsStore();
  const { locations, fetchLocations } = useLocationsStore();
  const { assets, fetchAssets } = useAssetsStore();
  const { employees, fetchEmployees } = useEmployeesStore();

  // Local state for dynamic data
  const [partSearchOpen, setPartSearchOpen] = useState<{ [key: number]: boolean }>({});
  const [assetSearchOpen, setAssetSearchOpen] = useState(false);
  const [recipientSearchOpen, setRecipientSearchOpen] = useState(false);
  
  const [filteredParts, setFilteredParts] = useState<Part[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  
  // Form setup
  const form = useForm<FormData>({
    resolver: zodResolver(stockTransactionFormSchema),
    defaultValues: {
      transactionType: initialData?.transactionType || 'receipt',
      transactionDate: initialData?.transactionDate ? new Date(initialData.transactionDate) : new Date(),
      referenceNumber: initialData?.referenceNumber || '',
      description: initialData?.description || '',
      materialCode: initialData?.materialCode || '',
      purchaseOrderNumber: initialData?.purchaseOrderNumber || '',
      vendorName: initialData?.vendorName || '',
      vendorContact: initialData?.vendorContact || '',
      sourceLocation: initialData?.sourceLocation || '',
      destinationLocation: initialData?.destinationLocation || '',
      supplier: initialData?.supplier || '',
      recipient: initialData?.recipient || '',
      recipientType: initialData?.recipientType || 'other',
      assetId: initialData?.assetId || '',
      assetName: initialData?.assetName || '',
      workOrderId: initialData?.workOrderId || '',
      workOrderNumber: initialData?.workOrderNumber || '',
      items: initialData?.items || [],
      priority: initialData?.priority || 'normal',
      notes: initialData?.notes || '',
      internalNotes: initialData?.internalNotes || '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedTransactionType = form.watch("transactionType");
  const watchedRecipientType = form.watch("recipientType");
  const watchedItems = form.watch("items");

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchParts(),
          fetchLocations(),
          fetchAssets({ fetchAll: true }), // Fetch ALL assets for dropdown without pagination
          fetchEmployees(), // Fetch all employees for dropdown
        ]);
      } catch (error) {
        console.error('Error loading form data:', error);
      }
    };

    loadData();
  }, [fetchParts, fetchLocations, fetchAssets, fetchEmployees]);

  // Filter data based on user's access level
  useEffect(() => {
    console.log('🔍 Filtering assets - Total assets:', assets.length);
    console.log('🔍 Current user:', user?.name, 'Department:', user?.department, 'Access Level:', user?.accessLevel);
    console.log('🔍 All assets:', assets.map(asset => ({ id: asset.id, name: asset.name, department: asset.department })));

    if (user?.accessLevel === 'super_admin') {
      // Super admin can see all data
      setFilteredParts(parts);
      setFilteredAssets(assets);
      setFilteredEmployees(employees);
      console.log('🔍 Super admin - showing all assets:', assets.length);
    } else {
      // Filter parts by user's department (strict for inventory control)
      setFilteredParts(parts.filter(part => 
        part.department === user?.department || 
        part.departmentsServed?.includes(user?.department || '')
      ));
      
      // For stock transactions, users can issue parts for assets in any department
      // This allows cross-department maintenance and repairs
      setFilteredAssets(assets);
      console.log('🔍 Regular user - showing all assets for cross-department transactions:', assets.length);
      
      // Filter employees by user's department for recipient selection
      setFilteredEmployees(employees.filter(employee => employee.department === user?.department));
    }
  }, [parts, assets, employees, user]);

  // Validate stock availability when transaction type or items change
  useEffect(() => {
    if (watchedItems) {
      watchedItems.forEach((item, index) => {
        if (item.partId) {
          validateStockAvailability(index);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedTransactionType, watchedItems]);

  // Add new item
  const addItem = () => {
    append({
      partId: '',
      partNumber: '',
      partName: '',
      quantity: 1,
      unitCost: 0,
      totalCost: 0,
      fromLocation: '',
      toLocation: '',
      notes: '',
    });
  };

  // Remove item
  const removeItem = (index: number) => {
    remove(index);
  };

  // Handle part selection
  const handlePartSelect = (index: number, part: Part) => {
    form.setValue(`items.${index}.partId`, part.id);
    form.setValue(`items.${index}.partNumber`, part.partNumber);
    form.setValue(`items.${index}.partName`, part.name);
    form.setValue(`items.${index}.unitCost`, part.unitPrice || 0);
    
    // Update total cost
    const quantity = form.getValues(`items.${index}.quantity`) || 1;
    form.setValue(`items.${index}.totalCost`, quantity * (part.unitPrice || 0));
    
    // Validate stock availability after part selection
    validateStockAvailability(index, quantity);
    
    setPartSearchOpen(prev => ({ ...prev, [index]: false }));
  };

  // Handle asset selection
  const handleAssetSelect = (asset: Asset) => {
    form.setValue('assetId', asset.id);
    form.setValue('assetName', asset.name);
    setAssetSearchOpen(false);
  };

  // Handle recipient selection
  const handleRecipientSelect = (recipient: Employee) => {
    form.setValue('recipient', recipient.name);
    form.setValue('recipientType', 'employee');
    setRecipientSearchOpen(false);
  };

  // Enhanced stock validation function
  const validateStockAvailability = (index: number, quantity?: number) => {
    const partId = form.getValues(`items.${index}.partId`);
    const itemQuantity = quantity !== undefined ? quantity : form.getValues(`items.${index}.quantity`) || 0;
    
    // Only validate for outbound transactions (issue, scrap)
    // Note: 'transfer' is handled separately as it affects both source and destination
    if (!partId || !['issue', 'scrap'].includes(watchedTransactionType)) {
      form.clearErrors(`items.${index}.quantity`);
      return;
    }

    const part = parts.find(p => p.id === partId);
    if (!part) {
      form.setError(`items.${index}.quantity`, {
        type: 'manual',
        message: 'Part not found. Please select a valid part.',
      });
      return;
    }

    // Check current stock levels
    const availableStock = part.quantity || 0;
    if (availableStock < itemQuantity) {
      form.setError(`items.${index}.quantity`, {
        type: 'manual',
        message: `Insufficient stock. Available: ${availableStock}, Requested: ${itemQuantity}`,
      });
    } else if (availableStock === 0) {
      form.setError(`items.${index}.quantity`, {
        type: 'manual',
        message: 'Part is out of stock.',
      });
    } else if (availableStock <= (part.minStockLevel || 0) && availableStock - itemQuantity < (part.minStockLevel || 0)) {
      // Warning for low stock after transaction (but allow it)
      console.warn(`Transaction will result in low stock for ${part.partNumber}`);
      form.clearErrors(`items.${index}.quantity`);
    } else {
      form.clearErrors(`items.${index}.quantity`);
    }
  };

  // Update total cost when quantity changes
  const handleQuantityChange = (index: number, quantity: number) => {
    form.setValue(`items.${index}.quantity`, quantity);
    
    const unitCost = form.getValues(`items.${index}.unitCost`) || 0;
    form.setValue(`items.${index}.totalCost`, quantity * unitCost);
    
    // Validate stock availability for outbound transactions
    validateStockAvailability(index, quantity);
  };

  // Update total cost when unit cost changes
  const handleUnitCostChange = (index: number, unitCost: number) => {
    const quantity = form.getValues(`items.${index}.quantity`) || 1;
    form.setValue(`items.${index}.totalCost`, quantity * unitCost);
  };

  // Comprehensive client-side validation
  const validateSubmission = (data: FormData): string[] => {
    const errors: string[] = [];

    // Validate stock availability for outbound transactions (issue, scrap)
    // Transfer validation is handled separately in the backend
    if (['issue', 'scrap'].includes(data.transactionType)) {
      data.items.forEach((item, index) => {
        const part = filteredParts.find(p => p.id === item.partId);
        if (part && part.quantity < item.quantity) {
          errors.push(`Item ${index + 1}: Insufficient stock for ${item.partName}. Available: ${part.quantity}, Requested: ${item.quantity}`);
        }
      });
    }

    // Validate required fields based on transaction type
    if (data.transactionType === 'receipt' && !data.supplier) {
      errors.push('Supplier is required for receipt transactions');
    }

    if (data.transactionType === 'issue' && !data.recipient && !data.destinationLocation) {
      errors.push('Recipient or destination location is required for issue transactions');
    }

    if (data.transactionType === 'transfer' && 
        (!data.sourceLocation || !data.destinationLocation)) {
      errors.push('Both source and destination locations are required for transfer transactions');
    }

    if (data.transactionType === 'transfer' && 
        data.sourceLocation === data.destinationLocation) {
      errors.push('Source and destination locations must be different for transfers');
    }

    // Validate item quantities and stock availability
    data.items.forEach((item, index) => {
      if (item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
      }
      if (item.unitCost && item.unitCost < 0) {
        errors.push(`Item ${index + 1}: Unit cost cannot be negative`);
      }
      
      // Validate stock availability for outbound transactions (issue, scrap)
      if (['issue', 'scrap'].includes(data.transactionType)) {
        const part = parts.find(p => p.id === item.partId);
        if (part) {
          const availableStock = part.quantity || 0;
          if (availableStock < item.quantity) {
            errors.push(`${item.partName}: Insufficient stock (Available: ${availableStock}, Requested: ${item.quantity})`);
          } else if (availableStock === 0) {
            errors.push(`${item.partName}: Part is out of stock`);
          }
        } else if (item.partId) {
          errors.push(`${item.partName}: Part not found in inventory`);
        }
      }
    });

    // Validate total items limit
    if (data.items.length > 50) {
      errors.push('Cannot exceed 50 items per transaction');
    }

    return errors;
  };

  // Form submission
  const handleSubmit = async (data: FormData) => {
    try {
      // Run comprehensive validation
      const validationErrors = validateSubmission(data);
      
      if (validationErrors.length > 0) {
        // Display validation errors to the user
        console.error('Form Validation Failed:', validationErrors);
        
        // You can add toast notifications here if needed
        alert(`Please fix the following issues:\n\n• ${validationErrors.join('\n• ')}`);
        
        return;
      }

      const formattedData: StockTransactionFormData = {
        ...data,
        transactionDate: format(data.transactionDate, 'yyyy-MM-dd'),
        items: data.items.map(item => ({
          ...item,
          totalCost: item.quantity * (item.unitCost || 0),
        })),
      };

      await onSubmit(formattedData);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  // Calculate total amount
  const totalAmount = form.watch("items")?.reduce((sum, item) => 
    sum + (item.totalCost || (item.quantity * (item.unitCost || 0))), 0
  ) || 0;

  // Get transaction type specific labels
  const getTransactionTypeLabels = (type: string) => {
    switch (type) {
      case 'receipt':
        return {
          sourceLabel: 'Supplier Address',
          destinationLabel: 'Receiving Location',
          showSupplier: true,
          showRecipient: false,
        };
      case 'issue':
        return {
          sourceLabel: 'From Location',
          destinationLabel: 'To Location/Recipient',
          showSupplier: false,
          showRecipient: true,
        };
      case 'transfer':
        return {
          sourceLabel: 'From Location (Source Department)',
          destinationLabel: 'To Location (Destination Department)',
          showSupplier: false,
          showRecipient: false,
        };
      case 'adjustment':
        return {
          sourceLabel: 'Location',
          destinationLabel: 'Adjusted Location',
          showSupplier: false,
          showRecipient: false,
        };
      case 'scrap':
        return {
          sourceLabel: 'From Location',
          destinationLabel: 'Disposal Location',
          showSupplier: false,
          showRecipient: false,
        };
      default:
        return {
          sourceLabel: 'Source Location',
          destinationLabel: 'Destination Location',
          showSupplier: false,
          showRecipient: false,
        };
    }
  };

  const typeLabels = getTransactionTypeLabels(watchedTransactionType);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Header Information */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Transaction Type */}
            <FormField
              control={form.control}
              name="transactionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select transaction type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="receipt">Stock Receipt (Procurement)</SelectItem>
                      <SelectItem value="issue">Stock Issue (Asset Maintenance)</SelectItem>
                      <SelectItem value="transfer">Transfer Parts (Dept-to-Dept)</SelectItem>
                      <SelectItem value="adjustment">Stock Adjustment</SelectItem>
                      <SelectItem value="scrap">Scrap/Disposal</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Transaction Date */}
            <FormField
              control={form.control}
              name="transactionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction Date *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Priority */}
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reference Number */}
            <FormField
              control={form.control}
              name="referenceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference Number</FormLabel>
                  <FormControl>
                    <Input placeholder="PO#, WO#, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Material Code */}
            <FormField
              control={form.control}
              name="materialCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Material Code (MC)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter material code" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Purchase Order Number */}
            <FormField
              control={form.control}
              name="purchaseOrderNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase Order Number (PO)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter PO number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Vendor Name */}
            <FormField
              control={form.control}
              name="vendorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter vendor name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Vendor Contact */}
            <FormField
              control={form.control}
              name="vendorContact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor Contact</FormLabel>
                  <FormControl>
                    <Input placeholder="Phone, email, or contact person" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Supplier (for receipts) */}
            {typeLabels.showSupplier && (
              <FormField
                control={form.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter supplier name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Recipient (for issues) */}
            {typeLabels.showRecipient && (
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="recipientType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipient Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select recipient type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="employee">Employee</SelectItem>
                          <SelectItem value="department">Department</SelectItem>
                          <SelectItem value="work_order">Work Order</SelectItem>
                          <SelectItem value="asset">Asset</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="recipient"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipient</FormLabel>
                      {watchedRecipientType === 'employee' ? (
                        <Popover open={recipientSearchOpen} onOpenChange={setRecipientSearchOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value || "Select employee"}
                                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px] p-0">
                            <Command>
                              <CommandInput placeholder="Search employees..." />
                              <CommandEmpty>No employees found.</CommandEmpty>
                              <CommandGroup>
                                <ScrollArea className="h-[200px]">
                                  {filteredEmployees.map((employee) => (
                                    <CommandItem
                                      key={employee.id}
                                      onSelect={() => handleRecipientSelect(employee)}
                                    >
                                      <div className="flex flex-col">
                                        <span className="font-medium">{employee.name}</span>
                                        <span className="text-sm text-muted-foreground">
                                          {employee.role} - {employee.department}
                                        </span>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </ScrollArea>
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <FormControl>
                          <Input placeholder="Enter recipient name" {...field} />
                        </FormControl>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location Information */}
        <Card>
          <CardHeader>
            <CardTitle>Location Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Source Location */}
            <FormField
              control={form.control}
              name="sourceLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {watchedTransactionType === 'receipt' ? 'Supplier Address' : typeLabels.sourceLabel}
                  </FormLabel>
                  <FormControl>
                    {watchedTransactionType === 'receipt' ? (
                      <Input 
                        placeholder="Enter supplier address" 
                        {...field} 
                      />
                    ) : (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${typeLabels.sourceLabel.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {locations
                            .filter(location => 
                              user?.accessLevel === 'super_admin' || 
                              location.department === user?.department
                            )
                            .map((location, index) => (
                            <SelectItem key={`${location.id}-${location.name}-${index}`} value={location.name}>
                              {location.name} ({location.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Destination Location */}
            <FormField
              control={form.control}
              name="destinationLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{typeLabels.destinationLabel}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${typeLabels.destinationLabel.toLowerCase()}`} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {locations
                        .filter(location => 
                          user?.accessLevel === 'super_admin' || 
                          location.department === user?.department
                        )
                        .map((location, index) => (
                        <SelectItem key={`${location.id}-${location.name}-dest-${index}`} value={location.name}>
                          {location.name} ({location.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Asset/Work Order Information (if applicable) */}
        {(watchedTransactionType === 'issue' || watchedRecipientType === 'asset') && (
          <Card>
            <CardHeader>
              <CardTitle>Asset Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Asset Selection */}
              <div className="space-y-2">
                <Label>Asset</Label>
                <Popover open={assetSearchOpen} onOpenChange={setAssetSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between",
                        !form.watch("assetName") && "text-muted-foreground"
                      )}
                    >
                      {form.watch("assetName") || "Select asset"}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput placeholder="Search assets..." />
                      <CommandEmpty>No assets found.</CommandEmpty>
                      <CommandGroup>
                        <ScrollArea className="h-[200px]">
                          {filteredAssets.map((asset) => (
                            <CommandItem
                              key={asset.id}
                              onSelect={() => handleAssetSelect(asset)}
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">{asset.name}</span>
                                <span className="text-sm text-muted-foreground">
                                  {asset.type} - {asset.department}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </ScrollArea>
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Work Order */}
              <FormField
                control={form.control}
                name="workOrderNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Order Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter work order number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Items</CardTitle>
            <Button type="button" onClick={addItem} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent>
            {fields.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No items added yet. Click "Add Item" to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <Card key={field.id} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Part Selection */}
                      <div className="lg:col-span-2">
                        <Label>Part *</Label>
                        <Popover 
                          open={partSearchOpen[index] || false} 
                          onOpenChange={(open) => setPartSearchOpen(prev => ({ ...prev, [index]: open }))}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !form.watch(`items.${index}.partName`) && "text-muted-foreground"
                              )}
                            >
                              {form.watch(`items.${index}.partName`) || "Select part"}
                              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px] p-0">
                            <Command>
                              <CommandInput placeholder="Search parts..." />
                              <CommandEmpty>No parts found.</CommandEmpty>
                              <CommandGroup>
                                <ScrollArea className="h-[200px]">
                                  {filteredParts.map((part) => (
                                    <CommandItem
                                      key={part.id}
                                      onSelect={() => handlePartSelect(index, part)}
                                    >
                                      <div className="flex flex-col w-full">
                                        <div className="flex items-center justify-between">
                                          <span className="font-medium">{part.name}</span>
                                          <Badge variant={part.stockStatus === 'in_stock' ? 'default' : 'destructive'}>
                                            {part.quantity} in stock
                                          </Badge>
                                        </div>
                                        <span className="text-sm text-muted-foreground">
                                          {part.partNumber} - {part.category}
                                        </span>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </ScrollArea>
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Quantity */}
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0.01"
                                placeholder="0"
                                value={field.value === 0 ? '' : field.value?.toString() || ''}
                                onChange={(e) => {
                                  const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                                  field.onChange(value);
                                  handleQuantityChange(index, value);
                                }}
                                onBlur={(e) => {
                                  if (e.target.value === '') {
                                    field.onChange(0);
                                  }
                                  field.onBlur();
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Unit Cost */}
                      <FormField
                        control={form.control}
                        name={`items.${index}.unitCost`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit Cost</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={field.value === 0 ? '' : field.value?.toString() || ''}
                                onChange={(e) => {
                                  const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                                  field.onChange(value);
                                  handleUnitCostChange(index, value);
                                }}
                                onBlur={(e) => {
                                  if (e.target.value === '') {
                                    field.onChange(0);
                                  }
                                  field.onBlur();
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Notes */}
                      <div className="lg:col-span-3">
                        <FormField
                          control={form.control}
                          name={`items.${index}.notes`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notes</FormLabel>
                              <FormControl>
                                <Input placeholder="Item-specific notes" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Remove Button */}
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(index)}
                          className="w-full"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </div>

                    {/* Total Cost Display */}
                    <div className="mt-2 text-right">
                      <span className="text-sm text-muted-foreground">
                        Total: ${((form.watch(`items.${index}.quantity`) || 0) * (form.watch(`items.${index}.unitCost`) || 0)).toFixed(2)}
                      </span>
                    </div>
                  </Card>
                ))}

                {/* Grand Total */}
                <div className="flex justify-end">
                  <Card className="p-4">
                    <div className="text-lg font-semibold">
                      Grand Total: ${totalAmount.toFixed(2)}
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Description and Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the purpose of this transaction"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes or comments"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Internal Notes (for managers/admins) */}
            {(user?.role === 'manager' || user?.accessLevel === 'super_admin') && (
              <FormField
                control={form.control}
                name="internalNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Internal Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Internal notes (visible only to managers and admins)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading 
              ? (initialData ? 'Updating...' : 'Creating...') 
              : (initialData ? 'Update Transaction' : 'Create Transaction')
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}
