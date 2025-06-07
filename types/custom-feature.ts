export type FieldType = "text" | "textarea" | "number" | "date" | "select" | "checkbox" | "file" | "relation"

export interface FeatureField {
  id: string
  name: string // User-friendly name
  label: string
  type: FieldType
  required?: boolean
  options?: string[] // For select type
  relatedEntity?: string // For relation type
  // Add other field-specific properties like validation rules, default values etc.
}

export type UIComponentType =
  | "TextField"
  | "TextArea"
  | "NumberInput"
  | "DatePicker"
  | "SelectDropdown"
  | "Checkbox"
  | "FileUpload"
  | "RelatedEntityPicker"
  | "ReadOnlyText"
  | "TableColumn"

export interface UIViewFieldConfig {
  fieldId: string // links to FeatureField.id
  componentType: UIComponentType
  order: number
  // Add other UI-specific properties like visibility conditions, custom props for the component
}

export interface FeatureUISchemaView {
  viewType: "listView" | "detailView" | "formView"
  fields: UIViewFieldConfig[]
  // Potentially add layout configurations, e.g., grid, sections
}

export interface FeatureAccessControl {
  role: string // e.g., "admin", "manager", "technician", or custom roles
  canCreate?: boolean
  canRead?: boolean
  canUpdate?: boolean
  canDelete?: boolean
  // Potentially field-level permissions
}

export interface CustomFeatureDefinition {
  id: string // Unique identifier for the feature
  name: string // e.g., "Safety Inspections", "Equipment Calibration"
  slug: string // URL-friendly slug, e.g., "safety-inspections"
  iconName?: string // Lucide icon name
  fields: FeatureField[]
  uiSchema: {
    listView: FeatureUISchemaView
    detailView: FeatureUISchemaView
    formView: FeatureUISchemaView
  }
  accessControls: FeatureAccessControl[]
  // Potentially add workflow definitions, API endpoints if auto-generated
}

// For the store or state management of features
export interface CustomFeatureState {
  features: CustomFeatureDefinition[]
  isLoading: boolean
  error: string | null
  editingFeature: CustomFeatureDefinition | null // For editing

  fetchFeatures: () => Promise<void>
  addFeature: (featureData: Omit<CustomFeatureDefinition, "id">) => Promise<CustomFeatureDefinition | null>
  updateFeature: (id: string, updates: Partial<CustomFeatureDefinition>) => Promise<CustomFeatureDefinition | null>
  deleteFeature: (id: string) => Promise<void>
  setEditingFeature: (feature: CustomFeatureDefinition | null) => void
  // Functions to get feature by slug/id
}

export const USER_ROLES = ["admin", "manager", "technician", "viewer"] as const
export type UserRole = (typeof USER_ROLES)[number]
