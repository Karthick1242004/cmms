import mongoose, { Document, Schema } from 'mongoose';

export interface ILogTracking extends Document {
  // Module identification
  module: 'parts' | 'assets' | 'tickets' | 'employees' | 'locations' | 'departments' | 'maintenance' | 'safety-inspection' | 'daily-log-activities' | 'meeting-minutes' | 'stock-transactions';
  entityId: string; // ID of the entity being tracked
  entityName: string; // Name of the entity for display purposes
  
  // Action details
  action: 'create' | 'update' | 'delete' | 'status_change' | 'assign' | 'unassign' | 'approve' | 'reject' | 'complete' | 'cancel';
  actionDescription: string; // Human-readable description of what happened
  
  // User information
  userId: string;
  userName: string;
  userEmail: string;
  userDepartment: string;
  userAccessLevel: 'super_admin' | 'department_admin' | 'manager' | 'technician' | 'viewer';
  
  // Change details
  fieldsChanged?: Array<{
    field: string;
    oldValue: any;
    newValue: any;
    fieldDisplayName?: string;
  }>;
  
  // Additional metadata
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    reason?: string; // For deletions or major changes
    relatedEntities?: Array<{
      module: string;
      entityId: string;
      entityName: string;
      relationship: string; // e.g., 'linked_asset', 'parent_location', etc.
    }>;
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const LogTrackingSchema = new Schema<ILogTracking>({
  // Module identification
  module: {
    type: String,
    required: true,
    enum: ['parts', 'assets', 'tickets', 'employees', 'locations', 'departments', 'maintenance', 'safety-inspection', 'daily-log-activities', 'meeting-minutes', 'stock-transactions'],
    index: true
  },
  entityId: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  entityName: {
    type: String,
    required: true,
    trim: true
  },
  
  // Action details
  action: {
    type: String,
    required: true,
    enum: ['create', 'update', 'delete', 'status_change', 'assign', 'unassign', 'approve', 'reject', 'complete', 'cancel'],
    index: true
  },
  actionDescription: {
    type: String,
    required: true,
    trim: true
  },
  
  // User information
  userId: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  userName: {
    type: String,
    required: true,
    trim: true
  },
  userEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  userDepartment: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  userAccessLevel: {
    type: String,
    required: true,
    enum: ['super_admin', 'department_admin', 'manager', 'technician', 'viewer']
  },
  
  // Change details
  fieldsChanged: [{
    field: {
      type: String,
      required: true,
      trim: true
    },
    oldValue: {
      type: Schema.Types.Mixed
    },
    newValue: {
      type: Schema.Types.Mixed
    },
    fieldDisplayName: {
      type: String,
      trim: true
    }
  }],
  
  // Additional metadata
  metadata: {
    ipAddress: {
      type: String,
      trim: true
    },
    userAgent: {
      type: String,
      trim: true
    },
    sessionId: {
      type: String,
      trim: true
    },
    reason: {
      type: String,
      trim: true
    },
    relatedEntities: [{
      module: {
        type: String,
        trim: true
      },
      entityId: {
        type: String,
        trim: true
      },
      entityName: {
        type: String,
        trim: true
      },
      relationship: {
        type: String,
        trim: true
      }
    }]
  }
}, {
  timestamps: true,
  collection: 'logtrackings'
});

// Compound indexes for efficient querying
LogTrackingSchema.index({ module: 1, entityId: 1 });
LogTrackingSchema.index({ module: 1, createdAt: -1 });
LogTrackingSchema.index({ userId: 1, createdAt: -1 });
LogTrackingSchema.index({ userDepartment: 1, createdAt: -1 });
LogTrackingSchema.index({ action: 1, createdAt: -1 });

// Transform to frontend format
LogTrackingSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const LogTracking = mongoose.models.LogTracking || mongoose.model<ILogTracking>('LogTracking', LogTrackingSchema);

export default LogTracking;
