"use client"

import { useState, useEffect, useMemo } from "react"
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
import { useAssetsStore } from "@/stores/assets-store"
import type { Asset } from "@/types/asset"

export default function AllAssetsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  // Use the assets store
  const { 
    assets, 
    isLoading, 
    fetchAssets,
    deleteAsset 
  } = useAssetsStore()

  // Filter state
  const [filters, setFilters] = useState({
    type: "all",
    status: "all",
    location: "all",
    condition: "all",
    priceRange: "all",
  })

  useEffect(() => {
    // Fetch assets from API
    fetchAssets()
  }, [])

  // Get unique values for filter options
  const uniqueTypes = Array.from(new Set(assets.map(asset => asset.type))).filter(Boolean)
  const uniqueLocations = Array.from(new Set(assets.map(asset => asset.location))).filter(Boolean)
  const uniqueConditions = Array.from(new Set(assets.map(asset => asset.condition))).filter(Boolean)

  // Filter assets based on search term and filters
  const filteredAssets = useMemo(() => {
    let filtered = assets

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (asset) =>
          asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (asset.assetTag && asset.assetTag.toLowerCase().includes(searchTerm.toLowerCase())) ||
          asset.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          asset.location.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply filters
    if (filters.type && filters.type !== "all") {
      filtered = filtered.filter(asset => asset.type === filters.type)
    }
    if (filters.status && filters.status !== "all") {
      filtered = filtered.filter(asset => asset.status === filters.status)
    }
    if (filters.location && filters.location !== "all") {
      filtered = filtered.filter(asset => asset.location === filters.location)
    }
    if (filters.condition && filters.condition !== "all") {
      filtered = filtered.filter(asset => asset.condition === filters.condition)
    }
    if (filters.priceRange && filters.priceRange !== "all") {
      const [min, max] = filters.priceRange.split('-').map(Number)
      filtered = filtered.filter(asset => {
        const price = asset.purchasePrice || 0
        if (max) {
          return price >= min && price <= max
        }
        return price >= min
      })
    }

    return filtered
  }, [assets, searchTerm, filters])

  // Handle filter changes
  const handleFilterChange = (filterKey: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }))
  }

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      type: "all",
      status: "all",
      location: "all",
      condition: "all",
      priceRange: "all",
    })
    setSearchTerm("")
  }

  // Asset action handlers
  const handleEdit = (asset: Asset) => {
    // TODO: Implement edit functionality - could navigate to edit page or open edit dialog
    console.log("Edit asset:", asset.id)
  }
  
  const handleDelete = async (assetId: string) => {
    if (confirm('Are you sure you want to delete this asset?')) {
      try {
        await deleteAsset(assetId)
        // Refresh the list after deletion
        await fetchAssets()
      } catch (error) {
        console.error('Error deleting asset:', error)
      }
    }
  }

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

        {/* Search and Filters */}
        <div className="space-y-4">
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
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Asset Type</Label>
              <Select value={filters.type} onValueChange={(value) => handleFilterChange("type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {uniqueTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="out-of-service">Out of Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Select value={filters.location} onValueChange={(value) => handleFilterChange("location", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All locations</SelectItem>
                  {uniqueLocations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Condition</Label>
              <Select value={filters.condition} onValueChange={(value) => handleFilterChange("condition", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All conditions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All conditions</SelectItem>
                  {uniqueConditions.map((condition) => (
                    <SelectItem key={condition} value={condition}>
                      {condition.charAt(0).toUpperCase() + condition.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Price Range</Label>
              <Select value={filters.priceRange} onValueChange={(value) => handleFilterChange("priceRange", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All prices" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All prices</SelectItem>
                  <SelectItem value="0-1000">$0 - $1,000</SelectItem>
                  <SelectItem value="1001-5000">$1,001 - $5,000</SelectItem>
                  <SelectItem value="5001-10000">$5,001 - $10,000</SelectItem>
                  <SelectItem value="10001-50000">$10,001 - $50,000</SelectItem>
                  <SelectItem value="50001">$50,000+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          Showing {filteredAssets.length} of {assets.length} assets
        </div>
      </PageHeader>

      <PageContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading assets...</p>
            </div>
          </div>
        ) : (
          <>
            <AssetListTable assets={filteredAssets} onEdit={handleEdit} onDelete={handleDelete} />
            {filteredAssets.length === 0 && assets.length > 0 && (
              <p className="text-center text-muted-foreground py-8">No assets found matching your search and filters.</p>
            )}
            {filteredAssets.length === 0 && assets.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No assets found. Try adding some assets first.</p>
            )}
          </>
        )}
      </PageContent>
    </PageLayout>
  )
}
