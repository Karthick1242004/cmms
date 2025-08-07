"use client"

import { CardFooter } from "@/components/ui/card"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Plus,
  Trash2,
  Edit,
  Eye,
  Package,
  Shield,
  Calendar,
  AlertTriangle,
  Users,
  Thermometer,
  GripVertical,
  Info,
  FileText,
  Settings,
  Copy,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useNavigationStore } from "@/stores/navigation-store"
import { useRouter } from "next/navigation"
import type {
  CustomFeatureDefinition,
  FeatureField,
  FeatureUISchemaView,
  FeatureAccessControls,
  UserRole,
  UIViewFieldConfig,
} from "@/types/custom-feature"
import { featureExamples as EXAMPLE_FEATURES } from "./feature-examples"

// Available field types
const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "email", label: "Email" },
  { value: "date", label: "Date" },
  { value: "datetime", label: "Date & Time" },
  { value: "boolean", label: "Yes/No" },
  { value: "select", label: "Dropdown" },
  { value: "textarea", label: "Long Text" },
  { value: "file", label: "File Upload" },
]

// User roles
const USER_ROLES_ARRAY: UserRole[] = ["admin", "manager", "technician", "viewer"]

export default function FeatureBuilderPage() {
  const router = useRouter()
  const { addCustomFeature } = useNavigationStore()

  // Tab state
  const [activeTab, setActiveTab] = useState("examples")

  // Form state
  const [featureName, setFeatureName] = useState("")
  const [featureSlug, setFeatureSlug] = useState("")
  const [featureIcon, setFeatureIcon] = useState<string>("Package")
  const [featureDescription, setFeatureDescription] = useState("")

  // Fields state
  const [fields, setFields] = useState<FeatureField[]>([])
  const [newFieldName, setNewFieldName] = useState("")
  const [newFieldLabel, setNewFieldLabel] = useState("")
  const [newFieldType, setNewFieldType] = useState<FeatureField["type"]>("text")

  // UI Schema state
  const [currentUISchema, setCurrentUISchema] = useState<FeatureUISchemaView>({
    listView: [],
    detailView: [],
    formView: [],
  })

  // Access Controls state
  const [currentAccessControls, setCurrentAccessControls] = useState<FeatureAccessControls>({
    admin: { create: true, read: true, update: true, delete: true },
    manager: { create: false, read: true, update: false, delete: false },
    technician: { create: false, read: true, update: false, delete: false },
    viewer: { create: false, read: true, update: false, delete: false },
  })

  // Custom features state
  const [customFeatures, setCustomFeatures] = useState<CustomFeatureDefinition[]>([])
  const [editingFeature, setEditingFeature] = useState<CustomFeatureDefinition | null>(null)

  // Auto-generate slug from feature name
  useEffect(() => {
    if (featureName && !editingFeature) {
      const slug = featureName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
      setFeatureSlug(slug)
    }
  }, [featureName, editingFeature])

  // Load editing feature data
  useEffect(() => {
    if (editingFeature) {
      setFeatureName(editingFeature.name)
      setFeatureSlug(editingFeature.slug)
      setFeatureIcon(editingFeature.icon)
      setFeatureDescription(editingFeature.description || "")
      setFields(editingFeature.fields || []) // Ensure fields is an array
      setCurrentUISchema(editingFeature.uiSchema || { listView: [], detailView: [], formView: [] })
      setCurrentAccessControls(
        editingFeature.accessControls || {
          admin: { create: true, read: true, update: true, delete: true },
          manager: { create: false, read: true, update: false, delete: false },
          technician: { create: false, read: true, update: false, delete: false },
          viewer: { create: false, read: true, update: false, delete: false },
        },
      )
      setActiveTab("custom") // Switch to custom tab when editing
    }
  }, [editingFeature])

  const handleAddField = () => {
    if (!newFieldName || !newFieldLabel) {
      toast({
        title: "Error",
        description: "Please fill in both field name and label.",
        variant: "destructive",
      })
      return
    }

    const newField: FeatureField = {
      name: newFieldName,
      label: newFieldLabel,
      type: newFieldType,
      required: false,
    }

    setFields([...fields, newField])
    setNewFieldName("")
    setNewFieldLabel("")
    setNewFieldType("text")
  }

  const handleRemoveField = (index: number) => {
    const fieldNameToRemove = (fields[index] || {}).name
    const updatedFields = fields.filter((_, i) => i !== index)
    setFields(updatedFields)

    if (fieldNameToRemove) {
      setCurrentUISchema((prev) => ({
        listView: prev.listView.filter((f) => f.fieldName !== fieldNameToRemove),
        detailView: prev.detailView.filter((f) => f.fieldName !== fieldNameToRemove),
        formView: prev.formView.filter((f) => f.fieldName !== fieldNameToRemove),
      }))
    }
  }

  const handleAddFieldToView = (viewType: keyof FeatureUISchemaView, fieldName: string) => {
    const field = fields.find((f) => f.name === fieldName)
    if (!field) return

    const newFieldConfig: UIViewFieldConfig = {
      fieldName,
      componentType: viewType === "listView" ? "TableColumn" : viewType === "detailView" ? "DetailField" : "FormInput",
      order: (currentUISchema[viewType] || []).length,
    }

    setCurrentUISchema((prev) => ({
      ...prev,
      [viewType]: [...(prev[viewType] || []), newFieldConfig],
    }))
  }

  const handleRemoveFieldFromView = (viewType: keyof FeatureUISchemaView, fieldName: string) => {
    setCurrentUISchema((prev) => ({
      ...prev,
      [viewType]: (prev[viewType] || []).filter((f) => f.fieldName !== fieldName),
    }))
  }

  const handleAccessControlChange = (
    role: UserRole,
    permission: keyof FeatureAccessControls[UserRole],
    checked: boolean,
  ) => {
    setCurrentAccessControls((prev) => ({
      ...prev,
      [role]: {
        ...(prev[role] || { create: false, read: false, update: false, delete: false }),
        [permission]: checked,
      },
    }))
  }

  const handleSaveFeature = () => {
    if (!featureName || !featureSlug) {
      toast({
        title: "Error",
        description: "Please fill in feature name and slug.",
        variant: "destructive",
      })
      return
    }

    const newFeature: CustomFeatureDefinition = {
      id: editingFeature?.id || Date.now().toString(),
      name: featureName,
      slug: featureSlug,
      icon: featureIcon,
      description: featureDescription,
      fields: fields,
      uiSchema: currentUISchema,
      accessControls: currentAccessControls,
      createdAt: editingFeature?.createdAt || new Date(),
      updatedAt: new Date(),
    }

    if (editingFeature) {
      setCustomFeatures((prev) => prev.map((f) => (f.id === editingFeature.id ? newFeature : f)))
      toast({ title: "Success", description: "Feature updated successfully!" })
    } else {
      setCustomFeatures((prev) => [...prev, newFeature])
      addCustomFeature({ name: featureName, href: `/custom/${featureSlug}`, iconName: featureIcon })
      toast({ title: "Success", description: "Feature created successfully! It will appear in the navigation." })
    }
    handleResetForm()
  }

  const handleResetForm = () => {
    setFeatureName("")
    setFeatureSlug("")
    setFeatureIcon("Package")
    setFeatureDescription("")
    setFields([])
    setCurrentUISchema({ listView: [], detailView: [], formView: [] })
    setCurrentAccessControls({
      admin: { create: true, read: true, update: true, delete: true },
      manager: { create: false, read: true, update: false, delete: false },
      technician: { create: false, read: true, update: false, delete: false },
      viewer: { create: false, read: true, update: false, delete: false },
    })
    setEditingFeature(null)
    // Optionally, switch back to examples tab or stay on custom tab
    // setActiveTab("examples");
  }

  const handleEditFeature = (feature: CustomFeatureDefinition) => {
    setEditingFeature(feature) // This will trigger the useEffect to populate the form and switch tab
  }

  const handleDeleteFeature = (featureId: string) => {
    setCustomFeatures((prev) => prev.filter((f) => f.id !== featureId))
    toast({ title: "Success", description: "Feature deleted successfully!" })
  }

  const handleUseExample = (example: CustomFeatureDefinition) => {
    setEditingFeature(null) // Ensure we are in "create" mode

    setFeatureName(example.name + " (Copy)") // Suggest a new name
    setFeatureSlug(example.slug + "-copy") // Suggest a new slug
    setFeatureIcon(example.icon)
    setFeatureDescription(example.description || "")
    setFields(JSON.parse(JSON.stringify(example.fields || []))) // Deep copy fields
    setCurrentUISchema(JSON.parse(JSON.stringify(example.uiSchema || { listView: [], detailView: [], formView: [] }))) // Deep copy UI schema
    setCurrentAccessControls(
      JSON.parse(
        JSON.stringify(
          example.accessControls ||
            {
              /* default access */
            },
        ),
      ),
    ) // Deep copy access controls

    setActiveTab("custom") // Switch to the custom tab to show the populated form
    toast({
      title: "Template Loaded",
      description: `"${example.name}" template loaded. You can now customize and save it as a new feature.`,
    })
  }

  const LucideIcons: { [key: string]: React.ElementType } = {
    Package,
    Shield,
    Calendar,
    AlertTriangle,
    Users,
    Thermometer,
    FileText,
    Settings,
    Eye,
    GripVertical,
    Info,
    Plus,
    Trash2,
    Edit,
    Copy,
  }

  const getIconComponent = (iconName: string | undefined) => {
    if (!iconName || !LucideIcons[iconName]) {
      return LucideIcons["Package"] // Default icon
    }
    return LucideIcons[iconName]
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Feature Builder</h1>
        <p className="text-muted-foreground mt-2">
          Create custom features to extend your FMMS 360 functionality without code modifications.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="examples">Example Features</TabsTrigger>
          <TabsTrigger value="custom">Custom Features ({(customFeatures || []).length})</TabsTrigger>
        </TabsList>

        <TabsContent value="examples" className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              These are pre-built feature examples to help you understand what custom features can do. You can use them
              as-is or customize them to fit your needs.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(EXAMPLE_FEATURES || []).map((example) => {
              const IconComponent = getIconComponent(example.icon)
              const exampleFields = example.fields || []

              return (
                <Card key={example.id} className="hover:shadow-md transition-shadow flex flex-col">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{example.name}</CardTitle>
                        <Badge variant="outline" className="mt-1">
                          {exampleFields.length} fields
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <CardDescription className="mb-4 text-sm">{example.description}</CardDescription>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">KEY FIELDS:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {exampleFields.slice(0, 3).map((field) => (
                          <li key={field.name} className="flex items-center space-x-2">
                            <div className="w-1 h-1 bg-primary rounded-full shrink-0" />
                            <span className="truncate" title={field.label}>
                              {field.label}
                            </span>
                          </li>
                        ))}
                        {exampleFields.length > 3 && (
                          <li className="text-xs text-muted-foreground">+{exampleFields.length - 3} more fields</li>
                        )}
                      </ul>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={() => handleUseExample(example)} className="w-full" variant="outline">
                      <Copy className="mr-2 h-4 w-4" /> Use This Template
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Feature Creation Form */}
            <Card>
              <CardHeader>
                <CardTitle>{editingFeature ? "Edit Custom Feature" : "Create New Custom Feature"}</CardTitle>
                <CardDescription>
                  {editingFeature
                    ? "Modify the details of your existing feature."
                    : "Define a new feature by filling out the form below. Start from scratch or use a template."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="feature-name">Feature Name</Label>
                    <Input
                      id="feature-name"
                      value={featureName}
                      onChange={(e) => setFeatureName(e.target.value)}
                      placeholder="e.g., Safety Inspections"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="feature-slug">Slug</Label>
                    <Input
                      id="feature-slug"
                      value={featureSlug}
                      onChange={(e) => setFeatureSlug(e.target.value)}
                      placeholder="safety-inspections"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="feature-icon">Icon (Lucide)</Label>
                    <Select value={featureIcon} onValueChange={(value) => setFeatureIcon(value as string)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(LucideIcons).map((iconKey) => (
                          <SelectItem key={iconKey} value={iconKey}>
                            {iconKey}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feature-description">Description (Optional)</Label>
                  <Textarea
                    id="feature-description"
                    value={featureDescription}
                    onChange={(e) => setFeatureDescription(e.target.value)}
                    placeholder="Describe what this feature does..."
                    rows={3}
                  />
                </div>

                <Accordion type="single" collapsible className="w-full" defaultValue="fields">
                  {/* Fields Definition */}
                  <AccordionItem value="fields">
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4" />
                        <span>Fields Definition</span>
                        <Badge variant="secondary">{fields.length}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      {/* Add Field Form */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                        <Input
                          placeholder="Field name (e.g., inspector_name)"
                          value={newFieldName}
                          onChange={(e) => setNewFieldName(e.target.value)}
                        />
                        <Input
                          placeholder="Field label (e.g., Inspector Name)"
                          value={newFieldLabel}
                          onChange={(e) => setNewFieldLabel(e.target.value)}
                        />
                        <Select
                          value={newFieldType}
                          onValueChange={(value: FeatureField["type"]) => setNewFieldType(value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELD_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button onClick={handleAddField} size="sm">
                          <Plus className="h-4 w-4 mr-1" />
                          Add Field
                        </Button>
                      </div>

                      {/* Fields List */}
                      {fields.length > 0 && (
                        <div className="space-y-2 pt-2">
                          {fields.map((field, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                            >
                              <div className="flex items-center space-x-3">
                                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                <div>
                                  <p className="font-medium">{field.label}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {field.name} • {FIELD_TYPES.find((t) => t.value === field.type)?.label}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveField(index)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  {/* UI Schema */}
                  <AccordionItem value="ui-schema">
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center space-x-2">
                        <Eye className="h-4 w-4" />
                        <span>UI Schema</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-6 pt-4">
                      <p className="text-sm text-muted-foreground">
                        Define how this feature appears in lists, details, and forms. Select fields you've defined
                        above.
                      </p>

                      {["listView", "detailView", "formView"].map((viewTypeKey) => {
                        const viewType = viewTypeKey as keyof FeatureUISchemaView
                        const viewTitle = viewType.charAt(0).toUpperCase() + viewType.slice(1).replace("View", " View")
                        const currentViewFields = currentUISchema[viewType] || []
                        return (
                          <div key={viewType} className="space-y-3 p-3 border rounded-lg bg-muted/30">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{viewTitle}</h4>
                              <Select onValueChange={(fieldName) => handleAddFieldToView(viewType, fieldName)}>
                                <SelectTrigger className="w-auto min-w-[200px]">
                                  <SelectValue placeholder={`Add Field to ${viewTitle}`} />
                                </SelectTrigger>
                                <SelectContent>
                                  {fields
                                    .filter((f) => !currentViewFields.some((vf) => vf.fieldName === f.name))
                                    .map((field) => (
                                      <SelectItem key={field.name} value={field.name}>
                                        {field.label} ({field.name})
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                            {currentViewFields.length === 0 && (
                              <p className="text-xs text-muted-foreground text-center py-2">
                                No fields added to this view yet.
                              </p>
                            )}
                            {currentViewFields.map((fieldConfig) => (
                              <div
                                key={fieldConfig.fieldName}
                                className="flex items-center justify-between p-2 border rounded bg-background"
                              >
                                <span className="text-sm">
                                  {
                                    (
                                      fields.find((f) => f.name === fieldConfig.fieldName) || {
                                        label: fieldConfig.fieldName,
                                      }
                                    ).label
                                  }
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleRemoveFieldFromView(viewType, fieldConfig.fieldName)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )
                      })}
                    </AccordionContent>
                  </AccordionItem>

                  {/* Access Controls */}
                  <AccordionItem value="access-controls">
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4" />
                        <span>Access Controls</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4">
                      <p className="text-sm text-muted-foreground mb-4">
                        Define roles and permissions for this feature.
                      </p>

                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="text-left p-3 font-medium">Role</th>
                              <th className="text-center p-3 font-medium">Read</th>
                              <th className="text-center p-3 font-medium">Create</th>
                              <th className="text-center p-3 font-medium">Update</th>
                              <th className="text-center p-3 font-medium">Delete</th>
                            </tr>
                          </thead>
                          <tbody>
                            {USER_ROLES_ARRAY.map((role) => (
                              <tr key={role} className="border-t">
                                <td className="p-3 font-medium capitalize">{role}</td>
                                {["read", "create", "update", "delete"].map((permission) => (
                                  <td key={permission} className="p-3 text-center">
                                    <Checkbox
                                      checked={
                                        currentAccessControls[role]?.[
                                          permission as keyof FeatureAccessControls[UserRole]
                                        ] || false
                                      }
                                      onCheckedChange={(checked) =>
                                        handleAccessControlChange(
                                          role,
                                          permission as keyof FeatureAccessControls[UserRole],
                                          checked as boolean,
                                        )
                                      }
                                    />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-6">
                  <Button variant="outline" onClick={handleResetForm}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveFeature}>{editingFeature ? "Update Feature" : "Save Feature"}</Button>
                </div>
              </CardContent>
            </Card>

            {/* Custom Features List */}
            <Card>
              <CardHeader>
                <CardTitle>Your Custom Features</CardTitle>
                <CardDescription>Manage your created custom features.</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-280px)] pr-3">
                  {(customFeatures || []).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No custom features created yet.</p>
                      <p className="text-sm">Create your first feature to get started!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(customFeatures || []).map((feature) => {
                        const Icon = getIconComponent(feature.icon)
                        const featureFields = feature.fields || []
                        return (
                          <Card
                            key={feature.id}
                            className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow"
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="p-2 bg-primary/10 rounded-lg">
                                    <Icon className="h-4 w-4 text-primary" />
                                  </div>
                                  <div>
                                    <CardTitle className="text-base">{feature.name}</CardTitle>
                                    <p className="text-sm text-muted-foreground">/{feature.slug}</p>
                                  </div>
                                </div>
                                <div className="flex space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => handleEditFeature(feature)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                    onClick={() => handleDeleteFeature(feature.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="space-y-2">
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                  <span>{featureFields.length} fields</span>
                                  <span>•</span>
                                  <span>Created {new Date(feature.createdAt).toLocaleDateString()}</span>
                                </div>
                                {feature.description && (
                                  <p className="text-sm text-muted-foreground italic">{feature.description}</p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
