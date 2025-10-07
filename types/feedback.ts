export interface FeedbackFormData {
  // Section 1: Company & User Information
  companyName: string;
  industryType: string[];
  industryTypeOther?: string;
  address: string;
  contactPersonName: string;
  designation: string;
  emailId: string;
  phoneNumber: string;
  numberOfEmployees: string;
  numberOfFMMSUsers: string;
  peakConcurrentUsers: string;

  // Section 2: Daily Activities & Work order/Ticket Management
  logDailyMaintenanceTasks: boolean;
  workOrderCreationTracking: boolean;
  taskAssignmentToTechnicians: boolean;
  taskStatusUpdates: boolean;
  realTimeNotifications: boolean;
  attachImagesVideos: boolean;
  avgImagesPerWorkOrder?: string;
  avgVideosPerWorkOrder?: string;
  avgSizePerImage?: string;
  avgSizePerVideo?: string;

  // Section 3: Meeting & Communication
  logMeetingMinutes: boolean;
  teamDiscussionThreads: boolean;
  actionItemsAssignment: boolean;
  alertsForMeetings: boolean;

  // Section 4: Asset Management
  maintainAssetRegister: boolean;
  assetLocationTracking: boolean;
  assetHistoryLogs: boolean;
  assetLifecycleTracking: boolean;
  assetCategorization: boolean;
  approximateNumberOfAssets?: string;

  // Section 5: Preventive Maintenance (PM)
  pmScheduling: boolean;
  autoRemindersForPM: boolean;
  pmChecklistsTemplates: boolean;
  pmReportsCompliance: boolean;
  numberOfPMTasksPerMonth?: string;

  // Section 6: Safety & Compliance
  safetyInspectionChecklists: boolean;
  incidentReportingFollowUp: boolean;
  complianceAuditLogs: boolean;
  correctivePreventiveActions: boolean;

  // Section 7: Spare Parts & Inventory
  sparePartMasterList: boolean;
  stockLevelsReorderAlerts: boolean;
  partsTransactionLogs: boolean;
  supplierVendorTracking: boolean;
  barcodeQRCodeIntegration: boolean;
  approximateNumberOfSpareItems?: string;

  // Section 8: Employee / Staff Management
  employeeShiftsRoster: boolean;
  technicianAssignmentPerformance: boolean;
  userRolesPermissions: boolean;

  // Section 9: Reporting & Analytics
  downtimeAnalysis: boolean;
  breakdownHistory: boolean;
  costTracking: boolean;
  technicianPerformanceReports: boolean;
  sparePartUsageReports: boolean;
  customDashboardsKPIs: boolean;
  exportReports: boolean;

  // Section 10: Notifications & Alerts
  workOrderStatusUpdates: boolean;
  pmReminders: boolean;
  safetyInspectionAlerts: boolean;
  stockReorderAlerts: boolean;
  pushNotifications: boolean;
  pushNotificationsType?: string;
  approximateNotificationsPerDay?: string;

  // Section 11: Visual / Display Features
  bannerDisplay: boolean;
  noticeBoard: boolean;
  graphsChartsKPIs: boolean;
  dashboardManagementOverview: boolean;

  // Section 12: Historical Data & Audit
  assetMaintenanceHistory: boolean;
  workOrderLogsHistory: boolean;
  pmCompletionHistory: boolean;
  partsTransactionHistory: boolean;
  auditLogsCompliance: boolean;

  // Section 13: Cloud Deployment Details
  usersUploadingDaily?: string;
  retentionPeriod?: string;
  dailyBandwidthPerUser?: string;
  peakConcurrentUploads?: string;
  backupFrequency?: string;
  backupRetentionPeriod?: string;
  disasterRecoveryRequired: boolean;
  expectedAnnualGrowth?: string;

  // Section 14: Deployment Preference & Go-Live
  deploymentType: string[];
  expectedGoLiveDate?: string;

  // Section 15: File Upload / Asset & Spare Parts Details
  maintainAssetList: boolean;
  canProvideAssetList: boolean;
  maintainSparePartsList: boolean;
  approximateSparePartsCount?: string;
  canProvideSparePartsList: boolean;
  haveBarcodeQRInfo: boolean;

  // Confirmation
  confirmInformation: boolean;

  // Metadata
  submittedBy: string;
  submittedByName: string;
  submittedByEmail: string;
  submittedByDepartment?: string;
  submittedAt: string;
}

export interface Feedback extends FeedbackFormData {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbacksResponse {
  feedbacks: Feedback[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface FeedbackApiResponse {
  success: boolean;
  data?: Feedback | FeedbacksResponse;
  message?: string;
  error?: string;
}

export interface FeedbackFilters {
  page?: number;
  limit?: number;
  search?: string;
  fromDate?: string;
  toDate?: string;
  companyName?: string;
  industryType?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

