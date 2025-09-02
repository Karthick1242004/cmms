"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Upload, ImageIcon, AlertCircle, Plus, X } from "lucide-react"
import { toast } from "sonner"

interface DailyLogActivityImageUploadProps {
  images: string[] // Array of existing image URLs
  imageFiles: File[] // Array of new file uploads
  onImagesChange: (images: string[]) => void
  onImageFilesChange: (files: File[]) => void
  maxImages?: number
}

export function DailyLogActivityImageUpload({ 
  images, 
  imageFiles, 
  onImagesChange, 
  onImageFilesChange,
  maxImages = 5
}: DailyLogActivityImageUploadProps) {
  const [uploading, setUploading] = useState(false)

  // Handle new image file selection
  const handleImageUpload = (files: FileList | null) => {
    if (!files) return

    const newFiles = Array.from(files)
    const totalImages = images.length + imageFiles.length + newFiles.length

    if (totalImages > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`)
      return
    }

    // Validate file types and sizes
    const validFiles: File[] = []
    const maxSize = 10 * 1024 * 1024 // 10MB

    for (const file of newFiles) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not a valid image file`)
        continue
      }

      if (file.size > maxSize) {
        toast.error(`${file.name} is too large. Maximum size is 10MB`)
        continue
      }

      validFiles.push(file)
    }

    if (validFiles.length > 0) {
      onImageFilesChange([...imageFiles, ...validFiles])
      toast.success(`${validFiles.length} image(s) added`)
    }
  }

  // Remove an existing image (from server)
  const removeExistingImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
  }

  // Remove a new image file (before upload)
  const removeNewImageFile = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index)
    onImageFilesChange(newFiles)
  }

  // Get preview URL for file
  const getFilePreviewUrl = (file: File): string => {
    return URL.createObjectURL(file)
  }

  const canAddMore = images.length + imageFiles.length < maxImages

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Activity Images
        </CardTitle>
        <CardDescription>
          Upload images related to this daily log activity (max {maxImages} images, 10MB each)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Image Grid */}
        {(images.length > 0 || imageFiles.length > 0) && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            
            {/* Existing Images */}
            {images.map((imageUrl, index) => (
              <div key={`existing-${index}`} className="relative group">
                <div className="aspect-square border-2 border-dashed border-muted-foreground/25 rounded-lg overflow-hidden bg-muted/50">
                  <img
                    src={imageUrl}
                    alt={`Activity image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeExistingImage(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-center text-muted-foreground mt-1">
                  Saved Image {index + 1}
                </p>
              </div>
            ))}

            {/* New Image Files */}
            {imageFiles.map((file, index) => (
              <div key={`new-${index}`} className="relative group">
                <div className="aspect-square border-2 border-dashed border-blue-300 rounded-lg overflow-hidden bg-blue-50">
                  <img
                    src={getFilePreviewUrl(file)}
                    alt={`New image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeNewImageFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-center text-muted-foreground mt-1">
                  New: {file.name}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Upload Area */}
        {canAddMore && (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
              <div className="text-center">
                <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <div>
                  <label htmlFor="activity-images">
                    <Button type="button" variant="outline" asChild>
                      <span>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Images
                      </span>
                    </Button>
                  </label>
                  <input
                    id="activity-images"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleImageUpload(e.target.files)}
                  />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  PNG, JPG, GIF up to 10MB each
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Image Counter */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {images.length + imageFiles.length} of {maxImages} images
          </span>
          {!canAddMore && (
            <span className="text-amber-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              Maximum images reached
            </span>
          )}
        </div>

        {/* Instructions */}
        {(images.length === 0 && imageFiles.length === 0) && (
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <ImageIcon className="mx-auto h-12 w-12 text-blue-500 mb-2" />
            <h3 className="font-medium text-blue-900 mb-1">Add Activity Images</h3>
            <p className="text-sm text-blue-700">
              Upload images showing the problem, solution, or evidence of the daily log activity.
              This helps with documentation and verification.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
