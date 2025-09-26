import mongoose, { Document, Schema } from 'mongoose';

// Interface for individual checklist items
export interface IMaintenanceChecklistItem {
  itemId: string;
  description: string;
  completed: boolean;
  status: 'pending' | 'completed' | 'failed' | 'skipped';
  notes?: string;
  completedAt?: Date;
  completedBy?: string;
}

// Interface for parts status
export interface IMaintenancePartsStatus {
  partId: string;
  partName: string;
  replaced: boolean;
  condition: 'good' | 'fair' | 'poor' | 'replace';
  timeSpent: number;
  checklistItems: IMaintenanceChecklistItem[];
  notes?: string;
}

// Main interface for the checklist data document
export interface IMaintenanceChecklistData extends Document {
  recordId: string; // Reference to the backend maintenance record
  scheduleId: string; // Reference to the maintenance schedule
  assetId: string;
  assetName: string;
  technician: string;
  technicianId: string;
  department: string;
  
  // Detailed checklist data
  generalChecklist: IMaintenanceChecklistItem[];
  partsStatus: IMaintenancePartsStatus[];
  
  // Completion metadata
  completedDate: Date;
  totalItems: number;
  completedItems: number;
  failedItems: number;
  skippedItems: number;
  completionPercentage: number;
  
  // Audit information
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastModifiedBy?: string;
}

// Schema for checklist items
const ChecklistItemSchema = new Schema<IMaintenanceChecklistItem>({
  itemId: { type: String, required: true },
  description: { type: String, required: true },
  completed: { type: Boolean, required: true, default: false },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'skipped'], 
    required: true,
    default: 'pending'
  },
  notes: { type: String, trim: true },
  completedAt: { type: Date },
  completedBy: { type: String, trim: true }
}, { _id: false });

// Schema for parts status
const PartsStatusSchema = new Schema<IMaintenancePartsStatus>({
  partId: { type: String, required: true },
  partName: { type: String, required: true },
  replaced: { type: Boolean, required: true, default: false },
  condition: { 
    type: String, 
    enum: ['good', 'fair', 'poor', 'replace'], 
    required: true,
    default: 'good'
  },
  timeSpent: { type: Number, required: true, min: 0 },
  checklistItems: [ChecklistItemSchema],
  notes: { type: String, trim: true }
}, { _id: false });

// Main schema for maintenance checklist data
const MaintenanceChecklistDataSchema = new Schema<IMaintenanceChecklistData>({
  recordId: { 
    type: String, 
    required: true, 
    unique: true, // One checklist data per record
    index: true 
  },
  scheduleId: { type: String, required: true, index: true },
  assetId: { type: String, required: true, index: true },
  assetName: { type: String, required: true },
  technician: { type: String, required: true },
  technicianId: { type: String, required: true },
  department: { type: String, required: true, index: true },
  
  // Detailed checklist data
  generalChecklist: [ChecklistItemSchema],
  partsStatus: [PartsStatusSchema],
  
  // Completion metadata
  completedDate: { type: Date, required: true },
  totalItems: { type: Number, required: true, min: 0 },
  completedItems: { type: Number, required: true, min: 0 },
  failedItems: { type: Number, required: true, min: 0 },
  skippedItems: { type: Number, required: true, min: 0 },
  completionPercentage: { type: Number, required: true, min: 0, max: 100 },
  
  // Audit information
  createdBy: { type: String, required: true },
  lastModifiedBy: { type: String }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  collection: 'maintenance_checklist_data'
});

// Add indexes for better query performance
MaintenanceChecklistDataSchema.index({ recordId: 1 });
MaintenanceChecklistDataSchema.index({ scheduleId: 1 });
MaintenanceChecklistDataSchema.index({ assetId: 1 });
MaintenanceChecklistDataSchema.index({ department: 1 });
MaintenanceChecklistDataSchema.index({ completedDate: -1 });
MaintenanceChecklistDataSchema.index({ technician: 1 });

// Add a compound index for common queries
MaintenanceChecklistDataSchema.index({ 
  assetId: 1, 
  completedDate: -1 
});

// Pre-save middleware to calculate completion statistics
MaintenanceChecklistDataSchema.pre('save', function(next) {
  const doc = this as IMaintenanceChecklistData;
  
  let totalItems = 0;
  let completedItems = 0;
  let failedItems = 0;
  let skippedItems = 0;
  
  // Count general checklist items
  doc.generalChecklist.forEach(item => {
    totalItems++;
    if (item.status === 'completed') completedItems++;
    else if (item.status === 'failed') failedItems++;
    else if (item.status === 'skipped') skippedItems++;
  });
  
  // Count parts checklist items
  doc.partsStatus.forEach(part => {
    part.checklistItems.forEach(item => {
      totalItems++;
      if (item.status === 'completed') completedItems++;
      else if (item.status === 'failed') failedItems++;
      else if (item.status === 'skipped') skippedItems++;
    });
  });
  
  // Update calculated fields
  doc.totalItems = totalItems;
  doc.completedItems = completedItems;
  doc.failedItems = failedItems;
  doc.skippedItems = skippedItems;
  doc.completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  
  next();
});

// Create and export the model
const MaintenanceChecklistData = mongoose.models.MaintenanceChecklistData || 
  mongoose.model<IMaintenanceChecklistData>('MaintenanceChecklistData', MaintenanceChecklistDataSchema);

export default MaintenanceChecklistData;

// Helper functions for the API
export const checklistDataHelpers = {
  // Create checklist data from maintenance record
  createFromRecord: (recordData: any, backendRecordId: string, createdBy: string) => {
    return {
      recordId: backendRecordId,
      scheduleId: recordData.scheduleId,
      assetId: recordData.assetId,
      assetName: recordData.assetName,
      technician: recordData.technician,
      technicianId: recordData.technicianId,
      department: recordData.department,
      generalChecklist: recordData.generalChecklist || [],
      partsStatus: recordData.partsStatus || [],
      completedDate: new Date(recordData.completedDate),
      createdBy: createdBy,
      // Calculated fields will be set by pre-save middleware
      totalItems: 0,
      completedItems: 0,
      failedItems: 0,
      skippedItems: 0,
      completionPercentage: 0
    };
  },
  
  // Merge checklist data with backend record
  mergeWithBackendRecord: (backendRecord: any, checklistData: IMaintenanceChecklistData | null) => {
    if (!checklistData) {
      return {
        ...backendRecord,
        generalChecklist: [],
        partsStatus: backendRecord.partsStatus || [],
        _dataSource: 'backend_only' as const,
        _checklistAvailable: false
      };
    }
    
    return {
      ...backendRecord,
      generalChecklist: checklistData.generalChecklist,
      partsStatus: checklistData.partsStatus.length > 0 ? checklistData.partsStatus : backendRecord.partsStatus,
      _dataSource: 'local_database' as const,
      _checklistAvailable: true,
      _completionStats: {
        totalItems: checklistData.totalItems,
        completedItems: checklistData.completedItems,
        failedItems: checklistData.failedItems,
        skippedItems: checklistData.skippedItems,
        completionPercentage: checklistData.completionPercentage
      }
    };
  }
};
