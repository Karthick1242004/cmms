# Asset Creation Troubleshooting Guide

## ✅ **Issues Fixed**

### 1. **Cloudinary Upload Preset Error**
**Error**: `Upload preset not found`
**Fix**: 
- Temporarily disabled Cloudinary upload to prevent blocking asset creation
- Added clear instructions in console for setting up the upload preset
- Falls back to placeholder images until properly configured

### 2. **Backend Validation Errors**
**Errors**: 
- `warrantyDetails: Cast to string failed for value "{...}" (type Object)`
- `files.0: Cast to [string] failed for value`
- `associatedCustomer: Cast to string failed for value`

**Fix**: 
- Completely rewrote the data transformation logic
- Only sends meaningful data (no empty objects)
- Properly filters out undefined values
- Direct field mapping instead of complex transformations

### 3. **Data Structure Mismatch**
**Issue**: Frontend sending objects but backend expecting different formats
**Fix**: 
- Removed complex data cleaning functions that were causing issues
- Direct field-by-field mapping to ensure proper types
- Only include arrays and objects when they contain actual data

## 🧪 **Test Results**
After fixes:
- ✅ Asset creation form submits without errors
- ✅ Images use placeholder until Cloudinary is configured
- ✅ No more validation errors from complex objects
- ✅ Clean data structure sent to backend

## 🔧 **Current Behavior**
1. **Image Upload**: Uses placeholder images with helpful console instructions
2. **Asset Creation**: Works with all fields except image upload
3. **Complex Objects**: Only sent when they contain meaningful data
4. **Error Handling**: Graceful fallbacks for all upload failures

## 📋 **Next Steps to Enable Image Upload**
1. **Go to [Cloudinary Console](https://console.cloudinary.com/)**
2. **Navigate to**: Settings → Upload → Upload presets
3. **Create new preset**:
   - Name: `cmms_assets` (exact name)
   - Signing Mode: `Unsigned`
   - Save the preset
4. **Uncomment the upload code** in `/lib/cloudinary-config.ts`
5. **Test image upload** in the asset creation form

## 🐛 **Debug Information**
If you encounter issues:
1. Check browser console for detailed error messages
2. Verify all required fields are filled
3. Ensure user has proper permissions (super admin or department admin)
4. Check network tab for API request/response details

## 🚀 **Working Features**
- ✅ Asset creation with all text fields
- ✅ Department dropdown (dynamic from database)
- ✅ Location dropdown (dynamic from database)
- ✅ QR/Barcode scanner for asset identification
- ✅ Parts/BOM management
- ✅ Permission-based access control
- ✅ Image upload UI (falls back to placeholder)
- ✅ Comprehensive form validation