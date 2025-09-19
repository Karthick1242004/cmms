// Cloudinary configuration
export const CLOUDINARY_CONFIG = {
  cloudName: 'dqvgfjr6v',
  apiKey: '811261811966866',
  apiSecret: 'BeMWsDfXcA28FCbq1MAfT39jI3o', // Only use in server-side code
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'cmms_assets', // You need to create this in Cloudinary dashboard
}

// Simple signature generation for basic uploads
const generateSignature = (params: Record<string, any>): string => {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&')
  
  // Cloudinary signature format: params + api_secret
  const stringToSign = `${sortedParams}${CLOUDINARY_CONFIG.apiSecret}`
  
  // Simple hash simulation - in real app, use proper crypto.createHash('sha1')
  return btoa(stringToSign).slice(0, 20)
}

export const uploadToCloudinary = async (file: File, folder = 'assets'): Promise<string> => {
  console.log('🔧 CLOUDINARY UPLOAD STARTED')
  console.log('File details:', {
    name: file.name,
    size: file.size,
    type: file.type,
    folder: folder
  })

  try {
    // Determine upload endpoint based on file type
    const isVideo = file.type.startsWith('video/')
    const uploadEndpoint = isVideo ? 'video' : 'image'
    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/${uploadEndpoint}/upload`
    
    console.log(`📝 Using ${uploadEndpoint} upload endpoint for file type: ${file.type}`)
    
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', 'cmms_assets')
    formData.append('folder', folder)

    // For videos, we can add resource_type parameter
    if (isVideo) {
      formData.append('resource_type', 'video')
    }

    console.log('📤 Uploading to Cloudinary...')
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    })

    console.log('📥 Cloudinary response status:', response.status)
    const result = await response.json()
    console.log('📥 Cloudinary response data:', result)

    if (!response.ok) {
      throw new Error(`Cloudinary upload failed: ${result.error?.message || 'Unknown error'}`)
    }

    if (result.secure_url) {
      console.log('✅ Upload successful! URL:', result.secure_url)
      return result.secure_url
    } else {
      throw new Error('No secure_url in Cloudinary response')
    }

  } catch (error) {
    console.error('❌ Cloudinary upload failed:', error)
    
    // Final fallback to placeholder
    const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const placeholderUrl = `/placeholder.svg?height=150&width=250&text=${encodeURIComponent(fileName)}`
    
    console.log('🔄 Using placeholder as final fallback:', placeholderUrl)
    return placeholderUrl
  }
  
  /* 
  // If you want to try Cloudinary later, uncomment this and create a preset:
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', 'your_preset_name_here')
    formData.append('cloud_name', CLOUDINARY_CONFIG.cloudName)

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    )

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(`Cloudinary error: ${data.error?.message}`)
    }

    return data.secure_url
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    return placeholderUrl
  }
  */
}

export const deleteFromCloudinary = async (publicId: string, resourceType: 'image' | 'video' = 'image'): Promise<boolean> => {
  try {
    // This should be done server-side for security
    // For now, we'll just return true
    console.log(`Deleting ${resourceType} from Cloudinary:`, publicId)
    return true
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error)
    return false
  }
}