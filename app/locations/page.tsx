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
import { Plus, Search, Edit, Trash2, MapPin, Building } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"

const locations = [
  {
    id: 1,
    name: "Building A - 1st Floor",
    code: "BA-F1",
    type: "Floor",
    description: "Main floor with reception and offices",
    parentLocation: "Building A",
    assetCount: 15,
    address: "123 Main Street, Building A",
  },
  {
    id: 2,
    name: "Building A - Conference Room A",
    code: "BA-CRA",
    type: "Room",
    description: "Main conference room on 1st floor",
    parentLocation: "Building A - 1st Floor",
    assetCount: 3,
    address: "123 Main Street, Building A",
  },
  {
    id: 3,
    name: "Building B - Warehouse 1",
    code: "BB-WH1",
    type: "Warehouse",
    description: "Primary storage warehouse for parts",
    parentLocation: "Building B",
    assetCount: 78,
    address: "456 Oak Avenue, Building B",
  },
  {
    id: 4,
    name: "Main Campus - Server Room",
    code: "MC-SRV",
    type: "Utility Room",
    description: "Central server and networking equipment",
    parentLocation: "Main Campus",
    assetCount: 25,
    address: "789 Pine Street, Admin Building",
  },
  {
    id: 5,
    name: "Building C - Lab 2B",
    code: "BC-L2B",
    type: "Laboratory",
    description: "Research and Development Lab",
    parentLocation: "Building C - 2nd Floor",
    assetCount: 12,
    address: "101 Innovation Drive, Building C",
  },
  {
    id: 6,
    name: "Building A - 2nd Floor",
    code: "BA-F2",
    type: "Floor",
    description: "Second floor with department offices",
    parentLocation: "Building A",
    assetCount: 22,
    address: "123 Main Street, Building A",
  },
  {
    id: 7,
    name: "Building B - Warehouse 2",
    code: "BB-WH2",
    type: "Warehouse",
    description: "Secondary storage for large equipment",
    parentLocation: "Building B",
    assetCount: 45,
    address: "456 Oak Avenue, Building B",
  },
  {
    id: 8,
    name: "Main Campus - Electrical Room",
    code: "MC-ER",
    type: "Utility Room",
    description: "Main electrical distribution panels",
    parentLocation: "Main Campus",
    assetCount: 18,
    address: "789 Pine Street, Admin Building",
  },
]

export default function LocationsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const filteredLocations = locations.filter(
    (location) =>
      location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Locations</h1>
          <p className="text-muted-foreground">Manage physical locations where assets are deployed</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Location</DialogTitle>
              <DialogDescription>Create a new location for asset deployment.</DialogDescription>
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
                <Label htmlFor="type" className="text-right">
                  Type
                </Label>
                <Input id="type" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">
                  Address
                </Label>
                <Input id="address" className="col-span-3" />
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
                Save Location
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search locations..."
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
              <TableHead>Location</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Parent Location</TableHead>
              <TableHead>Assets</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLocations.map((location) => (
              <TableRow key={location.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
                      <MapPin className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">{location.name}</div>
                      <div className="text-sm text-muted-foreground">{location.code}</div>
                      <div className="text-xs text-muted-foreground">{location.description}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{location.type}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{location.parentLocation}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{location.assetCount} assets</Badge>
                </TableCell>
                <TableCell className="text-sm">{location.address}</TableCell>
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
