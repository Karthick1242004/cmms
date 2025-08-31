'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { MoreHorizontal, CheckCircle, XCircle, Clock, User, Calendar, Eye, Shield, MessageSquare, History } from "lucide-react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { useDailyLogActivitiesStore } from "@/stores/daily-log-activities-store";
import { useAuthStore } from "@/stores/auth-store";
import type { DailyLogActivity } from "@/types/daily-log-activity";
import { format } from 'date-fns';
import { ActivityHistoryDialog } from './activity-history-dialog';

interface DailyLogActivityRecordsTableProps {
  records: DailyLogActivity[];
  isLoading: boolean;
  isAdmin: boolean;
}

export function DailyLogActivityRecordsTable({ records, isLoading, isAdmin }: DailyLogActivityRecordsTableProps) {
  const { verifyActivity } = useDailyLogActivitiesStore();
  const { user } = useAuthStore();
  
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DailyLogActivity | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const handleVerifyClick = (record: DailyLogActivity) => {
    setSelectedRecord(record);
    setAdminNotes("");
    setVerifyDialogOpen(true);
  };

  const handleDetailClick = (record: DailyLogActivity) => {
    setSelectedRecord(record);
    setDetailDialogOpen(true);
  };

  const handleHistoryClick = (record: DailyLogActivity) => {
    setSelectedRecord(record);
    setHistoryDialogOpen(true);
  };

  const handleVerifyConfirm = async () => {
    if (selectedRecord) {
      const success = await verifyActivity(selectedRecord._id, adminNotes);
      if (success) {
        setSelectedRecord(null);
        setVerifyDialogOpen(false);
        setAdminNotes("");
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "default";
      case "pending_verification": return "secondary";
      case "verified": return "default";
      case "failed": return "destructive";
      default: return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4" />;
      case "pending_verification": return <Clock className="h-4 w-4" />;
      case "verified": return <Shield className="h-4 w-4" />;
      case "failed": return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy");
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const getProgressPercentage = (record: DailyLogActivity) => {
    switch (record.status) {
      case "open": return 0;
      case "in-progress": return 50;
      case "completed": return 100;
      case "pending_verification": return 90;
      case "verified": return 100;
      default: return 0;
    }
  };

  const canVerifyRecord = (record: DailyLogActivity) => {
    // Only admins can verify activities
    if (!isAdmin) return false;
    // Activity must be completed or pending verification and not already verified
    return (record.status === 'completed' || record.status === 'pending_verification') && !record.adminVerified;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <LoadingSpinner />
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No Activity Records</h3>
            <p className="text-gray-600">No completed activities found. Activities will appear here once they are completed and ready for verification.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Activity Records</CardTitle>
          <CardDescription>
            Completed activities awaiting verification and verified activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset & Date</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Overall Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record._id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <div className="font-medium">{record.assetName}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(record.date)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{record.assignedToName || record.attendedByName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm">{formatDate(record.date)}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatTime(record.time)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>1.0h</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(record.status)}
                        <Badge 
                          variant="outline"
                          className={getStatusColor(record.status) === 'destructive' ? 'bg-red-100 text-red-800 border-red-200' : ''}
                        >
                          {record.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="w-full max-w-[100px]">
                        <Progress value={getProgressPercentage(record)} className="h-2" />
                        <div className="text-xs text-muted-foreground mt-1">
                          {getProgressPercentage(record)}%
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-1">
                        {record.adminVerified ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                            <Shield className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        ) : record.status === 'pending_verification' ? (
                          <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                            Pending
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                            {record.status.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDetailClick(record)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleHistoryClick(record)}>
                            <History className="mr-2 h-4 w-4" />
                            View History
                          </DropdownMenuItem>
                          {canVerifyRecord(record) && (
                            <DropdownMenuItem
                              onClick={() => handleVerifyClick(record)}
                              className="text-green-600 focus:text-green-600"
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              Verify Record
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Verification Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Activity Record</DialogTitle>
            <DialogDescription>
              Review and verify the activity completed by {selectedRecord?.attendedByName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Asset:</strong> {selectedRecord.assetName}
                </div>
                <div>
                  <strong>Date:</strong> {formatDate(selectedRecord.date)}
                </div>
                <div>
                  <strong>Time:</strong> {selectedRecord.time}
                </div>
                <div>
                  <strong>Status:</strong> {selectedRecord.status.replace('_', ' ')}
                </div>
                <div>
                  <strong>Problem:</strong> {selectedRecord.natureOfProblem}
                </div>
                <div>
                  <strong>Solution:</strong> {selectedRecord.commentsOrSolution}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminNotes">Admin Verification Notes</Label>
                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add verification notes or feedback..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleVerifyConfirm} className="bg-green-600 hover:bg-green-700">
              <Shield className="mr-2 h-4 w-4" />
              Verify Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Activity Details</DialogTitle>
            <DialogDescription>
              Detailed information about the activity record
            </DialogDescription>
          </DialogHeader>
          
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Asset:</strong> {selectedRecord.assetName}
                </div>
                <div>
                  <strong>Date:</strong> {formatDate(selectedRecord.date)}
                </div>
                <div>
                  <strong>Time:</strong> {selectedRecord.time}
                </div>
                <div>
                  <strong>Area:</strong> {selectedRecord.area}
                </div>
                <div>
                  <strong>Department:</strong> {selectedRecord.departmentName}
                </div>
                <div>
                  <strong>Assigned To:</strong> {selectedRecord.assignedToName || selectedRecord.attendedByName}
                </div>
                <div>
                  <strong>Status:</strong> {selectedRecord.status.replace('_', ' ')}
                </div>
                <div>
                  <strong>Priority:</strong> {selectedRecord.priority}
                </div>
              </div>
              
              <div>
                <strong>Problem:</strong>
                <p className="text-sm text-muted-foreground mt-1">{selectedRecord.natureOfProblem}</p>
              </div>
              
              <div>
                <strong>Solution:</strong>
                <p className="text-sm text-muted-foreground mt-1">{selectedRecord.commentsOrSolution}</p>
              </div>

              {selectedRecord.adminVerified && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <strong>Verified by:</strong> {selectedRecord.adminVerifiedByName}
                  <br />
                  <strong>Verified at:</strong> {selectedRecord.adminVerifiedAt ? format(new Date(selectedRecord.adminVerifiedAt), 'MMM dd, yyyy HH:mm') : 'N/A'}
                  {selectedRecord.adminNotes && (
                    <>
                      <br />
                      <strong>Notes:</strong> {selectedRecord.adminNotes}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Activity History Dialog */}
      <ActivityHistoryDialog 
        isOpen={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        activity={selectedRecord}
      />
    </>
  );
}
