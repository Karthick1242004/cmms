"use client"
import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Edit, Trash2, DollarSign, Calendar, MapPinIcon, RefreshCw, User } from "lucide-react"
import { toast } from "sonner"
import { assetsApi } from "@/lib/assets-api"
import type { Asset } from "@/types/asset" // Using the simplified Asset type for list

interface AssetListTableProps {
  assets: Asset[]
  onEdit?: (asset: Asset) => void
  onDelete?: (assetId: string) => void
  onStatusChange?: () => void // Callback to refresh assets after status change
  canModify?: boolean
}

export function AssetListTable({ assets, onEdit, onDelete, onStatusChange, canModify = true }: AssetListTableProps) {
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [newStatus, setNewStatus] = useState('')
  const [remarks, setRemarks] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const statusOptions = [
    { value: 'operational', label: 'Operational' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'out-of-service', label: 'Out of Service' },
    { value: 'available', label: 'Available' },
    { value: 'in stock', label: 'In Stock' },
    { value: 'new', label: 'New' },
  ]

  const handleStatusChange = async (asset: Asset, status: string) => {
    if (!asset || !status) return

    setIsUpdating(true)
    try {
      const response = await assetsApi.updateAssetStatus(asset.id, status, remarks)
      
      if (response.success) {
        toast.success(`Asset status updated to "${status}" successfully`)
        setIsStatusDialogOpen(false)
        setSelectedAsset(null)
        setNewStatus('')
        setRemarks('')
        onStatusChange?.() // Refresh the assets list
      } else {
        toast.error(response.error || 'Failed to update asset status')
      }
    } catch (error) {
      console.error('Error updating asset status:', error)
      toast.error('Failed to update asset status')
    } finally {
      setIsUpdating(false)
    }
  }

  const openStatusDialog = (asset: Asset) => {
    setSelectedAsset(asset)
    setNewStatus(asset.status)
    setRemarks('')
    setIsStatusDialogOpen(true)
  }

  const getStatusColor = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case "operational":
        return "bg-green-100 text-green-800 border-green-200 hover:bg-green-200"
      case "available":
        return "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200"
      case "in stock":
        return "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200"
      case "new":
        return "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200"
      case "out-of-service":
        return "bg-red-100 text-red-800 border-red-200 hover:bg-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200"
    }
  }

  const getStatusBadgeVariant = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case "operational":
      case "available":
      case "in stock":
      case "new":
        return "default"
      case "maintenance":
        return "secondary"
      case "out-of-service":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getConditionColor = (condition: string | undefined) => {
    switch (condition?.toLowerCase()) {
      case "excellent":
      case "new":
        return "default"
      case "good":
        return "secondary"
      case "fair":
        return "outline"
      case "poor":
        return "destructive"
      default:
        return "secondary"
    }
  }

  return (
    <div className="border rounded-lg bg-background">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10 border-b">
          <TableRow>
            <TableHead className="w-[80px]">Image</TableHead>
            <TableHead>Asset Name</TableHead>
            {/* <TableHead>Category Name</TableHead> */}
            <TableHead>Location</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Condition</TableHead>
            <TableHead>Assigned Person</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assets.map((asset) => (
            <TableRow key={asset.id} className="hover:bg-muted/50">
              <TableCell>
                <Link href={`/assets/${asset.id}`}>
                  <div className="w-16 h-12 bg-muted rounded overflow-hidden flex items-center justify-center">
                    <Image
                      src={asset.imageSrc || "/placeholder.svg?height=48&width=64&query=asset"}
                      alt={asset.name}
                      width={64}
                      height={48}
                      className="object-cover"
                    />
                  </div>
                </Link>
              </TableCell>
              <TableCell>
                <Link href={`/assets/${asset.id}`} className="hover:underline">
                  <div className="font-medium">{asset.name}</div>
                  <div className="text-sm text-muted-foreground">{asset.assetTag || asset.id}</div>
                </Link>
              </TableCell>
              {/* <TableCell>
                <Badge variant="outline">{asset.categoryName || asset.type}</Badge>
              </TableCell> */}
              <TableCell>
                <div className="flex items-center text-sm">
                  <MapPinIcon className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                  {asset.location}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{asset.department || "N/A"}</Badge>
              </TableCell>
              <TableCell>
                <button
                  className={`capitalize px-1.5 py-1 rounded-sm flex text-xs flex-row items-center ${getStatusColor(asset.status)}`}
                  onClick={() => openStatusDialog(asset)}
                >
                  <RefreshCw className="mr-1 h-2.5 w-2.5" />
                  {asset.status.replace("-", " ")}
                </button>
              </TableCell>
              <TableCell>
                <Badge variant={getConditionColor(asset.condition)} className="capitalize">
                  {asset.condition}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center text-sm">
                  <User className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                  {asset.allocated || (asset.personnel && asset.personnel.length > 0 ? asset.personnel[0].name : 'Unassigned')}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit?.(asset)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => onDelete?.(asset.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Status Change Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Asset Status</DialogTitle>
          </DialogHeader>
          
          {selectedAsset && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Asset</Label>
                <div className="text-sm text-muted-foreground">
                  {selectedAsset.name} ({selectedAsset.assetTag || selectedAsset.id})
                </div>
              </div>

              <div className="space-y-2">
                <Label>Current Status</Label>
                <Badge variant={getStatusBadgeVariant(selectedAsset.status)} className="capitalize">
                  {selectedAsset.status.replace("-", " ")}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-status">New Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks (Optional)</Label>
                <Textarea
                  id="remarks"
                  placeholder="Enter any remarks for this status change..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsStatusDialogOpen(false)}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleStatusChange(selectedAsset, newStatus)}
                  disabled={isUpdating || !newStatus || newStatus === selectedAsset.status}
                >
                  {isUpdating ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Status'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
