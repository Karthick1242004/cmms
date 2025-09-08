# Stock Transaction Access Level Implementation

## Overview

This document describes the implementation of proper access level controls for stock transaction status updates, ensuring that only super administrators and department administrators can update transaction status, while normal users are restricted from this action.

## Access Level Requirements

### Status Update Authorization
- **Super Admin**: Can update status for any transaction
- **Department Admin**: Can update status only for transactions in their department
- **Normal Users**: Cannot update transaction status (UI hidden, API blocked)

## Implementation Details

### 1. Frontend Access Control (`components/stock-transactions/stock-transaction-list.tsx`)

#### Updated `canApprove` Function
```typescript
const canApprove = (transaction: StockTransaction) => {
  // Only super admin and department admin can update status
  if (user?.accessLevel === 'super_admin') {
    return true;
  }
  
  if (user?.accessLevel === 'department_admin') {
    // Department admins can only update status for transactions from their department
    return transaction.department === user?.department;
  }
  
  return false;
};
```

#### UI Rendering Logic
```typescript
{canApprove(transaction) && (
  <DropdownMenuItem onClick={() => onStatusUpdate(transaction)}>
    <CheckCircle className="mr-2 h-4 w-4" />
    Update Status
  </DropdownMenuItem>
)}
```

**Key Changes**:
- Removed `user?.role === 'manager'` check (incorrect field)
- Added proper `user?.accessLevel === 'department_admin'` check
- Added department validation for department admins
- Status update button only renders for authorized users

### 2. Backend Access Control (`app/api/stock-transactions/[id]/status/route.ts`)

#### Updated Authorization Logic
```typescript
// Check permissions - Only super admin and department admin can update status
const isAuthorized = user.accessLevel === 'super_admin' || 
                    (user.accessLevel === 'department_admin' && 
                     user.department === transaction.department);

if (!isAuthorized) {
  return NextResponse.json(
    { success: false, message: 'Unauthorized - Only super administrators and department administrators can update transaction status' },
    { status: 403 }
  );
}
```

**Key Changes**:
- Removed normal user department access (`user.department === transaction.department`)
- Added strict department validation for department admins
- Enhanced error message for clarity
- Maintains security at API level

## Access Level Hierarchy

### User Access Levels
Based on `types/auth.ts`:
```typescript
accessLevel?: 'super_admin' | 'department_admin' | 'normal_user'
```

### Permission Matrix

| Action | Super Admin | Department Admin | Normal User |
|--------|-------------|------------------|-------------|
| **View Transactions** | ✅ All | ✅ Own Department | ✅ Own Department |
| **Create Transactions** | ✅ All | ✅ Own Department | ✅ Own Department |
| **Edit Transactions** | ✅ All | ✅ Own Department | ❌ None |
| **Delete Transactions** | ✅ Draft Only | ✅ Own Dept Draft | ❌ None |
| **Update Status** | ✅ All | ✅ Own Department | ❌ None |

## Security Implementation

### 1. **Frontend Security**
- UI elements hidden based on access level
- Prevents unauthorized action attempts
- Provides clear user experience

### 2. **Backend Security**
- API-level authorization checks
- Validates user access level
- Department-based restrictions
- Proper HTTP status codes (403 Forbidden)

### 3. **Defense in Depth**
- Both frontend and backend validation
- Consistent authorization logic
- Clear error messages
- Audit trail maintenance

## Integration with Existing Patterns

### Consistent with Other Modules
The implementation follows the same access level patterns used throughout the application:

#### Asset Management
```typescript
const canEditAsset = user?.accessLevel === 'super_admin' || user?.accessLevel === 'department_admin'
```

#### Maintenance Records
```typescript
if (user.accessLevel === 'super_admin') return true
if (user.accessLevel === 'department_admin' && user.department === schedule.department) return true
```

#### Notice Board
```typescript
const canManageNotices = user?.accessLevel === 'super_admin' || user?.accessLevel === 'department_admin';
```

## Testing Scenarios

### 1. **Super Admin Access**
- ✅ Can update status for any transaction
- ✅ UI shows "Update Status" button
- ✅ API allows status updates

### 2. **Department Admin Access**
- ✅ Can update status for transactions in their department
- ✅ Cannot update status for other departments
- ✅ UI shows "Update Status" button only for own department
- ✅ API validates department ownership

### 3. **Normal User Access**
- ❌ Cannot update status for any transaction
- ❌ UI hides "Update Status" button
- ❌ API returns 403 Forbidden

## Error Handling

### Frontend Error Handling
- Graceful UI hiding for unauthorized users
- No error messages needed (UI simply not shown)

### Backend Error Handling
```typescript
{
  success: false, 
  message: 'Unauthorized - Only super administrators and department administrators can update transaction status',
  status: 403
}
```

## Compliance with Custom Rules

### Security Requirements ✅
- **Authentication**: All operations require valid JWT tokens
- **Authorization**: Proper access level validation
- **Input Validation**: Department ownership verification
- **Error Handling**: Clear, non-revealing error messages

### Performance Requirements ✅
- **Efficient Checks**: Simple access level comparisons
- **Minimal Overhead**: No additional database queries
- **Cached User Data**: Access level from auth store

### Architecture Requirements ✅
- **Consistent Patterns**: Follows established access control patterns
- **RESTful Design**: Proper HTTP status codes
- **Type Safety**: TypeScript interfaces for access levels
- **Maintainable Code**: Clear, readable authorization logic

## Future Enhancements

### Planned Features
1. **Audit Logging**: Track who updated transaction status
2. **Approval Workflows**: Multi-level approval for critical transactions
3. **Role-Based Permissions**: Granular permissions within access levels
4. **Department Delegation**: Temporary access for specific users

### Technical Improvements
1. **Permission Caching**: Cache access level checks for performance
2. **Dynamic Permissions**: Runtime permission updates
3. **Integration APIs**: External system permission synchronization
4. **Advanced Analytics**: Access pattern analysis

---

This implementation ensures that stock transaction status updates are properly secured while maintaining a consistent user experience across the application. The access level controls follow established patterns and provide robust security at both the frontend and backend levels.
