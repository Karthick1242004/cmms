"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageLayout, PageHeader, PageContent } from "@/components/page-layout"
import { Plus, Search, Calendar, Clock, AlertTriangle, CheckCircle, Users, TrendingUp, FileBarChart, Activity } from "lucide-react"
import { useMaintenanceStore } from "@/stores/maintenance-store"
import { useAuthStore } from "@/stores/auth-store"
import { MaintenanceScheduleForm } from "@/components/maintenance/maintenance-schedule-form"
import { MaintenanceRecordForm } from "@/components/maintenance/maintenance-record-form"
import { MaintenanceScheduleTable } from "@/components/maintenance/maintenance-schedule-table"
import { MaintenanceRecordTable } from "@/components/maintenance/maintenance-record-table"
import { MaintenanceStats } from "@/components/maintenance/maintenance-stats"
import { MaintenanceOverallReport } from "@/components/maintenance/maintenance-overall-report"
import { LogTrackingTab } from "@/components/common/log-tracking-tab"

export default function MaintenancePage() {
  const {
    schedules,
    records,
    filteredSchedules,
    filteredRecords,
    searchTerm,
    statusFilter,
    priorityFilter,
    frequencyFilter,
    isLoading,
    stats,
    setSearchTerm,
    setStatusFilter,
    setPriorityFilter,
    setFrequencyFilter,
    fetchSchedules,
    fetchRecords,
  } = useMaintenanceStore()

  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState("schedules")
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)

  useEffect(() => {
    fetchSchedules()
    fetchRecords()
  }, [fetchSchedules, fetchRecords])

  // Apply filters when tab changes
  useEffect(() => {
    if (activeTab === "schedules") {
      // Reset record-specific filters when switching to schedules
      if (statusFilter === "verified" || statusFilter === "pending" || statusFilter === "in_progress") {
        setStatusFilter("all")
      }
    } else {
      // Reset schedule-specific filters when switching to records
      if (statusFilter === "active" || statusFilter === "overdue" || statusFilter === "paused") {
        setStatusFilter("all")
      }
    }
  }, [activeTab, statusFilter, setStatusFilter])

  // Apply filters when filter values change
  useEffect(() => {
    const { filterSchedules, filterRecords } = useMaintenanceStore.getState()
    if (activeTab === "schedules") {
      filterSchedules()
    } else {
      filterRecords()
    }
  }, [searchTerm, statusFilter, priorityFilter, frequencyFilter, activeTab])

  const isAdmin = user?.accessLevel === 'super_admin' || user?.accessLevel === 'department_admin'

  return (
    <PageLayout>
      <PageHeader>
        <div className="flex mt-4 justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Maintenance Schedules</h1>
            <p className="text-muted-foreground">
              Manage maintenance schedules and track completion records
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsReportDialogOpen(true)}>
              <FileBarChart className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
            {isAdmin && (
              <MaintenanceScheduleForm
                trigger={
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Schedule Maintenance
                  </Button>
                }
              />
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <MaintenanceStats stats={stats} />

        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search maintenance..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {activeTab === "schedules" ? (
                <>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="pending">Pending Verification</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>

          {activeTab === "schedules" && (
            <>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>

              <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Frequencies</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annually">Annually</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}

          <Button 
            variant="outline" 
            onClick={() => {
              setSearchTerm("")
              setStatusFilter("all")
              setPriorityFilter("all")
              setFrequencyFilter("all")
            }}
            className="ml-2"
          >
            Clear Filters
          </Button>
        </div>
      </PageHeader>

      <PageContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="schedules" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Schedules ({filteredSchedules.length})
            </TabsTrigger>
            <TabsTrigger value="records" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Records ({filteredRecords.length})
            </TabsTrigger>
            <TabsTrigger value="activity-log" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activity Log
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedules" className="space-y-4">
            <MaintenanceScheduleTable
              schedules={filteredSchedules}
              isLoading={isLoading}
              isAdmin={isAdmin}
            />
          </TabsContent>

          <TabsContent value="records" className="space-y-4">
            <MaintenanceRecordTable
              records={filteredRecords}
              isLoading={isLoading}
              isAdmin={isAdmin}
            />
          </TabsContent>

          <TabsContent value="activity-log" className="space-y-4">
            <LogTrackingTab 
              module="maintenance"
              className="mt-4"
            />
          </TabsContent>
        </Tabs>

        {/* Overall Maintenance Report Dialog */}
        <MaintenanceOverallReport
          isOpen={isReportDialogOpen}
          onClose={() => setIsReportDialogOpen(false)}
        />
      </PageContent>
    </PageLayout>
  )
} 