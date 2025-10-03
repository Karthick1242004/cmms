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
import type { Ticket } from "@/types/ticket";

import { usePartsStore } from "@/stores/parts-store";
import { useLocationsStore } from "@/stores/locations-store";
import { useAssetsStore } from "@/stores/assets-store";
import { useEmployeesStore } from "@/stores/employees-store";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import { ticketsApi } from "@/lib/tickets-api";

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
  const [ticketSearchOpen, setTicketSearchOpen] = useState(false);
  
  const [filteredParts, setFilteredParts] = useState<Part[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  
  // Track if transaction-level fields have been auto-filled from first part (for issue transactions)
  const [isAutoFilledFromPart, setIsAutoFilledFromPart] = useState(false);
  
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
  const watchedAssetId = form.watch("assetId");

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

  // Reset auto-fill flag when transaction type changes
  useEffect(() => {
    // Clear the auto-fill flag when transaction type changes to allow re-filling with new transaction type logic
    setIsAutoFilledFromPart(false);
    console.log('[AUTO-FILL] Transaction type changed to:', watchedTransactionType, '- Reset auto-fill flag');
  }, [watchedTransactionType]);

  // Fetch tickets dynamically based on asset selection and department
  useEffect(() => {
    const fetchTicketsForForm = async () => {
      if (!user) return;

      setIsLoadingTickets(true);
      try {
        const filters: any = {
          limit: 100, // Get more tickets for selection
          sortBy: 'loggedDateTime',
          sortOrder: 'desc',
        };

        // If asset is selected, filter by that asset
        if (watchedAssetId) {
          console.log('[TICKETS] Fetching tickets for asset:', watchedAssetId);
          filters.equipmentId = watchedAssetId;
        } else {
          // Otherwise, filter by user's department
          console.log('[TICKETS] Fetching tickets for department:', user.department);
          filters.department = user.department;
        }

        const response = await ticketsApi.getTickets(filters);
        
        if (response.success && response.data) {
          const tickets = (response.data as any).tickets || [];
          setFilteredTickets(tickets);
          console.log('[TICKETS] Fetched tickets:', tickets.length, 'tickets');
        } else {
          console.error('[TICKETS] Failed to fetch tickets:', response.error);
          setFilteredTickets([]);
        }
      } catch (error) {
        console.error('[TICKETS] Error fetching tickets:', error);
        setFilteredTickets([]);
      } finally {
        setIsLoadingTickets(false);
      }
    };

    fetchTicketsForForm();
  }, [watchedAssetId, user]);

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
    
    // AUTO-FILL LOGIC FOR ISSUE TRANSACTIONS
    // When first part is selected in an issue transaction, auto-fill procurement fields from part data
    if (watchedTransactionType === 'issue' && !isAutoFilledFromPart) {
      console.log('[AUTO-FILL] Issue transaction detected - auto-filling from part:', part.partNumber);
      
      // Auto-fill Material Code
      if (part.materialCode) {
        form.setValue('materialCode', part.materialCode);
        console.log('[AUTO-FILL] Material Code:', part.materialCode);
      }
      
      // Auto-fill Purchase Order Number
      if (part.purchaseOrderNumber) {
        form.setValue('purchaseOrderNumber', part.purchaseOrderNumber);
        console.log('[AUTO-FILL] Purchase Order Number:', part.purchaseOrderNumber);
      }
      
      // Auto-fill Vendor Name
      if (part.vendorName) {
        form.setValue('vendorName', part.vendorName);
        console.log('[AUTO-FILL] Vendor Name:', part.vendorName);
      }
      
      // Auto-fill Vendor Contact
      if (part.vendorContact) {
        form.setValue('vendorContact', part.vendorContact);
        console.log('[AUTO-FILL] Vendor Contact:', part.vendorContact);
      }
      
      // Auto-fill Supplier (from part's supplier field)
      if (part.supplier) {
        form.setValue('supplier', part.supplier);
        console.log('[AUTO-FILL] Supplier:', part.supplier);
      }
      
      // Mark as auto-filled to prevent re-filling when more items added
      setIsAutoFilledFromPart(true);
      
      console.log('[AUTO-FILL] Transaction-level fields auto-filled successfully from part');
    }
    
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

  // Handle ticket selection
  const handleTicketSelect = (ticket: Ticket) => {
    form.setValue('workOrderId', ticket.id);
    form.setValue('workOrderNumber', ticket.ticketId);
    setTicketSearchOpen(false);
    console.log('[TICKET SELECT] Selected ticket:', ticket.ticketId, '-', ticket.subject);
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
                  <FormLabel className="flex items-center gap-2">
                    Material Code (MC)
                    {watchedTransactionType === 'issue' && isAutoFilledFromPart && field.value && (
                      <Badge variant="secondary" className="text-xs">Auto-filled</Badge>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={watchedTransactionType === 'issue' ? "Will auto-fill from part" : "Enter material code"} 
                      {...field}
                      className={watchedTransactionType === 'issue' && isAutoFilledFromPart && field.value ? "bg-blue-50 dark:bg-blue-950" : ""}
                    />
                  </FormControl>
                  {watchedTransactionType === 'issue' && !isAutoFilledFromPart && (
                    <p className="text-xs text-muted-foreground">💡 This will auto-fill when you select a part</p>
                  )}
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
                  <FormLabel className="flex items-center gap-2">
                    Purchase Order Number (PO)
                    {watchedTransactionType === 'issue' && isAutoFilledFromPart && field.value && (
                      <Badge variant="secondary" className="text-xs">Auto-filled</Badge>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={watchedTransactionType === 'issue' ? "Will auto-fill from part" : "Enter PO number"} 
                      {...field}
                      className={watchedTransactionType === 'issue' && isAutoFilledFromPart && field.value ? "bg-blue-50 dark:bg-blue-950" : ""}
                    />
                  </FormControl>
                  {watchedTransactionType === 'issue' && !isAutoFilledFromPart && (
                    <p className="text-xs text-muted-foreground">💡 This will auto-fill when you select a part</p>
                  )}
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
                  <FormLabel className="flex items-center gap-2">
                    Vendor Name
                    {watchedTransactionType === 'issue' && isAutoFilledFromPart && field.value && (
                      <Badge variant="secondary" className="text-xs">Auto-filled</Badge>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={watchedTransactionType === 'issue' ? "Will auto-fill from part" : "Enter vendor name"} 
                      {...field}
                      className={watchedTransactionType === 'issue' && isAutoFilledFromPart && field.value ? "bg-blue-50 dark:bg-blue-950" : ""}
                    />
                  </FormControl>
                  {watchedTransactionType === 'issue' && !isAutoFilledFromPart && (
                    <p className="text-xs text-muted-foreground">💡 This will auto-fill when you select a part</p>
                  )}
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
                  <FormLabel className="flex items-center gap-2">
                    Vendor Contact
                    {watchedTransactionType === 'issue' && isAutoFilledFromPart && field.value && (
                      <Badge variant="secondary" className="text-xs">Auto-filled</Badge>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={watchedTransactionType === 'issue' ? "Will auto-fill from part" : "Phone, email, or contact person"} 
                      {...field}
                      className={watchedTransactionType === 'issue' && isAutoFilledFromPart && field.value ? "bg-blue-50 dark:bg-blue-950" : ""}
                    />
                  </FormControl>
                  {watchedTransactionType === 'issue' && !isAutoFilledFromPart && (
                    <p className="text-xs text-muted-foreground">💡 This will auto-fill when you select a part</p>
                  )}
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

              {/* Ticket/Work Order Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  {watchedAssetId ? 'Related Ticket (Asset-Specific)' : 'Related Ticket (Department)'}
                  {isLoadingTickets && (
                    <Badge variant="outline" className="text-xs">
                      <svg className="animate-spin h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading...
                    </Badge>
                  )}
                </Label>
                <Popover open={ticketSearchOpen} onOpenChange={setTicketSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between",
                        !form.watch('workOrderNumber') && "text-muted-foreground"
                      )}
                      disabled={isLoadingTickets}
                    >
                      {form.watch('workOrderNumber') ? (
                        <span className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {form.watch('workOrderNumber')}
                          </Badge>
                          {filteredTickets.find(t => t.ticketId === form.watch('workOrderNumber'))?.subject || 'Select ticket'}
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          {watchedAssetId ? '🎯 Select ticket for this asset' : '📋 Select ticket from your department'}
                        </span>
                      )}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[500px] p-0">
                    <Command>
                      <CommandInput placeholder="Search tickets by ID or subject..." />
                      <CommandEmpty>
                        {isLoadingTickets ? (
                          <div className="py-6 text-center text-sm">
                            <svg className="animate-spin h-5 w-5 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Loading tickets...
                          </div>
                        ) : watchedAssetId ? (
                          <div className="py-6 text-center text-sm">
                            <p className="text-muted-foreground mb-2">No tickets found for this asset</p>
                            <p className="text-xs text-muted-foreground">Try selecting a different asset or leave blank</p>
                          </div>
                        ) : (
                          <div className="py-6 text-center text-sm">
                            <p className="text-muted-foreground mb-2">No tickets found in your department</p>
                            <p className="text-xs text-muted-foreground">Create a ticket first or leave blank</p>
                          </div>
                        )}
                      </CommandEmpty>
                      <CommandGroup>
                        <ScrollArea className="h-[300px]">
                          {filteredTickets.map((ticket) => (
                            <CommandItem
                              key={ticket.id}
                              onSelect={() => handleTicketSelect(ticket)}
                            >
                              <div className="flex flex-col w-full gap-1">
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center gap-2">
                                    <Badge 
                                      variant={
                                        ticket.status === 'completed' ? 'default' :
                                        ticket.status === 'in-progress' ? 'secondary' :
                                        ticket.status === 'open' ? 'outline' : 'destructive'
                                      }
                                      className="text-xs"
                                    >
                                      {ticket.ticketId}
                                    </Badge>
                                    <Badge 
                                      variant={
                                        ticket.priority === 'critical' ? 'destructive' :
                                        ticket.priority === 'high' ? 'default' :
                                        'outline'
                                      }
                                      className="text-xs"
                                    >
                                      {ticket.priority}
                                    </Badge>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {ticket.status}
                                  </Badge>
                                </div>
                                <span className="font-medium text-sm">{ticket.subject}</span>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>📅 {new Date(ticket.loggedDateTime).toLocaleDateString()}</span>
                                  {ticket.asset && (
                                    <span>• 🔧 {ticket.asset.name}</span>
                                  )}
                                  <span>• 🏢 {ticket.department}</span>
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </ScrollArea>
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                {watchedAssetId && filteredTickets.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    ℹ️ Showing {filteredTickets.length} ticket(s) for the selected asset
                  </p>
                )}
                {!watchedAssetId && filteredTickets.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    ℹ️ Showing {filteredTickets.length} ticket(s) from your department. Select an asset to filter tickets.
                  </p>
                )}
              </div>
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
            {/* Info Banner for Issue Transactions */}
            {watchedTransactionType === 'issue' && !isAutoFilledFromPart && (
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      Smart Auto-Fill Enabled
                    </h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      When you select your first part, procurement details (Material Code, PO Number, Vendor Name, and Vendor Contact) will automatically fill from the part's information. You can still edit these fields manually if needed.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {watchedTransactionType === 'issue' && isAutoFilledFromPart && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-200">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Procurement fields auto-filled from part data</span>
                </div>
              </div>
            )}
            
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
