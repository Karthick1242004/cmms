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
import { generateCalendarReport } from '@/components/calendar/calendar-report-generator';

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
      currentDate: new Date(), // Track current viewing date

      // Fetch calendar events from multiple sources
      fetchEvents: async (startDate: string, endDate: string) => {
        const currentState = get();
        
        // Create unique request key for this date range
        const requestKey = `${startDate}-${endDate}`;
        
        // Prevent duplicate requests for the same date range
        if (currentState.isLoading) {
          console.log('📅 [Calendar] - Request already in progress, skipping...');
          return;
        }

        // Check if we already have data for this exact range (even if empty)
        if (lastFetchedRange && 
            lastFetchedRange.startDate === startDate && 
            lastFetchedRange.endDate === endDate) {
          console.log('📅 [Calendar] - Data already fetched for this range, skipping...');
          return;
        }

        console.log('📅 [Calendar] - Fetching events for range:', { startDate, endDate });
        
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const token = localStorage.getItem('auth-token');
          if (!token) {
            throw new Error('Authentication required');
          }

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
            console.log('📅 [Calendar] - Successfully fetched events:', { count: data.data?.length || 0 });
            
            set((state) => {
              state.events = data.data || [];
              state.isLoading = false;
              state.error = null; // Clear any previous errors
            });
            
            // Update cache REGARDLESS of whether events array is empty
            // This prevents refetching empty results
            lastFetchedRange = { startDate, endDate };
            
          } else {
            throw new Error(data.message || 'Failed to fetch events');
          }
        } catch (error) {
          console.error('❌ [Calendar] - Error fetching events:', error);
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to fetch events';
            state.isLoading = false;
            state.events = []; // Set empty array on error to prevent infinite loading
          });
          
          // Cache the failed request to prevent immediate retry
          lastFetchedRange = { startDate, endDate };
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
            
            // Clear cache and refresh calendar events to show the new leave
            lastFetchedRange = null;
            
            // Get current date range and refresh events
            const currentState = get();
            const today = new Date();
            const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0); // Extended range for better coverage
            
            // Refresh events for the current visible range
            await currentState.fetchEvents(
              startDate.toISOString().split('T')[0],
              endDate.toISOString().split('T')[0]
            );
            
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
            
            // Clear cache and refresh calendar events to show the new overtime
            lastFetchedRange = null;
            
            // Get current date range and refresh events
            const currentState = get();
            const today = new Date();
            const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0); // Extended range for better coverage
            
            // Refresh events for the current visible range
            await currentState.fetchEvents(
              startDate.toISOString().split('T')[0],
              endDate.toISOString().split('T')[0]
            );
            
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
        
        // Only clear cache for filters that affect data fetching (like departments)
        // Client-side filters (like showLeaves, showMaintenance) don't need cache clearing
        const dataAffectingFilters = ['departments', 'employees'];
        const hasDataAffectingChanges = Object.keys(newFilters).some(key => 
          dataAffectingFilters.includes(key)
        );
        
        if (hasDataAffectingChanges) {
          console.log('📅 [Calendar] - Data-affecting filter change, clearing cache');
          lastFetchedRange = null;
        } else {
          console.log('📅 [Calendar] - Client-side filter change, keeping cache');
        }
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
            body: JSON.stringify({
              reportType: 'summary' // Default report type
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(errorData.message || `HTTP ${response.status}: Failed to generate report`);
          }

          const data = await response.json();
          
          if (data.success) {
            
            // Get current events from store for additional context
            const currentState = get();
            
            // Prepare report data in the expected format
            // Note: API returns { data: reportData } where reportData already has the correct structure
            const reportData = data.data;
            
            
            // Generate and open HTML report in new tab
            generateCalendarReport({ 
              reportData, 
              events: currentState.events 
            });
            
          }
        } catch (error) {
          console.error('❌ [Calendar] - Error generating report:', error);
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to generate report';
          });
        }
      },

      // Generate filtered reports with module selection
      generateFilteredReport: async (startDate: string, endDate: string, filters: any) => {
        try {
          const token = localStorage.getItem('auth-token');
          if (!token) {
            throw new Error('Authentication required');
          }


          const response = await fetch(`/api/calendar/reports`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              startDate,
              endDate,
              moduleFilters: filters.modules,
              includeAllData: filters.includeAllData
            })
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ [Calendar] - API Error:', {
              status: response.status,
              statusText: response.statusText,
              errorData
            });
            throw new Error(errorData.message || `HTTP ${response.status}: Failed to generate report`);
          }

          const data = await response.json();
          
          if (data.success) {
            
            // Get current events from store for additional context
            const currentState = get();
            
            // Prepare report data in the expected format
            // Note: API returns { data: reportData } where reportData already has the correct structure
            const reportData = data.data;
            
            
            // Generate and open HTML report in new tab
            generateCalendarReport({ 
              reportData, 
              events: currentState.events 
            });
            
          } else {
            throw new Error(data.message || 'Failed to generate filtered report');
          }
        } catch (error) {
          console.error('❌ [Calendar] - Error generating filtered report:', error);
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to generate filtered report';
          });
          throw error;
        }
      },

      // Navigation methods
      setCurrentDate: (date: Date) => {
        set((state) => {
          state.currentDate = date;
        });
      },

      navigateToMonth: (year: number, month: number) => {
        const newDate = new Date(year, month, 1);
        
        set((state) => {
          state.currentDate = newDate;
        });
        
        // Calculate date range for the month
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        
        console.log('📅 [Calendar] - Navigating to month:', { year, month, startDateStr, endDateStr });
        
        // Only clear cache if we're navigating to a truly different month
        if (lastFetchedRange && 
            (lastFetchedRange.startDate !== startDateStr || lastFetchedRange.endDate !== endDateStr)) {
          console.log('📅 [Calendar] - Different month detected, clearing cache');
          lastFetchedRange = null;
        }
        
        // Fetch events for the new month
        const updatedState = get();
        updatedState.fetchEvents(startDateStr, endDateStr);
      },

      goToPreviousMonth: () => {
        const currentState = get();
        const currentDate = currentState.currentDate;
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        currentState.navigateToMonth(newDate.getFullYear(), newDate.getMonth());
      },

      goToNextMonth: () => {
        const currentState = get();
        const currentDate = currentState.currentDate;
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        currentState.navigateToMonth(newDate.getFullYear(), newDate.getMonth());
      },

      goToToday: () => {
        const today = new Date();
        const currentState = get();
        currentState.navigateToMonth(today.getFullYear(), today.getMonth());
      }
    })),
    {
      name: 'calendar-store',
    }
  )
);
