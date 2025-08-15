# Profile Implementation Testing Guide

## ✅ Implementation Summary

The profile functionality has been successfully updated to use the backend employee collection instead of a separate user collection. This ensures data consistency across the entire CMMS application.

### Changes Made:

1. **Backend Server** (`/server`):
   - Created `src/controllers/profileController.ts` - Handles profile CRUD operations
   - Created `src/routes/profileRoutes.ts` - Defines API endpoints
   - Created `src/middleware/profileValidation.ts` - Validates profile data
   - Enhanced `src/models/Employee.ts` - Added profile fields
   - Updated `src/index.ts` - Registered profile routes

2. **Frontend** (`/app`):
   - Updated `app/profile/page.tsx` - Uses new backend API
   - Created `app/api/profile/route.ts` - Proxies to backend
   - Removed `app/api/user/profile/route.ts` - Old conflicting route

## 🚀 How to Test

### Method 1: Start Both Servers

1. **Start Backend Server:**
   ```bash
   cd server
   npm run build
   npm start
   ```
   - Should run on http://localhost:5001
   - Check logs for "🚀 Server running on port 5001"

2. **Start Frontend Server:**
   ```bash
   cd ..
   npm run dev
   ```
   - Should run on http://localhost:3000

3. **Test Profile Page:**
   - Login to the app
   - Navigate to `/profile`
   - Try updating profile information
   - Verify changes are saved

### Method 2: Direct API Testing

1. **Test Profile Endpoint:**
   ```bash
   # Test unauthorized access
   curl -X GET "http://localhost:5001/api/profile" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer invalid-token"
   
   # Should return: {"success":false,"message":"Unauthorized - User not authenticated"}
   ```

2. **Test with Valid Token:**
   - Login through the frontend
   - Get auth token from browser localStorage
   - Use token in API calls

### Method 3: Database Verification

1. **Check MongoDB Collection:**
   - Open MongoDB Compass
   - Connect to your database
   - View `employees` collection
   - Verify profile updates appear in employee records

## 🔧 Troubleshooting

### Common Issues:

1. **Port Conflicts:**
   ```bash
   # Kill processes on port 5001
   lsof -ti:5001 | xargs kill -9
   ```

2. **Build Issues:**
   ```bash
   cd server
   npm run build
   # Check for compilation errors
   ```

3. **Database Connection:**
   - Verify MongoDB Atlas connection string
   - Check network access in MongoDB Atlas
   - Ensure IP is whitelisted

## 📊 Verification Checklist

- [ ] Backend server starts without errors on port 5001
- [ ] Frontend can access profile API endpoints
- [ ] Profile updates are saved to employee collection
- [ ] All form fields work correctly (name, phone, address, etc.)
- [ ] Authentication is properly enforced
- [ ] Error handling works as expected

## 🎯 Expected Behavior

1. **Data Consistency:** Profile changes immediately reflect in employee listings and other parts of the app
2. **Enhanced Fields:** Users can now update additional fields like address, bio, job title
3. **Proper Validation:** Client and server-side validation for all fields
4. **Role-Based Access:** Regular users can only edit their own profiles

The implementation ensures that profile management is fully integrated with the main employee data system, providing a seamless experience across the entire CMMS application.

