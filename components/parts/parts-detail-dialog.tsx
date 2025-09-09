'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  Hash, 
  Building, 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  Eye, 
  X, 
  Edit, 
  Trash2, 
  History, 
  Download,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Wrench,
  FileText,
  Phone,
  Mail,
  DollarSign,
  ShoppingCart,
  Tag,
  Layers
} from 'lucide-react';
import { format } from 'date-fns';
import type { Part } from '@/types/part';
import { cn } from '@/lib/utils';

const statusColors = {
  'in-stock': 'bg-green-100 text-green-800 border-green-200',
  'low-stock': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'out-of-stock': 'bg-red-100 text-red-800 border-red-200',
  'discontinued': 'bg-gray-100 text-gray-800 border-gray-200',
};

interface PartsDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  part: Part | null;
  onEdit?: (part: Part) => void;
  onDelete?: (partId: string) => void;
  onViewHistory?: (part: Part) => void;
}

export function PartsDetailDialog({ 
  isOpen, 
  onClose, 
  part, 
  onEdit, 
  onDelete, 
  onViewHistory 
}: PartsDetailDialogProps) {
  if (!part) return null;

  const getStockStatus = (part: Part) => {
    if (part.currentStock <= 0) return 'out-of-stock';
    if (part.currentStock <= part.minimumStock) return 'low-stock';
    return 'in-stock';
  };

  const stockStatus = getStockStatus(part);
  const statusColor = statusColors[stockStatus as keyof typeof statusColors] || statusColors['in-stock'];

  const handleEdit = () => {
    if (onEdit) {
      onEdit(part);
      onClose();
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(part.id);
      onClose();
    }
  };

  const handleViewHistory = () => {
    if (onViewHistory) {
      onViewHistory(part);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Part Details
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-primary mb-2">{part.name}</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-mono">{part.partNumber}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-mono">{part.sku}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="secondary" className="text-xs">
                          {part.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Stock Information</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Current Stock:</span>
                        <span className="font-medium">{part.currentStock}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Minimum Stock:</span>
                        <span className="font-medium">{part.minimumStock}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Maximum Stock:</span>
                        <span className="font-medium">{part.maximumStock}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Status:</span>
                        <Badge className={cn("text-xs", statusColor)}>
                          {stockStatus.replace('-', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Location & Department</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{part.department}</span>
                      </div>
                      {part.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <Badge variant="outline" className="text-xs">
                            {part.location}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Material & Specifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Layers className="h-4 w-4" />
                  Material & Specifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {part.materialCode && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Material Code:</span>
                    <Badge variant="outline" className="text-xs font-mono">
                      {part.materialCode}
                    </Badge>
                  </div>
                )}
                {part.material && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Material:</span>
                    <span className="text-sm font-medium">{part.material}</span>
                  </div>
                )}
                {part.specifications && (
                  <div>
                    <span className="text-sm text-muted-foreground">Specifications:</span>
                    <p className="text-sm mt-1">{part.specifications}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Vendor Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShoppingCart className="h-4 w-4" />
                  Vendor Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {part.vendorName && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Vendor:</span>
                    <span className="text-sm font-medium">{part.vendorName}</span>
                  </div>
                )}
                {part.vendorContact && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{part.vendorContact}</span>
                  </div>
                )}
                {part.supplier && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Supplier:</span>
                    <span className="text-sm font-medium">{part.supplier}</span>
                  </div>
                )}
                {part.purchaseOrder && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Purchase Order:</span>
                    <Badge variant="outline" className="text-xs font-mono">
                      {part.purchaseOrder}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Financial Information */}
          {(part.unitCost || part.totalValue) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <DollarSign className="h-4 w-4" />
                  Financial Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {part.unitCost && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Unit Cost:</span>
                      <span className="text-sm font-medium">${part.unitCost.toFixed(2)}</span>
                    </div>
                  )}
                  {part.totalValue && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Value:</span>
                      <span className="text-sm font-medium">${part.totalValue.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Linked Assets */}
          {part.linkedAssets && part.linkedAssets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wrench className="h-4 w-4" />
                  Linked Assets ({part.linkedAssets.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {part.linkedAssets.map((asset, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded-lg">
                      <div>
                        <div className="font-medium text-sm">{asset.assetName}</div>
                        <div className="text-xs text-muted-foreground">{asset.assetDepartment}</div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Qty: {asset.quantityInAsset}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {part.description && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{part.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Audit Trail */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" />
                Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Created</div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(part.createdAt), 'MMM dd, yyyy • h:mm a')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Last Updated</div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(part.updatedAt), 'MMM dd, yyyy • h:mm a')}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleViewHistory}>
              <History className="mr-2 h-4 w-4" />
              View History
            </Button>
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Part
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Part
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
