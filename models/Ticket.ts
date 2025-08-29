import mongoose, { Document, Schema } from 'mongoose'
import Counter from './Counter'

export interface ITicket extends Document {
  ticketId: string // Auto-generated unique ticket ID like TKT-2025-000001
  title: string // Subject/title of the ticket
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'in-progress' | 'pending' | 'completed' | 'cancelled'
  category: string // 'service' | 'maintenance' | 'incident' | 'breakdown' | 'general'
  
  // Date and time
  loggedDateTime: Date
  ticketCloseDate?: Date
  totalTime?: number // Total time in hours
  
  // User information
  loggedBy: string
  createdBy: string
  reviewedBy?: string
  
  // Company and location
  company: string
  department: string
  area: string
  inCharge: string
  
  // Equipment
  equipmentId?: string // Asset ID (optional)
  
  // Communication
  reportedVia: 'Phone' | 'Email' | 'In-Person' | 'Mobile App' | 'Web Portal'
  
  // Report Type
  reportType: {
    service: boolean
    maintenance: boolean
    incident: boolean
    breakdown: boolean
  }
  
  // Content
  solution?: string
  
  // Access control
  isOpenTicket: boolean // If true, all departments can see this ticket
  assignedDepartments: string[]
  assignedUsers: string[]
  
  // Activity log
  activityLog: Array<{
    date: Date
    duration?: number // Duration in minutes
    loggedBy: string
    remarks: string
    action: 'Created' | 'Updated' | 'Assigned' | 'Comment' | 'Status Change' | 'Closed'
  }>
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
  // Status verification workflow
  statusApproval?: {
    pending: boolean
    requestedStatus?: 'open' | 'in-progress' | 'pending' | 'completed' | 'cancelled'
    requestedBy?: string
    requestedAt?: Date
    verifiedBy?: string
    verifiedAt?: Date
  }
}

const TicketSchema = new Schema<ITicket>({
  ticketId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true,
    lowercase: true
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'pending', 'completed', 'cancelled'],
    default: 'open',
    lowercase: true
  },
  category: {
    type: String,
    enum: ['service', 'maintenance', 'incident', 'breakdown', 'general'],
    required: true,
    lowercase: true
  },
  loggedDateTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  ticketCloseDate: {
    type: Date
  },
  totalTime: {
    type: Number,
    min: 0
  },
  loggedBy: {
    type: String,
    required: true,
    trim: true
  },
  createdBy: {
    type: String,
    required: true,
    trim: true
  },
  reviewedBy: {
    type: String,
    trim: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  area: {
    type: String,
    required: true,
    trim: true
  },
  inCharge: {
    type: String,
    required: true,
    trim: true
  },
  equipmentId: {
    type: String,
    trim: true
  },
  reportedVia: {
    type: String,
    enum: ['Phone', 'Email', 'In-Person', 'Mobile App', 'Web Portal'],
    default: 'Web Portal'
  },
  reportType: {
    service: {
      type: Boolean,
      default: false
    },
    maintenance: {
      type: Boolean,
      default: false
    },
    incident: {
      type: Boolean,
      default: false
    },
    breakdown: {
      type: Boolean,
      default: false
    }
  },
  solution: {
    type: String,
    trim: true
  },
  isOpenTicket: {
    type: Boolean,
    default: false
  },
  assignedDepartments: [{
    type: String,
    trim: true
  }],
  assignedUsers: [{
    type: String,
    trim: true
  }],
  
  // Activity log
  activityLog: [{
    date: {
      type: Date,
      default: Date.now
    },
    duration: Number,
    loggedBy: {
      type: String,
      required: true,
      trim: true
    },
    remarks: {
      type: String,
      required: true,
      trim: true
    },
    action: {
      type: String,
      enum: ['Created', 'Updated', 'Assigned', 'Comment', 'Status Change', 'Closed'],
      required: true
    }
  }]
  ,
  // Status verification workflow
  statusApproval: {
    pending: { type: Boolean, default: false },
    requestedStatus: { type: String, enum: ['open', 'in-progress', 'pending', 'completed', 'cancelled'] },
    requestedBy: { type: String, trim: true },
    requestedAt: { type: Date },
    verifiedBy: { type: String, trim: true },
    verifiedAt: { type: Date }
  }
}, {
  timestamps: true
})

// Indexes for better query performance
TicketSchema.index({ ticketId: 1 })
TicketSchema.index({ department: 1, status: 1 })
TicketSchema.index({ loggedDateTime: -1 })
TicketSchema.index({ priority: 1, status: 1 })
TicketSchema.index({ createdBy: 1 })
TicketSchema.index({ isOpenTicket: 1 })

// Transform the output to include 'id' field and handle ObjectId conversion
TicketSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString()
    delete ret._id
    delete ret.__v
    return ret
  }
})

// Generate ticketId before validation so 'required' validation passes
// FIXED: Use atomic counter to prevent race conditions and duplicate IDs
TicketSchema.pre('validate', async function (next) {
  try {
    if (this.isNew && !this.ticketId) {
      const year = new Date().getFullYear()
      
      // Use separate Counter model to atomically get the next sequence number
      // This prevents race conditions when multiple tickets are created simultaneously
      const result = await Counter.findOneAndUpdate(
        { _id: `ticket_${year}` }, // Use year-specific counter
        { $inc: { sequence: 1 } }, // Increment the sequence
        { 
          upsert: true, // Create if doesn't exist
          new: true, // Return the updated document
          setDefaultsOnInsert: true // Set defaults on insert
        }
      )
      
      // Generate ticketId with the sequence number
      this.ticketId = `TKT-${year}-${String(result.sequence).padStart(6, '0')}`
    }
    next()
  } catch (err) {
    next(err as any)
  }
})

// Pre-save hook: add creation activity log entry for new tickets
TicketSchema.pre('save', function(next) {
  if (this.isNew) {
    this.activityLog.push({
      date: new Date(),
      loggedBy: this.createdBy,
      remarks: 'Ticket created',
      action: 'Created'
    })
  }
  next()
})

const Ticket = mongoose.models.Ticket || mongoose.model<ITicket>('Ticket', TicketSchema)

export default Ticket
