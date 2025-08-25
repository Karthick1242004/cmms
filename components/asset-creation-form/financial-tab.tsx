"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AssetFormField } from './form-fields'
import type { TabProps } from './types'

export function FinancialTab({ formData, errors, touched, onChange, onBlur }: TabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Financial Information</CardTitle>
          <CardDescription>Cost, pricing, and financial details</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <AssetFormField
            field="costPrice"
            label="Cost Price ($)"
            placeholder="0.00"
            type="number"
            options={{ min: 0, step: '0.01' }}
            formData={formData}
            errors={errors}
            touched={touched}
            onChange={onChange}
            onBlur={onBlur}
          />

          <AssetFormField
            field="purchasePrice"
            label="Purchase Price ($)"
            placeholder="0.00"
            type="number"
            options={{ min: 0, step: '0.01' }}
            formData={formData}
            errors={errors}
            touched={touched}
            onChange={onChange}
            onBlur={onBlur}
          />

          <AssetFormField
            field="salesPrice"
            label="Sales Price ($)"
            placeholder="0.00"
            type="number"
            options={{ min: 0, step: '0.01' }}
            formData={formData}
            errors={errors}
            touched={touched}
            onChange={onChange}
            onBlur={onBlur}
          />

          <AssetFormField
            field="expectedLifeSpan"
            label="Expected Life Span (years)"
            placeholder="5"
            type="number"
            options={{ min: 0, max: 100 }}
            formData={formData}
            errors={errors}
            touched={touched}
            onChange={onChange}
            onBlur={onBlur}
          />

          <AssetFormField
            field="purchaseDate"
            label="Purchase Date"
            placeholder=""
            type="date"
            formData={formData}
            errors={errors}
            touched={touched}
            onChange={onChange}
            onBlur={onBlur}
          />

          <AssetFormField
            field="commissioningDate"
            label="Commissioning Date"
            placeholder=""
            type="date"
            formData={formData}
            errors={errors}
            touched={touched}
            onChange={onChange}
            onBlur={onBlur}
          />

          <AssetFormField
            field="warrantyStart"
            label="Warranty Start"
            placeholder=""
            type="date"
            formData={formData}
            errors={errors}
            touched={touched}
            onChange={onChange}
            onBlur={onBlur}
          />

          <AssetFormField
            field="endOfWarranty"
            label="Warranty End"
            placeholder=""
            type="date"
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
