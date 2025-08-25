"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, X, AlertCircle } from "lucide-react"
import type { TabProps } from './types'

export function PartsBOMTab({ formData, onChange }: TabProps) {
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
    onChange('partsBOM', [...formData.partsBOM, newPart])
  }

  const updatePartBOM = (index: number, field: string, value: any) => {
    const updatedParts = formData.partsBOM.map((part, i) => 
      i === index ? { ...part, [field]: value } : part
    )
    onChange('partsBOM', updatedParts)
  }

  const removePartBOM = (index: number) => {
    const updatedParts = formData.partsBOM.filter((_, i) => i !== index)
    onChange('partsBOM', updatedParts)
  }

  return (
    <div className="space-y-6">
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
                    value={part.quantity === 1 || part.quantity === 0 ? '' : part.quantity?.toString() || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 1 : parseInt(e.target.value) || 1;
                      updatePartBOM(index, 'quantity', value);
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '') {
                        updatePartBOM(index, 'quantity', 1);
                      }
                    }}
                    placeholder="1"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`part-cost-${index}`}>Unit Cost ($)</Label>
                  <Input 
                    id={`part-cost-${index}`}
                    type="number"
                    step="0.01"
                    value={part.unitCost === 0 ? '' : part.unitCost?.toString() || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                      updatePartBOM(index, 'unitCost', value);
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '') {
                        updatePartBOM(index, 'unitCost', 0);
                      }
                    }}
                    placeholder="0.00"
                    min="0"
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
                <div className="space-y-2">
                  <Label htmlFor={`part-next-maintenance-${index}`}>Next Maintenance</Label>
                  <Input 
                    id={`part-next-maintenance-${index}`}
                    type="date"
                    value={part.nextMaintenanceDate}
                    onChange={(e) => updatePartBOM(index, 'nextMaintenanceDate', e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Total Cost: ${((part.unitCost || 0) * (part.quantity || 0)).toFixed(2)}</Label>
                  <div className="text-sm text-muted-foreground">
                    Unit Cost: ${part.unitCost || 0} × Quantity: {part.quantity || 0}
                  </div>
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
    </div>
  )
}
