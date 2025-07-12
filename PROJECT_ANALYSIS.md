# CMMS Dashboard - Complete Project Analysis & Data Flow

## Project Overview

This is a **Computerized Maintenance Management System (CMMS)** with a React/Next.js frontend and dual backend architecture:

### Architecture Components

1. **Frontend**: Next.js 14 with App Router (TypeScript)
2. **Backend 1**: Simple Express.js server (`/server` folder) - Limited functionality
3. **Backend 2**: MongoDB-based backend (accessible via frontend API routes)
4. **Database**: MongoDB (used by frontend) + Basic MongoDB (used by simple server)

---

## Backend Analysis

### Simple Express Server (`/server`)

**Technologies:**
- Express.js 5.1.0
- MongoDB with Mongoose 8.15.0
- Passport.js for authentication
- bcryptjs for password hashing

**Models:**
- `User.js`: Basic user model with fields:
  - name, email, password (hashed)
  - role: 'student' | 'instructor' | 'admin'
  - createdAt, updatedAt

**API Endpoints:**
- `GET /api/courses/instructor` - Fetch instructor courses
- `POST /api/courses/instructor` - Create/update courses

**Data Flow:**
```
Client → Express Server → MongoDB → Response
```

**Limitations:** 
- Only handles course management
- Basic authentication
- No comprehensive CMMS functionality

### Main Backend (MongoDB via Frontend API)

**Technologies:**
- MongoDB with Mongoose (through frontend)
- NextAuth.js for OAuth
- JWT tokens for authentication
- bcryptjs for password hashing

**Models:**
- `User.ts`: Comprehensive user model with 30+ fields including:
  - Authentication: email, password, authMethod, googleId
  - Profile: firstName, lastName, phone, address, etc.
  - Work: role, department, jobTitle, employeeId
  - Preferences: notifications, theme settings

---

## Frontend Analysis

### Technology Stack

- **Framework**: Next.js 14 with App Router
- **State Management**: Zustand with persistence
- **Styling**: Tailwind CSS + shadcn/ui components
- **Authentication**: NextAuth.js + Custom auth store
- **Database**: MongoDB via API routes

### Architecture Pattern

```
Frontend → API Routes (proxy) → External Server/Database → Response
```

---

## Data Flow by Module

### 1. Authentication Module

**Components:**
- `stores/auth-store.ts` - Main authentication state
- `hooks/use-auth-sync.ts` - Syncs NextAuth with Zustand
- `components/auth-guard.tsx` - Route protection
- `app/api/auth/` - Authentication API routes

**Data Flow:**
```
Login Form → auth-store.login() → /api/auth/login → MongoDB → 
JWT Token → localStorage + Zustand state → Route Access
```

**OAuth Flow:**
```
Google Sign-In → NextAuth → /api/auth/[...nextauth] → MongoDB → 
Session Creation → auth-store sync → Dashboard Access
```

**Key Features:**
- Dual authentication (email/password + OAuth)
- Profile completion tracking
- Role-based access control
- Persistent login state

### 2. Maintenance Module

**Components:**
- `stores/maintenance-store.ts` - State management
- `lib/maintenance-api.ts` - API client
- `app/api/maintenance/` - Proxy API routes
- `components/maintenance/` - UI components

**Data Flow:**
```
UI Component → maintenance-store → maintenance-api → 
/api/maintenance → External Server → Database → 
Response Chain → Store Update → UI Re-render
```

**Entities:**
- **Schedules**: Preventive maintenance schedules
- **Records**: Completed maintenance work
- **Stats**: Performance metrics

**State Management:**
- Filtered data for searching/sorting
- Loading states
- Dialog management
- Real-time statistics calculation

### 3. Safety Inspection Module

**Components:**
- `stores/safety-inspection-store.ts` - State management
- `lib/safety-inspection-api.ts` - API client
- `app/api/safety-inspection/` - Proxy API routes
- `components/safety-inspection/` - UI components

**Data Flow:**
```
Inspector Form → safety-store → API → External Server → 
Compliance Calculation → Violation Tracking → Admin Verification
```

**Key Features:**
- Compliance scoring (0-100%)
- Violation tracking with corrective actions
- Admin verification workflow
- Risk level assessment

### 4. Employee Management Module

**Components:**
- `stores/employees-store.ts` - State management
- `lib/employees-api.ts` - API client
- `app/api/employees/` - Proxy API routes

**Data Flow:**
```
Employee Form → employees-store → employees-api → 
/api/employees → External Server → Database → 
Response → Store Update → List Refresh
```

**CRUD Operations:**
- Create: Form validation → API call → Store update
- Read: Fetch all → Filter/search → Display
- Update: Form → API → Refetch all data
- Delete: Confirmation → API → Refetch all data

### 5. Assets Management Module

**Components:**
- `stores/assets-store.ts` - State management
- `types/asset.ts` & `types/asset-type.ts` - Type definitions

**Data Flow:**
```
Asset Form → assets-store → Mock Data (Currently) → 
Filter/Search → Display in Tables/Cards
```

**Asset Types:**
- Equipment, Facilities, Products, Tools
- Status tracking: operational, maintenance, out-of-service
- Condition assessment: excellent, good, fair, poor

### 6. Shift Details Module

**Components:**
- `stores/shift-details-store.ts` - State management
- `lib/shift-details-api.ts` - API client
- `app/api/shift-details/` - Proxy API routes

**Data Flow:**
```
Shift Form → shift-store → API → External Server → 
Schedule Management → Employee Assignment → Status Tracking
```

### 7. Departments Module

**Components:**
- `stores/departments-store.ts` - State management
- `app/api/departments/` - Proxy API routes

**Data Flow:**
```
Department Form → departments-store → Direct Server API → 
Employee Count Updates → Status Management
```

### 8. Dashboard Module

**Components:**
- `stores/dashboard-store.ts` - State management
- `data/dashboard.ts` - Static data

**Data Flow:**
```
Dashboard Load → dashboard-store.initializeData() → 
Mock Statistics → Quick Actions → Recent Activities
```

**Aggregated Data:**
- Stats from multiple modules
- Recent activities across systems
- Quick action shortcuts

---

## State Management Patterns

### Zustand Architecture

**Pattern Used:**
```typescript
// Store Structure
create<StateType>()(
  devtools(
    persist(
      immer((set, get) => ({
        // State
        data: [],
        filters: {},
        ui: {},
        
        // Actions
        fetchData: async () => { /* API calls */ },
        updateFilters: () => { /* State updates */ },
        CRUD operations: () => { /* Database operations */ }
      })),
      { persistConfig }
    ),
    { devtoolsConfig }
  )
)
```

**Key Features:**
- **Immer**: Immutable state updates
- **Persistence**: localStorage integration
- **DevTools**: Redux DevTools support
- **Filtering**: Real-time search/filter
- **Loading States**: UI feedback
- **Error Handling**: Graceful failures

### API Communication Pattern

**Frontend API Routes (Proxy Pattern):**
```
Frontend → /api/[module] → External Server → Database
```

**Benefits:**
- Single API surface for frontend
- Centralized error handling
- Environment variable management
- Request/response transformation

---

## Database Schema Analysis

### Frontend User Model (MongoDB)
```typescript
interface IUser {
  // Authentication
  email: string
  password?: string
  authMethod: 'email' | 'oauth'
  googleId?: string
  
  // Profile
  name: string
  firstName?: string
  lastName?: string
  phone?: string
  address?: string
  
  // Work
  role: 'admin' | 'manager' | 'technician'
  department: string
  jobTitle?: string
  employeeId?: string
  
  // System
  profileCompleted: boolean
  notifications: { email: boolean, sms: boolean }
  preferences: { compactView: boolean, darkMode: boolean }
}
```

### Backend User Model (Simple Server)
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: ['student', 'instructor', 'admin']
}
```

---

## API Endpoints Analysis

### Authentication Endpoints
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/signup` - User registration
- `GET/POST /api/auth/[...nextauth]` - OAuth handling
- `GET /api/user/profile` - User profile data

### Module Endpoints (All proxy to external server)
- `GET/POST /api/maintenance` - Maintenance schedules/records
- `GET/POST /api/safety-inspection/schedules` - Safety schedules
- `GET/POST /api/safety-inspection/records` - Safety records
- `GET/POST /api/employees` - Employee management
- `GET/POST /api/shift-details` - Shift management
- `GET/POST /api/departments` - Department management

### Statistics Endpoints
- `GET /api/maintenance/stats` - Maintenance metrics
- `GET /api/safety-inspection/stats` - Safety metrics
- `GET /api/employees/stats` - Employee metrics
- `GET /api/shift-details/stats` - Shift metrics

---

## Component Architecture

### Page Structure
```
app/
├── (auth)/
│   └── login/page.tsx
├── (dashboard)/
│   ├── page.tsx (Dashboard)
│   ├── maintenance/page.tsx
│   ├── safety-inspection/page.tsx
│   ├── employees/page.tsx
│   └── [other-modules]/page.tsx
└── api/ (Backend proxy routes)
```

### Component Hierarchy
```
Layout (app/layout.tsx)
├── AuthGuard
├── ClientLayout
│   ├── Sidebar (navigation)
│   └── Main Content
│       ├── Header
│       ├── ProfileCompletionBanner
│       └── Page Content
│           ├── Tables/Forms
│           ├── Statistics
│           └── Dialogs/Modals
└── Providers (Theme, Query, Session)
```

---

## Security Implementation

### Authentication Security
- **Password Hashing**: bcryptjs with salt
- **JWT Tokens**: 7-day expiration
- **OAuth Integration**: Google Sign-In
- **Session Management**: NextAuth.js + localStorage
- **Route Protection**: AuthGuard component

### Authorization Levels
- **Admin**: Full system access
- **Manager**: Department-level access
- **Technician**: Limited operational access

### Data Validation
- **Frontend**: Form validation with error handling
- **Backend**: API route validation
- **Database**: Mongoose schema validation

---

## Current Issues & Observations

### Architecture Issues
1. **Dual Backend Confusion**: Two different backend systems
2. **API Inconsistency**: Some routes use external server, others use MongoDB
3. **Mock Data**: Some modules still use hardcoded data

### Missing Backend Implementation
- The simple Express server lacks CMMS functionality
- No maintenance, safety, or asset management APIs
- Limited to basic course management

### Frontend-Backend Mismatch
- Frontend expects comprehensive CMMS APIs
- Backend provides limited course management
- Environment variables point to non-existent endpoints

---

## Recommendations for Changes

### 1. Unify Backend Architecture
- Choose one backend approach (recommend the MongoDB approach)
- Implement missing APIs in the chosen backend
- Remove redundant backend system

### 2. Complete API Implementation
- Implement maintenance management APIs
- Add safety inspection APIs
- Create asset management endpoints
- Build employee management system

### 3. Data Flow Optimization
- Remove proxy API routes if using direct backend
- Implement proper error boundaries
- Add request caching for better performance

### 4. Security Enhancements
- Implement proper API authentication middleware
- Add request rate limiting
- Improve input validation

This analysis provides a complete picture of the current system architecture and data flow patterns. The system has a solid frontend foundation but needs backend completion to fully function as intended. 