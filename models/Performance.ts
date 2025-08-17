import { Schema, model, models } from 'mongoose';

// Import types from employee types
import type { 
  PerformanceMetrics, 
  WorkHistoryEntry, 
  AssetAssignment,
  EmployeeAnalytics 
} from '@/types/employee';

// Performance collection schema that matches EmployeeDetail analytics structure
export interface Performance {
  _id?: string;
  employeeId: string; // Reference to employee ID
  employeeName: string;
  employeeEmail: string;
  department: string;
  role: string;
  
  // Performance tracking data matching EmployeeDetail structure
  workHistory: WorkHistoryEntry[];
  assetAssignments: AssetAssignment[];
  currentAssignments: string[]; // Array of current asset IDs
  performanceMetrics: PerformanceMetrics;
  
  // Analytics data
  totalWorkHours: number;
  productivityScore: number;
  reliabilityScore: number;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// Schema definition
const performanceSchema = new Schema<Performance>({
  employeeId: {
    type: String,
    required: true,
    index: true
  },
  employeeName: {
    type: String,
    required: true
  },
  employeeEmail: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  
  // Work history array
  workHistory: [{
    type: {
      type: String,
      enum: ['ticket', 'maintenance', 'daily-log', 'safety-inspection'],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: String,
    assetName: String,
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'failed', 'cancelled'],
      required: true
    },
    date: {
      type: String,
      required: true
    },
    duration: Number, // in hours
    scheduleId: String, // Reference to the original schedule/task ID
    recordId: String, // Reference to the completed record ID
    assignmentRole: String // Role in this specific assignment
  }],
  
  // Asset assignments array
  assetAssignments: [{
    assetName: {
      type: String,
      required: true
    },
    assetId: String,
    assignedDate: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      required: true
    },
    role: {
      type: String,
      enum: ['primary', 'secondary', 'temporary'],
      required: true
    },
    notes: String
  }],
  
  // Current assignments (asset IDs)
  currentAssignments: [{
    type: String
  }],
  
  // Performance metrics matching EmployeeDetail structure
  performanceMetrics: {
    totalTasksCompleted: {
      type: Number,
      default: 0
    },
    averageCompletionTime: {
      type: Number,
      default: 0
    },
    ticketsResolved: {
      type: Number,
      default: 0
    },
    maintenanceCompleted: {
      type: Number,
      default: 0
    },
    safetyInspectionsCompleted: {
      type: Number,
      default: 0
    },
    dailyLogEntries: {
      type: Number,
      default: 0
    },
    lastActivityDate: String,
    efficiency: {
      type: Number,
      default: 0
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    }
  },
  
  // Analytics scores
  totalWorkHours: {
    type: Number,
    default: 0
  },
  productivityScore: {
    type: Number,
    default: 0
  },
  reliabilityScore: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'performances'
});

// Create compound index for efficient queries
performanceSchema.index({ employeeId: 1, department: 1 });
performanceSchema.index({ department: 1, role: 1 });

// Export the model
export const PerformanceModel = models.Performance || model<Performance>('Performance', performanceSchema);
