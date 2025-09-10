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
import { Plus, Search, FileText, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageLayout, PageHeader, PageContent } from "@/components/page-layout"
import { AssetListTable } from "@/components/asset-list-table"
import { AssetCreationForm } from "@/components/asset-creation-form"
import { AssetEditForm } from "@/components/asset-edit-form"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

import { useAssetsStore } from "@/stores/assets-store"
import { useAuthStore } from "@/stores/auth-store"
import type { Asset } from "@/types/asset"

export default function AllAssetsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedAssetForEdit, setSelectedAssetForEdit] = useState<Asset | null>(null)


  // Helper function to get status colors for consistent styling
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "operational":
        return "bg-green-100 text-green-800 border-green-200"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "available":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "out-of-service":
        return "bg-red-100 text-red-800 border-red-200"
      case "in stock":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "new":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }
  
  // Use the assets store
  const { 
    assets, 
    isLoading, 
    fetchAssets,
    deleteAsset,
    clearCache,
    // Pagination state
    currentPage,
    totalPages,
    totalCount,
    hasNext,
    hasPrevious,
    setPage,
    nextPage,
    previousPage
  } = useAssetsStore()
  
  // Use auth store for permissions
  const { user } = useAuthStore()
  
  // Check permissions - only super admin and department admin can create/edit assets
  const canModifyAssets = user?.accessLevel === 'super_admin' || user?.accessLevel === 'department_admin'

  // Filter state
  const [filters, setFilters] = useState({
    type: "all",
    status: "all",
    location: "all",
    condition: "all",
    priceRange: "all",
    department: "all",
  })

  useEffect(() => {
    // Fetch assets from API with current page
    fetchAssets({ page: currentPage })
  }, [currentPage])

  // Debug log to see what assets are in the store
  useEffect(() => {
    console.log('Assets in store:', assets)
    console.log('First asset department:', assets[0]?.department)
  }, [assets])

  // Get unique values for filter options
  const uniqueTypes = Array.from(new Set(assets.map(asset => asset.type))).filter(Boolean)
  const uniqueLocations = Array.from(new Set(assets.map(asset => asset.location))).filter(Boolean)
  const uniqueConditions = Array.from(new Set(assets.map(asset => asset.condition))).filter(Boolean)
  const uniqueDepartments = Array.from(new Set(assets.map(asset => asset.department))).filter(Boolean)

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
          asset.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          asset.department.toLowerCase().includes(searchTerm.toLowerCase())
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
    if (filters.department && filters.department !== "all") {
      filtered = filtered.filter(asset => asset.department === filters.department)
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
      department: "all",
    })
    setSearchTerm("")
  }

  // Asset action handlers
  const handleEdit = (asset: Asset) => {
    setSelectedAssetForEdit(asset)
    setIsEditDialogOpen(true)
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

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false)
    setSelectedAssetForEdit(null)
    fetchAssets() // Refresh the assets list
  }

  const handleEditCancel = () => {
    setIsEditDialogOpen(false)
    setSelectedAssetForEdit(null)
  }

  const handleStatusChange = () => {
    fetchAssets() // Refresh assets list after status change
  }

  const generateAssetsReport = () => {
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    const currentTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })

    // Calculate summary statistics
    const totalAssets = filteredAssets.length
    const maintenanceAssets = filteredAssets.filter(asset => asset.status === "maintenance")
    const outOfServiceAssets = filteredAssets.filter(asset => asset.status === "out-of-service")
    const operationalAssets = filteredAssets.filter(asset => asset.status === "operational")
    const availableAssets = filteredAssets.filter(asset => asset.status === "available")
    const totalValue = filteredAssets.reduce((sum, asset) => sum + (asset.purchasePrice || 0), 0)

    // Group by category
    const assetsByCategory = filteredAssets.reduce((acc, asset) => {
      if (!acc[asset.type]) {
        acc[asset.type] = []
      }
      acc[asset.type].push(asset)
      return acc
    }, {} as Record<string, Asset[]>)

    // Group by department
    const assetsByDepartment = filteredAssets.reduce((acc, asset) => {
      if (!acc[asset.department]) {
        acc[asset.department] = []
      }
      acc[asset.department].push(asset)
      return acc
    }, {} as Record<string, Asset[]>)

    const reportHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Assets Comprehensive Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: white; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; }
          .header h1 { font-size: 28px; font-weight: bold; color: #1e40af; margin-bottom: 10px; }
          .header .subtitle { font-size: 16px; color: #6b7280; margin-bottom: 5px; }
          .header .timestamp { font-size: 14px; color: #9ca3af; }
          .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
          .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; text-align: center; }
          .summary-card h3 { font-size: 24px; font-weight: bold; color: #1e40af; margin-bottom: 5px; }
          .summary-card p { color: #6b7280; font-size: 14px; }
          .section { margin-bottom: 30px; }
          .section h2 { font-size: 20px; font-weight: bold; color: #1e40af; margin-bottom: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          th { background: #3b82f6; color: white; padding: 12px; text-align: left; font-weight: 600; font-size: 14px; }
          td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
          tr:nth-child(even) { background: #f8fafc; }
          tr:hover { background: #f1f5f9; }
          .status-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; text-transform: capitalize; }
          .status-operational { background: #dcfce7; color: #166534; }
          .status-maintenance { background: #fef3c7; color: #92400e; }
          .status-out-of-service { background: #fee2e2; color: #991b1b; }
          .status-available { background: #dbeafe; color: #1e40af; }
          .condition-excellent, .condition-new { background: #dcfce7; color: #166534; }
          .condition-good { background: #dbeafe; color: #1e40af; }
          .condition-fair { background: #fef3c7; color: #92400e; }
          .condition-poor { background: #fee2e2; color: #991b1b; }
          .print-button { position: fixed; top: 20px; right: 20px; z-index: 1000; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-weight: 600; box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: all 0.2s ease; user-select: none; border: 2px solid #1d4ed8; }
          .print-button:hover { background: #2563eb; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.2); }
          .close-button { position: fixed; top: 80px; right: 20px; z-index: 1000; background: #6b7280; color: white; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: all 0.2s ease; user-select: none; border: 1px solid #4b5563; }
          .close-button:hover { background: #4b5563; box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
          @media print { .print-button, .close-button { display: none; } body { padding: 0; } .header { border-bottom: 2px solid #3b82f6; } }
        </style>
      </head>
      <body>
        <div class="print-button" onclick="window.print()" title="Click to print or save as PDF">🖨️ Print Report</div>
        <div class="close-button" onclick="window.close()" title="Close this report window">❌ Close</div>
        <div class="header">
          <h1>ASSETS COMPREHENSIVE REPORT</h1>
          <div class="subtitle">Generated on ${currentDate}</div>
          <div class="timestamp">Time: ${currentTime}</div>
        </div>
        <div class="summary-grid">
          <div class="summary-card"><h3>${totalAssets}</h3><p>Total Assets</p></div>
          <div class="summary-card"><h3>${operationalAssets.length}</h3><p>Operational</p></div>
          <div class="summary-card"><h3>${maintenanceAssets.length}</h3><p>Maintenance</p></div>
          <div class="summary-card"><h3>${outOfServiceAssets.length}</h3><p>Out of Service</p></div>
          <div class="summary-card"><h3>$${totalValue.toLocaleString()}</h3><p>Total Value</p></div>
        </div>
        <div class="section">
          <h2>Executive Summary</h2>
          <table>
            <thead><tr><th>Metric</th><th>Count</th><th>Percentage</th><th>Value</th></tr></thead>
            <tbody>
              <tr><td>Total Assets</td><td>${totalAssets}</td><td>100%</td><td>$${totalValue.toLocaleString()}</td></tr>
              <tr><td>Operational</td><td>${operationalAssets.length}</td><td>${totalAssets > 0 ? ((operationalAssets.length / totalAssets) * 100).toFixed(1) : 0}%</td><td>$${operationalAssets.reduce((sum, asset) => sum + (asset.purchasePrice || 0), 0).toLocaleString()}</td></tr>
              <tr><td>Under Maintenance</td><td>${maintenanceAssets.length}</td><td>${totalAssets > 0 ? ((maintenanceAssets.length / totalAssets) * 100).toFixed(1) : 0}%</td><td>$${maintenanceAssets.reduce((sum, asset) => sum + (asset.purchasePrice || 0), 0).toLocaleString()}</td></tr>
              <tr><td>Out of Service</td><td>${outOfServiceAssets.length}</td><td>${totalAssets > 0 ? ((outOfServiceAssets.length / totalAssets) * 100).toFixed(1) : 0}%</td><td>$${outOfServiceAssets.reduce((sum, asset) => sum + (asset.purchasePrice || 0), 0).toLocaleString()}</td></tr>
            </tbody>
          </table>
        </div>
        <div class="section">
          <h2>Category Analysis</h2>
          <table>
            <thead><tr><th>Category</th><th>Total Assets</th><th>Total Value</th><th>Maintenance</th><th>Out of Service</th><th>Health %</th></tr></thead>
            <tbody>
              ${Object.entries(assetsByCategory).map(([category, categoryAssets]) => {
                const categoryMaintenance = categoryAssets.filter(asset => asset.status === "maintenance").length
                const categoryOutOfService = categoryAssets.filter(asset => asset.status === "out-of-service").length
                const categoryValue = categoryAssets.reduce((sum, asset) => sum + (asset.purchasePrice || 0), 0)
                const healthPercentage = categoryAssets.length > 0 ? (((categoryAssets.length - categoryMaintenance - categoryOutOfService) / categoryAssets.length) * 100).toFixed(1) : 0
                return `<tr><td>${category}</td><td>${categoryAssets.length}</td><td>$${categoryValue.toLocaleString()}</td><td>${categoryMaintenance}</td><td>${categoryOutOfService}</td><td>${healthPercentage}%</td></tr>`
              }).join('')}
            </tbody>
          </table>
        </div>
        <div class="section">
          <h2>Department Analysis</h2>
          <table>
            <thead><tr><th>Department</th><th>Total Assets</th><th>Total Value</th><th>Operational</th><th>Maintenance</th><th>Health %</th></tr></thead>
            <tbody>
              ${Object.entries(assetsByDepartment).map(([department, departmentAssets]) => {
                const departmentOperational = departmentAssets.filter(asset => asset.status === "operational").length
                const departmentMaintenance = departmentAssets.filter(asset => asset.status === "maintenance").length
                const departmentValue = departmentAssets.reduce((sum, asset) => sum + (asset.purchasePrice || 0), 0)
                const healthPercentage = departmentAssets.length > 0 ? ((departmentOperational / departmentAssets.length) * 100).toFixed(1) : 0
                return `<tr><td>${department}</td><td>${departmentAssets.length}</td><td>$${departmentValue.toLocaleString()}</td><td>${departmentOperational}</td><td>${departmentMaintenance}</td><td>${healthPercentage}%</td></tr>`
              }).join('')}
            </tbody>
          </table>
        </div>
        <div class="section">
          <h2>Complete Assets Inventory</h2>
          <table>
            <thead><tr><th>Asset Name</th><th>Asset Tag</th><th>Type</th><th>Department</th><th>Location</th><th>Status</th><th>Condition</th><th>Value</th></tr></thead>
            <tbody>
              ${filteredAssets.map(asset => `<tr><td>${asset.name}</td><td>${asset.assetTag || 'N/A'}</td><td>${asset.type}</td><td>${asset.department}</td><td>${asset.location}</td><td><span class="status-badge status-${asset.status.replace('-', '-')}">${asset.status}</span></td><td><span class="status-badge condition-${asset.condition}">${asset.condition}</span></td><td>$${(asset.purchasePrice || 0).toLocaleString()}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
        <script>setTimeout(() => { if (!window.closed) { window.close() } }, 300000);</script>
      </body>
      </html>
    `

    // Open in new window
    const newWindow = window.open('about:blank', '_blank')
    if (newWindow) {
      newWindow.document.write(reportHTML)
      newWindow.document.close()
    }
  }

  return (
    <PageLayout>
      <PageHeader>
        <div className="flex mt-4 justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">All Assets</h1>
            <p className="text-muted-foreground">Browse and manage all assets across your organization</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={generateAssetsReport}
              variant="outline"
            >
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
            <Button 
              onClick={() => {
                clearCache()
                fetchAssets()
              }}
              variant="outline"
            >
              <Loader2 className="mr-2 h-4 w-4" />
              Refresh Data
            </Button>
            {canModifyAssets && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Asset
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
                <AssetCreationForm 
                  onSuccess={() => {
                    setIsDialogOpen(false)
                    fetchAssets() // Refresh the assets list
                  }}
                  onCancel={() => setIsDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
            )}
          </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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
                  <SelectItem value="operational">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      Operational
                    </div>
                  </SelectItem>
                  <SelectItem value="maintenance">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      Maintenance
                    </div>
                  </SelectItem>
                  <SelectItem value="available">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      Available
                    </div>
                  </SelectItem>
                  <SelectItem value="out-of-service">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      Out of Service
                    </div>
                  </SelectItem>
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

            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={filters.department} onValueChange={(value) => handleFilterChange("department", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {uniqueDepartments.map((department) => (
                    <SelectItem key={department} value={department}>
                      {department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          Showing {assets.length} of {totalCount} assets (Page {currentPage} of {totalPages})
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
            <AssetListTable 
              assets={filteredAssets} 
              onEdit={canModifyAssets ? handleEdit : undefined} 
              onDelete={canModifyAssets ? handleDelete : undefined} 
              onStatusChange={handleStatusChange}
              canModify={canModifyAssets}
            />
            {filteredAssets.length === 0 && assets.length > 0 && (
              <p className="text-center text-muted-foreground py-8">No assets found matching your search and filters.</p>
            )}
            {filteredAssets.length === 0 && assets.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No assets found. Try adding some assets first.</p>
            )}
          </>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      if (hasPrevious) {
                        previousPage()
                      }
                    }}
                    className={!hasPrevious ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          setPage(pageNum)
                        }}
                        isActive={currentPage === pageNum}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  )
                })}
                
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                
                <PaginationItem>
                  <PaginationNext 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      if (hasNext) {
                        nextPage()
                      }
                    }}
                    className={!hasNext ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </PageContent>

      {/* Edit Asset Dialog */}
      {canModifyAssets && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="sr-only">
              <DialogTitle>
                Edit Asset {selectedAssetForEdit?.name || ''}
              </DialogTitle>
            </DialogHeader>
            {selectedAssetForEdit && (
              <AssetEditForm
                asset={selectedAssetForEdit}
                onSuccess={handleEditSuccess}
                onCancel={handleEditCancel}
              />
            )}
          </DialogContent>
        </Dialog>
      )}


    </PageLayout>
  )
}
