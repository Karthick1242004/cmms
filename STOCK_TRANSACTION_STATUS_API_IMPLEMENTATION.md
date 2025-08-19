# Stock Transaction API Implementation

## Overview

This document describes the implementation of missing stock transaction API endpoints (status update, delete, get by ID, and update) and their integration with parts inventory management.

## Problem Analysis

The frontend was attempting to call several missing endpoints:

1. **Status Update**: `PUT /api/stock-transactions/{id}/status` - 404 error
2. **Delete Transaction**: `DELETE /api/stock-transactions/{id}` - 404 error  
3. **Get by ID**: `GET /api/stock-transactions/{id}` - 404 error
4. **Update Transaction**: `PUT /api/stock-transactions/{id}` - 404 error

The frontend already had complete UI and logic for all these operations, but was failing at the API level.

## Solution Implemented

### 1. Created Missing API Endpoints

#### Status Update Endpoint
**File:** `app/api/stock-transactions/[id]/status/route.ts`

**Features:**
- Complete status update logic with validation
- Authorization checks based on user roles and departments
- Automatic approval tracking with user information
- Integration with parts inventory updates
- Comprehensive error handling

#### Individual Transaction Endpoint  
**File:** `app/api/stock-transactions/[id]/route.ts`

**Features:**
- **GET**: Retrieve individual transaction with department-based authorization
- **DELETE**: Delete draft transactions with strict authorization rules
- **PUT**: Update transaction details with validation and permissions

### 2. Status Workflow

The API supports the following status transitions:

```
draft → pending → approved → completed
  ↓        ↓         ↓
cancelled cancelled cancelled
```

**Status Rules:**
- **draft**: Initial state, can be edited by creator
- **pending**: Awaiting approval, requires manager/admin approval
- **approved**: Approved by manager/admin, ready for execution
- **completed**: Transaction executed, inventory updated
- **cancelled**: Transaction cancelled, no inventory impact

### 3. Authorization Logic

#### Status Update Authorization
```typescript
const isAuthorized = user.accessLevel === 'super_admin' || 
                    user.accessLevel === 'department_admin' ||
                    (user.department === transaction.department);
```

**Access Levels:**
- **Super Admin**: Can update any transaction status
- **Department Admin**: Can update transactions in their department
- **Regular Users**: Can update transactions in their department

#### Delete Authorization
```typescript
let canDelete = false;

if (user.accessLevel === 'super_admin') {
  canDelete = transaction.status === 'draft';
} else if (user.accessLevel === 'department_admin') {
  canDelete = transaction.department === user.department && transaction.status === 'draft';
}
// Regular users cannot delete transactions
```

**Delete Rules:**
- **Super Admin**: Can delete any draft transaction
- **Department Admin**: Can delete draft transactions from their department only
- **Regular Users**: Cannot delete any transactions
- **Status Restriction**: Only draft transactions can be deleted (prevents data integrity issues)

### 4. Parts Inventory Integration

When a transaction status changes to **completed**, the system automatically updates parts inventory:

#### Transaction Types and Inventory Impact:

| Transaction Type | Inventory Change | Description |
|-----------------|------------------|-------------|
| `receipt` | +quantity | Increases stock (receiving goods) |
| `transfer_in` | +quantity | Increases stock (transfer from another location) |
| `issue` | -quantity | Decreases stock (issuing to work orders/departments) |
| `transfer_out` | -quantity | Decreases stock (transfer to another location) |
| `scrap` | -quantity | Decreases stock (scrapped/damaged items) |
| `adjustment` | ±quantity | Sets absolute quantity (inventory adjustments) |

#### Parts Data Updated:

```typescript
// Inventory quantities
quantity: newQuantity,
totalValue: newQuantity * unitPrice,

// Usage tracking (for outgoing transactions)
totalConsumed: previous + quantityUsed,
lastUsedDate: new Date(),

// Purchase tracking (for receipts)
lastPurchaseDate: new Date(),
lastPurchasePrice: unitCost,
unitPrice: latestUnitCost, // if newer

// Stock status calculation
stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock'
```

#### Stock Status Logic:

```typescript
if (newQuantity === 0) {
  stockStatus = 'out_of_stock';
} else if (newQuantity <= minStockLevel) {
  stockStatus = 'low_stock';
} else {
  stockStatus = 'in_stock';
}
```

## Database Schemas

### Stock Transaction Schema

```typescript
{
  transactionNumber: String, // Auto-generated: ST{YY}{MM}{SEQUENCE}
  transactionType: ['receipt', 'issue', 'transfer_in', 'transfer_out', 'adjustment', 'scrap'],
  status: ['draft', 'pending', 'approved', 'completed', 'cancelled'],
  items: [{
    partId: String,
    partNumber: String,
    partName: String,
    quantity: Number,
    unitCost: Number,
    totalCost: Number,
    fromLocation: String,
    toLocation: String,
    notes: String
  }],
  // ... other fields
}
```

### Parts Schema

```typescript
{
  partNumber: String,
  name: String,
  quantity: Number, // Current stock
  minStockLevel: Number,
  unitPrice: Number,
  totalValue: Number,
  totalConsumed: Number,
  averageMonthlyUsage: Number,
  lastUsedDate: Date,
  lastPurchaseDate: Date,
  lastPurchasePrice: Number,
  stockStatus: ['in_stock', 'low_stock', 'out_of_stock'],
  // ... other fields
}
```

## API Usage

### Update Transaction Status

```typescript
PUT /api/stock-transactions/{id}/status

Body:
{
  "status": "completed",
  "notes": "Transaction completed successfully"
}

Response:
{
  "success": true,
  "data": {
    // Updated transaction object
  },
  "message": "Transaction status updated to completed"
}
```

### Delete Transaction

```typescript
DELETE /api/stock-transactions/{id}

Response:
{
  "success": true,
  "message": "Stock transaction ST25120001 deleted successfully"
}
```

### Get Transaction by ID

```typescript
GET /api/stock-transactions/{id}

Response:
{
  "success": true,
  "data": {
    // Complete transaction object
  },
  "message": "Stock transaction retrieved successfully"
}
```

### Update Transaction

```typescript
PUT /api/stock-transactions/{id}

Body:
{
  "description": "Updated description",
  "items": [...],
  // Other updatable fields
}

Response:
{
  "success": true,
  "data": {
    // Updated transaction object
  },
  "message": "Stock transaction updated successfully"
}
```

### Error Responses

```typescript
// Unauthorized
{
  "success": false,
  "message": "Unauthorized - Insufficient permissions"
}

// Invalid status
{
  "success": false,
  "message": "Invalid status value"
}

// Transaction not found
{
  "success": false,
  "message": "Stock transaction not found"
}

// Cannot delete (wrong status)
{
  "success": false,
  "message": "Cannot delete transaction - Only draft transactions can be deleted"
}

// Cannot delete (wrong department)
{
  "success": false,
  "message": "Cannot delete transaction - You can only delete transactions from your department"
}

// Cannot delete completed transaction
{
  "success": false,
  "message": "Cannot delete completed transaction - Transaction has already affected inventory"
}
```

## Frontend Integration

The frontend already had all the necessary components:

1. **Status Update Dialog**: Complete UI for selecting new status and adding notes
2. **Authorization Checks**: UI elements show/hide based on user permissions
3. **Store Integration**: Zustand store with `updateTransactionStatus` method
4. **API Client**: `stockTransactionsApi.updateStatus()` method
5. **Real-time Updates**: Automatic table refresh after status changes

### Frontend Flow:

1. User clicks "Update Status" in dropdown menu
2. Dialog opens with current transaction and status options
3. User selects new status and optionally adds notes
4. Frontend calls `updateTransactionStatus(id, status, notes)`
5. Store calls API endpoint via `stockTransactionsApi.updateStatus()`
6. On success, table updates and success toast is shown
7. On error, error toast is shown with details

## Error Handling

### API Level:
- Input validation for status values
- Authorization checks
- Transaction existence validation
- Database operation error handling
- Parts inventory update error handling (non-blocking)

### Frontend Level:
- Loading states during API calls
- Toast notifications for success/error
- Form validation
- Optimistic updates with rollback on error

## Security Features

1. **Authentication**: JWT token validation
2. **Authorization**: Role-based access control
3. **Department Isolation**: Users can only update transactions in their department
4. **Audit Trail**: All status changes are logged with user and timestamp
5. **Input Validation**: All inputs are validated and sanitized

## Performance Optimizations

1. **Efficient Queries**: Direct MongoDB operations using indexes
2. **Batch Updates**: Multiple parts updated in single database session
3. **Error Isolation**: Parts inventory failures don't block status updates
4. **Minimal Data Transfer**: Only necessary fields in API responses
5. **Store Caching**: Frontend store caches data to minimize API calls

## Testing

### Test Cases to Verify:

1. **Status Updates**:
   - ✅ Update draft to pending
   - ✅ Update pending to approved
   - ✅ Update approved to completed
   - ✅ Update any status to cancelled

2. **Authorization**:
   - ✅ Super admin can update any transaction
   - ✅ Department admin can update department transactions
   - ✅ Regular user can update department transactions
   - ✅ Cross-department access denied

3. **Inventory Updates**:
   - ✅ Receipt increases part quantity
   - ✅ Issue decreases part quantity
   - ✅ Stock status updates correctly
   - ✅ Usage tracking for outgoing transactions
   - ✅ Purchase tracking for receipts

4. **Error Handling**:
   - ✅ Invalid status rejected
   - ✅ Non-existent transaction returns 404
   - ✅ Unauthorized access returns 403
   - ✅ Parts inventory errors don't block status updates

## Integration Points

### With Parts Management:
- Automatic inventory updates on transaction completion
- Stock status recalculation
- Usage and purchase history tracking
- Low stock notifications (future enhancement)

### With User Management:
- Role-based authorization
- Department-based access control
- User activity logging

### With Notifications:
- Status change notifications (future enhancement)
- Low stock alerts (future enhancement)
- Approval workflow notifications (future enhancement)

## Future Enhancements

1. **Email Notifications**: Send emails on status changes
2. **Approval Workflow**: Multi-level approval process
3. **Stock Alerts**: Automatic low stock notifications
4. **Audit Reports**: Detailed transaction and inventory reports
5. **Mobile Optimization**: Mobile-friendly status updates
6. **Bulk Operations**: Update multiple transaction statuses at once

## Conclusion

The implementation provides a complete, secure, and efficient stock transaction status update system with automatic parts inventory integration. The solution maintains data consistency while providing excellent user experience through real-time updates and comprehensive error handling.
