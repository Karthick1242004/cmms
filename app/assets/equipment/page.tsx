"use client"

import { useState, useEffect } from "react"
import { PageLayout, PageHeader, PageContent } from "@/components/page-layout"
import { AssetListTable } from "@/components/asset-list-table"
import { useAssetsStore } from "@/stores/assets-store"
import type { Asset } from "@/types/asset"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useDebounce } from "@/hooks/use-debounce"

export default function EquipmentAssetsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  
  const { 
    assets, 
    isLoading, 
    fetchAssets 
  } = useAssetsStore()

  // Fetch assets on component mount and when search changes
  useEffect(() => {
    fetchAssets({
      category: 'Equipment', // Filter for equipment only
      search: debouncedSearchTerm || undefined,
      limit: 100 // Get all equipment assets
    })
  }, [fetchAssets, debouncedSearchTerm])

  // Filter assets to only show equipment (as backup to API filtering)
  const equipmentAssets = assets.filter(asset => asset.type === 'Equipment')

  return (
    <PageLayout>
      <PageHeader>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Equipment Assets</h1>
            <p className="text-muted-foreground">
              Manage all equipment and machinery assets. {equipmentAssets.length} assets found.
            </p>
          </div>
          {/* Add button can be added here if needed */}
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search equipment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </PageHeader>
      <PageContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
            <span className="ml-2 text-muted-foreground">Loading equipment assets...</span>
          </div>
        ) : (
          <AssetListTable assets={equipmentAssets} />
        )}
      </PageContent>
    </PageLayout>
  )
}
