'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Wrench, 
  AlertCircle, 
  CheckCircle,
  Building,
  Hash,
  FileText,
  Eye,
  X
} from 'lucide-react';
import { useDailyLogActivitiesStore } from '@/stores/daily-log-activities-store';
import { format } from 'date-fns';
import type { DailyLogActivity } from '@/types/daily-log-activity';

const statusColors = {
  'open': 'bg-red-100 text-red-800 border-red-200',
  'in-progress': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'resolved': 'bg-blue-100 text-blue-800 border-blue-200',
  'verified': 'bg-green-100 text-green-800 border-green-200',
};

const priorityColors = {
  'low': 'bg-gray-100 text-gray-800 border-gray-200',
  'medium': 'bg-blue-100 text-blue-800 border-blue-200',
  'high': 'bg-orange-100 text-orange-800 border-orange-200',
  'critical': 'bg-red-100 text-red-800 border-red-200',
};

interface DailyLogActivityViewProps {
  isOpen: boolean;
  onClose: () => void;
  activity: DailyLogActivity | null;
}

export function DailyLogActivityView({ isOpen, onClose, activity }: DailyLogActivityViewProps) {
  if (!activity) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Activity Log Details
            </DialogTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-semibold text-lg">
                        {format(new Date(activity.date), 'EEEE, MMMM dd, yyyy')}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {activity.time}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Hash className="h-4 w-4" />
                    <span>ID: {activity._id}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge 
                    variant="outline"
                    className={statusColors[activity.status]}
                  >
                    {activity.status.replace('-', ' ')}
                  </Badge>
                  <Badge 
                    variant="outline"
                    className={priorityColors[activity.priority]}
                  >
                    {activity.priority} priority
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location & Asset Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location & Department
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Area</label>
                  <p className="text-base">{activity.area}</p>
                </div>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Department</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <p className="text-base">{activity.departmentName}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Asset Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Asset Name</label>
                  <p className="text-base font-medium">{activity.assetName}</p>
                </div>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Asset ID</label>
                  <p className="text-sm text-muted-foreground font-mono">{activity.assetId}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Problem Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Problem Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nature of Problem</label>
                <div className="mt-2 p-3 bg-muted/50 rounded-md">
                  <p className="text-base">{activity.natureOfProblem}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Comments / Solution</label>
                <div className="mt-2 p-3 bg-muted/50 rounded-md">
                  <p className="text-base">{activity.commentsOrSolution}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personnel & Verification */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-4 w-4" />
                Personnel & Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Attended By</label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="text-base">{activity.attendedByName}</p>
                  </div>
                </div>
                
                {activity.verifiedBy && activity.verifiedByName && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Verified By</label>
                    <div className="flex items-center gap-2 mt-1">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <p className="text-base">{activity.verifiedByName}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Audit Trail */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created By</label>
                  <p className="text-base">{activity.createdByName}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(activity.createdAt), 'MMM dd, yyyy • h:mm a')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(activity.updatedAt), 'MMM dd, yyyy • h:mm a')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}