import mongoose, { Document, Schema } from 'mongoose';

export interface ILocation extends Document {
  name: string;
  code: string;
  type: string;
  description?: string;
  department: string;
  parentLocation?: string;
  assetCount?: number;
  address?: string;
  status: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema = new Schema<ILocation>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  code: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  department: {
    type: String,
    required: true,
    trim: true,
  },
  parentLocation: {
    type: String,
    trim: true,
  },
  assetCount: {
    type: Number,
    default: 0,
  },
  address: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    default: 'active',
  },
}, {
  timestamps: true,
  collection: 'locations', // Explicitly specify collection name
});

// Virtual for display name
LocationSchema.virtual('displayName').get(function() {
  return `${this.name} (${this.code})`;
});

// Transform to frontend format
LocationSchema.set('toJSON', {
  transform: function(doc: any, ret: any) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Location = mongoose.models.Location || mongoose.model<ILocation>('Location', LocationSchema);

export default Location;
