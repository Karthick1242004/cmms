'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Wrench, 
  Clipboard, 
  FileText, 
  Shield, 
  Building,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import type { AssetActivityLogEntry } from '@/types/asset-activity-log';

// Demo data showing what the asset activity log would look like
const demoActivityLogs: AssetActivityLogEntry[] = [
  {
    id: "1",
    assetId: "asset_001",
    assetName: "Industrial Generator #1",
    module: "maintenance",
    activityType: "maintenance_record_created",
    title: "Maintenance Started: Preventive Maintenance",
    description: "Preventive maintenance work started on Industrial Generator #1 by John Smith",
    priority: "high",
    status: "active",
    createdBy: "user_001",
    createdByName: "John Smith",
    assignedTo: "user_001",
    assignedToName: "John Smith",
    referenceId: "maint_001",
    referenceName: "PM-2024-001",
    referenceType: "maintenance_record",
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z",
    department: "Operations",
    departmentId: "dept_001",
    location: "Building A - Floor 2",
    metadata: {
      originalData: {
        maintenanceType: "Preventive Maintenance",
        technicianId: "user_001"
      },
      duration: 2.5,
      notes: "Maintenance type: Preventive Maintenance",
      customFields: {
        maintenanceType: "Preventive Maintenance",
        condition: "good",
        technicianId: "user_001"
      }
    },
    editHistory: [],
    isEdited: false,
    isDeleted: false
  },
  {
    id: "2",
    assetId: "asset_001",
    assetName: "Industrial Generator #1",
    module: "daily_log",
    activityType: "daily_log_created",
    title: "Daily Activity Logged: Unusual Noise Detected",
    description: "Daily activity logged for Industrial Generator #1 in Engine Room",
    priority: "medium",
    status: "completed",
    createdBy: "user_002",
    createdByName: "Sarah Johnson",
    assignedTo: "user_002",
    assignedToName: "Sarah Johnson",
    referenceId: "daily_001",
    referenceType: "daily_log_activity",
    createdAt: "2024-01-14T14:30:00Z",
    updatedAt: "2024-01-14T16:45:00Z",
    completedAt: "2024-01-14T16:45:00Z",
    department: "Operations",
    departmentId: "dept_001",
    metadata: {
      originalData: {
        area: "Engine Room",
        time: "14:30",
        natureOfProblem: "Unusual Noise Detected",
        solution: "Lubricated bearings, noise reduced"
      },
      notes: "Problem: Unusual Noise Detected\nSolution: Lubricated bearings, noise reduced",
      customFields: {
        area: "Engine Room",
        time: "14:30",
        attendedById: "user_002"
      }
    },
    editHistory: [],
    isEdited: false,
    isDeleted: false
  },
  {
    id: "3",
    assetId: "asset_001",
    assetName: "Industrial Generator #1",
    module: "tickets",
    activityType: "ticket_created",
    title: "Ticket Created: WO-2024-001",
    description: "Repair work order ticket created for Industrial Generator #1 by Mike Davis",
    priority: "critical",
    status: "active",
    createdBy: "user_003",
    createdByName: "Mike Davis",
    assignedTo: "user_001",
    assignedToName: "John Smith",
    referenceId: "ticket_001",
    referenceType: "ticket",
    createdAt: "2024-01-13T11:15:00Z",
    updatedAt: "2024-01-13T11:15:00Z",
    department: "Maintenance",
    departmentId: "dept_002",
    metadata: {
      originalData: {
        ticketNumber: "WO-2024-001",
        issueType: "Repair",
        severity: "critical"
      },
      notes: "Issue: Repair\nSeverity: critical\nReporter: Mike Davis",
      customFields: {
        ticketNumber: "WO-2024-001",
        issueType: "Repair",
        severity: "critical",
        reporterId: "user_003"
      }
    },
    editHistory: [],
    isEdited: false,
    isDeleted: false
  },
  {
    id: "4",
    assetId: "asset_001",
    assetName: "Industrial Generator #1",
    module: "safety_inspection",
    activityType: "safety_inspection_completed",
    title: "Safety Inspection Completed: Monthly Safety Check",
    description: "Safety inspection completed for Industrial Generator #1 by Emma Wilson",
    priority: "high",
    status: "verified",
    createdBy: "user_004",
    createdByName: "Emma Wilson",
    assignedTo: "user_004",
    assignedToName: "Emma Wilson",
    verifiedBy: "admin_001",
    verifiedByName: "Admin User",
    referenceId: "safety_001",
    referenceType: "safety_inspection_record",
    createdAt: "2024-01-12T08:00:00Z",
    updatedAt: "2024-01-12T17:30:00Z",
    verifiedAt: "2024-01-12T17:30:00Z",
    department: "Safety",
    departmentId: "dept_003",
    metadata: {
      originalData: {
        inspectionType: "Monthly Safety Check",
        complianceScore: 95,
        violations: 0
      },
      duration: 1.5,
      notes: "Inspection type: Monthly Safety Check\nCompliance Score: 95%\nViolations: 0",
      customFields: {
        inspectionType: "Monthly Safety Check",
        complianceScore: 95,
        violations: 0,
        inspectorId: "user_004"
      }
    },
    editHistory: [],
    isEdited: false,
    isDeleted: false
  }
];

interface ActivityLogDemoProps {
  assetId: string;
  assetName: string;
}

export function ActivityLogDemo({ assetId, assetName }: ActivityLogDemoProps) {
  const [selectedActivity, setSelectedActivity] = useState<AssetActivityLogEntry | null>(null);

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'maintenance': return <Wrench className="h-4 w-4 text-blue-600" />;
      case 'daily_log': return <Clipboard className="h-4 w-4 text-green-600" />;
      case 'tickets': return <FileText className="h-4 w-4 text-orange-600" />;
      case 'safety_inspection': return <Shield className="h-4 w-4 text-red-600" />;
      case 'assets': return <Building className="h-4 w-4 text-purple-600" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'verified': return <Shield className="h-4 w-4 text-emerald-500" />;
      case 'pending': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Asset Activity Log Demo
        </CardTitle>
        <CardDescription>
          This demo shows how activities from all modules (Maintenance, Daily Log, Tickets, Safety Inspection) 
          would be consolidated into a unified activity log for {assetName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {demoActivityLogs.map((activity) => (
            <div
              key={activity.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedActivity(activity)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getModuleIcon(activity.module)}
                  <div>
                    <h4 className="font-medium">{activity.title}</h4>
                    <p className="text-sm text-muted-foreground capitalize">
                      {activity.module.replace('_', ' ')} • {activity.activityType.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getPriorityColor(activity.priority)}>
                    {activity.priority}
                  </Badge>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(activity.status)}
                    <span className="text-sm capitalize">{activity.status}</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-3">
                {activity.description}
              </p>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>Created by {activity.createdByName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(activity.createdAt)}</span>
                  </div>
                </div>
                <div>
                  {activity.verifiedByName && (
                    <span className="text-green-600">
                      ✓ Verified by {activity.verifiedByName}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">🚀 Key Features Demonstrated:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Unified Timeline:</strong> All activities from different modules in chronological order</li>
            <li>• <strong>Module Integration:</strong> Maintenance, Daily Log, Tickets, Safety Inspections</li>
            <li>• <strong>Rich Context:</strong> Priority, status, assignments, and verification details</li>
            <li>• <strong>Audit Trail:</strong> Complete history of who did what and when</li>
            <li>• <strong>Admin Controls:</strong> Edit/delete capabilities with reason tracking</li>
            <li>• <strong>Visual Indicators:</strong> Icons, badges, and colors for quick identification</li>
          </ul>
        </div>

        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 className="font-semibold text-green-900 mb-2">📊 Summary Statistics:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-green-700">{demoActivityLogs.length}</div>
              <div className="text-green-600">Total Activities</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-700">
                {demoActivityLogs.filter(a => a.status === 'active').length}
              </div>
              <div className="text-blue-600">Active</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-emerald-700">
                {demoActivityLogs.filter(a => a.status === 'verified').length}
              </div>
              <div className="text-emerald-600">Verified</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-700">
                {demoActivityLogs.filter(a => a.priority === 'critical' || a.priority === 'high').length}
              </div>
              <div className="text-orange-600">High Priority</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
