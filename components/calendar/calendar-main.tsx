'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Filter, 
  Download, 
  Plus, 
  Clock,
  Users,
  Settings
} from 'lucide-react';
import { useCalendarStore } from '@/stores/calendar-store';
import { CalendarFilters } from './calendar-filters';
import { CalendarEventDialog } from './calendar-event-dialog';
import { AddLeaveDialog } from './add-leave-dialog';
import { AddOvertimeDialog } from './add-overtime-dialog';
import { CalendarSkeleton } from './calendar-skeleton';
import { LoadingSpinner } from '@/components/loading-spinner';
import { CalendarReportFilterDialog, ReportFilterOptions } from './calendar-report-filter-dialog';
import { MonthYearPicker } from './month-year-picker';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

export function CalendarMain() {
  const { user } = useAuthStore();
  const calendarRef = useRef<FullCalendar>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddLeave, setShowAddLeave] = useState(false);
  const [showAddOvertime, setShowAddOvertime] = useState(false);
  const [showReportFilter, setShowReportFilter] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  
  // Refs to prevent multiple initializations and cleanup timeouts
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialized = useRef(false);
  const isNavigatingRef = useRef(false);

  const {
    events,
    filters,
    selectedEvent,
    isLoading,
    error,
    viewType,
    currentDate,
    fetchEvents,
    setSelectedEvent,
    setViewType,
    setSelectedDate,
    generateReport,
    generateFilteredReport,
    navigateToMonth,
    goToPreviousMonth,
    goToNextMonth,
    goToToday
  } = useCalendarStore();

  // Use store's currentDate for title
  const calendarTitle = currentDate ? currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  }) : new Date().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  // Fetch events when component mounts - using ref to avoid dependencies
  const fetchEventsRef = useRef(fetchEvents);
  fetchEventsRef.current = fetchEvents;

  useEffect(() => {
    // Prevent multiple initializations
    if (isInitialized.current) {
      console.log('📅 [Calendar] - Already initialized, skipping...');
      return;
    }

    console.log('📅 [Calendar] - Initializing calendar component...');
    isInitialized.current = true;

    const initializeCalendar = () => {
      const today = new Date();
      
      // Only initialize if currentDate is truly uninitialized
      if (!currentDate || currentDate.getFullYear() === 1970) {
        console.log('📅 [Calendar] - Setting initial date to current month');
        navigateToMonth(today.getFullYear(), today.getMonth());
      } else {
        // If currentDate is already set, just fetch events for that month
        console.log('📅 [Calendar] - Current date already set, fetching events...');
        const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        fetchEventsRef.current(
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        );
      }
    };
    
    // Small delay to ensure calendar component is ready
    timeoutRef.current = setTimeout(initializeCalendar, 100);

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      isInitialized.current = false; // Reset on unmount
    };
  }, []); // Empty dependency array to run only once

  // Filter events based on current filters - memoized for performance
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const { type, department, priority, status } = event.extendedProps;

      // Type filters
      if (!filters.showLeaves && type === 'leave') return false;
      if (!filters.showShifts && type === 'shift') return false;
      if (!filters.showOvertime && type === 'overtime') return false;
      if (!filters.showSafetyInspections && type === 'safety-inspection') return false;
      if (!filters.showMaintenance && type === 'maintenance') return false;
      if (!filters.showTickets && type === 'ticket') return false;
      if (!filters.showDailyActivities && type === 'daily-activity') return false;
      if (!filters.showHolidays && type === 'holiday') return false;

      // Department filter
      if (filters.departments.length > 0 && department && !filters.departments.includes(department)) {
        return false;
      }

      // Priority filter
      if (filters.priorities.length > 0 && priority && !filters.priorities.includes(priority)) {
        return false;
      }

      // Status filter
      if (filters.statuses.length > 0 && status && !filters.statuses.includes(status)) {
        return false;
      }

      return true;
    });
  }, [events, filters]);

  const handleEventClick = useCallback((clickInfo: any) => {
    const eventData = {
      id: clickInfo.event.id,
      title: clickInfo.event.title,
      start: clickInfo.event.start?.toISOString() || '',
      end: clickInfo.event.end?.toISOString(),
      color: clickInfo.event.backgroundColor,
      extendedProps: clickInfo.event.extendedProps
    };
    setSelectedEvent(eventData);
  }, [setSelectedEvent]);

  const handleDateClick = useCallback((dateInfo: any) => {
    setSelectedDate(dateInfo.dateStr);
  }, [setSelectedDate]);

  // timeoutRef and isNavigatingRef already declared above

  const handleDatesSet = useCallback((dateInfo: any) => {
    // Skip if we're in the middle of programmatic navigation to prevent conflicts
    if (isNavigatingRef.current) {
      console.log('📅 [Calendar] - Skipping datesSet during navigation');
      return;
    }

    // Skip if component is not yet initialized to prevent early fetches
    if (!isInitialized.current) {
      console.log('📅 [Calendar] - Skipping datesSet during initialization');
      return;
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce the API call to prevent rapid requests
    timeoutRef.current = setTimeout(() => {
      const startDate = dateInfo.start.toISOString().split('T')[0];
      const endDate = dateInfo.end.toISOString().split('T')[0];
      
      console.log('📅 [Calendar] - datesSet triggered fetch:', { startDate, endDate });
      fetchEventsRef.current(startDate, endDate);
    }, 500); // Increased delay to 500ms for better stability
  }, []);

  const handleViewChange = useCallback((view: 'month' | 'week' | 'day' | 'list') => {
    setViewType(view);
    const calendar = calendarRef.current?.getApi();
    if (calendar) {
      const viewMap = {
        month: 'dayGridMonth',
        week: 'timeGridWeek',
        day: 'timeGridDay',
        list: 'listWeek'
      };
      calendar.changeView(viewMap[view]);
    }
  }, [setViewType]);

  // Keep FullCalendar view in sync with store
  useEffect(() => {
    const calendar = calendarRef.current?.getApi();
    if (calendar && viewType) {
      const viewMap = {
        month: 'dayGridMonth',
        week: 'timeGridWeek',
        day: 'timeGridDay',
        list: 'listWeek'
      };
      
      const currentView = calendar.view.type;
      const expectedView = viewMap[viewType];
      
      if (currentView !== expectedView) {
        calendar.changeView(expectedView);
      }
    }
  }, [viewType, events]); // Re-sync when events change

  // Sync FullCalendar with store's currentDate
  useEffect(() => {
    const calendar = calendarRef.current?.getApi();
    if (calendar && currentDate) {
      // Get the calendar's current date
      const calendarCurrentDate = calendar.getDate();
      
      // Check if we need to navigate the calendar to match store's currentDate
      if (calendarCurrentDate && 
          (calendarCurrentDate.getFullYear() !== currentDate.getFullYear() ||
           calendarCurrentDate.getMonth() !== currentDate.getMonth())) {
        
        // Set navigation flag to prevent conflicts during programmatic navigation
        isNavigatingRef.current = true;
        calendar.gotoDate(currentDate);
        
        // Clear the flag after navigation completes
        setTimeout(() => {
          isNavigatingRef.current = false;
        }, 500);
      }
    }
  }, [currentDate]);

  const handleGenerateReport = useCallback(async () => {
    setShowReportFilter(true);
  }, []);

  const handleGenerateFilteredReport = useCallback(async (filters: ReportFilterOptions) => {
    setIsGeneratingReport(true);
    setShowReportFilter(false);
    
    try {
      // Calculate date range based on filter options
      let startDate: string;
      let endDate: string;
      
      const { type, year, months, startDate: customStart, endDate: customEnd } = filters.dateRange;
      
      switch (type) {
        case 'current_month': {
          const now = new Date();
          const start = new Date(now.getFullYear(), now.getMonth(), 1);
          const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          startDate = start.toISOString().split('T')[0];
          endDate = end.toISOString().split('T')[0];
          break;
        }
        case 'single_month': {
          const month = months?.[0] || 0;
          const start = new Date(year!, month, 1);
          const end = new Date(year!, month + 1, 0);
          startDate = start.toISOString().split('T')[0];
          endDate = end.toISOString().split('T')[0];
          break;
        }
        case 'multiple_months': {
          if (!months || months.length === 0) {
            throw new Error('No months selected');
          }
          const sortedMonths = [...months].sort((a, b) => a - b);
          const firstMonth = sortedMonths[0];
          const lastMonth = sortedMonths[sortedMonths.length - 1];
          const start = new Date(year!, firstMonth, 1);
          const end = new Date(year!, lastMonth + 1, 0);
          startDate = start.toISOString().split('T')[0];
          endDate = end.toISOString().split('T')[0];
          break;
        }
        case 'whole_year': {
          const start = new Date(year!, 0, 1);
          const end = new Date(year!, 11, 31);
          startDate = start.toISOString().split('T')[0];
          endDate = end.toISOString().split('T')[0];
          break;
        }
        case 'custom_range': {
          if (!customStart || !customEnd) {
            throw new Error('Custom date range requires both start and end dates');
          }
          startDate = customStart;
          endDate = customEnd;
          break;
        }
        default: {
          // Fallback to current calendar view
          const calendar = calendarRef.current?.getApi();
          if (calendar) {
            const view = calendar.view;
            startDate = view.activeStart.toISOString().split('T')[0];
            endDate = view.activeEnd.toISOString().split('T')[0];
          } else {
            throw new Error('Unable to determine date range');
          }
        }
      }
      
      await generateFilteredReport(startDate, endDate, filters);
    } catch (error) {
      console.error('Failed to generate filtered report:', error);
    } finally {
      setIsGeneratingReport(false);
    }
  }, [generateFilteredReport]);


  // Show skeleton on initial load or error
  if (isLoading && events.length === 0) {
    return <CalendarSkeleton />;
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          <p className="mb-4">Error loading calendar: {error}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Team Calendar</h1>
            <p className="text-muted-foreground">
              Manage schedules, leaves, overtime, and work activities
            </p>
          </div>
          <Badge variant="outline" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {filteredEvents.length} Events
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(showFilters && "bg-accent")}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          
          {(user?.accessLevel === 'super_admin' || user?.accessLevel === 'department_admin') && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddLeave(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Leave
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddOvertime(true)}
              >
                <Clock className="h-4 w-4 mr-2" />
                Add Overtime
              </Button>
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateReport}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <CalendarFilters onClose={() => setShowFilters(false)} />
      )}

      {/* Calendar Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            {/* Month/Year Navigation */}
            <div className="flex items-center gap-4">
              <MonthYearPicker
                currentDate={currentDate}
                onDateChange={navigateToMonth}
                onPreviousMonth={goToPreviousMonth}
                onNextMonth={goToNextMonth}
                onToday={goToToday}
              />
              <div className="text-sm text-muted-foreground">
                {filteredEvents.length} events this month
              </div>
            </div>

            {/* View Type Controls */}
            <div className="flex items-center gap-1">
              {(['month', 'week', 'day'] as const).map((view) => (
                <Button
                  key={view}
                  variant={viewType === view ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleViewChange(view)}
                  className={cn(
                    'capitalize transition-all',
                    viewType === view && 'bg-primary text-primary-foreground shadow-sm'
                  )}
                >
                  {view}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="calendar-container relative">
            {/* Show overlay spinner only on initial load or when no events have been loaded yet */}
            {isLoading && events.length === 0 && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="flex items-center justify-center text-muted-foreground">
                  <LoadingSpinner className="mr-2" />
                  Loading calendar events...
                </div>
              </div>
            )}
            
            {/* Show subtle loading indicator in top corner when refreshing with existing data */}
            {isLoading && events.length > 0 && (
              <div className="absolute top-2 right-2 z-10 bg-background/90 rounded-md px-2 py-1 text-xs flex items-center gap-1 text-muted-foreground border shadow-sm">
                <LoadingSpinner size="sm" />
                Refreshing...
              </div>
            )}
            
            <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView={
                  viewType === 'month' ? 'dayGridMonth' :
                  viewType === 'week' ? 'timeGridWeek' :
                  viewType === 'day' ? 'timeGridDay' :
                  'listWeek'
                }
                initialDate={currentDate || new Date()}
                headerToolbar={false} // We're using custom header
                height="auto"
                events={filteredEvents}
                eventClick={handleEventClick}
                dateClick={handleDateClick}
                datesSet={handleDatesSet}
                eventDisplay="block"
                dayMaxEvents={3}
                moreLinkClick="popover"
                weekends={true}
                selectable={true}
                selectMirror={true}
                dayHeaderFormat={{ weekday: 'short' }}
                eventTimeFormat={{
                  hour: 'numeric',
                  minute: '2-digit',
                  meridiem: 'short'
                }}
                slotMinTime="06:00:00"
                slotMaxTime="22:00:00"
                businessHours={{
                  daysOfWeek: [1, 2, 3, 4, 5, 6], // Monday - Saturday
                  startTime: '08:00',
                  endTime: '18:00',
                }}
                eventClassNames="cursor-pointer hover:opacity-80 transition-opacity"
                dayCellClassNames="hover:bg-accent/50 transition-colors"
                viewDidMount={(info) => {
                  // Update store if view changed from outside
                  const storeViewMap: { [key: string]: 'month' | 'week' | 'day' | 'list' } = {
                    'dayGridMonth': 'month',
                    'timeGridWeek': 'week',
                    'timeGridDay': 'day',
                    'listWeek': 'list'
                  };
                  const storeView = storeViewMap[info.view.type];
                  if (storeView && storeView !== viewType) {
                    setViewType(storeView);
                  }
                }}
              />
          </div>
        </CardContent>
      </Card>

      {/* Event Details Dialog */}
      {selectedEvent && (
        <CalendarEventDialog
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}

      {/* Add Leave Dialog */}
      <AddLeaveDialog
        isOpen={showAddLeave}
        onClose={() => setShowAddLeave(false)}
      />

      {/* Add Overtime Dialog */}
      <AddOvertimeDialog
        isOpen={showAddOvertime}
        onClose={() => setShowAddOvertime(false)}
      />

      {/* Report Filter Dialog */}
      <CalendarReportFilterDialog
        isOpen={showReportFilter}
        onClose={() => setShowReportFilter(false)}
        onGenerate={handleGenerateFilteredReport}
        isGenerating={isGeneratingReport}
      />
    </div>
  );
}
