"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Search } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageLayout, PageHeader, PageContent } from "@/components/page-layout"
import { AssetListTable } from "@/components/asset-list-table"
import { sampleAssetDetails } from "@/data/assets-sample"
import type { Asset, AssetDetail } from "@/types/asset"

// Helper to map AssetDetail to simpler Asset for list views
const mapAssetDetailToAsset = (detail: AssetDetail): Asset => ({
  id: detail.id,
  name: detail.assetName,
  assetTag: detail.serialNo, // Or assetTag if available directly
  type: detail.category, // Main category like "Equipment"
  location: detail.location || "N/A",
  status:
    detail.statusText.toLowerCase().includes("online") || detail.statusText.toLowerCase().includes("operational")
      ? "operational"
      : detail.statusText.toLowerCase().includes("maintenance")
        ? "maintenance"
        : detail.statusText.toLowerCase().includes("stock") || detail.statusText.toLowerCase().includes("available")
          ? "available"
          : "out-of-service",
  purchaseDate: detail.purchaseDate || detail.commissioningDate,
  purchasePrice: detail.purchasePrice || detail.costPrice,
  condition: detail.condition || "good",
  imageSrc: detail.imageSrc,
  categoryName: detail.categoryName,
})

export default function AllAssetsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [assets, setAssets] = useState<Asset[]>([])

  useEffect(() => {
    // In a real app, fetch data. Here we use sample data.
    const allAssets = sampleAssetDetails.map(mapAssetDetailToAsset)
    setAssets(allAssets)
  }, [])

  const filteredAssets = assets.filter(
    (asset) =>
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.assetTag && asset.assetTag.toLowerCase().includes(searchTerm.toLowerCase())) ||
      asset.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.location.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // TODO: Implement actual edit/delete handlers
  const handleEdit = (asset: Asset) => console.log("Edit asset:", asset.id)
  const handleDelete = (assetId: string) => console.log("Delete asset:", assetId)

  return (
    <PageLayout>
      <PageHeader>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">All Assets</h1>
            <p className="text-muted-foreground">Browse and manage all assets across your organization</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Asset
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Asset</DialogTitle>
                <DialogDescription>Register a new asset in your inventory.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* Form fields from original assets/page.tsx */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input id="name" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="assetTag" className="text-right">
                    Asset Tag
                  </Label>
                  <Input id="assetTag" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    Type
                  </Label>
                  <Select>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select asset type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="facilities">Facilities</SelectItem>
                      <SelectItem value="products">Products</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="tools">Tools</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="location" className="text-right">
                    Location
                  </Label>
                  <Input id="location" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="purchasePrice" className="text-right">
                    Purchase Price
                  </Label>
                  <Input id="purchasePrice" type="number" className="col-span-3" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={() => setIsDialogOpen(false)}>
                  Save Asset
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search all assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {/* Add more filters if needed */}
        </div>
      </PageHeader>

      <PageContent>
        <AssetListTable assets={filteredAssets} onEdit={handleEdit} onDelete={handleDelete} />
      </PageContent>
    </PageLayout>
  )
}
