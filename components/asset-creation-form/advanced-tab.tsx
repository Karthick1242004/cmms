"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, X, Upload, AlertCircle } from "lucide-react"
import { AssetFormField, AssetSelectField } from './form-fields'
import type { TabProps } from './types'

export function AdvancedTab({ formData, errors, touched, onChange, onBlur }: TabProps) {
  // Helper functions for managing links
  const addLink = () => {
    const newLink = {
      id: `link-${Date.now()}`,
      name: '',
      url: '',
      description: '',
      type: 'document' as const
    }
    onChange('links', [...formData.links, newLink])
  }

  const updateLink = (index: number, field: string, value: string) => {
    const updatedLinks = formData.links.map((link, i) => 
      i === index ? { ...link, [field]: value } : link
    )
    onChange('links', updatedLinks)
  }

  const removeLink = (index: number) => {
    const updatedLinks = formData.links.filter((_, i) => i !== index)
    onChange('links', updatedLinks)
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
    onChange('meteringEvents', [...formData.meteringEvents, newEvent])
  }

  const updateMeteringEvent = (index: number, field: string, value: any) => {
    const updatedEvents = formData.meteringEvents.map((event, i) => 
      i === index ? { ...event, [field]: value } : event
    )
    onChange('meteringEvents', updatedEvents)
  }

  const removeMeteringEvent = (index: number) => {
    const updatedEvents = formData.meteringEvents.filter((_, i) => i !== index)
    onChange('meteringEvents', updatedEvents)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Advanced Settings</CardTitle>
          <CardDescription>Additional configuration and operational details</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <AssetFormField
            field="allocated"
            label="Allocated To"
            placeholder="e.g., Tool Crib A"
            formData={formData}
            errors={errors}
            touched={touched}
            onChange={onChange}
            onBlur={onBlur}
          />

          <AssetFormField
            field="size"
            label="Size"
            placeholder="Physical dimensions"
            formData={formData}
            errors={errors}
            touched={touched}
            onChange={onChange}
            onBlur={onBlur}
          />

          <AssetFormField
            field="productionHoursDaily"
            label="Production Hours Daily"
            placeholder="0"
            type="number"
            options={{ min: 0, max: 24, step: '0.01' }}
            formData={formData}
            errors={errors}
            touched={touched}
            onChange={onChange}
            onBlur={onBlur}
          />

          <AssetSelectField
            field="outOfOrder"
            label="Out of Order"
            placeholder="Select status"
            options={[
              { value: 'No', label: 'No' },
              { value: 'Yes', label: 'Yes' }
            ]}
            formData={formData}
            errors={errors}
            touched={touched}
            onChange={onChange}
            onBlur={onBlur}
          />

          <AssetSelectField
            field="isActive"
            label="Is Active"
            placeholder="Select status"
            options={[
              { value: 'Yes', label: 'Yes' },
              { value: 'No', label: 'No' }
            ]}
            formData={formData}
            errors={errors}
            touched={touched}
            onChange={onChange}
            onBlur={onBlur}
          />
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
                    step="0.01"
                    value={event.reading === 0 ? '' : event.reading?.toString() || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                      updateMeteringEvent(index, 'reading', value);
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '') {
                        updateMeteringEvent(index, 'reading', 0);
                      }
                    }}
                    placeholder="0"
                    min="0"
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
    </div>
  )
}
