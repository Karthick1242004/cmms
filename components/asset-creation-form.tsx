"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plus, X, Upload, Save, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useAssetsStore } from "@/stores/assets-store"

interface AssetFormData {
  // Basic Information
  assetName: string
  serialNo: string
  rfid: string
  category: string
  categoryName: string
  statusText: string
  statusColor: 'green' | 'yellow' | 'red'
  manufacturer: string
  description: string
  location: string
  department: string
  assetType: string
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'new'
  
  // Financial Information
  costPrice: number
  purchasePrice: number
  salesPrice: number
  expectedLifeSpan: number
  
  // Dates
  purchaseDate: string
  commissioningDate: string
  warrantyStart: string
  endOfWarranty: string
  
  // Additional Details
  outOfOrder: 'Yes' | 'No'
  isActive: 'Yes' | 'No'
  allocated: string
  uom: string
  size: string
  productionHoursDaily: number
  
  // Complex Objects
  meteringEvents: any[]
  personnel: any[]
  businesses: any[]
  files: any[]
  partsBOM: any[]
  warrantyDetails: any
  financials: any
  purchaseInfo: any
  associatedCustomer: any
  
  // Links for Files section
  links: Array<{
    id: string
    name: string
    url: string
    description?: string
    type: 'document' | 'manual' | 'specification' | 'image' | 'other'
  }>
}

interface AssetCreationFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function AssetCreationForm({ onSuccess, onCancel }: AssetCreationFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  const { addAsset } = useAssetsStore()
  
  const [formData, setFormData] = useState<AssetFormData>({
    assetName: '',
    serialNo: '',
    rfid: '',
    category: '',
    categoryName: '',
    statusText: 'Available',
    statusColor: 'green',
    manufacturer: '',
    description: '',
    location: '',
    department: '',
    assetType: 'Tangible',
    condition: 'new',
    costPrice: 0,
    purchasePrice: 0,
    salesPrice: 0,
    expectedLifeSpan: 5,
    purchaseDate: '',
    commissioningDate: '',
    warrantyStart: '',
    endOfWarranty: '',
    outOfOrder: 'No',
    isActive: 'Yes',
    allocated: '',
    uom: '',
    size: '',
    productionHoursDaily: 0,
    meteringEvents: [],
    personnel: [],
    businesses: [],
    files: [],
    links: [],
    partsBOM: [],
    warrantyDetails: {},
    financials: {},
    purchaseInfo: {},
    associatedCustomer: {}
  })

  const handleInputChange = (field: keyof AssetFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Helper functions for managing links
  const addLink = () => {
    const newLink = {
      id: `link-${Date.now()}`,
      name: '',
      url: '',
      description: '',
      type: 'document' as const
    }
    setFormData(prev => ({
      ...prev,
      links: [...prev.links, newLink]
    }))
  }

  const updateLink = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.map((link, i) => 
        i === index ? { ...link, [field]: value } : link
      )
    }))
  }

  const removeLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index)
    }))
  }

  const addMeteringEvent = () => {
    const newEvent = {
      id: `meter_${Date.now()}`,
      eventType: '',
      reading: 0,
      unit: '',
      recordedDate: new Date().toISOString().split('T')[0],
      recordedBy: '',
      notes: ''
    }
    setFormData(prev => ({
      ...prev,
      meteringEvents: [...prev.meteringEvents, newEvent]
    }))
  }

  const updateMeteringEvent = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      meteringEvents: prev.meteringEvents.map((event, i) => 
        i === index ? { ...event, [field]: value } : event
      )
    }))
  }

  const removeMeteringEvent = (index: number) => {
    setFormData(prev => ({
      ...prev,
      meteringEvents: prev.meteringEvents.filter((_, i) => i !== index)
    }))
  }

  const addPersonnel = () => {
    const newPerson = {
      id: `person_${Date.now()}`,
      name: '',
      role: '',
      email: '',
      phone: '',
      assignedDate: new Date().toISOString().split('T')[0],
      responsibilities: []
    }
    setFormData(prev => ({
      ...prev,
      personnel: [...prev.personnel, newPerson]
    }))
  }

  const updatePersonnel = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      personnel: prev.personnel.map((person, i) => 
        i === index ? { ...person, [field]: value } : person
      )
    }))
  }

  const removePersonnel = (index: number) => {
    setFormData(prev => ({
      ...prev,
      personnel: prev.personnel.filter((_, i) => i !== index)
    }))
  }

  const addBusiness = () => {
    const newBusiness = {
      id: `business_${Date.now()}`,
      name: '',
      type: 'Supplier',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      relationship: ''
    }
    setFormData(prev => ({
      ...prev,
      businesses: [...prev.businesses, newBusiness]
    }))
  }

  const updateBusiness = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      businesses: prev.businesses.map((business, i) => 
        i === index ? { ...business, [field]: value } : business
      )
    }))
  }

  const removeBusiness = (index: number) => {
    setFormData(prev => ({
      ...prev,
      businesses: prev.businesses.filter((_, i) => i !== index)
    }))
  }

  const addPartBOM = () => {
    const newPart = {
      id: `part_${Date.now()}`,
      partName: '',
      partNumber: '',
      quantity: 1,
      unitCost: 0,
      supplier: '',
      lastReplaced: '',
      nextMaintenanceDate: ''
    }
    setFormData(prev => ({
      ...prev,
      partsBOM: [...prev.partsBOM, newPart]
    }))
  }

  const updatePartBOM = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      partsBOM: prev.partsBOM.map((part, i) => 
        i === index ? { ...part, [field]: value } : part
      )
    }))
  }

  const removePartBOM = (index: number) => {
    setFormData(prev => ({
      ...prev,
      partsBOM: prev.partsBOM.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async () => {
    // Validate required fields
    const requiredFields = [
      { field: formData.assetName, name: 'Asset name' },
      { field: formData.category, name: 'Category' },
      { field: formData.department, name: 'Department' },
      { field: formData.statusText, name: 'Status' }
    ]

    const missingFields = requiredFields.filter(({ field }) => !field?.trim()).map(({ name }) => name)
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in required fields: ${missingFields.join(', ')}`)
      return
    }

    setIsLoading(true)
    try {
      // Helper function to remove empty objects and arrays
      const cleanData = (obj: any): any => {
        const cleaned: any = {}
        
        for (const [key, value] of Object.entries(obj)) {
          if (value === null || value === undefined || value === '') {
            // Skip null, undefined, and empty string values
            continue
          } else if (Array.isArray(value)) {
            // Only include non-empty arrays
            if (value.length > 0) {
              cleaned[key] = value
            }
          } else if (typeof value === 'object') {
            // Only include non-empty objects
            if (Object.keys(value).length > 0) {
              cleaned[key] = value
            }
          } else {
            // Include all other values (strings, numbers, booleans)
            cleaned[key] = value
          }
        }
        
        return cleaned
      }

      // Merge links into files array before cleaning data
      const linksAsFiles = (formData.links || []).map(link => ({
        // Convert link to file format that backend expects
        id: link.id,
        name: link.name,
        url: link.url,
        description: link.description,
        type: link.type,
        // Add common file properties that might be expected
        category: link.type || 'document',
        size: undefined,
        uploadDate: new Date().toISOString(),
        uploadedBy: undefined,
        // Mark as link for identification
        isLink: true
      }))

      const mergedFormData = {
        ...formData,
        files: [...(formData.files || []), ...linksAsFiles], // Merge existing files with formatted links
        links: undefined // Remove links field since we're merging into files
      }

      // Convert file objects to strings as backend expects
      if (mergedFormData.files && mergedFormData.files.length > 0) {
        mergedFormData.files = mergedFormData.files.map(file => 
          typeof file === 'object' ? JSON.stringify(file) : file
        )
      }

      // Transform and clean form data
      const assetData = cleanData({
        ...mergedFormData, // Include all form data first (with merged files)
        name: formData.assetName, // Override with correct field mappings
        type: formData.category,
        status: formData.statusText.toLowerCase().includes("available") ? "available" as const :
                formData.statusText.toLowerCase().includes("maintenance") ? "maintenance" as const :
                formData.statusText.toLowerCase().includes("out") ? "out-of-service" as const : "operational" as const,
        assetTag: formData.serialNo,
        imageSrc: "/placeholder.svg?height=150&width=250"
      })

      await addAsset(assetData)
      toast.success('Asset created successfully!')
      onSuccess?.()
    } catch (error) {
      console.error('Error creating asset:', error)
      toast.error('Failed to create asset. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Create New Asset</h2>
          <p className="text-muted-foreground">Add a new asset to your inventory</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Save className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Asset
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="personnel">Personnel</TabsTrigger>
          <TabsTrigger value="businesses">Businesses</TabsTrigger>
          <TabsTrigger value="parts">Parts/BOM</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Essential asset details and identification</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="assetName">Asset Name *</Label>
                <Input 
                  id="assetName"
                  value={formData.assetName}
                  onChange={(e) => handleInputChange('assetName', e.target.value)}
                  placeholder="e.g., Heavy Duty Wrench Set"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="serialNo">Serial Number</Label>
                <Input 
                  id="serialNo"
                  value={formData.serialNo}
                  onChange={(e) => handleInputChange('serialNo', e.target.value)}
                  placeholder="e.g., HDWS-M-001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Equipment">Equipment</SelectItem>
                    <SelectItem value="Tools">Tools</SelectItem>
                    <SelectItem value="Facilities">Facilities</SelectItem>
                    <SelectItem value="Products">Products</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryName">Category Name</Label>
                <Input 
                  id="categoryName"
                  value={formData.categoryName}
                  onChange={(e) => handleInputChange('categoryName', e.target.value)}
                  placeholder="e.g., Tools > Hand Tools"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input 
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                  placeholder="e.g., Craftsman"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input 
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="e.g., Tool Crib A"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Input 
                  id="department"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  placeholder="e.g., Maintenance"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Condition</Label>
                <Select value={formData.condition} onValueChange={(value) => handleInputChange('condition', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Detailed description of the asset..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status & Settings</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="statusText">Status *</Label>
                <Select value={formData.statusText} onValueChange={(value) => handleInputChange('statusText', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="In Use">In Use</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                    <SelectItem value="Out of Service">Out of Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assetType">Asset Type</Label>
                <Select value={formData.assetType} onValueChange={(value) => handleInputChange('assetType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tangible">Tangible</SelectItem>
                    <SelectItem value="Fixed Asset">Fixed Asset</SelectItem>
                    <SelectItem value="Consumable">Consumable</SelectItem>
                    <SelectItem value="Reusable">Reusable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="uom">Unit of Measure</Label>
                <Input 
                  id="uom"
                  value={formData.uom}
                  onChange={(e) => handleInputChange('uom', e.target.value)}
                  placeholder="e.g., Set, Piece, Meter"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Financial Information</CardTitle>
              <CardDescription>Cost, pricing, and financial details</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="costPrice">Cost Price ($)</Label>
                <Input 
                  id="costPrice"
                  type="number"
                  value={formData.costPrice}
                  onChange={(e) => handleInputChange('costPrice', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchasePrice">Purchase Price ($)</Label>
                <Input 
                  id="purchasePrice"
                  type="number"
                  value={formData.purchasePrice}
                  onChange={(e) => handleInputChange('purchasePrice', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="salesPrice">Sales Price ($)</Label>
                <Input 
                  id="salesPrice"
                  type="number"
                  value={formData.salesPrice}
                  onChange={(e) => handleInputChange('salesPrice', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expectedLifeSpan">Expected Life Span (years)</Label>
                <Input 
                  id="expectedLifeSpan"
                  type="number"
                  value={formData.expectedLifeSpan}
                  onChange={(e) => handleInputChange('expectedLifeSpan', parseInt(e.target.value) || 0)}
                  placeholder="5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchaseDate">Purchase Date</Label>
                <Input 
                  id="purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="commissioningDate">Commissioning Date</Label>
                <Input 
                  id="commissioningDate"
                  type="date"
                  value={formData.commissioningDate}
                  onChange={(e) => handleInputChange('commissioningDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="warrantyStart">Warranty Start</Label>
                <Input 
                  id="warrantyStart"
                  type="date"
                  value={formData.warrantyStart}
                  onChange={(e) => handleInputChange('warrantyStart', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endOfWarranty">Warranty End</Label>
                <Input 
                  id="endOfWarranty"
                  type="date"
                  value={formData.endOfWarranty}
                  onChange={(e) => handleInputChange('endOfWarranty', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personnel" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Personnel Assignment
                <Button onClick={addPersonnel} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Person
                </Button>
              </CardTitle>
              <CardDescription>Assign personnel responsible for this asset</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.personnel.map((person, index) => (
                <Card key={person.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Person {index + 1}</Badge>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removePersonnel(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`person-name-${index}`}>Name</Label>
                      <Input 
                        id={`person-name-${index}`}
                        value={person.name}
                        onChange={(e) => updatePersonnel(index, 'name', e.target.value)}
                        placeholder="Person's name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`person-role-${index}`}>Role</Label>
                      <Input 
                        id={`person-role-${index}`}
                        value={person.role}
                        onChange={(e) => updatePersonnel(index, 'role', e.target.value)}
                        placeholder="Job role"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`person-email-${index}`}>Email</Label>
                      <Input 
                        id={`person-email-${index}`}
                        type="email"
                        value={person.email}
                        onChange={(e) => updatePersonnel(index, 'email', e.target.value)}
                        placeholder="email@company.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`person-phone-${index}`}>Phone</Label>
                      <Input 
                        id={`person-phone-${index}`}
                        value={person.phone}
                        onChange={(e) => updatePersonnel(index, 'phone', e.target.value)}
                        placeholder="+1-555-0123"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
              {formData.personnel.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No personnel assigned yet</p>
                  <p className="text-sm">Click "Add Person" to assign someone to this asset</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="businesses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Business Relationships
                <Button onClick={addBusiness} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Business
                </Button>
              </CardTitle>
              <CardDescription>Suppliers, service providers, and other business relationships</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.businesses.map((business, index) => (
                <Card key={business.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Business {index + 1}</Badge>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeBusiness(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`business-name-${index}`}>Business Name</Label>
                      <Input 
                        id={`business-name-${index}`}
                        value={business.name}
                        onChange={(e) => updateBusiness(index, 'name', e.target.value)}
                        placeholder="Company name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`business-type-${index}`}>Type</Label>
                      <Select 
                        value={business.type} 
                        onValueChange={(value) => updateBusiness(index, 'type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Business type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Supplier">Supplier</SelectItem>
                          <SelectItem value="Service Provider">Service Provider</SelectItem>
                          <SelectItem value="Manufacturer">Manufacturer</SelectItem>
                          <SelectItem value="Contractor">Contractor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`business-contact-${index}`}>Contact Person</Label>
                      <Input 
                        id={`business-contact-${index}`}
                        value={business.contactPerson}
                        onChange={(e) => updateBusiness(index, 'contactPerson', e.target.value)}
                        placeholder="Contact person name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`business-phone-${index}`}>Phone</Label>
                      <Input 
                        id={`business-phone-${index}`}
                        value={business.phone}
                        onChange={(e) => updateBusiness(index, 'phone', e.target.value)}
                        placeholder="+1-555-0200"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
              {formData.businesses.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No business relationships defined yet</p>
                  <p className="text-sm">Click "Add Business" to add suppliers or service providers</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Parts Bill of Materials (BOM)
                <Button onClick={addPartBOM} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Part
                </Button>
              </CardTitle>
              <CardDescription>Components and parts that make up this asset</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.partsBOM.map((part, index) => (
                <Card key={part.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Part {index + 1}</Badge>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removePartBOM(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor={`part-name-${index}`}>Part Name</Label>
                      <Input 
                        id={`part-name-${index}`}
                        value={part.partName}
                        onChange={(e) => updatePartBOM(index, 'partName', e.target.value)}
                        placeholder="Part name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`part-number-${index}`}>Part Number</Label>
                      <Input 
                        id={`part-number-${index}`}
                        value={part.partNumber}
                        onChange={(e) => updatePartBOM(index, 'partNumber', e.target.value)}
                        placeholder="Part number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`part-quantity-${index}`}>Quantity</Label>
                      <Input 
                        id={`part-quantity-${index}`}
                        type="number"
                        value={part.quantity}
                        onChange={(e) => updatePartBOM(index, 'quantity', parseInt(e.target.value) || 0)}
                        placeholder="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`part-cost-${index}`}>Unit Cost ($)</Label>
                      <Input 
                        id={`part-cost-${index}`}
                        type="number"
                        value={part.unitCost}
                        onChange={(e) => updatePartBOM(index, 'unitCost', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`part-supplier-${index}`}>Supplier</Label>
                      <Input 
                        id={`part-supplier-${index}`}
                        value={part.supplier}
                        onChange={(e) => updatePartBOM(index, 'supplier', e.target.value)}
                        placeholder="Supplier name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`part-last-replaced-${index}`}>Last Replaced</Label>
                      <Input 
                        id={`part-last-replaced-${index}`}
                        type="date"
                        value={part.lastReplaced}
                        onChange={(e) => updatePartBOM(index, 'lastReplaced', e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
              {formData.partsBOM.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No parts defined yet</p>
                  <p className="text-sm">Click "Add Part" to add components to the bill of materials</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>Additional configuration and operational details</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="allocated">Allocated To</Label>
                <Input 
                  id="allocated"
                  value={formData.allocated}
                  onChange={(e) => handleInputChange('allocated', e.target.value)}
                  placeholder="e.g., Tool Crib A"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="size">Size</Label>
                <Input 
                  id="size"
                  value={formData.size}
                  onChange={(e) => handleInputChange('size', e.target.value)}
                  placeholder="Physical dimensions"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="productionHoursDaily">Production Hours Daily</Label>
                <Input 
                  id="productionHoursDaily"
                  type="number"
                  max="24"
                  value={formData.productionHoursDaily}
                  onChange={(e) => handleInputChange('productionHoursDaily', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rfid">RFID Tag</Label>
                <Input 
                  id="rfid"
                  value={formData.rfid}
                  onChange={(e) => handleInputChange('rfid', e.target.value)}
                  placeholder="RFID tag number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="outOfOrder">Out of Order</Label>
                <Select value={formData.outOfOrder} onValueChange={(value) => handleInputChange('outOfOrder', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="No">No</SelectItem>
                    <SelectItem value="Yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="isActive">Is Active</Label>
                <Select value={formData.isActive} onValueChange={(value) => handleInputChange('isActive', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Links/Files Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Files & Links</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLink}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Link
                </Button>
              </CardTitle>
              <CardDescription>
                Add links to documents, manuals, specifications, or other relevant files
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.links.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No links added yet</p>
                  <p className="text-sm">Click "Add Link" to add file references</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.links.map((link, index) => (
                    <div key={link.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Link {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLink(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`create-link-name-${index}`}>Link Name *</Label>
                          <Input
                            id={`create-link-name-${index}`}
                            value={link.name}
                            onChange={(e) => updateLink(index, 'name', e.target.value)}
                            placeholder="e.g., User Manual"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`create-link-type-${index}`}>Type</Label>
                          <Select 
                            value={link.type} 
                            onValueChange={(value) => updateLink(index, 'type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="document">Document</SelectItem>
                              <SelectItem value="manual">Manual</SelectItem>
                              <SelectItem value="specification">Specification</SelectItem>
                              <SelectItem value="image">Image</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`create-link-url-${index}`}>URL *</Label>
                        <Input
                          id={`create-link-url-${index}`}
                          type="url"
                          value={link.url}
                          onChange={(e) => updateLink(index, 'url', e.target.value)}
                          placeholder="https://example.com/document.pdf"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`create-link-description-${index}`}>Description</Label>
                        <Textarea
                          id={`create-link-description-${index}`}
                          value={link.description || ''}
                          onChange={(e) => updateLink(index, 'description', e.target.value)}
                          placeholder="Brief description of the file or link"
                          rows={2}
                        />
                      </div>

                      {/* Preview/Test Link */}
                      {link.url && (
                        <div className="flex items-center gap-2 pt-2 border-t">
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                          >
                            <Upload className="h-3 w-3" />
                            Open Link
                          </a>
                          <Badge variant="outline" className="text-xs">
                            {link.type}
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Metering Events
                <Button onClick={addMeteringEvent} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Event
                </Button>
              </CardTitle>
              <CardDescription>Track readings and measurements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.meteringEvents.map((event, index) => (
                <Card key={event.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Event {index + 1}</Badge>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeMeteringEvent(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`event-type-${index}`}>Event Type</Label>
                      <Input 
                        id={`event-type-${index}`}
                        value={event.eventType}
                        onChange={(e) => updateMeteringEvent(index, 'eventType', e.target.value)}
                        placeholder="e.g., Usage Count"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`event-reading-${index}`}>Reading</Label>
                      <Input 
                        id={`event-reading-${index}`}
                        type="number"
                        value={event.reading}
                        onChange={(e) => updateMeteringEvent(index, 'reading', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`event-unit-${index}`}>Unit</Label>
                      <Input 
                        id={`event-unit-${index}`}
                        value={event.unit}
                        onChange={(e) => updateMeteringEvent(index, 'unit', e.target.value)}
                        placeholder="e.g., uses, hours, km"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`event-date-${index}`}>Date</Label>
                      <Input 
                        id={`event-date-${index}`}
                        type="date"
                        value={event.recordedDate}
                        onChange={(e) => updateMeteringEvent(index, 'recordedDate', e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
              {formData.meteringEvents.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No metering events recorded yet</p>
                  <p className="text-sm">Click "Add Event" to track usage or condition readings</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 