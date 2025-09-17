'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MonthYearPickerProps {
  currentDate: Date;
  onDateChange: (year: number, month: number) => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  className?: string;
}

export function MonthYearPicker({
  currentDate,
  onDateChange,
  onPreviousMonth,
  onNextMonth,
  onToday,
  className
}: MonthYearPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth().toString());

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i); // 10 years before and after current year
  
  const months = [
    { value: '0', label: 'January' },
    { value: '1', label: 'February' },
    { value: '2', label: 'March' },
    { value: '3', label: 'April' },
    { value: '4', label: 'May' },
    { value: '5', label: 'June' },
    { value: '6', label: 'July' },
    { value: '7', label: 'August' },
    { value: '8', label: 'September' },
    { value: '9', label: 'October' },
    { value: '10', label: 'November' },
    { value: '11', label: 'December' }
  ];

  const handleApply = () => {
    const year = parseInt(selectedYear);
    const month = parseInt(selectedMonth);
    onDateChange(year, month);
    setIsOpen(false);
  };

  const handleToday = () => {
    onToday();
    setIsOpen(false);
  };

  // Update local state when current date changes
  useEffect(() => {
    if (currentDate) {
      setSelectedYear(currentDate.getFullYear().toString());
      setSelectedMonth(currentDate.getMonth().toString());
    }
  }, [currentDate]);

  const currentMonthYear = currentDate ? currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  }) : new Date().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Previous Month Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onPreviousMonth}
        className="h-8 w-8 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Month/Year Picker Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="h-8 px-3 text-sm font-medium min-w-[140px] justify-center"
          >
            <Calendar className="h-4 w-4 mr-2" />
            {currentMonthYear}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Month & Year</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Year Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Month Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Month</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleToday}>
                Go to Today
              </Button>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleApply}>
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Next Month Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onNextMonth}
        className="h-8 w-8 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
