"use client"

import { SelectItem } from "@/components/ui/select"

import { SelectContent } from "@/components/ui/select"

import { SelectValue } from "@/components/ui/select"

import { SelectTrigger } from "@/components/ui/select"

import { Select } from "@/components/ui/select"

import type React from "react"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MoreHorizontal, Edit3, Trash2, PackagePlus, PackageMinus, AlertCircle } from "lucide-react"
import type { Part, PartUpdateData } from "@/types/part"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"

interface PartsListTableProps {
  initialParts: Part[]
}

export function PartsListTable({ initialParts }: PartsListTableProps) {
  const [parts, setParts] = useState<Part[]>(initialParts)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false)
  const [selectedPart, setSelectedPart] = useState<Part | null>(null)
  const [editFormData, setEditFormData] = useState<PartUpdateData>({})
  const [stockAdjustment, setStockAdjustment] = useState<number>(0)
  const [adjustmentType, setAdjustmentType] = useState<"add" | "remove">("add")

  const openEditDialog = (part: Part) => {
    setSelectedPart(part)
    setEditFormData({
      name: part.name,
      sku: part.sku,
      location: part.location,
      description: part.description,
      price: part.price,
      minStockLevel: part.minStockLevel,
    })
    setIsEditDialogOpen(true)
  }

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEditFormData((prev) => ({
      ...prev,
      [name]: name === "price" || name === "minStockLevel" ? Number.parseFloat(value) || 0 : value,
    }))
  }

  const handleSaveEdit = () => {
    if (!selectedPart) return

    setParts((prevParts) =>
      prevParts.map(
        (p) => (p.id === selectedPart.id ? { ...p, ...editFormData, quantity: p.quantity } : p), // Keep original quantity
      ),
    )
    setIsEditDialogOpen(false)
    setSelectedPart(null)
    toast({
      title: "Part Updated",
      description: `${editFormData.name || selectedPart.name} details have been updated locally.`,
    })
  }

  const openStockDialog = (part: Part) => {
    setSelectedPart(part)
    setStockAdjustment(0)
    setAdjustmentType("add")
    setIsStockDialogOpen(true)
  }

  const handleAdjustStock = () => {
    if (!selectedPart || stockAdjustment === 0) {
      setIsStockDialogOpen(false)
      return
    }

    setParts((prevParts) =>
      prevParts.map((p) => {
        if (p.id === selectedPart.id) {
          const currentQuantity = p.quantity
          let newQuantity =
            adjustmentType === "add" ? currentQuantity + stockAdjustment : currentQuantity - stockAdjustment
          if (newQuantity < 0) {
            toast({
              variant: "destructive",
              title: "Adjustment Error",
              description: "Stock quantity cannot be negative.",
            })
            newQuantity = 0 // Prevent negative stock
          }
          return { ...p, quantity: newQuantity }
        }
        return p
      }),
    )
    setIsStockDialogOpen(false)
    setSelectedPart(null)
    toast({ title: "Stock Adjusted", description: `Stock for ${selectedPart.name} has been updated locally.` })
  }

  const handleDeletePart = (partId: string, partName: string) => {
    // Confirm before deleting (optional, good practice)
    if (confirm(`Are you sure you want to delete ${partName}? This action is for the current session only.`)) {
      setParts((prevParts) => prevParts.filter((p) => p.id !== partId))
      toast({ title: "Part Deleted", description: `${partName} has been removed locally for this session.` })
    }
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parts.map((part) => (
              <TableRow key={part.id}>
                <TableCell className="font-medium">{part.name}</TableCell>
                <TableCell>{part.sku}</TableCell>
                <TableCell className="text-right">{part.quantity}</TableCell>
                <TableCell>{part.location || "N/A"}</TableCell>
                <TableCell className="text-right">${part.price?.toFixed(2) || "0.00"}</TableCell>
                <TableCell className="text-center">
                  {part.minStockLevel !== undefined && part.quantity < part.minStockLevel ? (
                    <Badge variant="destructive" className="flex items-center justify-center">
                      <AlertCircle className="h-3 w-3 mr-1" /> Low Stock
                    </Badge>
                  ) : part.quantity === 0 ? (
                    <Badge variant="destructive" className="flex items-center justify-center">
                      Out of Stock
                    </Badge>
                  ) : (
                    <Badge variant="secondary">In Stock</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => openEditDialog(part)}>
                        <Edit3 className="mr-2 h-4 w-4" />
                        Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openStockDialog(part)}>
                        <PackagePlus className="mr-2 h-4 w-4" /> {/* Or use a generic adjust icon */}
                        Adjust Stock
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeletePart(part.id, part.name)}
                        className="text-red-600 focus:text-red-500 focus:bg-red-50"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Part
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Part Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Edit Part: {selectedPart?.name}</DialogTitle>
            <DialogDescription>Make changes to the part details. Quantity is adjusted separately.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={editFormData.name || ""}
                onChange={handleEditFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sku" className="text-right">
                SKU
              </Label>
              <Input
                id="sku"
                name="sku"
                value={editFormData.sku || ""}
                onChange={handleEditFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                Location
              </Label>
              <Input
                id="location"
                name="location"
                value={editFormData.location || ""}
                onChange={handleEditFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Price
              </Label>
              <Input
                id="price"
                name="price"
                type="number"
                value={editFormData.price || ""}
                onChange={handleEditFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="minStockLevel" className="text-right">
                Min. Stock
              </Label>
              <Input
                id="minStockLevel"
                name="minStockLevel"
                type="number"
                value={editFormData.minStockLevel || ""}
                onChange={handleEditFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right pt-2">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={editFormData.description || ""}
                onChange={handleEditFormChange}
                className="col-span-3"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Stock Dialog */}
      <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adjust Stock for: {selectedPart?.name}</DialogTitle>
            <DialogDescription>
              Current quantity: {selectedPart?.quantity}. Enter amount to add or remove.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="adjustmentType" className="text-right">
                Action
              </Label>
              <Select value={adjustmentType} onValueChange={(value) => setAdjustmentType(value as "add" | "remove")}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">
                    <div className="flex items-center">
                      <PackagePlus className="mr-2 h-4 w-4" /> Add to Stock
                    </div>
                  </SelectItem>
                  <SelectItem value="remove">
                    <div className="flex items-center">
                      <PackageMinus className="mr-2 h-4 w-4" /> Remove from Stock
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stockAdjustment" className="text-right">
                Amount
              </Label>
              <Input
                id="stockAdjustment"
                type="number"
                value={stockAdjustment}
                onChange={(e) => setStockAdjustment(Math.max(0, Number.parseInt(e.target.value, 10) || 0))} // Ensure positive
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStockDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdjustStock}>Apply Adjustment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
