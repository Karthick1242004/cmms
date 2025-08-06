# CMMS Dashboard API Documentation

## Overview

This document provides comprehensive documentation for all APIs in the CMMS (Computerized Maintenance Management System) Dashboard. The system consists of two main API layers:

1. **Backend Server APIs** - Express.js server with MongoDB database
2. **Frontend APIs** - Next.js API routes that act as proxy/middleware layer

## Architecture

### Backend Server (Express.js)
- **Port**: 5001 (default)
- **Base URL**: `http://localhost:5001` (development)
- **Technology Stack**: Node.js, Express.js, MongoDB, TypeScript
- **Authentication**: JWT tokens, OAuth (Google)
- **Validation**: Express-validator middleware
- **Security**: Helmet, CORS, Rate limiting

### Frontend APIs (Next.js)
- **Technology**: Next.js 13+ App Router API routes
- **Purpose**: Authentication, authorization, request proxying
- **Features**: Department-based access control, user context injection

---

## Backend Server APIs

### Base Configuration
```typescript
Base URL: http://localhost:5001
CORS Origins: localhost:3000, *.vercel.app, *.railway.app
Rate Limiting: 100 requests per 15 minutes per IP
```

### 1. Health & Database APIs

#### Health Check
- **Endpoint**: `GET /api/health`
- **Description**: Server health status with database connectivity
- **Response**: Health status, uptime, memory usage, database info

#### Database Info
- **Endpoint**: `GET /api/database/info`
- **Description**: Database connection details and collections
- **Response**: Database name, host, collections list

---

### 2. Departments API (`/api/departments`)

| Method | Endpoint | Description | Validation |
|--------|----------|-------------|------------|
| GET | `/` | Get all departments with filtering/pagination | `validateDepartmentQuery` |
| GET | `/stats` | Get department statistics | None |
| GET | `/:id` | Get department by ID | `validateDepartmentId` |
| POST | `/` | Create new department | `validateCreateDepartment` |
| PUT | `/:id` | Update department | `validateUpdateDepartment` |
| DELETE | `/:id` | Delete department | `validateDepartmentId` |

**Features**:
- Pagination support
- Search and filtering
- Statistics generation

---

### 3. Employees API (`/api/employees`)

| Method | Endpoint | Description | Validation |
|--------|----------|-------------|------------|
| GET | `/` | Get all employees with filtering/pagination | `validateEmployeeQuery` |
| GET | `/stats` | Get employee statistics | None |
| GET | `/:id` | Get employee by ID | `validateEmployeeId` |
| GET | `/:id/details` | Get detailed employee information | `validateEmployeeId` |
| GET | `/:id/analytics` | Get employee analytics & performance metrics | `validateEmployeeId` |
| GET | `/:id/work-history` | Get employee work history | `validateEmployeeId` |
| POST | `/` | Create new employee | `validateCreateEmployee` |
| PUT | `/:id` | Update employee | `validateUpdateEmployee` |
| DELETE | `/:id` | Delete employee | `validateEmployeeId` |

**Features**:
- Advanced analytics and performance metrics
- Work history tracking
- Department-based filtering

---

### 4. Assets API (`/api/assets`)

| Method | Endpoint | Description | Validation |
|--------|----------|-------------|------------|
| GET | `/` | Get all assets with filtering/pagination | None |
| GET | `/stats` | Get asset statistics | None |
| GET | `/:id` | Get asset by ID | None |
| POST | `/` | Create new asset | None |
| POST | `/bulk-import` | Bulk import assets | None |
| PUT | `/:id` | Update asset | None |
| DELETE | `/:id` | Delete asset | None |

**Features**:
- Bulk import functionality
- Category-based filtering
- Status tracking

---

### 5. Maintenance API (`/api/maintenance`)

#### Maintenance Schedules
| Method | Endpoint | Description | Validation |
|--------|----------|-------------|------------|
| GET | `/schedules` | Get all maintenance schedules | `validateScheduleQuery` |
| GET | `/schedules/:id` | Get maintenance schedule by ID | `validateMaintenanceId` |
| POST | `/schedules` | Create new maintenance schedule | `validateCreateSchedule` |
| PUT | `/schedules/:id` | Update maintenance schedule | `validateUpdateSchedule` |
| DELETE | `/schedules/:id` | Delete maintenance schedule | `validateMaintenanceId` |

#### Maintenance Records
| Method | Endpoint | Description | Validation |
|--------|----------|-------------|------------|
| GET | `/records` | Get all maintenance records | `validateRecordQuery` |
| GET | `/records/:id` | Get maintenance record by ID | `validateMaintenanceId` |
| POST | `/records` | Create new maintenance record | `validateCreateRecord` |
| PUT | `/records/:id` | Update maintenance record | `validateUpdateRecord` |
| PATCH | `/records/:id/verify` | Verify maintenance record (admin only) | `validateVerifyRecord` |
| DELETE | `/records/:id` | Delete maintenance record | `validateMaintenanceId` |

#### Statistics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stats` | Get maintenance statistics |

**Features**:
- Schedule management
- Record verification system
- Admin-only verification
- Statistics and reporting

---

### 6. Safety Inspection API (`/api/safety-inspection`)

#### Safety Inspection Schedules
| Method | Endpoint | Description | Validation |
|--------|----------|-------------|------------|
| GET | `/schedules` | Get safety inspection schedules | `validateScheduleQuery` |
| GET | `/schedules/stats` | Get safety inspection statistics | None |
| GET | `/schedules/:id` | Get safety inspection schedule by ID | `validateIdParam` |
| POST | `/schedules` | Create safety inspection schedule | `validateCreateSafetyInspectionSchedule` |
| PUT | `/schedules/:id` | Update safety inspection schedule | `validateUpdateSafetyInspectionSchedule` |
| DELETE | `/schedules/:id` | Delete safety inspection schedule | `validateIdParam` |

#### Safety Inspection Records
| Method | Endpoint | Description | Validation |
|--------|----------|-------------|------------|
| GET | `/records` | Get safety inspection records | `validateRecordQuery` |
| POST | `/records` | Create safety inspection record | `validateCreateSafetyInspectionRecord` |
| PUT | `/records/:id` | Update safety inspection record | `validateUpdateSafetyInspectionRecord` |
| PATCH | `/records/:id/verify` | Verify safety inspection record | `validateVerifySafetyInspectionRecord` |

---

### 7. Tickets API (`/api/tickets`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all tickets with filtering & department access control |
| GET | `/stats` | Get ticket statistics |
| GET | `/my-tickets` | Get tickets assigned to current user |
| GET | `/department/:department` | Get tickets for specific department |
| GET | `/asset/:assetId` | Get tickets for specific asset |
| GET | `/:id` | Get ticket by ID |
| POST | `/` | Create new ticket |
| PUT | `/:id` | Update ticket |
| PATCH | `/:id/status` | Update ticket status |
| PATCH | `/:id/assign` | Assign ticket to users/departments |
| POST | `/:id/activity` | Add activity log entry |
| DELETE | `/:id` | Delete ticket (soft delete) |

**Features**:
- Department-based access control
- User assignment system
- Activity logging
- Status management
- Asset-specific tickets

---

### 8. Meeting Minutes API (`/api/meeting-minutes`)

| Method | Endpoint | Description | Validation |
|--------|----------|-------------|------------|
| GET | `/` | Get all meeting minutes | `validateMeetingMinutesQuery` |
| GET | `/stats` | Get meeting minutes statistics | None |
| GET | `/:id` | Get meeting minutes by ID | `validateMeetingMinutesId` |
| POST | `/` | Create new meeting minutes | `validateCreateMeetingMinutes` |
| PUT | `/:id` | Update meeting minutes | `validateUpdateMeetingMinutes` |
| DELETE | `/:id` | Delete meeting minutes | `validateMeetingMinutesId` |
| PATCH | `/:id/action-items` | Update action item status | `validateUpdateActionItem` |

**Features**:
- User context extraction
- Action item tracking
- Department filtering

---

### 9. Daily Log Activities API (`/api/daily-log-activities`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all daily log activities |
| GET | `/stats` | Get daily log statistics |
| GET | `/:id` | Get daily log activity by ID |
| POST | `/` | Create new daily log activity |
| PUT | `/:id` | Update daily log activity |
| DELETE | `/:id` | Delete daily log activity |

---

### 10. Notice Board API (`/api/notice-board`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all notice board entries |
| GET | `/stats` | Get notice board statistics |
| GET | `/:id` | Get notice board entry by ID |
| POST | `/` | Create new notice board entry |
| PUT | `/:id` | Update notice board entry |
| DELETE | `/:id` | Delete notice board entry |

---

## Frontend API Routes (Next.js)

### Authentication Layer
All frontend APIs include:
- User authentication via `getUserContext()`
- Department-based access control
- Request proxying to backend server
- Error handling and validation

### Base Configuration
```typescript
SERVER_BASE_URL: process.env.SERVER_BASE_URL || 'http://localhost:5001'
```

---

### 1. Authentication APIs

#### NextAuth Configuration
- **Path**: `/api/auth/[...nextauth]`
- **Provider**: Google OAuth
- **Features**: 
  - Automatic user creation
  - Role mapping based on email
  - JWT token management
  - Session management

#### Login/Signup
- **Path**: `/api/auth/login`, `/api/auth/signup`
- **Features**: Email/password authentication with MongoDB

---

### 2. Assets Frontend API (`/api/assets`)

#### Base Routes
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/assets` | Proxy to backend with department filtering | Optional (testing) |
| POST | `/api/assets` | Create asset with user context | Optional (testing) |

#### Dynamic Routes
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/assets/[id]` | Get asset by ID with department check | Optional (testing) |
| PUT | `/api/assets/[id]` | Update asset with permission check | Optional (testing) |
| DELETE | `/api/assets/[id]` | Delete asset with permission check | Optional (testing) |

#### Bulk Import
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/assets/bulk-import` | Bulk import assets |

#### Statistics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assets/stats` | Get asset statistics |

**Features**:
- Department-based filtering for non-admin users
- Permission checking before CRUD operations
- User context injection (createdBy, updatedBy)
- Fallback for testing without authentication

---

### 3. Employees Frontend API (`/api/employees`)

#### Base Routes
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/employees` | Get employees with department filtering | Yes |
| POST | `/api/employees` | Create employee | Yes |

#### Dynamic Routes
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/employees/[id]` | Get employee by ID | Yes |
| PUT | `/api/employees/[id]` | Update employee | Yes |
| DELETE | `/api/employees/[id]` | Delete employee | Yes |

#### Nested Routes
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/employees/[id]/analytics` | Get employee analytics | Yes |
| GET | `/api/employees/[id]/details` | Get employee details | Yes |
| GET | `/api/employees/[id]/work-history` | Get work history | Yes |

#### Statistics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/employees/stats` | Get employee statistics |

**Features**:
- Strict authentication required
- Department filtering for non-admin users
- User context headers forwarding

---

### 4. Tickets Frontend API (`/api/tickets`)

#### Base Routes
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/tickets` | Get tickets with department filtering | Optional (testing) |
| POST | `/api/tickets` | Create ticket with user context | Optional (testing) |

#### Dynamic Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tickets/[id]` | Get ticket by ID |
| PUT | `/api/tickets/[id]` | Update ticket |
| DELETE | `/api/tickets/[id]` | Delete ticket |

#### Nested Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tickets/[id]/activity` | Add activity log |
| PATCH | `/api/tickets/[id]/status` | Update ticket status |

#### Statistics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tickets/stats` | Get ticket statistics |

**Features**:
- User context injection (loggedBy, department, company)
- Report type validation
- Department filtering for open tickets
- User context headers forwarding

---

### 5. Departments Frontend API (`/api/departments`)

#### Base Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/departments` | Get all departments |
| POST | `/api/departments` | Create department |

#### Dynamic Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/departments/[id]` | Get department by ID |
| PUT | `/api/departments/[id]` | Update department |
| DELETE | `/api/departments/[id]` | Delete department |

#### Statistics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/departments/stats` | Get department statistics |

---

### 6. Maintenance Frontend API (`/api/maintenance`)

#### Base Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/maintenance` | Get maintenance records |
| POST | `/api/maintenance` | Create maintenance record |

#### Dynamic Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/maintenance/[id]` | Get maintenance record by ID |
| PUT | `/api/maintenance/[id]` | Update maintenance record |
| DELETE | `/api/maintenance/[id]` | Delete maintenance record |

---

### 7. Safety Inspection Frontend API (`/api/safety-inspection`)

#### Schedules
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/safety-inspection/schedules` | Get inspection schedules |
| POST | `/api/safety-inspection/schedules` | Create inspection schedule |
| GET | `/api/safety-inspection/schedules/[id]` | Get schedule by ID |
| PUT | `/api/safety-inspection/schedules/[scheduleId]` | Update schedule |

#### Records
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/safety-inspection/records` | Get inspection records |
| POST | `/api/safety-inspection/records` | Create inspection record |
| GET | `/api/safety-inspection/records/[id]` | Get record by ID |
| PATCH | `/api/safety-inspection/records/[id]/verify` | Verify record |

#### Statistics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/safety-inspection/schedules/stats` | Get inspection statistics |

---

### 8. Additional Frontend APIs

#### Shift Details
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/shift-details` | Get shift details |
| POST | `/api/shift-details` | Create shift detail |
| GET | `/api/shift-details/[id]` | Get shift detail by ID |
| GET | `/api/shift-details/stats` | Get shift statistics |

#### Meeting Minutes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/meeting-minutes` | Get meeting minutes |
| POST | `/api/meeting-minutes` | Create meeting minutes |
| GET | `/api/meeting-minutes/stats` | Get meeting statistics |

#### Daily Log Activities
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/daily-log-activities` | Get daily log activities |
| POST | `/api/daily-log-activities` | Create daily log activity |
| GET | `/api/daily-log-activities/[id]` | Get activity by ID |
| GET | `/api/daily-log-activities/stats` | Get activity statistics |

#### Notice Board
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notice-board` | Get notice board entries |
| POST | `/api/notice-board` | Create notice entry |
| GET | `/api/notice-board/[id]` | Get notice by ID |
| GET | `/api/notice-board/stats` | Get notice statistics |

#### Parts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/parts` | Get parts inventory |
| POST | `/api/parts` | Create part entry |

#### Stock Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stock-transactions` | Get stock transactions |
| POST | `/api/stock-transactions` | Create stock transaction |

#### User Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/profile` | Get user profile |
| PUT | `/api/user/profile` | Update user profile |

---

## Security & Authentication

### Backend Security Features
- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing with specific origins
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Express-validator for all routes
- **Environment Variables**: Secure configuration management

### Frontend Security Features
- **NextAuth**: JWT-based authentication
- **Department-based Access Control**: Users can only access their department's data
- **Role-based Permissions**: Admin, Manager, Technician roles
- **Request Validation**: Input validation before forwarding to backend
- **Error Handling**: Consistent error responses with appropriate HTTP status codes

### Authentication Flow
1. User authenticates via Google OAuth or email/password
2. Frontend validates user session
3. User context extracted (department, role, name, email)
4. Department filtering applied for non-admin users
5. Request forwarded to backend with user context headers

---

## Data Models

### Common Fields
Most entities include:
- `_id`: MongoDB ObjectId
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp
- `createdBy`: User who created the record
- `department`: Associated department

### Department Filtering
Non-admin users can only:
- View records from their department
- Create records in their department
- Update records they have access to
- Cannot change department assignments

---

## Error Handling

### HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error
- `503`: Service Unavailable (database issues)

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

---

## Deployment

### Backend Server
- **Platform**: Railway (production)
- **Environment**: Node.js 18+
- **Database**: MongoDB Atlas
- **Build Command**: `npm run build`
- **Start Command**: `npm run start`

### Frontend
- **Platform**: Vercel (production)
- **Framework**: Next.js 13+ App Router
- **Build Command**: `npm run build`
- **Environment Variables**: Authentication keys, API URLs

---

## Development Setup

### Backend Server
```bash
cd server
npm install
npm run dev  # Development server on port 5001
```

### Frontend
```bash
npm install
npm run dev  # Development server on port 3000
```

### Environment Variables Required
- `MONGODB_URI`: Database connection string
- `NEXT_PUBLIC_SERVER_URL`: Backend server URL
- `GOOGLE_CLIENT_ID`: OAuth configuration
- `GOOGLE_CLIENT_SECRET`: OAuth configuration
- `NEXTAUTH_SECRET`: JWT secret
- `NEXTAUTH_URL`: Frontend URL

---

## API Testing

### Backend APIs
Direct testing available at: `http://localhost:5001/api/*`

### Frontend APIs
Available at: `http://localhost:3000/api/*`

### Authentication
- Development: Some APIs allow testing without authentication
- Production: All APIs require proper authentication

---

This documentation covers all APIs in the CMMS Dashboard system. Each API includes comprehensive CRUD operations, statistics endpoints, and department-based access control for multi-tenant functionality.