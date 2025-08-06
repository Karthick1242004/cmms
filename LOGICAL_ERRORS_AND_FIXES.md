# CMMS Factory Management Application - Logical Errors and Disconnectivity Analysis

## Overview

This document analyzes logical errors, data flow inconsistencies, and role-based access control issues in the CMMS Factory Management Application. The application is designed for a factory environment with Super Admin, Department Heads, and Normal Users, but currently lacks proper department-based data segregation and role-based access controls.

---

## 🚨 Critical Role-Based Access Control Issues

### 1. **Dashboard Data Not Department-Filtered**

**Current Issue:**
- Dashboard shows global statistics for all users
- All users see the same dashboard data regardless of department
- Hard-coded sample data in `stores/dashboard-store.ts` (lines 44-97)

**Expected Behavior:**
- Super Admin: See all departments' data
- Department Head: See only their department's aggregated data
- Normal User: See only their department's data and personal assignments

**Solution:**
```typescript
// In dashboard-store.ts, modify initializeData to fetch department-specific data
initializeData: async () => {
  const user = useAuthStore.getState().user;
  if (!user) return;
  
  // Fetch department-specific stats based on user role and department
  const statsEndpoint = user.role === 'admin' 
    ? '/api/dashboard/stats' 
    : `/api/dashboard/stats?department=${user.department}`;
  
  // Load real-time data instead of hardcoded values
}
```

### 2. **Assets Module - Missing Department Auto-Selection**

**Current Issue:**
- Asset creation form shows department dropdown for all users (line 95 in `asset-creation-form.tsx`)
- Non-admin users can select any department
- No automatic department assignment based on user context

**Expected Behavior:**
- Super Admin: Can select any department
- Department Head/Normal User: Department auto-selected and disabled

**Solution:**
```typescript
// In asset-creation-form.tsx, modify department field
const { user } = useAuthStore();
const isAdmin = user?.role === 'admin';

// Department field should be:
{!isAdmin ? (
  <Input value={user?.department} disabled />
) : (
  <Select>...</Select>
)}
```

### 3. **Ticket Creation - Department Selection Logic Error**

**Current Issue:**
- All users see department dropdown (lines 239-261 in `ticket-creation-form.tsx`)
- Normal users should have department auto-selected
- Missing employee assignment filtering by department

**Expected Behavior:**
- Super Admin: Can select any department and see all employees
- Department Head: Department auto-selected, see department employees
- Normal User: Department auto-selected, see only department employees for assignment

**Solution:**
```typescript
// Modify ticket creation form
const departmentField = user?.role === 'admin' ? (
  <Select>
    {departments.map(dept => <SelectItem value={dept.name}>{dept.name}</SelectItem>)}
  </Select>
) : (
  <Input value={user?.department} disabled />
);

// For employee assignment, filter by department
const availableEmployees = employees.filter(emp => 
  user?.role === 'admin' || emp.department === user?.department
);
```

---

## 🔗 Data Integration and Workflow Issues

### 4. **Maintenance Schedule - Missing Asset/Parts Integration**

**Current Issue:**
- Maintenance schedules only show asset dropdown (lines 210-223 in `maintenance-schedule-form.tsx`)
- No option to specify if maintenance is for asset or specific parts
- Parts section exists but not properly integrated with workflow logic
- No connection between selected asset and available parts

**Expected Behavior:**
- Toggle option: "Asset Maintenance" vs "Parts Maintenance"
- If Asset: Show asset dropdown filtered by user's department
- If Parts: Show parts dropdown filtered by user's department
- Auto-populate parts list based on selected asset's BOM

**Solution:**
```typescript
// Add maintenance type toggle
const [maintenanceType, setMaintenanceType] = useState<'asset' | 'parts'>('asset');

// Asset/Parts selector logic
{maintenanceType === 'asset' ? (
  <Select value={formData.assetId} onValueChange={handleAssetChange}>
    {departmentFilteredAssets.map(asset => ...)}
  </Select>
) : (
  <Select value={formData.partId} onValueChange={handlePartChange}>
    {departmentFilteredParts.map(part => ...)}
  </Select>
)}

// Auto-populate parts based on selected asset
const handleAssetChange = (assetId: string) => {
  const asset = assets.find(a => a.id === assetId);
  if (asset?.partsBOM) {
    setParts(asset.partsBOM.map(transformToPart));
  }
};
```

### 5. **Employee vs Shift Details Data Inconsistency**

**Current Issue:**
- `types/employee.ts` and `types/shift-detail.ts` define different employee structures
- Employee module shows different employee data than Shift Details module
- No synchronization between employee data across modules
- Shift Details has `employeeId` (number) while Employee has `id` (string)

**Data Structure Mismatch:**
```typescript
// Employee interface (types/employee.ts)
interface Employee {
  id: string          // String ID
  name: string
  email: string
  department: string
  role: string
  // ... other fields
}

// ShiftDetail interface (types/shift-detail.ts)  
interface ShiftDetail {
  employeeId: number  // Number ID - INCONSISTENT!
  employeeName: string
  department: string
  // ... duplicate fields
}
```

**Solution:**
1. **Unify Employee Data Model:**
```typescript
// Create single Employee interface used across all modules
interface Employee {
  id: string
  employeeId: string  // Unique employee identifier
  name: string
  email: string
  department: string
  role: string
  shift?: ShiftInfo   // Embedded shift information
}

interface ShiftInfo {
  shiftType: "day" | "night" | "rotating" | "on-call"
  shiftStartTime: string
  shiftEndTime: string
  workDays: string[]
  supervisor: string
  location: string
}
```

2. **Modify Shift Details to Reference Employees:**
```typescript
// Shift Details becomes employee assignment management
interface ShiftAssignment {
  id: string
  employee: Employee  // Reference to Employee object
  shiftInfo: ShiftInfo
  status: "active" | "inactive" | "on-leave"
  assignedDate: string
}
```

### 6. **Parts Module - Missing Asset Integration**

**Current Issue:**
- Parts exist in isolation without connection to assets
- No asset-parts relationship management
- Maintenance schedules can't properly link to asset parts
- Missing Bill of Materials (BOM) integration

**Expected Behavior:**
- Parts should be linkable to specific assets
- Asset details should show associated parts (BOM)
- Maintenance schedules should auto-suggest parts based on asset selection
- Parts inventory should track which assets use specific parts

**Solution:**
```typescript
// Enhance Part interface
interface Part {
  // ... existing fields
  linkedAssets: string[]  // Array of asset IDs
  compatibleAssets: string[]  // Assets this part can be used with
  usageHistory: PartUsageRecord[]
}

// Create Asset-Parts relationship
interface AssetPartRelationship {
  assetId: string
  partId: string
  quantity: number
  isCritical: boolean
  replacementFrequency?: number
  lastReplaced?: string
}
```

---

## 📊 API and Data Flow Issues

### 7. **Frontend API Routes - Inconsistent Department Filtering**

**Current Issue:**
- Some APIs have department filtering, others don't
- Inconsistent authentication requirements
- Testing fallbacks bypass security (lines 12-15 in `app/api/assets/route.ts`)

**Example of Inconsistency:**
```typescript
// assets/route.ts - Has department filtering
if (user && user.role !== 'admin') {
  searchParams.set('department', user.department);
}

// But then has testing bypass:
if (!user) {
  console.log('No user authentication found, proceeding without department filtering for testing');
}
```

**Solution:**
- Remove all testing bypasses
- Implement consistent department filtering across all API routes
- Enforce authentication for all CRUD operations

### 8. **Employee Assignment in Tickets - Missing Department Filtering**

**Current Issue:**
- Ticket assignment shows text input for employee names (lines 537-548 in `ticket-creation-form.tsx`)
- No dropdown with department-filtered employees
- No validation if assigned employee belongs to the same department

**Solution:**
```typescript
// Replace text input with filtered employee dropdown
const AssignedEmployeesField = () => {
  const { employees } = useEmployeesStore();
  const { user } = useAuthStore();
  
  const availableEmployees = employees.filter(emp => 
    user?.role === 'admin' || emp.department === user?.department
  );
  
  return (
    <Select multiple>
      {availableEmployees.map(emp => (
        <SelectItem key={emp.id} value={emp.id}>
          {emp.name} - {emp.role}
        </SelectItem>
      ))}
    </Select>
  );
};
```

---

## 🔐 Security and Permission Issues

### 9. **Normal Users Have CRUD Access**

**Current Issue:**
- Normal users can create/edit/delete data in various modules
- No restriction on CRUD operations based on user role
- Admin checks only exist in UI, not enforced in API

**Current Example (parts/page.tsx line 369):**
```typescript
{isAdmin && (
  <Button>Add Part</Button>
)}
```

**Missing for Normal Users:**
- Should only be able to create daily logs and tickets
- Should only edit their own assignments/tickets
- Should have read-only access to department data

**Solution:**
```typescript
// Implement proper role-based restrictions
const canCreate = (resource: string, user: User) => {
  if (user.role === 'admin') return true;
  if (user.role === 'manager') return ['daily-logs', 'tickets', 'employees'].includes(resource);
  if (user.role === 'technician') return ['daily-logs', 'tickets'].includes(resource);
  return false;
};

const canEdit = (resource: any, user: User) => {
  if (user.role === 'admin') return true;
  if (user.role === 'manager') return resource.department === user.department;
  if (user.role === 'technician') return resource.assignedTo === user.id;
  return false;
};
```

### 10. **Reports Show Global Data**

**Current Issue:**
- All reports show organization-wide data
- No department-based filtering in report generation
- Normal users see data from other departments

**Solution:**
- Filter all reports by user's department (unless admin)
- Add department parameter to all report APIs
- Implement role-based report access controls

---

## 🏗️ Architectural Issues

### 11. **Hardcoded User Roles and Departments**

**Current Issue:**
- User roles hardcoded in `auth-store.ts` (lines 9-37)
- Department names hardcoded in forms
- No dynamic department/role management

**Solution:**
```typescript
// Create dynamic department/role management
interface Department {
  id: string
  name: string
  headId?: string  // Department head employee ID
  isActive: boolean
}

interface Role {
  id: string
  name: string
  permissions: Permission[]
}

interface Permission {
  resource: string
  actions: ('create' | 'read' | 'update' | 'delete')[]
}
```

### 12. **Missing Asset-Employee Assignment Workflow**

**Current Issue:**
- No clear asset assignment workflow
- Assets have personnel in sample data but no management interface
- No asset check-out/check-in system for tools

**Solution:**
```typescript
interface AssetAssignment {
  id: string
  assetId: string
  employeeId: string
  assignedDate: string
  returnDate?: string
  purpose: string
  status: 'checked-out' | 'returned' | 'overdue'
  notes?: string
}

// Implement asset assignment workflow
const AssetCheckoutSystem = () => {
  // Asset selection filtered by department
  // Employee selection filtered by department
  // Check-out/check-in functionality
  // Overdue tracking
};
```

---

## 🎯 Priority Implementation Plan

### Phase 1: Critical Security Issues
1. **Remove testing bypasses in API routes**
2. **Implement proper role-based access control**
3. **Add department filtering to all API endpoints**
4. **Enforce authentication for all operations**

### Phase 2: Data Consistency
1. **Unify Employee and Shift Details data models**
2. **Implement department auto-selection for forms**
3. **Add asset-parts relationship management**
4. **Create proper employee-asset assignment workflow**

### Phase 3: Enhanced Integrations
1. **Implement maintenance type selection (asset vs parts)**
2. **Add dynamic parts selection based on asset BOM**
3. **Create department-filtered employee dropdowns**
4. **Implement proper report filtering**

### Phase 4: Advanced Features
1. **Dynamic department/role management**
2. **Asset check-out/check-in system**
3. **Advanced permission management**
4. **Audit trail for all operations**

---

## 🔧 Technical Implementation Notes

### Backend Changes Required
1. **Add department filtering middleware to all routes**
2. **Implement role-based permission checking**
3. **Create unified employee management API**
4. **Add asset-parts relationship endpoints**

### Frontend Changes Required
1. **Modify all forms to auto-select department for non-admin users**
2. **Implement department-filtered dropdowns**
3. **Add role-based UI component rendering**
4. **Create unified employee selection components**

### Database Schema Updates
1. **Unify employee data structure**
2. **Add asset-parts relationship tables**
3. **Implement proper user roles and permissions**
4. **Add audit logging for all operations**

---

This analysis provides a comprehensive roadmap for fixing the logical inconsistencies and implementing proper factory management workflows with appropriate role-based access controls.