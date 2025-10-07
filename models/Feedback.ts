import mongoose, { Document, Schema } from 'mongoose';

export interface IFeedback extends Document {
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

  // Section 2: Daily Activities
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

  // Section 5: Preventive Maintenance
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

  // Section 8: Employee Management
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

  // Section 11: Visual Features
  bannerDisplay: boolean;
  noticeBoard: boolean;
  graphsChartsKPIs: boolean;
  dashboardManagementOverview: boolean;

  // Section 12: Historical Data
  assetMaintenanceHistory: boolean;
  workOrderLogsHistory: boolean;
  pmCompletionHistory: boolean;
  partsTransactionHistory: boolean;
  auditLogsCompliance: boolean;

  // Section 13: Cloud Deployment
  usersUploadingDaily?: string;
  retentionPeriod?: string;
  dailyBandwidthPerUser?: string;
  peakConcurrentUploads?: string;
  backupFrequency?: string;
  backupRetentionPeriod?: string;
  disasterRecoveryRequired: boolean;
  expectedAnnualGrowth?: string;

  // Section 14: Deployment Preference
  deploymentType: string[];
  expectedGoLiveDate?: string;

  // Section 15: File Upload Details
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
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>({
  // Section 1
  companyName: { type: String, required: true, trim: true },
  industryType: [{ type: String, required: true }],
  industryTypeOther: { type: String, trim: true },
  address: { type: String, required: true, trim: true },
  contactPersonName: { type: String, required: true, trim: true },
  designation: { type: String, required: true, trim: true },
  emailId: { type: String, required: true, trim: true },
  phoneNumber: { type: String, required: true, trim: true },
  numberOfEmployees: { type: String, trim: true },
  numberOfFMMSUsers: { type: String, trim: true },
  peakConcurrentUsers: { type: String, trim: true },

  // Section 2
  logDailyMaintenanceTasks: { type: Boolean, default: false },
  workOrderCreationTracking: { type: Boolean, default: false },
  taskAssignmentToTechnicians: { type: Boolean, default: false },
  taskStatusUpdates: { type: Boolean, default: false },
  realTimeNotifications: { type: Boolean, default: false },
  attachImagesVideos: { type: Boolean, default: false },
  avgImagesPerWorkOrder: { type: String, trim: true },
  avgVideosPerWorkOrder: { type: String, trim: true },
  avgSizePerImage: { type: String, trim: true },
  avgSizePerVideo: { type: String, trim: true },

  // Section 3
  logMeetingMinutes: { type: Boolean, default: false },
  teamDiscussionThreads: { type: Boolean, default: false },
  actionItemsAssignment: { type: Boolean, default: false },
  alertsForMeetings: { type: Boolean, default: false },

  // Section 4
  maintainAssetRegister: { type: Boolean, default: false },
  assetLocationTracking: { type: Boolean, default: false },
  assetHistoryLogs: { type: Boolean, default: false },
  assetLifecycleTracking: { type: Boolean, default: false },
  assetCategorization: { type: Boolean, default: false },
  approximateNumberOfAssets: { type: String, trim: true },

  // Section 5
  pmScheduling: { type: Boolean, default: false },
  autoRemindersForPM: { type: Boolean, default: false },
  pmChecklistsTemplates: { type: Boolean, default: false },
  pmReportsCompliance: { type: Boolean, default: false },
  numberOfPMTasksPerMonth: { type: String, trim: true },

  // Section 6
  safetyInspectionChecklists: { type: Boolean, default: false },
  incidentReportingFollowUp: { type: Boolean, default: false },
  complianceAuditLogs: { type: Boolean, default: false },
  correctivePreventiveActions: { type: Boolean, default: false },

  // Section 7
  sparePartMasterList: { type: Boolean, default: false },
  stockLevelsReorderAlerts: { type: Boolean, default: false },
  partsTransactionLogs: { type: Boolean, default: false },
  supplierVendorTracking: { type: Boolean, default: false },
  barcodeQRCodeIntegration: { type: Boolean, default: false },
  approximateNumberOfSpareItems: { type: String, trim: true },

  // Section 8
  employeeShiftsRoster: { type: Boolean, default: false },
  technicianAssignmentPerformance: { type: Boolean, default: false },
  userRolesPermissions: { type: Boolean, default: false },

  // Section 9
  downtimeAnalysis: { type: Boolean, default: false },
  breakdownHistory: { type: Boolean, default: false },
  costTracking: { type: Boolean, default: false },
  technicianPerformanceReports: { type: Boolean, default: false },
  sparePartUsageReports: { type: Boolean, default: false },
  customDashboardsKPIs: { type: Boolean, default: false },
  exportReports: { type: Boolean, default: false },

  // Section 10
  workOrderStatusUpdates: { type: Boolean, default: false },
  pmReminders: { type: Boolean, default: false },
  safetyInspectionAlerts: { type: Boolean, default: false },
  stockReorderAlerts: { type: Boolean, default: false },
  pushNotifications: { type: Boolean, default: false },
  pushNotificationsType: { type: String, trim: true },
  approximateNotificationsPerDay: { type: String, trim: true },

  // Section 11
  bannerDisplay: { type: Boolean, default: false },
  noticeBoard: { type: Boolean, default: false },
  graphsChartsKPIs: { type: Boolean, default: false },
  dashboardManagementOverview: { type: Boolean, default: false },

  // Section 12
  assetMaintenanceHistory: { type: Boolean, default: false },
  workOrderLogsHistory: { type: Boolean, default: false },
  pmCompletionHistory: { type: Boolean, default: false },
  partsTransactionHistory: { type: Boolean, default: false },
  auditLogsCompliance: { type: Boolean, default: false },

  // Section 13
  usersUploadingDaily: { type: String, trim: true },
  retentionPeriod: { type: String, trim: true },
  dailyBandwidthPerUser: { type: String, trim: true },
  peakConcurrentUploads: { type: String, trim: true },
  backupFrequency: { type: String, trim: true },
  backupRetentionPeriod: { type: String, trim: true },
  disasterRecoveryRequired: { type: Boolean, default: false },
  expectedAnnualGrowth: { type: String, trim: true },

  // Section 14
  deploymentType: [{ type: String }],
  expectedGoLiveDate: { type: String, trim: true },

  // Section 15
  maintainAssetList: { type: Boolean, default: false },
  canProvideAssetList: { type: Boolean, default: false },
  maintainSparePartsList: { type: Boolean, default: false },
  approximateSparePartsCount: { type: String, trim: true },
  canProvideSparePartsList: { type: Boolean, default: false },
  haveBarcodeQRInfo: { type: Boolean, default: false },

  // Confirmation
  confirmInformation: { type: Boolean, required: true, default: false },

  // Metadata
  submittedBy: { type: String, required: true, trim: true },
  submittedByName: { type: String, required: true, trim: true },
  submittedByEmail: { type: String, required: true, trim: true },
  submittedByDepartment: { type: String, trim: true },
  submittedAt: { type: Date, required: true, default: Date.now },
}, {
  timestamps: true
});

// Indexes
FeedbackSchema.index({ companyName: 1 });
FeedbackSchema.index({ submittedByEmail: 1 });
FeedbackSchema.index({ submittedAt: -1 });
FeedbackSchema.index({ industryType: 1 });

// Transform output
FeedbackSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.models.Feedback || mongoose.model<IFeedback>('Feedback', FeedbackSchema);

