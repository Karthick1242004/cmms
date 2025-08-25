"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, CheckCircle } from "lucide-react"
import type { AssetFormData, AssetFormErrors } from './types'

interface FormFieldProps {
  field: keyof AssetFormData
  label: string
  placeholder: string
  type?: string
  required?: boolean
  options?: { min?: number; max?: number; step?: string }
  formData: AssetFormData
  errors: AssetFormErrors
  touched: Record<string, boolean>
  onChange: (field: keyof AssetFormData, value: any) => void
  onBlur: (field: string) => void
}

interface SelectFieldProps {
  field: keyof AssetFormData
  label: string
  placeholder: string
  options: { value: string; label: string }[]
  required?: boolean
  formData: AssetFormData
  errors: AssetFormErrors
  touched: Record<string, boolean>
  onChange: (field: keyof AssetFormData, value: any) => void
  onBlur: (field: string) => void
}

export function AssetFormField({
  field,
  label,
  placeholder,
  type = 'text',
  required = false,
  options,
  formData,
  errors,
  touched,
  onChange,
  onBlur
}: FormFieldProps) {
  const fieldName = field as string
  const hasError = errors[fieldName as keyof AssetFormErrors] && touched[fieldName]
  const isValid = touched[fieldName] && !errors[fieldName as keyof AssetFormErrors] && formData[field]
  
  // Handle number field display value
  const getDisplayValue = () => {
    if (type === 'number') {
      const numValue = formData[field] as number
      return numValue === 0 ? '' : numValue?.toString() || ''
    }
    return formData[field] as string
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (type === 'number') {
      const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
      onChange(field, value)
    } else {
      onChange(field, e.target.value)
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (type === 'number' && e.target.value === '') {
      onChange(field, 0)
    }
    onBlur(fieldName)
  }
  
  return (
    <div className="space-y-2">
      <Label htmlFor={fieldName} className={required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ""}>
        {label}
      </Label>
      <Input
        id={fieldName}
        type={type}
        value={getDisplayValue()}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`${hasError ? 'border-red-500 focus:border-red-500' : ''} ${isValid ? 'border-green-500 focus:border-green-500' : ''}`}
        min={options?.min}
        max={options?.max}
        step={options?.step}
      />
      {hasError && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {errors[fieldName as keyof AssetFormErrors]}
        </p>
      )}
      {isValid && (
        <p className="text-sm text-green-600 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Valid
        </p>
      )}
    </div>
  )
}

export function AssetSelectField({
  field,
  label,
  placeholder,
  options,
  required = false,
  formData,
  errors,
  touched,
  onChange,
  onBlur
}: SelectFieldProps) {
  const fieldName = field as string
  const hasError = errors[fieldName as keyof AssetFormErrors] && touched[fieldName]
  const isValid = touched[fieldName] && !errors[fieldName as keyof AssetFormErrors] && formData[field]
  
  return (
    <div className="space-y-2">
      <Label htmlFor={fieldName} className={required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ""}>
        {label}
      </Label>
      <Select 
        value={formData[field] as string} 
        onValueChange={(value) => onChange(field, value)}
      >
        <SelectTrigger className={`${hasError ? 'border-red-500 focus:border-red-500' : ''} ${isValid ? 'border-green-500 focus:border-green-500' : ''}`}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasError && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          {errors[fieldName as keyof AssetFormErrors]}
        </p>
      )}
      {isValid && (
        <p className="text-sm text-green-600 flex items-center gap-1">
          <CheckCircle className="h-4 w-4" />
          Valid
        </p>
      )}
    </div>
  )
}
