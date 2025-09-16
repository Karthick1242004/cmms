import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { 
  CalendarState, 
  CalendarEvent, 
  EmployeeLeave, 
  OvertimeRecord, 
  CalendarFilter 
} from '@/types/calendar';

const defaultFilters: CalendarFilter = {
  showLeaves: true,
  showShifts: true,
  showOvertime: true,
  showSafetyInspections: true,
  showMaintenance: true,
  showTickets: true,
  showDailyActivities: true,
  showHolidays: true,
  departments: [],
  employees: [],
  priorities: [],
  statuses: []
};

// Cache to prevent duplicate requests
let lastFetchedRange: { startDate: string; endDate: string } | null = null;

export const useCalendarStore = create<CalendarState>()(
  devtools(
    immer((set, get) => ({
      // State
      events: [],
      leaves: [],
      overtimes: [],
      filters: defaultFilters,
      selectedDate: null,
      selectedEvent: null,
      isLoading: false,
      error: null,
      viewType: 'month',

      // Fetch calendar events from multiple sources
      fetchEvents: async (startDate: string, endDate: string) => {
        const currentState = get();
        
        // Prevent duplicate requests for the same date range
        if (currentState.isLoading) {
          console.log('🔄 [Calendar] - Already loading, skipping duplicate request');
          return;
        }

        // Check if we already have data for this range
        if (lastFetchedRange && 
            lastFetchedRange.startDate === startDate && 
            lastFetchedRange.endDate === endDate &&
            currentState.events.length > 0) {
          console.log('🔄 [Calendar] - Using cached data for range:', startDate, 'to', endDate);
          return;
        }
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const token = localStorage.getItem('auth-token');
          if (!token) {
            throw new Error('Authentication required');
          }

          console.log('🗓️ [Calendar] - Fetching events for range:', startDate, 'to', endDate);

          // Fetch events from calendar events API
          const response = await fetch(`/api/calendar/events?startDate=${startDate}&endDate=${endDate}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch calendar events');
          }

          const data = await response.json();
          
          if (data.success) {
            set((state) => {
              state.events = data.data || [];
              state.isLoading = false;
            });
            
            // Update cache
            lastFetchedRange = { startDate, endDate };
            
            console.log('✅ [Calendar] - Events loaded:', data.data?.length || 0, 'events');
          } else {
            throw new Error(data.message || 'Failed to fetch events');
          }
        } catch (error) {
          console.error('❌ [Calendar] - Error fetching events:', error);
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to fetch events';
            state.isLoading = false;
          });
        }
      },

      // Fetch employee leaves
      fetchLeaves: async (employeeId?: string) => {
        try {
          const token = localStorage.getItem('auth-token');
          if (!token) {
            throw new Error('Authentication required');
          }

          const url = employeeId 
            ? `/api/calendar/leaves?employeeId=${employeeId}`
            : '/api/calendar/leaves';

          const response = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch leaves');
          }

          const data = await response.json();
          
          if (data.success) {
            set((state) => {
              state.leaves = data.data || [];
            });
            console.log('✅ [Calendar] - Leaves loaded:', data.data?.length || 0, 'leaves');
          }
        } catch (error) {
          console.error('❌ [Calendar] - Error fetching leaves:', error);
        }
      },

      // Fetch overtime records
      fetchOvertimes: async (employeeId?: string) => {
        try {
          const token = localStorage.getItem('auth-token');
          if (!token) {
            throw new Error('Authentication required');
          }

          const url = employeeId 
            ? `/api/calendar/overtime?employeeId=${employeeId}`
            : '/api/calendar/overtime';

          const response = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch overtime records');
          }

          const data = await response.json();
          
          if (data.success) {
            set((state) => {
              state.overtimes = data.data || [];
            });
            console.log('✅ [Calendar] - Overtime records loaded:', data.data?.length || 0, 'records');
          }
        } catch (error) {
          console.error('❌ [Calendar] - Error fetching overtime records:', error);
        }
      },

      // Add new leave request
      addLeave: async (leave: Omit<EmployeeLeave, 'id'>) => {
        try {
          const token = localStorage.getItem('auth-token');
          if (!token) {
            throw new Error('Authentication required');
          }

          const response = await fetch('/api/calendar/leaves', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(leave),
          });

          if (!response.ok) {
            throw new Error('Failed to add leave request');
          }

          const data = await response.json();
          
          if (data.success) {
            set((state) => {
              state.leaves.push(data.data);
            });
            console.log('✅ [Calendar] - Leave added successfully');
            return true;
          }
          return false;
        } catch (error) {
          console.error('❌ [Calendar] - Error adding leave:', error);
          return false;
        }
      },

      // Add new overtime record
      addOvertime: async (overtime: Omit<OvertimeRecord, 'id'>) => {
        try {
          const token = localStorage.getItem('auth-token');
          if (!token) {
            throw new Error('Authentication required');
          }

          const response = await fetch('/api/calendar/overtime', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(overtime),
          });

          if (!response.ok) {
            throw new Error('Failed to add overtime record');
          }

          const data = await response.json();
          
          if (data.success) {
            set((state) => {
              state.overtimes.push(data.data);
            });
            console.log('✅ [Calendar] - Overtime added successfully');
            return true;
          }
          return false;
        } catch (error) {
          console.error('❌ [Calendar] - Error adding overtime:', error);
          return false;
        }
      },

      // Update filters
      updateFilters: (newFilters: Partial<CalendarFilter>) => {
        set((state) => {
          state.filters = { ...state.filters, ...newFilters };
        });
        
        // Clear cache when filters change to force fresh data
        lastFetchedRange = null;
      },

      // Set selected date
      setSelectedDate: (date: string | null) => {
        set((state) => {
          state.selectedDate = date;
        });
      },

      // Set selected event
      setSelectedEvent: (event: CalendarEvent | null) => {
        set((state) => {
          state.selectedEvent = event;
        });
      },

      // Set view type
      setViewType: (viewType: 'month' | 'week' | 'day' | 'list') => {
        set((state) => {
          state.viewType = viewType;
        });
      },

      // Generate reports
      generateReport: async (startDate: string, endDate: string) => {
        try {
          const token = localStorage.getItem('auth-token');
          if (!token) {
            throw new Error('Authentication required');
          }

          const response = await fetch(`/api/calendar/reports?startDate=${startDate}&endDate=${endDate}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('Failed to generate report');
          }

          const data = await response.json();
          
          if (data.success) {
            // Handle report generation success
            console.log('✅ [Calendar] - Report generated successfully');
            
            // Create and download the report
            const blob = new Blob([JSON.stringify(data.data, null, 2)], { 
              type: 'application/json' 
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `calendar-report-${startDate}-to-${endDate}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }
        } catch (error) {
          console.error('❌ [Calendar] - Error generating report:', error);
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to generate report';
          });
        }
      },
    })),
    {
      name: 'calendar-store',
    }
  )
);
