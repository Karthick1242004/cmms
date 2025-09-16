# 📅 Team Calendar Module - Implementation Guide

## Overview

The Team Calendar module is a comprehensive scheduling and event management system integrated with your CMMS dashboard. Built using [FullCalendar.io](https://fullcalendar.io/), it provides a Microsoft Teams-like calendar experience with advanced filtering, reporting, and event management capabilities.

## 🚀 Features

### ✅ **Multi-Source Event Integration**
- **Daily Log Activities** - Work activities and maintenance logs
- **Maintenance Schedules** - Planned maintenance events
- **Safety Inspections** - Safety inspection schedules
- **Tickets** - Support and issue tickets
- **Employee Shifts** - Work shift schedules
- **Leaves** - Employee leave requests and approvals
- **Overtime** - Planned and emergency overtime
- **Holidays** - Company and national holidays

### ✅ **Advanced Filtering System**
- **Event Type Filters** - Toggle visibility by event type
- **Department Filters** - Filter by departments (super admin only)
- **Priority Filters** - Filter by priority levels (low, medium, high, critical)
- **Status Filters** - Filter by event status (open, completed, etc.)
- **Real-time Filter Application** - Instant filtering without page reload

### ✅ **Role-Based Access Control**
- **Super Admin** - Full access to all departments and events
- **Department Admin** - Access to department-specific events
- **Normal User** - Access to personal and assigned events
- **Secure API Endpoints** - All APIs enforce role-based permissions

### ✅ **Event Management**
- **Leave Requests** - Submit and manage employee leave applications
- **Overtime Scheduling** - Plan and track overtime work
- **Event Details** - Comprehensive event information dialogs
- **Quick Actions** - Navigate to source modules for detailed management

### ✅ **Professional UI/UX**
- **Modern Design** - Matches project's design system
- **Responsive Layout** - Works on desktop, tablet, and mobile
- **Custom Styling** - Tailored FullCalendar appearance
- **Dark Mode Support** - Consistent with project theming

### ✅ **Reporting & Export**
- **Calendar Reports** - Generate reports for date ranges
- **Employee Reports** - Individual employee schedules
- **Department Reports** - Department-wide scheduling overview
- **JSON Export** - Export calendar data in structured format

## 📁 File Structure

```
├── app/
│   ├── api/calendar/
│   │   ├── events/route.ts          # Main events aggregation API
│   │   ├── leaves/route.ts          # Leave management API
│   │   └── overtime/route.ts        # Overtime management API
│   └── calendar/
│       └── page.tsx                 # Calendar page component
├── components/
│   ├── calendar/
│   │   ├── calendar-main.tsx        # Main calendar component
│   │   ├── calendar-filters.tsx     # Advanced filtering system
│   │   ├── calendar-event-dialog.tsx # Event details dialog
│   │   ├── add-leave-dialog.tsx     # Leave request form
│   │   └── add-overtime-dialog.tsx  # Overtime scheduling form
│   └── ui/
│       └── multi-select.tsx         # Multi-select component
├── stores/
│   └── calendar-store.ts            # Zustand state management
├── types/
│   └── calendar.ts                  # TypeScript interfaces
├── lib/
│   └── date-utils.ts               # Date utility functions
└── app/globals.css                  # FullCalendar custom styling
```

## 🔧 Technical Implementation

### **Dependencies**
```json
{
  "@fullcalendar/react": "^6.1.19",
  "@fullcalendar/daygrid": "^6.1.19",
  "@fullcalendar/timegrid": "^6.1.19",
  "@fullcalendar/interaction": "^6.1.19",
  "@fullcalendar/core": "^6.1.19"
}
```

### **State Management (Zustand)**
```typescript
interface CalendarState {
  events: CalendarEvent[];
  leaves: EmployeeLeave[];
  overtimes: OvertimeRecord[];
  filters: CalendarFilter;
  selectedDate: string | null;
  selectedEvent: CalendarEvent | null;
  isLoading: boolean;
  error: string | null;
  viewType: 'month' | 'week' | 'day' | 'list';
  
  // Actions
  fetchEvents: (startDate: string, endDate: string) => Promise<void>;
  fetchLeaves: (employeeId?: string) => Promise<void>;
  // ... more actions
}
```

### **Event Data Structure**
```typescript
interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  color?: string;
  extendedProps: {
    type: 'leave' | 'shift' | 'overtime' | 'safety-inspection' | 'maintenance' | 'ticket' | 'daily-activity' | 'holiday';
    status?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    department?: string;
    employeeName?: string;
    description?: string;
    metadata?: Record<string, any>;
  };
}
```

## 🎨 Visual Design

### **Color Coding System**
- 🟢 **Shifts**: Green (#10b981)
- 🟠 **Overtime**: Orange (#f97316)
- 🔴 **Safety Inspections**: Red (#dc2626)
- 🟡 **Maintenance**: Amber (#f59e0b)
- 🔵 **Tickets**: Blue (#3b82f6)
- 🟣 **Daily Activities**: Purple (#8b5cf6)
- 🟣 **Holidays**: Purple (#9333ea)
- 🟫 **Leaves**: Gray (#6b7280)

### **Priority Indicators**
- 🟫 **Low**: Gray
- 🔵 **Medium**: Blue
- 🟠 **High**: Orange
- 🔴 **Critical**: Red

### **Status Badges**
- 🔴 **Open**: Red
- 🟡 **In Progress**: Yellow
- 🟢 **Completed**: Green
- 🟠 **Pending**: Orange

## 🔐 Security Features

### **API Security**
- JWT Authentication required for all endpoints
- Role-based access control (RBAC)
- Department-based data filtering
- Input validation and sanitization
- SQL injection prevention

### **Data Privacy**
- Users can only see events they have access to
- Department admins restricted to their department
- Sensitive data excluded from API responses
- Audit trail for all calendar actions

## 📱 Mobile Responsiveness

### **Responsive Features**
- ✅ Touch-friendly interface
- ✅ Collapsible toolbar on mobile
- ✅ Optimized event display
- ✅ Swipe navigation support
- ✅ Mobile-specific styling

### **Mobile Layout**
```css
@media (max-width: 768px) {
  .fc-toolbar {
    flex-direction: column !important;
    gap: 0.5rem !important;
  }
  
  .fc-daygrid-event {
    font-size: 0.625rem !important;
    padding: 0.0625rem 0.25rem !important;
  }
}
```

## 🚀 Usage Examples

### **Basic Calendar Usage**
```typescript
import { CalendarMain } from '@/components/calendar/calendar-main';

export default function CalendarPage() {
  return (
    <PageLayout>
      <CalendarMain />
    </PageLayout>
  );
}
```

### **Fetching Events**
```typescript
const { fetchEvents } = useCalendarStore();

// Fetch events for current month
const today = new Date();
const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

await fetchEvents(
  startDate.toISOString().split('T')[0],
  endDate.toISOString().split('T')[0]
);
```

### **Adding Leave Request**
```typescript
const { addLeave } = useCalendarStore();

const leaveData = {
  employeeId: 'emp123',
  employeeName: 'John Doe',
  leaveType: 'vacation',
  startDate: '2024-01-15',
  endDate: '2024-01-17',
  reason: 'Family vacation',
  status: 'pending',
  appliedAt: new Date().toISOString(),
  department: 'Engineering'
};

const success = await addLeave(leaveData);
```

## 🔄 Integration Points

### **Existing Module Integration**
- **Daily Log Activities** → Calendar events for work activities
- **Maintenance Schedules** → Calendar events for maintenance
- **Safety Inspections** → Calendar events for inspections
- **Tickets** → Calendar events for support tickets
- **Shift Details** → Calendar events for work shifts
- **Employee Management** → Employee data for leave/overtime

### **Navigation Integration**
The calendar is accessible via the main navigation:
```typescript
{
  name: "Team Calendar",
  href: "/calendar",
  iconName: "CalendarDays",
}
```

## 📊 Reporting Features

### **Available Reports**
- **Employee Schedule Report** - Individual employee calendar
- **Department Schedule Report** - Department-wide view
- **Overtime Report** - Overtime hours and costs
- **Leave Report** - Leave patterns and utilization
- **Maintenance Schedule Report** - Planned maintenance overview

### **Export Formats**
- JSON format for data integration
- Printable HTML reports
- Date range filtering
- Department-specific exports

## 🎯 Best Practices

### **Performance Optimization**
- Efficient data fetching with date range limits
- Lazy loading of employee data
- Optimized re-renders with Zustand
- Cached API responses where appropriate

### **User Experience**
- Intuitive color coding for event types
- Quick access to source modules
- Real-time filtering without page reload
- Mobile-first responsive design

### **Code Organization**
- Separation of concerns (store, components, APIs)
- Reusable components (dialogs, filters)
- TypeScript for type safety
- Consistent error handling

## 🐛 Troubleshooting

### **Common Issues**
1. **Events not loading**: Check API authentication and permissions
2. **Filtering not working**: Verify filter state management
3. **Mobile display issues**: Check responsive CSS classes
4. **Date format errors**: Verify date utility functions

### **Debug Mode**
Enable debug logging in the calendar store:
```typescript
console.log('🗓️ [Calendar] - Events loaded:', events.length);
```

## 🔮 Future Enhancements

### **Planned Features**
- 📧 **Email Notifications** - Leave approvals and reminders
- 🔄 **Calendar Sync** - Integration with external calendars
- 📱 **Push Notifications** - Real-time event updates
- 📈 **Advanced Analytics** - Workforce utilization metrics
- 🎨 **Custom Views** - Personalized calendar layouts
- 🔗 **API Webhooks** - External system integration

### **Scalability Considerations**
- Event caching for large datasets
- Pagination for event lists
- Database indexing for date queries
- CDN integration for assets

---

## 🎉 **Calendar Module Successfully Implemented!**

The Team Calendar module is now fully integrated into your CMMS dashboard, providing a comprehensive scheduling and event management solution that matches Microsoft Teams functionality while maintaining security, performance, and your project's design standards.

**Key Benefits:**
- ✅ Unified view of all work-related events
- ✅ Streamlined leave and overtime management  
- ✅ Role-based access control
- ✅ Professional UI/UX matching project design
- ✅ Mobile-responsive design
- ✅ Secure and scalable architecture

The calendar is now accessible via the main navigation and ready for production use! 🚀
