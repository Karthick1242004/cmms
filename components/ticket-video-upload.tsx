"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Upload, X, Video, Play, Download, Eye } from "lucide-react"
import { toast } from "sonner"
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary-config"

interface TicketVideoUploadProps {
  videos: string[]
  videoFiles: File[]
  onVideosChange: (videos: string[]) => void
  onVideoFilesChange: (videoFiles: File[]) => void
  maxVideos?: number
  maxFileSize?: number // in bytes
}

export function TicketVideoUpload({
  videos,
  videoFiles,
  onVideosChange,
  onVideoFilesChange,
  maxVideos = 3,
  maxFileSize = 4 * 1024 * 1024, // 4MB default
}: TicketVideoUploadProps) {
  const [previewVideos, setPreviewVideos] = useState<{ file: File; url: string }[]>([])
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/quicktime']

  const generatePreview = (file: File): string => {
    return URL.createObjectURL(file)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    const newFiles: File[] = []
    const newPreviews: { file: File; url: string }[] = []

    Array.from(files).forEach((file) => {
      // Check if we've reached the maximum number of videos
      if (videos.length + videoFiles.length + newFiles.length >= maxVideos) {
        toast.error(`Maximum ${maxVideos} videos allowed`)
        return
      }

      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name}: Only MP4, WebM, OGG, AVI, MOV, and QuickTime videos are allowed`)
        return
      }

      // Validate file size
      if (file.size > maxFileSize) {
        toast.error(`${file.name}: File size must be less than ${Math.round(maxFileSize / (1024 * 1024))}MB`)
        return
      }

      newFiles.push(file)
      newPreviews.push({
        file,
        url: generatePreview(file)
      })
    })

    if (newFiles.length > 0) {
      onVideoFilesChange([...videoFiles, ...newFiles])
      setPreviewVideos([...previewVideos, ...newPreviews])
      toast.success(`${newFiles.length} video(s) selected`)
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveExistingVideo = async (index: number) => {
    const videoUrl = videos[index]
    
    try {
      // Extract public_id from Cloudinary URL for deletion
      const publicIdMatch = videoUrl.match(/\/v\d+\/(.+)\.[^.]+$/)
      if (publicIdMatch) {
        const publicId = publicIdMatch[1]
        await deleteFromCloudinary(publicId, 'video')
        toast.success('Video deleted successfully')
      }
    } catch (error) {
      console.error('Failed to delete video from Cloudinary:', error)
      toast.error('Failed to delete video from cloud storage')
    }

    const updatedVideos = videos.filter((_, i) => i !== index)
    onVideosChange(updatedVideos)
  }

  const handleRemoveNewVideo = (index: number) => {
    const updatedFiles = videoFiles.filter((_, i) => i !== index)
    const updatedPreviews = previewVideos.filter((_, i) => i !== index)
    
    // Revoke the object URL to free memory
    const removedPreview = previewVideos[index]
    if (removedPreview) {
      URL.revokeObjectURL(removedPreview.url)
    }
    
    onVideoFilesChange(updatedFiles)
    setPreviewVideos(updatedPreviews)
    toast.success('Video removed')
  }

  const handleVideoClick = (videoUrl: string) => {
    window.open(videoUrl, '_blank')
  }

  const totalVideos = videos.length + videoFiles.length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Videos ({totalVideos}/{maxVideos})</Label>
        <Badge variant="outline" className="text-xs">
          Max {Math.round(maxFileSize / (1024 * 1024))}MB per video
        </Badge>
      </div>

      {/* Upload Area */}
      {totalVideos < maxVideos && (
        <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
          <CardContent className="flex flex-col items-center justify-center space-y-2 p-6">
            <Video className="h-8 w-8 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium">Add Videos</p>
              <p className="text-xs text-muted-foreground">
                MP4, WebM, OGG, AVI, MOV up to {Math.round(maxFileSize / (1024 * 1024))}MB each
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2"
            >
              <Upload className="mr-2 h-4 w-4" />
              Choose Videos
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept={allowedTypes.join(',')}
              multiple
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
          </CardContent>
        </Card>
      )}

      {/* Existing Videos */}
      {videos.length > 0 && (
        <div className="space-y-2">
          <Label>Uploaded Videos</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((videoUrl, index) => (
              <div key={`existing-${index}`} className="relative group">
                <Card className="p-3">
                  <div className="aspect-video bg-muted rounded-md overflow-hidden relative cursor-pointer group">
                    <video
                      src={videoUrl}
                      className="w-full h-full object-cover"
                      preload="metadata"
                      onClick={() => handleVideoClick(videoUrl)}
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <Play className="h-8 w-8 text-white opacity-80 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 z-10"
                    onClick={() => handleRemoveExistingVideo(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <div className="mt-2 text-center">
                    <p className="text-xs font-medium">Video {index + 1}</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => handleVideoClick(videoUrl)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Video Previews */}
      {previewVideos.length > 0 && (
        <div className="space-y-2">
          <Label>New Videos (Ready to Upload)</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {previewVideos.map((preview, index) => (
              <div key={`preview-${index}`} className="relative group">
                <Card className="p-3">
                  <div className="aspect-video bg-muted rounded-md overflow-hidden relative">
                    <video
                      src={preview.url}
                      className="w-full h-full object-cover"
                      preload="metadata"
                      controls
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 z-10"
                    onClick={() => handleRemoveNewVideo(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <div className="mt-2 text-center">
                    <p className="text-xs font-medium truncate" title={preview.file.name}>
                      {preview.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(preview.file.size)}
                    </p>
                    {uploadProgress[preview.file.name] !== undefined && (
                      <div className="mt-2">
                        <Progress value={uploadProgress[preview.file.name]} className="h-1" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Uploading... {uploadProgress[preview.file.name]}%
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Summary */}
      {totalVideos > 0 && (
        <div className="text-center text-xs text-muted-foreground">
          {totalVideos} of {maxVideos} videos • Total size: {formatFileSize(
            videoFiles.reduce((total, file) => total + file.size, 0)
          )}
        </div>
      )}
    </div>
  )
}
