import type { AssetFormData, AssetFormErrors } from './types'

// Validation functions
export const validateField = (field: string, value: any): string | undefined => {
  switch (field) {
    case 'assetName':
      if (!value || value.trim().length === 0) return 'Asset name is required'
      if (value.trim().length < 2) return 'Asset name must be at least 2 characters'
      if (value.trim().length > 100) return 'Asset name must be less than 100 characters'
      return undefined
    
    case 'category':
      if (!value || value.trim().length === 0) return 'Category is required'
      return undefined
    
    case 'department':
      if (!value || value.trim().length === 0) return 'Department is required'
      return undefined
    
    case 'statusText':
      if (!value || value.trim().length === 0) return 'Status is required'
      return undefined
    
    case 'serialNo':
      if (value && value.trim().length > 50) return 'Serial number must be less than 50 characters'
      return undefined
    
    case 'rfid':
      if (value && value.trim().length > 50) return 'RFID must be less than 50 characters'
      return undefined
    
    case 'costPrice':
      if (value && (isNaN(value) || value < 0)) return 'Cost price must be a positive number'
      if (value && value > 999999999) return 'Cost price is too high'
      return undefined
    
    case 'purchasePrice':
      if (value && (isNaN(value) || value < 0)) return 'Purchase price must be a positive number'
      if (value && value > 999999999) return 'Purchase price is too high'
      return undefined
    
    case 'constructionYear':
      if (value && value !== 0 && (isNaN(value) || value <= 1900 || value > new Date().getFullYear() + 10)) {
        return `Construction year must be after 1900 and before ${new Date().getFullYear() + 10}`
      }
      return undefined
    
    case 'expectedLifeSpan':
      if (value && (isNaN(value) || value < 0 || value > 100)) {
        return 'Expected life span must be between 0 and 100 years'
      }
      return undefined
    
    case 'shelfLifeInMonth':
      if (value && (isNaN(value) || value < 0 || value > 1200)) {
        return 'Shelf life must be between 0 and 1200 months (100 years)'
      }
      return undefined
    
    case 'productionHoursDaily':
      if (value && (isNaN(value) || value < 0 || value > 24)) {
        return 'Production hours must be between 0 and 24 hours'
      }
      return undefined
    
    default:
      return undefined
  }
}

export const validateForm = (formData: AssetFormData): AssetFormErrors => {
  const newErrors: AssetFormErrors = {}
  
  // Validate required fields
  const assetNameError = validateField('assetName', formData.assetName)
  if (assetNameError) newErrors.assetName = assetNameError
  
  const categoryError = validateField('category', formData.category)
  if (categoryError) newErrors.category = categoryError
  
  const departmentError = validateField('department', formData.department)
  if (departmentError) newErrors.department = departmentError
  
  const statusError = validateField('statusText', formData.statusText)
  if (statusError) newErrors.statusText = statusError
  
  // Validate optional fields if they have meaningful values
  if (formData.serialNo && formData.serialNo.trim()) {
    const serialError = validateField('serialNo', formData.serialNo)
    if (serialError) newErrors.serialNo = serialError
  }
  
  if (formData.rfid && formData.rfid.trim()) {
    const rfidError = validateField('rfid', formData.rfid)
    if (rfidError) newErrors.rfid = rfidError
  }
  
  if (formData.costPrice && formData.costPrice > 0) {
    const costError = validateField('costPrice', formData.costPrice)
    if (costError) newErrors.costPrice = costError
  }
  
  if (formData.purchasePrice && formData.purchasePrice > 0) {
    const purchaseError = validateField('purchasePrice', formData.purchasePrice)
    if (purchaseError) newErrors.purchasePrice = purchaseError
  }
  
  if (formData.constructionYear && formData.constructionYear > 1900) {
    const yearError = validateField('constructionYear', formData.constructionYear)
    if (yearError) newErrors.constructionYear = yearError
  }
  
  if (formData.expectedLifeSpan && formData.expectedLifeSpan > 0) {
    const lifespanError = validateField('expectedLifeSpan', formData.expectedLifeSpan)
    if (lifespanError) newErrors.expectedLifeSpan = lifespanError
  }
  
  if (formData.shelfLifeInMonth && formData.shelfLifeInMonth > 0) {
    const shelfError = validateField('shelfLifeInMonth', formData.shelfLifeInMonth)
    if (shelfError) newErrors.shelfLifeInMonth = shelfError
  }
  
  if (formData.productionHoursDaily && formData.productionHoursDaily > 0) {
    const hoursError = validateField('productionHoursDaily', formData.productionHoursDaily)
    if (hoursError) newErrors.productionHoursDaily = hoursError
  }
  
  return newErrors
}

export const isFormValid = (errors: AssetFormErrors): boolean => {
  return Object.values(errors).every(error => !error)
}
