# Cloudinary Setup Guide

## Prerequisites
You need to create an unsigned upload preset in your Cloudinary dashboard for the asset image uploads to work.

## Steps to Setup Cloudinary

### 🚨 **IMPORTANT: Upload Preset Required**
The asset image upload feature requires an unsigned upload preset to be created in your Cloudinary dashboard.

### 1. Login to Cloudinary Console
- Go to [Cloudinary Console](https://console.cloudinary.com/)
- Login with your account (using dqvgfjr6v cloud)

### 2. Create Upload Preset ⚡ **REQUIRED**
1. Navigate to **Settings** → **Upload** → **Upload presets**
2. Click **Add upload preset**
3. Set the following configuration:
   - **Preset name**: `cmms_assets` (EXACT name required)
   - **Signing Mode**: `Unsigned` (CRITICAL - must be unsigned)
   - **Folder**: `cmms` (optional, for organization)
   - **Format**: Auto
   - **Quality**: Auto
   - **Max file size**: 10MB
   - **Allowed formats**: jpg, png, gif, webp

### 3. **Verify Upload Preset**
- Make sure the preset name is exactly `cmms_assets`
- Confirm it shows "Unsigned" in the signing mode column
- Click on the preset to verify settings

### 3. Security Settings (Optional but Recommended)
- Set **Max files**: 1
- Set **Max image width**: 2000px
- Set **Max image height**: 2000px
- Enable **Unique filename**: Yes

### 4. Update Environment Variables
Create or update your `.env.local` file:

```bash
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dqvgfjr6v
NEXT_PUBLIC_CLOUDINARY_API_KEY=811261811966866
CLOUDINARY_API_SECRET=BeMWsDfXcA28FCbq1MAfT39jI3o
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=cmms_assets
```

### 5. Test Upload Functionality
1. Navigate to the asset creation/edit form
2. Try uploading an image
3. Check if the image appears in your Cloudinary Media Library

## Current Implementation
The asset management system uses Cloudinary for:
- Asset images (stored in `assets/images` folder)
- QR code images (stored in `assets/qrcodes` folder)
- Automatic fallback to placeholder images if upload fails

## Troubleshooting
If uploads fail:
1. Check if the upload preset `cmms_assets` exists and is unsigned
2. Verify CORS settings in Cloudinary allow your domain
3. Check browser console for detailed error messages
4. Ensure the upload preset allows the file types you're uploading

## Security Notes
- The API secret should only be used in server-side code
- Upload presets should be unsigned for client-side uploads
- Consider implementing server-side upload signatures for production use