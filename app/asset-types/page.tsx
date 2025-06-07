"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Trash2, Cog, Calendar } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"

const assetTypes = [
  {
    id: 1,
    name: "HVAC System",
    code: "HVAC",
    category: "Climate Control",
    description: "Heating, ventilation, and air conditioning systems",
    maintenanceInterval: 90,
    assetCount: 8,
    avgLifespan: 15,
    status: "active",
  },
  {
    id: 2,
    name: "Power Generation",
    code: "PWR",
    category: "Electrical",
    description: "Generators and backup power systems",
    maintenanceInterval: 30,
    assetCount: 4,
    avgLifespan: 20,
    status: "active",
  },
  {
    id: 3,
    name: "Transportation",
    code: "TRANS",
    category: "Mobility",
    description: "Elevators, escalators, and moving walkways",
    maintenanceInterval: 60,
    assetCount: 6,
    avgLifespan: 25,
    status: "active",
  },
  {
    id: 4,
    name: "Plumbing System",
    code: "PLUMB",
    category: "Water Systems",
    description: "Water supply and drainage systems",
    maintenanceInterval: 180,
    assetCount: 12,
    avgLifespan: 30,
    status: "inactive",
  },
]

export default function AssetTypesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const filteredAssetTypes = assetTypes.filter(
    (assetType) =>
      assetType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assetType.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assetType.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assetType.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Asset Types</h1>
          <p className="text-muted-foreground">Define and manage different categories of assets in your organization</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Asset Type
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Asset Type</DialogTitle>
              <DialogDescription>Create a new asset type category.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input id="name" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="code" className="text-right">
                  Code
                </Label>
                <Input id="code" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Category
                </Label>
                <Input id="category" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="maintenanceInterval" className="text-right">
                  Maintenance Interval (days)
                </Label>
                <Input id="maintenanceInterval" type="number" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="avgLifespan" className="text-right">
                  Avg Lifespan (years)
                </Label>
                <Input id="avgLifespan" type="number" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea id="description" className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={() => setIsDialogOpen(false)}>
                Save Asset Type
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search asset types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Maintenance</TableHead>
              <TableHead>Assets</TableHead>
              <TableHead>Lifespan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAssetTypes.map((assetType) => (
              <TableRow key={assetType.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg">
                      <Cog className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium">{assetType.name}</div>
                      <div className="text-sm text-muted-foreground">{assetType.code}</div>
                      <div className="text-xs text-muted-foreground">{assetType.description}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{assetType.category}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Every {assetType.maintenanceInterval} days</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{assetType.assetCount} assets</Badge>
                </TableCell>
                <TableCell className="text-sm">{assetType.avgLifespan} years</TableCell>
                <TableCell>
                  <Badge variant={assetType.status === "active" ? "default" : "secondary"}>{assetType.status}</Badge>
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
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
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
    </div>
  )
}
