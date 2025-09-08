import mongoose, { Document, Schema } from 'mongoose';

export interface IPart extends Document {
  partNumber: string;
  name: string;
  sku: string;
  materialCode: string;
  description?: string;
  category: string;
  department: string;
  
  linkedAssets: Array<{
    assetId: string;
    assetName: string;
    assetDepartment: string;
    quantityInAsset: number;
    lastUsed?: Date;
    replacementFrequency?: number;
    criticalLevel?: 'low' | 'medium' | 'high';
  }>;
  
  quantity: number;
  minStockLevel: number;
  unitPrice: number;
  totalValue: number;
  
  supplier: string;
  supplierCode?: string;
  leadTime?: number;
  lastPurchaseDate?: Date;
  lastPurchasePrice?: number;
  
  // Vendor and procurement information
  purchaseOrderNumber?: string;
  vendorName?: string;
  vendorContact?: string;
  
  location?: string;
  alternativeLocations?: string[];
  
  totalConsumed: number;
  averageMonthlyUsage: number;
  lastUsedDate?: Date;
  
  status: 'active' | 'inactive' | 'discontinued';
  isStockItem: boolean;
  isCritical: boolean;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  departmentsServed: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

const LinkedAssetSchema = new Schema({
  assetId: { type: String, required: true },
  assetName: { type: String, required: true },
  assetDepartment: { type: String, required: true },
  quantityInAsset: { type: Number, required: true, default: 1 },
  lastUsed: { type: Date },
  replacementFrequency: { type: Number },
  criticalLevel: { type: String, enum: ['low', 'medium', 'high'] }
}, { _id: false });

const PartSchema = new Schema<IPart>({
  partNumber: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  sku: { type: String, required: true, unique: true, trim: true },
  materialCode: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  category: { type: String, required: true, trim: true },
  department: { type: String, required: true, trim: true },
  
  linkedAssets: [LinkedAssetSchema],
  
  quantity: { type: Number, required: true, min: 0, default: 0 },
  minStockLevel: { type: Number, min: 0, default: 0 },
  unitPrice: { type: Number, min: 0, default: 0 },
  totalValue: { type: Number, min: 0, default: 0 },
  
  supplier: { type: String, required: true, trim: true },
  supplierCode: { type: String, trim: true },
  leadTime: { type: Number, min: 0 },
  lastPurchaseDate: { type: Date },
  lastPurchasePrice: { type: Number, min: 0 },
  
  // Vendor and procurement information
  purchaseOrderNumber: { type: String, trim: true },
  vendorName: { type: String, trim: true },
  vendorContact: { type: String, trim: true },
  
  location: { type: String, trim: true },
  alternativeLocations: [{ type: String, trim: true }],
  
  totalConsumed: { type: Number, min: 0, default: 0 },
  averageMonthlyUsage: { type: Number, min: 0, default: 0 },
  lastUsedDate: { type: Date },
  
  status: { type: String, enum: ['active', 'inactive', 'discontinued'], default: 'active' },
  isStockItem: { type: Boolean, default: true },
  isCritical: { type: Boolean, default: false },
  stockStatus: { type: String, enum: ['in_stock', 'low_stock', 'out_of_stock'], default: 'in_stock' },
  departmentsServed: [{ type: String, trim: true }],
}, {
  timestamps: true,
  collection: 'parts'
});

// Indexes for better query performance
PartSchema.index({ partNumber: 1 });
PartSchema.index({ sku: 1 });
PartSchema.index({ department: 1 });
PartSchema.index({ category: 1 });
PartSchema.index({ 'linkedAssets.assetId': 1 });
PartSchema.index({ status: 1 });
PartSchema.index({ stockStatus: 1 });

// Pre-save middleware to calculate totalValue and stockStatus
PartSchema.pre('save', function(next) {
  // Calculate total value
  this.totalValue = this.quantity * this.unitPrice;
  
  // Update stock status
  if (this.quantity === 0) {
    this.stockStatus = 'out_of_stock';
  } else if (this.quantity <= this.minStockLevel) {
    this.stockStatus = 'low_stock';
  } else {
    this.stockStatus = 'in_stock';
  }
  
  next();
});

const Part = mongoose.models.Part || mongoose.model<IPart>('Part', PartSchema);

export default Part;
