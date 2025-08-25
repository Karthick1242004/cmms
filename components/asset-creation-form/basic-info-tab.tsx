"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, CheckCircle } from "lucide-react"
import { AssetFormField, AssetSelectField } from './form-fields'
import { AssetImageUpload } from './asset-image-upload'
import type { TabProps } from './types'

export function BasicInfoTab({ formData, errors, touched, onChange, onBlur, departments = [], locations = [], user }: TabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Essential asset details and identification</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <AssetFormField
            field="assetName"
            label="Asset Name"
            placeholder="e.g., Heavy Duty Wrench Set"
            required
            formData={formData}
            errors={errors}
            touched={touched}
            onChange={onChange}
            onBlur={onBlur}
          />

          <AssetSelectField
            field="category"
            label="Category"
            placeholder="Select category"
            options={[
              { value: 'Equipment', label: 'Equipment' },
              { value: 'Tools', label: 'Tools' },
              { value: 'Facilities', label: 'Facilities' },
              { value: 'Products', label: 'Products' }
            ]}
            required
            formData={formData}
            errors={errors}
            touched={touched}
            onChange={onChange}
            onBlur={onBlur}
          />

          <AssetFormField
            field="categoryName"
            label="Category Name"
            placeholder="e.g., Tools > Hand Tools"
            formData={formData}
            errors={errors}
            touched={touched}
            onChange={onChange}
            onBlur={onBlur}
          />

          <AssetFormField
            field="manufacturer"
            label="Manufacturer"
            placeholder="e.g., Craftsman"
            formData={formData}
            errors={errors}
            touched={touched}
            onChange={onChange}
            onBlur={onBlur}
          />

          <AssetFormField
            field="constructionYear"
            label="Construction Year"
            placeholder="e.g., 2020 (optional)"
            type="number"
            options={{ min: 1901, max: new Date().getFullYear() + 10 }}
            formData={formData}
            errors={errors}
            touched={touched}
            onChange={onChange}
            onBlur={onBlur}
          />

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Select value={formData.location} onValueChange={(value) => onChange('location', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location: any) => (
                  <SelectItem key={location.id} value={location.name}>
                    {location.name} - {location.type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="department" className="after:content-['*'] after:ml-0.5 after:text-red-500">Department</Label>
            <Select 
              value={formData.department} 
              onValueChange={(value) => onChange('department', value)}
              disabled={user?.accessLevel === 'department_admin'}
            >
              <SelectTrigger className={`${errors.department && touched.department ? 'border-red-500 focus:border-red-500' : ''} ${touched.department && !errors.department && formData.department ? 'border-green-500 focus:border-green-500' : ''}`}>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {user?.accessLevel === 'super_admin' 
                  ? departments.map((dept: any) => (
                      <SelectItem key={dept.id} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                    ))
                  : (
                      <SelectItem value={user?.department || ''}>
                        {user?.department}
                      </SelectItem>
                    )
                }
              </SelectContent>
            </Select>
            {errors.department && touched.department && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.department}
              </p>
            )}
            {touched.department && !errors.department && formData.department && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Valid
              </p>
            )}
            {user?.accessLevel === 'department_admin' && (
              <p className="text-sm text-muted-foreground">
                Department is auto-selected based on your role
              </p>
            )}
          </div>

          <AssetSelectField
            field="condition"
            label="Condition"
            placeholder="Select condition"
            options={[
              { value: 'new', label: 'New' },
              { value: 'excellent', label: 'Excellent' },
              { value: 'good', label: 'Good' },
              { value: 'fair', label: 'Fair' },
              { value: 'poor', label: 'Poor' }
            ]}
            formData={formData}
            errors={errors}
            touched={touched}
            onChange={onChange}
            onBlur={onBlur}
          />

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => onChange('description', e.target.value)}
              placeholder="Detailed description of the asset..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <AssetImageUpload
        formData={formData}
        errors={errors}
        touched={touched}
        onChange={onChange}
        onBlur={onBlur}
      />

      <Card>
        <CardHeader>
          <CardTitle>Status & Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <AssetSelectField
            field="statusText"
            label="Status"
            placeholder="Select status"
            options={[
              { value: 'Available', label: 'Available' },
              { value: 'In Use', label: 'In Use' },
              { value: 'Maintenance', label: 'Maintenance' },
              { value: 'Out of Service', label: 'Out of Service' }
            ]}
            required
            formData={formData}
            errors={errors}
            touched={touched}
            onChange={onChange}
            onBlur={onBlur}
          />

          <AssetSelectField
            field="assetType"
            label="Asset Type"
            placeholder="Select type"
            options={[
              { value: 'Tangible', label: 'Tangible' },
              { value: 'Fixed Asset', label: 'Fixed Asset' },
              { value: 'Consumable', label: 'Consumable' },
              { value: 'Reusable', label: 'Reusable' }
            ]}
            formData={formData}
            errors={errors}
            touched={touched}
            onChange={onChange}
            onBlur={onBlur}
          />

          <AssetFormField
            field="uom"
            label="Unit of Measure"
            placeholder="e.g., Set, Piece, Meter"
            formData={formData}
            errors={errors}
            touched={touched}
            onChange={onChange}
            onBlur={onBlur}
          />
        </CardContent>
      </Card>
    </div>
  )
}
