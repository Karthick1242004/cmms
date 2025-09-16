'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  Wrench,
  Shield,
  Ticket,
  Activity,
  UserCheck,
  Clock,
  FileText,
  Download
} from 'lucide-react';

export interface ReportFilterOptions {
  modules: {
    dailyActivities: boolean;
    maintenance: boolean;
    safetyInspections: boolean;
    tickets: boolean;
    shifts: boolean;
    leaves: boolean;
    overtime: boolean;
    events: boolean;
  };
  includeAllData: boolean;
}

interface CalendarReportFilterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (filters: ReportFilterOptions) => void;
  isGenerating?: boolean;
}

const moduleOptions = [
  {
    key: 'dailyActivities' as keyof ReportFilterOptions['modules'],
    label: 'Daily Activity Log',
    description: 'Daily work activities and downtime records',
    icon: Activity,
    color: 'text-blue-600'
  },
  {
    key: 'maintenance' as keyof ReportFilterOptions['modules'],
    label: 'Maintenance Activities',
    description: 'Scheduled and completed maintenance tasks',
    icon: Wrench,
    color: 'text-orange-600'
  },
  {
    key: 'safetyInspections' as keyof ReportFilterOptions['modules'],
    label: 'Safety Inspections',
    description: 'Safety inspection schedules and records',
    icon: Shield,
    color: 'text-green-600'
  },
  {
    key: 'tickets' as keyof ReportFilterOptions['modules'],
    label: 'Support Tickets',
    description: 'Issue tracking and resolution tickets',
    icon: Ticket,
    color: 'text-red-600'
  },
  {
    key: 'shifts' as keyof ReportFilterOptions['modules'],
    label: 'Work Shifts',
    description: 'Employee shift schedules and assignments',
    icon: UserCheck,
    color: 'text-purple-600'
  },
  {
    key: 'leaves' as keyof ReportFilterOptions['modules'],
    label: 'Employee Leaves',
    description: 'Leave requests and absence records',
    icon: Calendar,
    color: 'text-gray-600'
  },
  {
    key: 'overtime' as keyof ReportFilterOptions['modules'],
    label: 'Overtime Records',
    description: 'Overtime work hours and schedules',
    icon: Clock,
    color: 'text-yellow-600'
  },
  {
    key: 'events' as keyof ReportFilterOptions['modules'],
    label: 'Calendar Events',
    description: 'General calendar events and meetings',
    icon: FileText,
    color: 'text-indigo-600'
  }
];

export function CalendarReportFilterDialog({
  isOpen,
  onClose,
  onGenerate,
  isGenerating = false
}: CalendarReportFilterDialogProps) {
  const [filters, setFilters] = useState<ReportFilterOptions>({
    modules: {
      dailyActivities: true,
      maintenance: true,
      safetyInspections: true,
      tickets: true,
      shifts: true,
      leaves: true,
      overtime: true,
      events: true
    },
    includeAllData: true
  });

  const handleModuleToggle = (moduleKey: keyof ReportFilterOptions['modules']) => {
    setFilters(prev => ({
      ...prev,
      modules: {
        ...prev.modules,
        [moduleKey]: !prev.modules[moduleKey]
      }
    }));
  };

  const handleSelectAll = () => {
    const allSelected = Object.values(filters.modules).every(Boolean);
    const newState = !allSelected;
    
    setFilters(prev => ({
      ...prev,
      modules: Object.keys(prev.modules).reduce((acc, key) => {
        acc[key as keyof ReportFilterOptions['modules']] = newState;
        return acc;
      }, {} as ReportFilterOptions['modules'])
    }));
  };

  const handleGenerate = () => {
    const selectedModules = Object.values(filters.modules).some(Boolean);
    if (!selectedModules) {
      // At least one module must be selected
      return;
    }
    onGenerate(filters);
  };

  const selectedCount = Object.values(filters.modules).filter(Boolean).length;
  const allSelected = Object.values(filters.modules).every(Boolean);
  const noneSelected = Object.values(filters.modules).every(val => !val);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-600" />
            Export Calendar Report
          </DialogTitle>
          <DialogDescription>
            Select which modules to include in your calendar report. All data for selected modules will be included without truncation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="text-xs"
              >
                {allSelected ? 'Deselect All' : 'Select All'}
              </Button>
              <span className="text-sm text-muted-foreground">
                {selectedCount} of {moduleOptions.length} modules selected
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeAllData"
                checked={filters.includeAllData}
                onCheckedChange={(checked) => 
                  setFilters(prev => ({ ...prev, includeAllData: !!checked }))
                }
              />
              <Label htmlFor="includeAllData" className="text-sm font-medium">
                Include all data (no limits)
              </Label>
            </div>
          </div>

          <Separator />

          {/* Module Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">
              Select Modules to Include:
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {moduleOptions.map((module) => {
                const Icon = module.icon;
                return (
                  <div
                    key={module.key}
                    className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                      filters.modules[module.key]
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleModuleToggle(module.key)}
                  >
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        checked={filters.modules[module.key]}
                        onCheckedChange={() => handleModuleToggle(module.key)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <Icon className={`h-4 w-4 ${module.color}`} />
                          <span className="text-sm font-medium text-gray-900">
                            {module.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {module.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Data Inclusion Options */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-yellow-800 mb-2">
              Data Inclusion Settings
            </h4>
            <div className="space-y-2 text-sm text-yellow-700">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                <span>
                  <strong>Include all data:</strong> Shows complete records without truncation
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                <span>
                  <strong>Limited data:</strong> Shows first 50-100 records per module (faster)
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>
            Cancel
          </Button>
          <Button 
            onClick={handleGenerate}
            disabled={noneSelected || isGenerating}
            className="min-w-[120px]"
          >
            {isGenerating ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Generating...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Generate Report</span>
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
