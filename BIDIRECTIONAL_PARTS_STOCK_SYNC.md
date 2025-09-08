# Bidirectional Parts-Stock Transaction Synchronization

## Overview

This feature implements automatic bidirectional synchronization between the Parts module and Stock Transactions module. When parts are created or modified with inventory quantities, corresponding stock transactions are automatically generated to maintain accurate inventory tracking.

## Key Features

### 1. **Automatic Stock Receipt Creation**
- When a new part is created with initial quantity > 0, a stock receipt transaction is automatically created
- The transaction is auto-approved to reflect the initial inventory setup
- All part details (SKU, material code, vendor info) are carried over to the stock transaction

### 2. **Quantity Change Tracking**
- When a part's quantity is updated, a stock adjustment transaction is created
- Positive changes create receipt transactions
- Negative changes create issue transactions  
- Only stock items trigger automatic transactions

### 3. **Comprehensive Data Sync**
- Part Number, Name, SKU, Material Code
- Vendor information (Purchase Order, Vendor Name, Contact)
- Location and department details
- Cost and pricing information

## Implementation Details

### Backend Components

#### 1. **Part-Stock Sync Service** (`lib/part-stock-sync.ts`)
```typescript
// Main functions:
- createStockReceiptForNewPart()
- shouldCreateStockTransaction()
- extractPartSyncData()
- autoApproveInitialStockTransaction()
```

#### 2. **Parts API Updates**
- **POST /api/parts**: Triggers stock transaction creation for new parts
- **PUT /api/parts/[id]**: Creates adjustment transactions for quantity changes
- Both endpoints include stock sync status in response messages

#### 3. **Integration with Existing Inventory System**
- Uses existing `inventory-service.ts` for inventory updates
- Follows established transaction approval workflow
- Maintains audit trails and inventory history

### Frontend Integration

The frontend automatically displays sync status messages:
- "Part created successfully. Stock receipt transaction created: ST2412001"
- "Part updated successfully. Stock adjustment transaction created: ST2412002"
- Error handling for sync failures with informative messages

## Data Flow

### Part Creation Flow
```
1. User creates part with initial quantity
2. Part saved to database
3. shouldCreateStockTransaction() validates if sync needed
4. extractPartSyncData() prepares transaction data
5. createStockReceiptForNewPart() creates stock transaction
6. autoApproveInitialStockTransaction() approves transaction
7. Inventory service updates part quantities
8. User receives confirmation with transaction number
```

### Part Update Flow
```
1. User updates part quantity
2. System compares with original quantity
3. If difference exists, creates adjustment transaction
4. Transaction type based on quantity change direction
5. Auto-approval and inventory update
6. User receives confirmation with transaction details
```

## Security & Validation

### Authentication & Authorization
- All sync operations require valid authentication tokens
- Department-based access controls applied
- Same permission rules as manual stock transactions

### Data Validation
- Validates required fields before sync
- Prevents negative quantities
- Ensures consistent department assignments
- Input sanitization and validation

### Error Handling
- Graceful degradation if sync fails
- Part creation/update succeeds even if stock sync fails
- Detailed error logging for troubleshooting
- User-friendly error messages

## Configuration

### Auto-Sync Triggers
Parts that trigger automatic stock transactions:
- `quantity > 0`
- `isStockItem = true` (default)
- Required fields present (partNumber, name, department)

### Transaction Details
- **Type**: 'receipt' for positive quantities
- **Reference**: Auto-generated (PART-INIT-{partNumber})
- **Description**: Descriptive text with part details
- **Status**: Auto-approved for initial inventory
- **Priority**: 'normal'

## Monitoring & Logging

### Console Logging
```typescript
[PART API] Creating stock receipt transaction for new part
[PART-STOCK SYNC] Stock receipt transaction created successfully
[PART UPDATE API] Creating stock adjustment transaction for quantity change
```

### Error Tracking
- Network errors during sync
- API validation failures
- Authentication issues
- Database transaction failures

## Benefits

### 1. **Data Consistency**
- Eliminates manual entry errors
- Ensures all inventory movements are tracked
- Maintains accurate stock levels across modules

### 2. **Audit Trail**
- Complete history of inventory changes
- Links parts to their stock transactions
- Regulatory compliance for inventory tracking

### 3. **User Experience**
- Seamless workflow between modules
- Automatic transaction generation
- Clear feedback on sync status

### 4. **Operational Efficiency**
- Reduces duplicate data entry
- Minimizes reconciliation effort
- Streamlines inventory management

## Usage Examples

### Creating a New Part
```javascript
// User creates part with quantity 50
// System automatically:
// 1. Saves part to database
// 2. Creates stock receipt transaction ST2412001
// 3. Updates inventory levels
// 4. Shows: "Part created successfully. Stock receipt transaction created: ST2412001"
```

### Updating Part Quantity
```javascript
// User changes quantity from 50 to 75
// System automatically:
// 1. Updates part in database
// 2. Creates adjustment transaction for +25 units
// 3. Updates inventory levels
// 4. Shows: "Part updated successfully. Stock adjustment transaction created: ST2412002"
```

## Troubleshooting

### Common Issues

1. **Sync Failure Messages**
   - Check authentication token validity
   - Verify department permissions
   - Ensure all required fields are present

2. **No Stock Transaction Created**
   - Verify `isStockItem = true`
   - Check if `quantity > 0`
   - Ensure user has stock transaction permissions

3. **Auto-Approval Failures**
   - Review user permissions
   - Check stock transaction API status
   - Verify workflow configuration

### Log Analysis
- Search for `[PART-STOCK SYNC]` tags in application logs
- Monitor API response times and error rates
- Track inventory discrepancies

## Future Enhancements

### Planned Features
1. **Bulk Part Import Sync**: Handle bulk part imports with batch stock transactions
2. **Advanced Approval Workflows**: Configurable approval rules for different scenarios
3. **Cost Tracking Integration**: Enhanced cost accounting for inventory movements
4. **Reporting Dashboard**: Analytics for sync operations and inventory flows

### Technical Improvements
1. **Transaction Queuing**: Handle high-volume operations with background processing
2. **Rollback Capabilities**: Advanced error recovery and transaction reversal
3. **Performance Optimization**: Caching and batch processing for large datasets
4. **Real-time Notifications**: WebSocket updates for inventory changes

## Compliance & Standards

- Follows REST API conventions
- Implements proper HTTP status codes
- Maintains data integrity with transactions
- Adheres to security best practices
- Compatible with existing audit requirements

---

This bidirectional synchronization feature ensures that inventory data remains consistent across the Parts and Stock Transactions modules, providing a seamless and efficient inventory management experience.
