# Frontend Migration Guide - Unified User Management System

## Overview

This guide details how to migrate the existing frontend from separate employee and shift management systems to the new unified user management system.

---

## ✅ **What's Been Implemented**

### **1. New Unified Types** (`types/user.ts`)
- **Single User Interface**: Combines authentication, employee data, and shift scheduling
- **Backward Compatibility**: Legacy Employee and ShiftDetail types still supported
- **Comprehensive Data Model**: Includes all factory management requirements

### **2. Unified API Layer** (`lib/users-api.ts`)
- **Main usersApi**: New unified API for all user operations
- **Legacy Compatibility**: employeesApi and shiftDetailsApi proxy to usersApi
- **Department Filtering**: Built-in support for role-based access
- **Type Safety**: Full TypeScript support throughout

### **3. Unified Store Management** (`stores/users-store.ts`)
- **useUsersStore**: Main store for all user operations
- **Legacy Stores**: useEmployeesStore and useShiftDetailsStore proxy to main store
- **Data Transformation**: Automatic conversion between formats
- **Filter Support**: Advanced filtering by department, role, shift type, etc.

### **4. Frontend API Routes**
- **`/api/users`**: Main unified endpoint with department filtering
- **`/api/users/[id]`**: Individual user operations with access control
- **`/api/users/stats`**: Statistics with department-based filtering
- **Authentication**: User context forwarding and permission checks

---

## 🔄 **Migration Steps**

### **Phase 1: Update Imports (Immediate)**

**Option A: Use New Unified System**
```typescript
// Old imports
import { employeesApi } from '@/lib/employees-api'
import { shiftDetailsApi } from '@/lib/shift-details-api'
import { useEmployeesStore } from '@/stores/employees-store'
import { useShiftDetailsStore } from '@/stores/shift-details-store'

// New imports
import { usersApi } from '@/lib/users-api'
import { useUsersStore } from '@/stores/users-store'
```

**Option B: Keep Legacy Imports (Backward Compatible)**
```typescript
// These still work - they proxy to the new system
import { employeesApi } from '@/lib/users-api'
import { shiftDetailsApi } from '@/lib/users-api'
import { useEmployeesStore } from '@/stores/users-store'
import { useShiftDetailsStore } from '@/stores/users-store'
```

### **Phase 2: Update Type Imports**

```typescript
// Old types
import type { Employee, EmployeeDetail } from '@/types/employee'
import type { ShiftDetail } from '@/types/shift-detail'

// New types (recommended)
import type { User, UserDetail, CreateUserData, UpdateUserData } from '@/types/user'

// Or keep legacy types (they're aliases to the new types)
import type { Employee, ShiftDetail } from '@/types/user'
```

### **Phase 3: Update Components**

**Example: Employee List Component**
```typescript
// Before
const { employees, fetchEmployees } = useEmployeesStore()

// After (Option 1: Use new unified system)
const { users: employees, fetchUsers: fetchEmployees } = useUsersStore()

// After (Option 2: Keep legacy - no change needed)
const { employees, fetchEmployees } = useEmployeesStore()
```

**Example: Shift Details Component**
```typescript
// Before
const { shiftDetails, fetchShiftDetails } = useShiftDetailsStore()

// After (Option 1: Use new unified system)
const { 
  users,
  filteredUsers: filteredShiftDetails,
  fetchUsers: fetchShiftDetails 
} = useUsersStore()

// Transform users to shift details format for display
const shiftDetails = users.map(user => ({
  id: user.id,
  employeeName: user.name,
  shiftType: user.shiftSchedule?.shiftType,
  // ... other mappings
}))

// After (Option 2: Keep legacy - no change needed)
const { shiftDetails, fetchShiftDetails } = useShiftDetailsStore()
```

---

## 📝 **Specific Component Updates Needed**

### **1. Employee Pages**

**File: `app/employees/page.tsx`**
```typescript
// Minimal change needed - update imports only
import { useEmployeesStore } from '@/stores/users-store'
// Rest of the component stays the same
```

**File: `app/employees/[id]/page.tsx`**
```typescript
// Update API call
const response = await usersApi.getById(employeeId)
// or keep existing: await employeesApi.getEmployeeDetails(employeeId)
```

### **2. Shift Details Pages**

**File: `app/shift-details/page.tsx`**
```typescript
// Update imports
import { useShiftDetailsStore } from '@/stores/users-store'
// Component logic remains the same
```

### **3. Form Components**

**Employee Creation Form:**
```typescript
// Old data structure
const employeeData = {
  name, email, phone, department, role, status
}

// New unified data structure
const userData: CreateUserData = {
  name, email, phone, department, role, status,
  jobTitle: role, // Map role to jobTitle
  shiftType: 'day', // Default shift
  shiftStartTime: '08:00',
  shiftEndTime: '17:00',
  workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
}
```

### **4. API Route Updates**

**Update existing API routes to use the new backend:**
```typescript
// Update base URLs in existing API routes
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

// Employees routes should proxy to /api/users
// Shift details routes should proxy to /api/users
```

---

## 🎯 **Immediate Benefits**

### **1. Data Consistency**
- ✅ No more employee/shift data mismatches
- ✅ Single source of truth for all user data
- ✅ Automatic synchronization between employee info and shift schedules

### **2. Department-Based Security**
- ✅ Built-in department filtering at API level
- ✅ Role-based access controls (super_admin, department_head, etc.)
- ✅ Prevents cross-department data access

### **3. Enhanced Functionality**
- ✅ Integrated shift scheduling with employee records
- ✅ Performance tracking and analytics
- ✅ Work history and asset assignments
- ✅ Skills and certifications management

### **4. Backward Compatibility**
- ✅ Existing components continue to work without changes
- ✅ Legacy API calls are automatically proxied
- ✅ Gradual migration possible

---

## 🧪 **Testing the Integration**

### **1. Test Data Compatibility**
```typescript
// Create a test user using the new API
const testUser = await usersApi.create({
  name: "John Doe",
  email: "john.doe@factory.com",
  phone: "+1-555-0123",
  department: "Maintenance Engineering",
  jobTitle: "Senior Technician",
  shiftType: "day",
  shiftStartTime: "08:00",
  shiftEndTime: "17:00",
  workDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
})

// Verify it appears in both employee and shift lists
const employees = await employeesApi.getAll()
const shiftDetails = await shiftDetailsApi.getAll()
```

### **2. Test Department Filtering**
```typescript
// Test with different user roles
const maintenanceUsers = await usersApi.getAll({ department: "Maintenance Engineering" })
const allUsers = await usersApi.getAll() // Should be filtered based on user's role
```

### **3. Test Legacy Compatibility**
```typescript
// Ensure old code still works
const { employees } = useEmployeesStore()
const { shiftDetails } = useShiftDetailsStore()
// Both should return the same underlying data
```

---

## 🚨 **Breaking Changes (Minimal)**

### **1. Data Structure Changes**
- **Employee role → jobTitle**: Role field now represents system role (admin, technician, etc.)
- **Shift status**: 'on-leave' → 'on_leave' (underscore format for consistency)
- **Employee ID**: Now string instead of number for shift details

### **2. API Response Format**
- **Unified response**: All user APIs now return the same user object format
- **Additional fields**: More fields available (skills, certifications, performance metrics)

### **3. Store State Changes**
- **Unified filters**: Filter state now includes additional options (shiftType, location)
- **Enhanced search**: Search now includes employee ID and job title

---

## 📦 **Implementation Priority**

### **High Priority - Start Here:**
1. ✅ Update imports to use new API and stores (backward compatible)
2. ✅ Test existing employee and shift pages with new backend
3. ✅ Verify department filtering works correctly
4. ✅ Update any hardcoded API endpoints

### **Medium Priority:**
1. Update form components to use new unified data structure
2. Enhance UI to show additional user fields (skills, performance, etc.)
3. Implement role-based UI controls
4. Add shift schedule editing capabilities

### **Low Priority:**
1. Migrate completely to new type system
2. Remove legacy compatibility layers
3. Implement advanced filtering and search
4. Add user analytics and performance tracking

---

## 🔧 **Configuration Changes Needed**

### **Environment Variables**
```bash
# Ensure backend URL is correctly configured
NEXT_PUBLIC_SERVER_URL=http://localhost:5001
SERVER_BASE_URL=http://localhost:5001
```

### **API Client Configuration**
```typescript
// Update base API client if needed
const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000';
```

---

## ✨ **Next Steps After Migration**

1. **Enhanced UI Features:**
   - Add shift schedule visualization
   - Implement user profile completion tracking
   - Add skills and certifications management
   - Show performance metrics in employee details

2. **Advanced Functionality:**
   - Implement work history tracking
   - Add asset assignment management
   - Create user analytics dashboard
   - Build performance reporting

3. **Security Enhancements:**
   - Implement proper authentication checks
   - Add audit logging for user changes
   - Create role-based navigation menus
   - Add department-based access controls throughout UI

---

The migration is designed to be **backward compatible** and **gradual**. You can start using the new system immediately while keeping existing code working, then gradually enhance features as needed.