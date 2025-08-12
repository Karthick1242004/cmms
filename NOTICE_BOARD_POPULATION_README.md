# Notice Board Population Guide

This guide explains how to populate your notice board with 7 sample notices using real employee data.

## 🎯 What's Included

### **7 Sample Notice Board Entries:**
1. **Annual Safety Training Program - 2025** (High Priority, All Employees)
2. **New Quality Management System Implementation** (Medium Priority, QA/Production/Maintenance)
3. **Maintenance Schedule Updates - February 2025** (Medium Priority, Maintenance/Production)
4. **Employee Wellness Program Launch** (Low Priority, All Employees)
5. **ISO 9001:2015 Certification Renewal** (High Priority, All Departments)
6. **New Equipment Installation - Production Line B** (Medium Priority, Production/Maintenance)
7. **Emergency Contact Information Update** (Medium Priority, All Employees)

### **7 Sample Employees:**
- **Karthick** - Super Administrator (Quality Assurance)
- **Srinath VV** - Senior Quality Analyst (Quality Assurance)
- **Dr. Emily Chen** - Quality Assurance Manager (Quality Assurance)
- **Mike Johnson** - Maintenance Supervisor (Maintenance)
- **Sarah Williams** - Safety Officer (Safety & Compliance)
- **David Rodriguez** - Production Manager (Production)
- **Lisa Thompson** - HR Director (Human Resources)

## 🚀 How to Populate

### **Method 1: Browser Console (Recommended)**

1. **Login to your application** as a user with notice creation permissions
2. **Open browser console** (F12 → Console tab)
3. **Copy the entire content** of `scripts/browser-populate-notice-board.js`
4. **Paste into console** and press Enter
5. **Watch the progress** as notices are created one by one
6. **Refresh the notice board page** to see the new notices

### **Method 2: Node.js Script**

1. **Install tsx** if not already installed:
   ```bash
   npm install -g tsx
   ```

2. **Set your auth token** as environment variable:
   ```bash
   export AUTH_TOKEN="your_jwt_token_here"
   ```

3. **Run the script**:
   ```bash
   npx tsx scripts/populate-notice-board.ts
   ```

## 🔧 Technical Details

### **Data Structure**
Each notice includes:
- **Basic Information**: Title, content, type, priority, target audience
- **Employee Attribution**: Created by, name, role, department, access level
- **Timestamps**: Creation date, update date, expiry date
- **Metadata**: Tags, view count, publication status

### **API Integration**
- **Endpoint**: `/api/notice-board` (POST)
- **Authentication**: Bearer token from localStorage
- **Headers**: Proper user context and access level information
- **Rate Limiting**: 500ms delay between requests

### **Permission Requirements**
- **Create Notices**: All authenticated users
- **Edit/Delete**: Super admin, department admin, or admin role
- **View All**: Super admin and department admin
- **View Published**: All users

## 📊 Expected Results

After successful population:
- **7 new notices** in your notice board
- **Proper employee attribution** (no more "John Doe")
- **Realistic content** relevant to CMMS operations
- **Varied priorities** and target audiences
- **Proper tags** for categorization and search

## 🐛 Troubleshooting

### **Common Issues:**

1. **"No auth token found"**
   - Solution: Make sure you're logged in to the application
   - Check localStorage for 'auth-token'

2. **"403 Forbidden"**
   - Solution: Verify your user has notice creation permissions
   - Check user role and access level

3. **"API endpoint not found"**
   - Solution: Ensure the notice board API routes are properly configured
   - Check that `/api/notice-board` endpoint exists

4. **"Backend server error"**
   - Solution: Check if your backend server is running
   - Verify SERVER_BASE_URL configuration

### **Debug Information:**
The scripts provide detailed logging:
- ✅ Success messages with notice IDs
- ❌ Error messages with specific failure reasons
- 📊 Summary of successful vs failed operations
- 🔍 Detailed information about each notice being created

## 🔄 Refreshing Data

After population:
1. **Refresh the notice board page** to see new notices
2. **Check the notice count** in the UI
3. **Verify employee attribution** shows correct names
4. **Test search and filtering** with the new content
5. **Verify edit/delete permissions** work correctly

## 📝 Customization

To modify the sample data:
1. **Edit** `data/notice-board-sample.ts` for TypeScript version
2. **Edit** `scripts/browser-populate-notice-board.js` for browser version
3. **Add more employees** to the `sampleEmployees` array
4. **Add more notices** to the `sampleNotices` array
5. **Modify priorities, tags, and content** as needed

## 🎉 Success Indicators

You'll know it worked when:
- Console shows "✅ Created successfully" for each notice
- Summary shows "7 notices created successfully"
- Notice board page displays 7+ notices
- Each notice shows the correct employee name (not "John Doe")
- Edit/delete buttons appear for notices (if you have permissions)

---

**Need Help?** Check the console logs for detailed error messages and ensure all prerequisites are met.
