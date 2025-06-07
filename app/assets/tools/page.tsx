"use client"

import { useState, useEffect } from "react"
import { PageLayout, PageHeader, PageContent } from "@/components/page-layout"
import { AssetListTable } from "@/components/asset-list-table"
import { sampleAssetDetails } from "@/data/assets-sample"
import type { Asset, AssetDetail } from "@/types/asset"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

const mapAssetDetailToAsset = (detail: AssetDetail): Asset => ({
  id: detail.id,
  name: detail.assetName,
  assetTag: detail.serialNo,
  type: detail.category,
  location: detail.location || "N/A",
  status: detail.statusText.toLowerCase().includes("available") ? "available" : "out-of-service",
  purchaseDate: detail.purchaseDate || detail.commissioningDate,
  purchasePrice: detail.purchasePrice || detail.costPrice,
  condition: detail.condition || "good",
  imageSrc: detail.imageSrc,
  categoryName: detail.categoryName,
})

export default function ToolsAssetsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [assets, setAssets] = useState<Asset[]>([])

  useEffect(() => {
    const toolAssets = sampleAssetDetails.filter((asset) => asset.category === "Tools").map(mapAssetDetailToAsset)
    setAssets(toolAssets)
  }, [])

  const filteredAssets = assets.filter(
    (asset) =>
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.assetTag && asset.assetTag.toLowerCase().includes(searchTerm.toLowerCase())) ||
      asset.location.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <PageLayout>
      <PageHeader>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tools</h1>
            <p className="text-muted-foreground">Manage all tools and small equipment.</p>
          </div>
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
        <AssetListTable assets={filteredAssets} />
      </PageContent>
    </PageLayout>
  )
}
