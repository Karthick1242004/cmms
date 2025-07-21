"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, AlertTriangle, Package, Wrench } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAssetsStore } from "@/stores/assets-store"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useDebounce } from "@/hooks/use-debounce"
import { PartsInventoryReport } from "@/components/parts-inventory-report"

interface PartInventory {
  id: string
  partName: string
  partNumber: string
  quantity: number
  unitCost: number
  supplier: string
  lastReplaced?: string
  nextMaintenanceDate?: string
  assetId: string
  assetName: string
  assetType: string
  location: string
  department: string
  isLowStock: boolean
}

export default function PartsInventoryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [stockFilter, setStockFilter] = useState("all")
  const [partsInventory, setPartsInventory] = useState<PartInventory[]>([])
  const [isLoadingParts, setIsLoadingParts] = useState(false)
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  
  const { assets, isLoading, fetchAssets } = useAssetsStore()

  // Fetch all assets to extract parts BOM
  useEffect(() => {
    fetchAssets({ limit: 500 }) // Get all assets
  }, [fetchAssets])

  // Transform assets' partsBOM into inventory data from real API data
  useEffect(() => {
    const fetchAssetsWithBOM = async () => {
      if (assets.length > 0) {
        setIsLoadingParts(true)
        const inventory: PartInventory[] = []
        
        try {
          // Fetch detailed asset data to get partsBOM
          for (const asset of assets) {
            try {
              const response = await fetch(`/api/assets/${asset.id}`)
              if (response.ok) {
                const assetDetailData = await response.json()
                const assetDetail = assetDetailData.data
                
                // Extract partsBOM from the detailed asset data
                if (assetDetail && assetDetail.partsBOM && Array.isArray(assetDetail.partsBOM)) {
                  const partsFromAsset = assetDetail.partsBOM.map((part: any) => ({
                    id: `${asset.id}-${part.id || part.partNumber}`,
                    partName: part.partName,
                    partNumber: part.partNumber,
                    quantity: part.quantity || 0,
                    unitCost: part.unitCost || 0,
                    supplier: part.supplier || "Unknown",
                    lastReplaced: part.lastReplaced,
                    nextMaintenanceDate: part.nextMaintenanceDate,
                    assetId: asset.id,
                    assetName: asset.name,
                    assetType: asset.type,
                    location: asset.location,
                    department: asset.department || "General",
                    isLowStock: (part.quantity || 0) <= 1, // Low stock if quantity is 1 or less
                  }))
                  
                  inventory.push(...partsFromAsset)
                }
              }
            } catch (error) {
              console.error(`Error fetching asset details for ${asset.id}:`, error)
            }
          }
          
          setPartsInventory(inventory)
        } catch (error) {
          console.error('Error fetching parts inventory:', error)
        } finally {
          setIsLoadingParts(false)
        }
      }
    }

    fetchAssetsWithBOM()
  }, [assets])

  const filteredInventory = partsInventory.filter((part) => {
    const matchesSearch =
      part.partName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      part.partNumber.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      part.assetName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      part.supplier.toLowerCase().includes(debouncedSearchTerm.toLowerCase())

    const matchesDepartment = departmentFilter === "all" || part.department === departmentFilter
    const matchesStock = stockFilter === "all" || 
      (stockFilter === "low" && part.isLowStock) ||
      (stockFilter === "normal" && !part.isLowStock)

    return matchesSearch && matchesDepartment && matchesStock
  })

  const totalParts = filteredInventory.length
  const lowStockParts = filteredInventory.filter(part => part.isLowStock).length
  const totalValue = filteredInventory.reduce((sum, part) => sum + (part.quantity * part.unitCost), 0)
  const uniqueDepartments = [...new Set(partsInventory.map(part => part.department))]

  const getStockBadge = (part: PartInventory) => {
    if (part.isLowStock) {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Low Stock</Badge>
    }
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">In Stock</Badge>
  }

  const getStockIcon = (part: PartInventory) => {
    if (part.isLowStock) {
      return <AlertTriangle className="h-4 w-4 text-red-600" />
    }
    return <Package className="h-4 w-4 text-green-600" />
  }



  if (isLoading || isLoadingParts) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Parts Inventory</h1>
          <p className="text-muted-foreground">Track all parts and components from asset Bill of Materials (BOM)</p>
        </div>
        <PartsInventoryReport
          filteredInventory={filteredInventory}
          totalParts={totalParts}
          lowStockParts={lowStockParts}
          totalValue={totalValue}
          uniqueDepartments={uniqueDepartments}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Parts</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalParts}</div>
            <p className="text-xs text-muted-foreground">Across all assets</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alert</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{lowStockParts}</div>
            <p className="text-xs text-muted-foreground">Parts need attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
            <Wrench className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">${totalValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Current stock value</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search parts, assets, or suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {uniqueDepartments.map(dept => (
              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={stockFilter} onValueChange={setStockFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by stock" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stock Levels</SelectItem>
            <SelectItem value="low">Low Stock Only</SelectItem>
            <SelectItem value="normal">Normal Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Parts Inventory Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Part Details</TableHead>
              <TableHead>Asset Information</TableHead>
              <TableHead>Stock Status</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Unit Cost</TableHead>
              <TableHead>Total Value</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Last Replaced</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInventory.map((part) => (
              <TableRow key={part.id} className={part.isLowStock ? "bg-red-800 border-red-200" : ""}>
                <TableCell>
                  <div>
                    <div className="font-medium">{part.partName}</div>
                    <div className="text-sm text-muted-foreground">{part.partNumber}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{part.assetName}</div>
                    <div className="text-sm text-muted-foreground">{part.assetType} • {part.location}</div>
                    <div className="text-xs text-muted-foreground">{part.department}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {getStockIcon(part)}
                    {getStockBadge(part)}
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={part.isLowStock ? "text-red-600 font-medium" : "text-green-600 font-medium"}
                  >
                    {part.quantity}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-medium">
                    ${part.unitCost.toFixed(2)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-medium">
                    ${(part.quantity * part.unitCost).toFixed(2)}
                  </span>
                </TableCell>
                <TableCell className="text-sm">{part.supplier}</TableCell>
                <TableCell className="text-sm">
                  <Badge variant="outline">{part.lastReplaced || "N/A"}</Badge>
                </TableCell>
              </TableRow>
            ))}
            {filteredInventory.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No parts found matching your criteria
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
