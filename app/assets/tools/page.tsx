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

export default function ToolsAssetsPage() {
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
      category: 'Tools', // Filter for tools only
      search: debouncedSearchTerm || undefined,
      limit: 100 // Get all tool assets
    })
  }, [fetchAssets, debouncedSearchTerm])

  // Filter assets to only show tools (as backup to API filtering)
  const toolAssets = assets.filter(asset => asset.type === 'Tools')

  return (
    <PageLayout>
      <PageHeader>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tools Assets</h1>
            <p className="text-muted-foreground">
              Manage all tools and equipment. {toolAssets.length} assets found.
            </p>
          </div>
          {/* Add button can be added here if needed */}
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search tools..."
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
            <span className="ml-2 text-muted-foreground">Loading tool assets...</span>
          </div>
        ) : (
          <AssetListTable assets={toolAssets} />
        )}
      </PageContent>
    </PageLayout>
  )
}
