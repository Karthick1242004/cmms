"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Upload, ImageIcon, AlertCircle, CheckCircle, Package } from "lucide-react"
import { toast } from "sonner"
import type { Part } from '@/types/part'

interface PartImageUploadProps {
  formData: Partial<Part>
  onChange: (field: keyof Part, value: any) => void
  validationErrors?: Record<string, string>
}

export function PartImageUpload({ formData, onChange, validationErrors = {} }: PartImageUploadProps) {

  // Handle image file selection
  const handleImageUpload = (file: File) => {
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image file size must be less than 10MB')
        return
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        onChange('imageFile', file)
        onChange('imageSrc', result)
        toast.success('Image selected successfully!')
      }
      reader.readAsDataURL(file)
    }
  }

  // Remove image
  const removeImage = () => {
    onChange('imageFile', null)
    onChange('imageSrc', '')
    toast.info('Image removed')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Part Image Upload
        </CardTitle>
        <CardDescription>Upload an image for this part to help with identification</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Part Image Upload */}
        <div className="space-y-4">
          <Label>Part Image</Label>
          <div className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-muted-foreground/25 rounded-lg bg-muted/50">
            {formData.imageSrc ? (
              <div className="relative w-full h-full">
                <img
                  src={formData.imageSrc}
                  alt="Part preview"
                  className="w-full h-full object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                <div className="mt-4">
                  <label htmlFor="part-image">
                    <Button type="button" variant="outline" asChild>
                      <span>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Part Image
                      </span>
                    </Button>
                  </label>
                  <input
                    id="part-image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageUpload(file)
                    }}
                  />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  PNG, JPG, GIF up to 10MB
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Optional: Add a photo to help identify this part
                </p>
              </div>
            )}
          </div>
          
          {/* Image upload validation feedback */}
          {validationErrors.imageSrc && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {validationErrors.imageSrc}
            </p>
          )}
          
          {formData.imageSrc && !validationErrors.imageSrc && (
            <p className="text-sm text-green-600 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Image ready for upload
            </p>
          )}
        </div>

        {/* Image Guidelines */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Image Guidelines</h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Use clear, well-lit photos of the part</li>
            <li>• Include the part number if visible</li>
            <li>• Show distinguishing features or markings</li>
            <li>• Avoid blurry or dark images</li>
            <li>• Maximum file size: 10MB</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
