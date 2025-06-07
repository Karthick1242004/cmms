"use client"
import Link from "next/link"
import Image from "next/image"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Edit, Trash2, DollarSign, Calendar, MapPinIcon } from "lucide-react"
import type { Asset } from "@/types/asset" // Using the simplified Asset type for list

interface AssetListTableProps {
  assets: Asset[]
  onEdit?: (asset: Asset) => void
  onDelete?: (assetId: string) => void
}

export function AssetListTable({ assets, onEdit, onDelete }: AssetListTableProps) {
  const getStatusColor = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case "operational":
      case "available":
      case "in stock":
      case "new":
        return "default" // Greenish in shadcn default
      case "maintenance":
        return "secondary" // Bluish/Grayish
      case "out-of-service":
        return "destructive" // Reddish
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
            <TableHead>Category</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Condition</TableHead>
            <TableHead>Purchase Info</TableHead>
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
              <TableCell>
                <Badge variant="outline">{asset.categoryName || asset.type}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center text-sm">
                  <MapPinIcon className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                  {asset.location}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusColor(asset.status)} className="capitalize">
                  {asset.status.replace("-", " ")}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={getConditionColor(asset.condition)} className="capitalize">
                  {asset.condition}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="space-y-0.5">
                  {asset.purchasePrice !== undefined && (
                    <div className="flex items-center text-sm">
                      <DollarSign className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                      {asset.purchasePrice.toLocaleString()}
                    </div>
                  )}
                  {asset.purchaseDate && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="mr-1 h-3 w-3" />
                      {asset.purchaseDate}
                    </div>
                  )}
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
    </div>
  )
}
