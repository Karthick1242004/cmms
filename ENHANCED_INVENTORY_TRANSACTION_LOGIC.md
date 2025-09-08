# Enhanced Inventory Transaction Logic

## Overview

This document describes the enhanced inventory transaction system that implements refined business logic for stock receipt, stock issue, and department transfer operations. The new system provides better tracking, audit trails, and integrates department-location cascading.

## New Transaction Types

### 1. **Stock Receipt** - Procurement Operations
**Purpose**: Track new parts bought for the company with complete procurement history

**Use Cases**:
- New parts purchased from vendors
- Parts received from suppliers
- Donated equipment/parts
- Returned parts from projects
- Initial stock setup

**Enhanced Fields**:
- `procurementType`: 'purchase' | 'donation' | 'return' | 'initial_stock'
- `procurementReason`: Why this procurement was made
- `receivedBy`: Who physically received the parts
- `receivedByName`: Full name of receiver
- `qualityChecked`: Whether parts passed quality inspection
- `qualityCheckedBy`: Who performed quality check
- `qualityNotes`: Quality inspection notes

**Business Logic**:
- Always increases inventory (positive quantity change)
- Requires supplier/vendor information
- Tracks complete procurement chain
- Auto-generates procurement audit trail

### 2. **Stock Issue** - Asset Maintenance Operations
**Purpose**: Track parts used for specific asset maintenance with detailed maintenance context

**Use Cases**:
- Preventive maintenance parts replacement
- Corrective maintenance and repairs
- Emergency breakdown repairs
- Asset upgrades and improvements

**Enhanced Fields**:
- `maintenanceType`: 'preventive' | 'corrective' | 'emergency' | 'upgrade'
- `maintenanceReason`: Detailed reason for maintenance
- `assetConditionBefore`: 'good' | 'fair' | 'poor' | 'critical'
- `assetConditionAfter`: Asset condition post-maintenance
- `replacementType`: 'scheduled' | 'breakdown' | 'upgrade' | 'recall'
- `technician`: Technician ID performing maintenance
- `technicianName`: Full name of technician
- `workOrderPriority`: 'low' | 'normal' | 'high' | 'critical'

**Business Logic**:
- Always decreases inventory (negative quantity change)
- Requires asset information (assetId or assetName)
- Links to asset maintenance history
- Tracks technician accountability
- Records asset condition changes

### 3. **Transfer Parts** - Department-to-Department Transfers
**Purpose**: Handle parts movement between departments with location cascading

**Use Cases**:
- Department inventory rebalancing
- Project-specific part allocation
- Emergency part sharing
- Organizational restructuring

**Enhanced Fields**:
- `transferReason`: 'rebalancing' | 'project_need' | 'emergency' | 'reorganization'
- `transferType`: 'permanent' | 'temporary' | 'loan'
- `expectedReturnDate`: For temporary transfers/loans
- `transferApprovedBy`: Who approved the transfer
- `transferApprovedByName`: Full name of approver
- `sourceDepartment`: Originating department
- `destinationDepartment`: Receiving department
- `transferNotes`: Additional transfer information

**Business Logic**:
- Creates dual inventory transactions (out from source, in to destination)
- Cascades with department-location mapping
- Requires both source and destination departments
- Handles temporary transfers with return tracking
- Auto-maps department locations from system configuration

## Enhanced Inventory Service

### Core Functions

#### 1. **Enhanced Quantity Calculation**
```typescript
calculateQuantityChange(
  transactionType: string,
  quantity: number,
  userDepartment?: string,
  sourceLocation?: string,
  destinationLocation?: string,
  sourceDepartment?: string,
  destinationDepartment?: string
): number
```

**Logic**:
- **Receipt**: Always positive (procurement increases inventory)
- **Issue**: Always negative (parts consumed for maintenance)
- **Transfer**: Depends on department perspective (negative for source, positive for destination)
- **Adjustment**: Can be positive or negative
- **Scrap**: Always negative (parts disposed)

#### 2. **Enhanced Inventory Processing**
```typescript
processEnhancedInventoryUpdates(
  transaction: StockTransaction,
  authToken: string,
  baseUrl?: string
): Promise<InventoryBatchUpdateResult>
```

**Features**:
- Type-specific validation before processing
- Separate handling for transfer transactions
- Enhanced error handling and logging
- Comprehensive audit trail creation

#### 3. **Department Transfer Processing**
```typescript
processDepartmentTransfer(
  transaction: StockTransaction,
  authToken: string,
  baseUrl?: string
): Promise<InventoryBatchUpdateResult>
```

**Features**:
- Dual-department inventory updates
- Department-location mapping integration
- Cascading location assignment
- Transfer audit trail creation

### Validation Logic

#### Transaction Type Validation
- **Receipt**: Requires supplier/vendor information and destination
- **Issue**: Requires asset information and technician/recipient
- **Transfer**: Requires different source and destination departments

#### Business Rule Validation
- Prevents negative inventory levels
- Validates department access permissions
- Ensures required fields based on transaction type
- Validates enum values for enhanced fields

## Department-Location Cascading

### Location Mapping Logic
The system automatically maps departments to their associated locations based on the location configuration:

```typescript
// Example department-location mapping
{
  "ASRS": ["ASRS Level 4", "TYJ 5S"],
  "Facility": ["TYJ 1S", "Main building"],
  "FACILITY": ["TYJ 5S", "None"]
}
```

### Transfer Location Assignment
1. **Source Department**: Uses primary location of source department
2. **Destination Department**: Uses primary location of destination department
3. **Fallback**: Uses department code as location if mapping not found

## API Integration

### Enhanced Schemas
All stock transaction schemas now include the enhanced fields:

```typescript
// Stock Transaction Schema additions
procurementType: { type: String, enum: [...] },
procurementReason: { type: String, maxlength: 200 },
// ... procurement fields

maintenanceType: { type: String, enum: [...] },
maintenanceReason: { type: String, maxlength: 200 },
// ... maintenance fields

transferReason: { type: String, enum: [...] },
sourceDepartment: { type: String, maxlength: 100 },
destinationDepartment: { type: String, maxlength: 100 },
// ... transfer fields
```

### API Endpoints Updated
- `POST /api/stock-transactions` - Accepts enhanced fields
- `PUT /api/stock-transactions/{id}/status` - Uses enhanced inventory processing
- `POST /api/parts/{id}/inventory` - Handles enhanced inventory updates

## Data Flow Examples

### Stock Receipt Flow
```
1. User creates receipt transaction with vendor details
2. System validates procurement requirements
3. Inventory increased in destination department
4. Procurement audit trail created
5. Quality check status recorded
6. Vendor relationship logged
```

### Stock Issue Flow
```
1. User creates issue transaction for asset maintenance
2. System validates asset and technician information
3. Inventory decreased from asset's department
4. Asset maintenance history updated
5. Technician accountability recorded
6. Asset condition change logged
```

### Department Transfer Flow
```
1. User creates transfer between departments
2. System validates department requirements
3. Outgoing transaction from source department
4. Incoming transaction to destination department
5. Department-location mapping applied
6. Dual audit trail created
7. Transfer approval recorded
```

## Security and Validation

### Enhanced Security Measures
- Department-based access control for all transactions
- Technician validation for maintenance operations
- Approval requirements for transfers
- Audit trail for all operations

### Data Validation
- Type-specific field validation
- Business rule enforcement
- Enum value validation
- Required field checks based on transaction type

### Error Handling
- Graceful degradation for missing data
- Comprehensive error messages
- Transaction rollback on failures
- Detailed logging for troubleshooting

## Benefits

### 1. **Enhanced Traceability**
- Complete procurement chain tracking
- Asset maintenance history integration
- Department transfer accountability
- Quality control documentation

### 2. **Improved Operations**
- Type-specific workflows
- Automated department-location cascading
- Comprehensive audit trails
- Better error handling

### 3. **Regulatory Compliance**
- Complete documentation chain
- Quality control tracking
- Asset maintenance records
- Procurement audit trails

### 4. **Business Intelligence**
- Procurement pattern analysis
- Maintenance cost tracking
- Department usage patterns
- Asset condition trending

## Migration Considerations

### Backward Compatibility
- Existing transactions remain functional
- Legacy `transfer_in`/`transfer_out` mapped to `transfer`
- Enhanced fields optional for existing data
- Gradual migration strategy supported

### Data Migration
- Existing transactions get default enhanced values
- Department-location mapping populated from current data
- Historical audit trails preserved
- Performance optimization during migration

## Future Enhancements

### Planned Features
1. **Automated Procurement**: Auto-generate purchase orders from low stock
2. **Predictive Maintenance**: AI-driven part replacement recommendations
3. **Cost Optimization**: Automated department rebalancing suggestions
4. **Mobile Integration**: Field technician mobile apps for instant updates

### Technical Roadmap
1. **Real-time Notifications**: WebSocket updates for inventory changes
2. **Batch Processing**: Bulk transfer operations
3. **Integration APIs**: ERP system integration
4. **Advanced Analytics**: Machine learning for demand forecasting

---

This enhanced inventory transaction logic provides a robust foundation for comprehensive inventory management while maintaining the flexibility needed for complex industrial operations.
