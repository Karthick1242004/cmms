"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Filter, Shield, AlertTriangle, FileText, Activity } from "lucide-react"
import { PageLayout } from "@/components/page-layout"
import { SafetyInspectionStats } from "@/components/safety-inspection/safety-inspection-stats"
import { SafetyInspectionScheduleForm } from "@/components/safety-inspection/safety-inspection-schedule-form"
import { SafetyInspectionScheduleTable } from "@/components/safety-inspection/safety-inspection-schedule-table"
import { SafetyInspectionRecordTableEnhanced } from "@/components/safety-inspection/safety-inspection-record-table-enhanced"
import { SafetyInspectionSchedulesReport } from "@/components/safety-inspection/safety-inspection-schedules-report"
import { LogTrackingTab } from "@/components/common/log-tracking-tab"
import { useSafetyInspectionStore } from "@/stores/safety-inspection-store"
import { useAuthStore } from "@/stores/auth-store"

export default function SafetyInspectionPage() {
  const { user } = useAuthStore()
  const {
    filteredSchedules,
    filteredRecords,
    searchTerm,
    statusFilter,
    priorityFilter,
    riskLevelFilter,
    frequencyFilter,
    complianceFilter,
    isLoading,
    stats,
    setSearchTerm,
    setStatusFilter,
    setPriorityFilter,
    setRiskLevelFilter,
    setFrequencyFilter,
    setComplianceFilter,
    setScheduleDialogOpen,
    initialize,
  } = useSafetyInspectionStore()

  const [activeTab, setActiveTab] = useState("schedules")
  const [isReportOpen, setIsReportOpen] = useState(false)
  const isAdmin = user?.accessLevel === 'super_admin' || user?.accessLevel === 'department_admin'

  useEffect(() => {
    initialize()
  }, [initialize])

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setPriorityFilter("all")
    setRiskLevelFilter("all")
    setFrequencyFilter("all")
    setComplianceFilter("all")
  }

  const getScheduleStatusOptions = () => {
    return ["active", "overdue", "completed", "inactive"]
  }

  const getRecordStatusOptions = () => {
    return ["completed", "in_progress", "failed"]
  }

  const getComplianceOptions = () => {
    return ["compliant", "non_compliant", "requires_attention"]
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-3 pb-4 border-b">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Safety Inspection</h1>
            <p className="text-muted-foreground">Manage safety inspection schedules and track compliance records</p>
          </div>
        </div>
        {/* Stats */}
        <SafetyInspectionStats stats={stats} isLoading={isLoading} />

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search inspections..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {(activeTab === "schedules" ? getScheduleStatusOptions() : getRecordStatusOptions()).map((status) => (
                      <SelectItem key={status} value={status} className="capitalize">
                        {status.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {activeTab === "schedules" ? "Risk Level" : "Compliance"}
                </label>
                {activeTab === "schedules" ? (
                  <Select value={riskLevelFilter} onValueChange={setRiskLevelFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All risk levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All risk levels</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Select value={complianceFilter} onValueChange={setComplianceFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All compliance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All compliance</SelectItem>
                      {getComplianceOptions().map((compliance) => (
                        <SelectItem key={compliance} value={compliance} className="capitalize">
                          {compliance.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {activeTab === "schedules" && (
              <div className="mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Frequency</label>
                  <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="All frequencies" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All frequencies</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="schedules" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Schedules ({filteredSchedules.length})
              </TabsTrigger>
              <TabsTrigger value="records" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Records ({filteredRecords.length})
              </TabsTrigger>
              <TabsTrigger value="activity-log" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Activity Log
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-3">
              {activeTab === "schedules" && (
                <Button 
                  onClick={() => setIsReportOpen(true)}
                  variant="outline"
                  disabled={filteredSchedules.length === 0}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              )}
              {isAdmin && activeTab === "schedules" && (
                <SafetyInspectionScheduleForm
                  trigger={
                    <Button onClick={() => setScheduleDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Schedule
                    </Button>
                  }
                />
              )}
            </div>
          </div>

          {/* Content Tabs */}
          <TabsContent value="schedules" className="space-y-6">
            <SafetyInspectionScheduleTable 
              schedules={filteredSchedules}
              isLoading={isLoading}
              isAdmin={isAdmin}
            />
          </TabsContent>

          <TabsContent value="records" className="space-y-6">
            <SafetyInspectionRecordTableEnhanced 
              records={filteredRecords}
              schedules={filteredSchedules}
              isLoading={isLoading}
              isAdmin={isAdmin}
            />
          </TabsContent>

          <TabsContent value="activity-log" className="space-y-6">
            <LogTrackingTab module="safety-inspection" className="mt-4" />
          </TabsContent>
        </Tabs>

        {/* Safety Inspection Schedules Report */}
        {isReportOpen && (
          <SafetyInspectionSchedulesReport 
            schedules={filteredSchedules}
            onClose={() => setIsReportOpen(false)}
          />
        )}
      </div>
    </PageLayout>
  )
} 