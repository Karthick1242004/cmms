"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Upload, QrCode, ImageIcon, AlertCircle, CheckCircle } from "lucide-react"
import { Html5QrcodeScanner } from "html5-qrcode"
import { toast } from "sonner"
import type { AssetFormData, AssetFormErrors } from './types'

interface AssetImageUploadProps {
  formData: AssetFormData
  errors: AssetFormErrors
  touched: Record<string, boolean>
  onChange: (field: keyof AssetFormData, value: any) => void
  onBlur: (field: string) => void
}

export function AssetImageUpload({ formData, errors, touched, onChange, onBlur }: AssetImageUploadProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null)

  // Handle image file selection
  const handleImageUpload = (file: File, type: 'image' | 'qrCode') => {
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        if (type === 'image') {
          onChange('imageFile', file)
          onChange('imageSrc', result)
        } else {
          onChange('qrCodeFile', file)
          onChange('qrCodeSrc', result)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Remove image
  const removeImage = (type: 'image' | 'qrCode') => {
    if (type === 'image') {
      onChange('imageFile', null)
      onChange('imageSrc', '')
    } else {
      onChange('qrCodeFile', null)
      onChange('qrCodeSrc', '')
    }
  }

  // Start QR/Barcode scanner
  const startScanner = (type: 'qr' | 'barcode') => {
    setIsScanning(true)
    
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
    }

    const qrCodeScanner = new Html5QrcodeScanner("qr-reader", config, false)
    
    qrCodeScanner.render(
      (decodedText) => {
        // Handle successful scan
        if (type === 'qr') {
          onChange('rfid', decodedText)
          toast.success('QR Code scanned successfully!')
        } else {
          onChange('serialNo', decodedText)
          toast.success('Barcode scanned successfully!')
        }
        qrCodeScanner.clear()
        setIsScanning(false)
        setScanner(null)
      },
      (error) => {
        // Handle scan error
        console.warn(`Code scan error = ${error}`)
      }
    )
    
    setScanner(qrCodeScanner)
  }

  // Stop scanner
  const stopScanner = () => {
    if (scanner) {
      scanner.clear()
      setScanner(null)
    }
    setIsScanning(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Image Upload</CardTitle>
        <CardDescription>Upload asset image and QR code</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Asset Image Upload */}
          <div className="space-y-4">
            <Label>Asset Image</Label>
            <div className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-muted-foreground/25 rounded-lg bg-muted/50">
              {formData.imageSrc ? (
                <div className="relative w-full h-full">
                  <img
                    src={formData.imageSrc}
                    alt="Asset preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => removeImage('image')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                  <div className="mt-4">
                    <label htmlFor="asset-image">
                      <Button type="button" variant="outline" asChild>
                        <span>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Image
                        </span>
                      </Button>
                    </label>
                    <input
                      id="asset-image"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload(file, 'image')
                      }}
                    />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* QR Code Image Upload */}
          <div className="space-y-4">
            <Label>QR Code Image</Label>
            <div className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-muted-foreground/25 rounded-lg bg-muted/50">
              {formData.qrCodeSrc ? (
                <div className="relative w-full h-full">
                  <img
                    src={formData.qrCodeSrc}
                    alt="QR Code preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => removeImage('qrCode')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <QrCode className="mx-auto h-12 w-12 text-muted-foreground" />
                  <div className="mt-4">
                    <label htmlFor="qr-code-image">
                      <Button type="button" variant="outline" asChild>
                        <span>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload QR Code
                        </span>
                      </Button>
                    </label>
                    <input
                      id="qr-code-image"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload(file, 'qrCode')
                      }}
                    />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scanner controls for serial number and RFID */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="serialNo">Serial Number</Label>
            <div className="flex gap-2">
              <Input 
                id="serialNo"
                value={formData.serialNo}
                onChange={(e) => onChange('serialNo', e.target.value)}
                onBlur={() => onBlur('serialNo')}
                placeholder="e.g., HDWS-M-001"
                className={`${errors.serialNo && touched.serialNo ? 'border-red-500 focus:border-red-500' : ''} ${touched.serialNo && !errors.serialNo && formData.serialNo ? 'border-green-500 focus:border-green-500' : ''}`}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => startScanner('barcode')}
                disabled={isScanning}
              >
                <QrCode className="h-4 w-4" />
              </Button>
            </div>
            {errors.serialNo && touched.serialNo && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.serialNo}
              </p>
            )}
            {touched.serialNo && !errors.serialNo && formData.serialNo && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Valid
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="rfid">RFID</Label>
            <div className="flex gap-2">
              <Input 
                id="rfid"
                value={formData.rfid}
                onChange={(e) => onChange('rfid', e.target.value)}
                onBlur={() => onBlur('rfid')}
                placeholder="e.g., RF123456789"
                className={`${errors.rfid && touched.rfid ? 'border-red-500 focus:border-red-500' : ''} ${touched.rfid && !errors.rfid && formData.rfid ? 'border-green-500 focus:border-green-500' : ''}`}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => startScanner('qr')}
                disabled={isScanning}
              >
                <QrCode className="h-4 w-4" />
              </Button>
            </div>
            {errors.rfid && touched.rfid && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.rfid}
              </p>
            )}
            {touched.rfid && !errors.rfid && formData.rfid && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Valid
              </p>
            )}
          </div>
        </div>

        {/* QR Scanner Section */}
        {isScanning && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Scanner</Label>
              <Button type="button" variant="outline" onClick={stopScanner}>
                Stop Scanner
              </Button>
            </div>
            <div id="qr-reader" className="w-full max-w-sm mx-auto"></div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
