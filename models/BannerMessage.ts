import mongoose, { Document, Model } from 'mongoose';

export interface IBannerMessage extends Document {
  text: string;
  isActive: boolean;
  priority: number;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

const BannerMessageSchema = new mongoose.Schema<IBannerMessage>({
  text: {
    type: String,
    required: true,
    maxlength: 200,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  priority: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
    default: 5,
    index: true
  },
  createdBy: {
    type: String,
    required: true,
    index: true
  },
  createdByName: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  collection: 'bannermessages'
});

// Compound index for efficient querying
BannerMessageSchema.index({ isActive: 1, priority: -1, createdAt: -1 });

// Ensure model is not redefined in development
const BannerMessage: Model<IBannerMessage> = 
  mongoose.models.BannerMessage || mongoose.model<IBannerMessage>('BannerMessage', BannerMessageSchema);

export default BannerMessage;
