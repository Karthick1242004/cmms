# Stock Transactions Implementation

## Overview

This document describes the comprehensive stock transaction system implemented for the CMMS (Computerized Maintenance Management System). The system provides complete inventory management capabilities with receipt, issue, transfer, adjustment, and scrap operations.

## Architecture

### Backend (Server)

#### 1. Data Model (`server/src/models/StockTransaction.ts`)
- **StockTransaction Model**: Comprehensive schema with MongoDB/Mongoose
- **Automatic Transaction Numbering**: Format `ST{YY}{MM}{SEQUENCE}`
- **Multiple Transaction Types**: receipt, issue, transfer_in, transfer_out, adjustment, scrap
- **Workflow States**: draft, pending, approved, completed, cancelled
- **Audit Trail**: Complete tracking of who created, approved, and modified transactions

#### 2. Controller (`server/src/controllers/stockTransactionController.ts`)
- **CRUD Operations**: Full create, read, update, delete functionality
- **Status Management**: Automated workflow with approval process
- **Stock Integration**: Automatic inventory updates when transactions are completed
- **Department Access Control**: Role-based filtering and permissions
- **Statistics**: Comprehensive analytics and reporting

#### 3. Routes (`server/src/routes/stockTransactionRoutes.ts`)
- `GET /api/stock-transactions` - List all transactions with filtering
- `POST /api/stock-transactions` - Create new transaction
- `GET /api/stock-transactions/:id` - Get specific transaction
- `PUT /api/stock-transactions/:id/status` - Update transaction status
- `DELETE /api/stock-transactions/:id` - Delete transaction (drafts only)
- `GET /api/stock-transactions/stats` - Get transaction statistics

### Frontend (Components)

#### 1. Types (`types/stock-transaction.ts`)
- **TypeScript Interfaces**: Complete type definitions
- **Form Validation**: Zod schemas for data validation
- **API Response Types**: Structured API response interfaces

#### 2. API Client (`lib/stock-transactions-api.ts`)
- **RESTful Client**: Axios-based API client
- **Error Handling**: Comprehensive error management
- **Type Safety**: Full TypeScript integration

#### 3. State Management (`stores/stock-transactions-store.ts`)
- **Zustand Store**: Reactive state management
- **Optimistic Updates**: Immediate UI feedback
- **Real-time Filtering**: Client-side search and filtering
- **Pagination Support**: Server-side pagination handling

#### 4. Components

##### Main Form (`components/stock-transactions/stock-transaction-form.tsx`)
- **Dynamic Form Fields**: Changes based on transaction type
- **Part Selection**: Searchable dropdown with stock levels
- **Location Integration**: Cascading dropdowns for locations
- **Asset/Employee Selection**: Context-aware recipient selection
- **Real-time Calculations**: Automatic cost calculations
- **Validation**: Client-side and server-side validation

##### List View (`components/stock-transactions/stock-transaction-list.tsx`)
- **Data Table**: Sortable, filterable table with pagination
- **Advanced Filtering**: Multiple filter criteria
- **Bulk Actions**: Status updates and exports
- **Role-based Actions**: Different actions based on user permissions
- **Real-time Search**: Instant filtering across all fields

##### Detail View (`components/stock-transactions/stock-transaction-view.tsx`)
- **Complete Information**: All transaction details
- **Audit Trail**: Complete history tracking
- **Print-friendly Layout**: Optimized for reporting
- **Conditional Display**: Shows different info based on transaction type

##### Main Page (`app/stock-history/page.tsx`)
- **Dialog Management**: Modal-based interactions
- **Error Handling**: User-friendly error messages
- **Loading States**: Progressive loading indicators
- **Route Integration**: Next.js 13+ app router compatible

## Key Features

### 1. Transaction Types

#### Receipt (Stock In)
- **Use Case**: Receiving goods from suppliers
- **Workflow**: Draft → Pending → Approved → Completed
- **Inventory Impact**: Increases stock quantities
- **Required Fields**: Supplier, destination location, items

#### Issue (Stock Out)
- **Use Case**: Parts for maintenance work, consumables
- **Workflow**: Draft → Pending → Approved → Completed
- **Inventory Impact**: Decreases stock quantities
- **Required Fields**: Recipient, source location, items
- **Stock Validation**: Prevents issuing more than available

#### Transfer In/Out
- **Use Case**: Moving inventory between locations
- **Workflow**: Paired transactions (out from source, in to destination)
- **Inventory Impact**: Location-based stock updates
- **Required Fields**: Source and destination locations

#### Adjustment
- **Use Case**: Correcting inventory discrepancies
- **Workflow**: Draft → Approved → Completed
- **Inventory Impact**: Sets new stock quantities
- **Required Fields**: Location, adjusted quantities, reason

#### Scrap/Disposal
- **Use Case**: Removing damaged or obsolete items
- **Workflow**: Draft → Approved → Completed
- **Inventory Impact**: Decreases stock quantities
- **Required Fields**: Source location, disposal reason

### 2. Access Control

#### Super Admin
- **Permissions**: Full access to all transactions across all departments
- **Capabilities**: Create, view, edit, approve, complete, delete any transaction
- **Department Override**: Can work with any department's inventory

#### Manager
- **Permissions**: Full access within their department
- **Capabilities**: Create, view, edit, approve, complete transactions in their department
- **Approval Authority**: Can approve pending transactions
- **Internal Notes**: Can view and edit internal notes

#### Technician
- **Permissions**: Limited access within their department
- **Capabilities**: Create, view transactions in their department
- **Restrictions**: Cannot approve transactions, limited to draft creation
- **Self-Service**: Can create issue requests for their work

### 3. Integration Points

#### Parts Integration
- **Real-time Stock Levels**: Shows current inventory during selection
- **Cost Integration**: Pulls current unit costs from parts master
- **Department Filtering**: Shows only relevant parts based on user's department
- **Stock Validation**: Prevents over-issuing inventory

#### Locations Integration
- **Dynamic Dropdowns**: Loads actual locations from the system
- **Department Filtering**: Shows only accessible locations
- **Hierarchical Display**: Shows parent-child location relationships

#### Assets Integration
- **Asset Selection**: Links transactions to specific equipment
- **Work Order Integration**: Connects to maintenance work orders
- **Parts BOM**: Shows parts used by specific assets

#### Employees Integration
- **Recipient Selection**: Searchable employee directory
- **Department Validation**: Ensures cross-department visibility rules
- **Audit Integration**: Links to employee records for accountability

### 4. Business Logic

#### Workflow Management
```
Draft → Pending → Approved → Completed
  ↓       ↓         ↓         ↓
Cancel   Cancel    Cancel     ✓
```

#### Inventory Updates
- **Stock Receipts**: Increase inventory quantities
- **Stock Issues**: Decrease inventory quantities with validation
- **Transfers**: Move quantities between locations
- **Adjustments**: Set absolute quantities with audit trail
- **Scrap**: Remove quantities with disposal tracking

#### Cost Tracking
- **Unit Costs**: Track individual item costs
- **Total Calculations**: Automatic transaction totals
- **Currency Support**: Multi-currency capability
- **Historical Pricing**: Maintain cost history

## Implementation Guidelines

### 1. Security
- **Authentication Required**: All endpoints require valid user context
- **Department Isolation**: Users only see their department's data (except super admin)
- **Role-based Authorization**: Different capabilities based on user role
- **Audit Logging**: Complete transaction history tracking

### 2. Performance
- **Pagination**: Server-side pagination for large datasets
- **Indexing**: Optimized database indexes for common queries
- **Caching**: Client-side caching of reference data
- **Lazy Loading**: Components load data as needed

### 3. User Experience
- **Progressive Enhancement**: Works with JavaScript disabled
- **Responsive Design**: Mobile-friendly interface
- **Error Recovery**: Graceful error handling and recovery
- **Offline Support**: Planned for future implementation

### 4. Data Integrity
- **Validation**: Multi-layer validation (client, server, database)
- **Transactions**: Database transactions for consistency
- **Referential Integrity**: Foreign key constraints where applicable
- **Backup Strategy**: Regular automated backups

## API Documentation

### Authentication Headers
All requests require these headers:
```
x-user-id: string
x-user-name: string
x-user-email: string
x-user-department: string
x-user-role: 'admin' | 'manager' | 'technician'
```

### Common Responses
```typescript
// Success Response
{
  success: true,
  data: T,
  message: string
}

// Error Response
{
  success: false,
  message: string,
  error?: any (development only)
}
```

### Filtering Options
All list endpoints support these query parameters:
- `page`: number (default: 1)
- `limit`: number (default: 20)
- `search`: string (searches across multiple fields)
- `department`: string (super admin only)
- `transactionType`: enum
- `status`: enum
- `priority`: enum
- `dateFrom`: ISO date string
- `dateTo`: ISO date string
- `sortBy`: string (default: 'transactionDate')
- `sortOrder`: 'asc' | 'desc' (default: 'desc')

## Testing Strategy

### Backend Testing
1. **Unit Tests**: Individual function testing
2. **Integration Tests**: API endpoint testing
3. **Database Tests**: Data consistency validation
4. **Performance Tests**: Load and stress testing

### Frontend Testing
1. **Component Tests**: Individual component validation
2. **Integration Tests**: Component interaction testing
3. **E2E Tests**: Complete user workflow testing
4. **Accessibility Tests**: WCAG compliance validation

## Deployment Notes

### Environment Variables
```
SERVER_BASE_URL=http://localhost:5001
MONGODB_URI=mongodb://...
NODE_ENV=production|development
```

### Database Setup
1. Run migrations for new collections
2. Create indexes for performance
3. Set up backup schedules
4. Configure replication (production)

### Frontend Build
1. TypeScript compilation
2. Bundle optimization
3. Asset optimization
4. PWA manifest generation

## Future Enhancements

### Planned Features
1. **Mobile App**: React Native mobile application
2. **Barcode Scanning**: QR/barcode integration for parts
3. **Automated Reordering**: AI-based reorder point calculation
4. **Advanced Analytics**: Machine learning insights
5. **API Integration**: Third-party ERP system integration

### Performance Optimizations
1. **Redis Caching**: Server-side response caching
2. **CDN Integration**: Static asset delivery
3. **Database Sharding**: Horizontal scaling
4. **Background Jobs**: Async processing queue

## Support and Maintenance

### Monitoring
- **Error Tracking**: Automatic error reporting
- **Performance Monitoring**: Response time tracking
- **Usage Analytics**: User behavior analysis
- **Health Checks**: Automated system monitoring

### Backup Strategy
- **Daily Backups**: Automated database backups
- **Point-in-time Recovery**: Transaction log backups
- **Geographic Redundancy**: Multi-region backup storage
- **Testing**: Regular backup restoration testing

### Documentation
- **API Documentation**: OpenAPI/Swagger specs
- **User Manual**: End-user documentation
- **Admin Guide**: System administration guide
- **Developer Guide**: Technical implementation guide
