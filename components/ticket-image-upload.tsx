'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  X, 
  FileImage, 
  AlertCircle, 
  ImageIcon,
  ZoomIn
} from 'lucide-react';
import { toast } from 'sonner';
import { deleteFromCloudinary } from '@/lib/cloudinary-config';

interface TicketImageUploadProps {
  images: string[];
  imageFiles: File[];
  onImagesChange: (images: string[]) => void;
  onImageFilesChange: (files: File[]) => void;
  maxImages?: number;
  maxFileSize?: number; // in bytes
}

export function TicketImageUpload({
  images,
  imageFiles,
  onImagesChange,
  onImageFilesChange,
  maxImages = 5,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
}: TicketImageUploadProps) {
  const [previewImages, setPreviewImages] = useState<{ file: File; url: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  const generatePreview = (file: File): string => {
    return URL.createObjectURL(file);
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles: File[] = [];
    const newPreviews: { file: File; url: string }[] = [];

    Array.from(files).forEach((file) => {
      // Check if we've reached the maximum number of images
      if (images.length + imageFiles.length + newFiles.length >= maxImages) {
        toast.error(`Maximum ${maxImages} images allowed`);
        return;
      }

      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name}: Only JPEG, PNG, GIF, and WebP images are allowed`);
        return;
      }

      // Validate file size
      if (file.size > maxFileSize) {
        toast.error(`${file.name}: File size must be less than ${Math.round(maxFileSize / (1024 * 1024))}MB`);
        return;
      }

      newFiles.push(file);
      newPreviews.push({
        file,
        url: generatePreview(file)
      });
    });

    if (newFiles.length > 0) {
      onImageFilesChange([...imageFiles, ...newFiles]);
      setPreviewImages([...previewImages, ...newPreviews]);
      toast.success(`${newFiles.length} image(s) selected`);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveExistingImage = async (index: number) => {
    try {
      const imageToRemove = images[index];
      
      // Remove from Cloudinary
      console.log('🗑️ DELETING TICKET IMAGE FROM CLOUDINARY:', imageToRemove);
      await deleteFromCloudinary(imageToRemove);
      console.log('🗑️ Successfully deleted ticket image from Cloudinary');
      
      const newImages = images.filter((_, i) => i !== index);
      onImagesChange(newImages);
      toast.success('Image removed successfully');
    } catch (error) {
      console.error('🗑️ Failed to delete ticket image from Cloudinary:', error);
      toast.error('Failed to remove image. Please try again.');
    }
  };

  const handleRemoveNewImage = (index: number) => {
    const imageToRemove = previewImages[index];
    
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(imageToRemove.url);
    
    const newPreviews = previewImages.filter((_, i) => i !== index);
    const newFiles = imageFiles.filter((_, i) => i !== index);
    
    setPreviewImages(newPreviews);
    onImageFilesChange(newFiles);
    toast.success('Image removed');
  };

  const handleImageClick = (imageUrl: string) => {
    window.open(imageUrl, '_blank');
  };

  const totalImages = images.length + imageFiles.length;
  const canAddMore = totalImages < maxImages;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          Ticket Images
          <Badge variant="secondary" className="ml-2">
            {totalImages}/{maxImages}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        {canAddMore && (
          <div className="space-y-2">
            <Label>Upload Images</Label>
            <div 
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">
                JPEG, PNG, GIF, WebP up to {Math.round(maxFileSize / (1024 * 1024))}MB each
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={allowedTypes.join(',')}
              multiple
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
          </div>
        )}

        {!canAddMore && (
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Maximum number of images reached ({maxImages})</span>
          </div>
        )}

        {/* Existing Images */}
        {images.length > 0 && (
          <div className="space-y-2">
            <Label>Uploaded Images</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((imageUrl, index) => (
                <div key={`existing-${index}`} className="relative group">
                  <div className="aspect-square border-2 border-dashed border-muted-foreground/25 rounded-lg overflow-hidden bg-muted/50">
                    <img
                      src={imageUrl}
                      alt={`Ticket image ${index + 1}`}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => handleImageClick(imageUrl)}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                    onClick={() => handleRemoveExistingImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <p className="text-xs text-center text-muted-foreground mt-1">
                    Image {index + 1}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Image Previews */}
        {previewImages.length > 0 && (
          <div className="space-y-2">
            <Label>Selected Images (not uploaded yet)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {previewImages.map((preview, index) => (
                <div key={`preview-${index}`} className="relative group">
                  <div className="aspect-square border-2 border-dashed border-blue-300 rounded-lg overflow-hidden bg-blue-50">
                    <img
                      src={preview.url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                    onClick={() => handleRemoveNewImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <div className="flex items-center gap-1 mt-1">
                    <FileImage className="h-3 w-3 text-blue-600" />
                    <p className="text-xs text-blue-600 font-medium">
                      {preview.file.name.length > 15 
                        ? `${preview.file.name.substring(0, 15)}...` 
                        : preview.file.name}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {(preview.file.size / (1024 * 1024)).toFixed(1)}MB
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        {totalImages === 0 && (
          <div className="text-center text-muted-foreground">
            <FileImage className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No images selected</p>
            <p className="text-xs">Add images to provide visual context for your ticket</p>
          </div>
        )}

        {totalImages > 0 && (
          <div className="text-xs text-muted-foreground">
            💡 Click on any uploaded image to view it in full size
          </div>
        )}
      </CardContent>
    </Card>
  );
}
