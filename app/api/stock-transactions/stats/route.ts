import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';

// Use the same schema as the main route
const StockTransactionSchema = new mongoose.Schema({
  transactionNumber: { type: String },
  transactionType: { type: String },
  transactionDate: { type: Date },
  description: { type: String },
  sourceLocation: { type: String },
  destinationLocation: { type: String },
  supplier: { type: String },
  recipient: { type: String },
  recipientType: { type: String },
  assetId: { type: String },
  assetName: { type: String },
  workOrderId: { type: String },
  workOrderNumber: { type: String },
  items: [{
    partId: { type: String },
    partNumber: { type: String },
    partName: { type: String },
    quantity: { type: Number },
    unitCost: { type: Number },
    totalCost: { type: Number },
    fromLocation: { type: String },
    toLocation: { type: String },
    notes: { type: String }
  }],
  totalAmount: { type: Number },
  currency: { type: String, default: 'USD' },
  createdBy: { type: String },
  createdByName: { type: String },
  department: { type: String },
  approvedBy: { type: String },
  approvedByName: { type: String },
  approvedAt: { type: Date },
  status: { type: String },
  notes: { type: String },
  internalNotes: { type: String },
  totalItems: { type: Number, default: 0 },
  totalQuantity: { type: Number, default: 0 },
}, {
  timestamps: true
});

const StockTransaction = mongoose.models.StockTransaction || mongoose.model('StockTransaction', StockTransactionSchema);

export async function GET(request: NextRequest) {
  try {
    const user = await getUserContext(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Build filter based on user access level
    const filter: any = {};
    if (user.accessLevel !== 'super_admin') {
      filter.department = user.department;
    }

    // Get current date for time-based calculations
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Run aggregation queries in parallel
    const [
      totalTransactions,
      pendingTransactions,
      completedTransactions,
      monthlyTransactions,
      yearlyTransactions,
      recentTransactions,
      totalValue,
      monthlyValue,
      yearlyValue,
      transactionsByType,
      transactionsByStatus,
      departmentStats
    ] = await Promise.all([
      // Total transactions
      StockTransaction.countDocuments(filter),
      
      // Pending transactions
      StockTransaction.countDocuments({ ...filter, status: 'pending' }),
      
      // Completed transactions
      StockTransaction.countDocuments({ ...filter, status: 'completed' }),
      
      // Monthly transactions
      StockTransaction.countDocuments({
        ...filter,
        createdAt: { $gte: startOfMonth }
      }),
      
      // Yearly transactions
      StockTransaction.countDocuments({
        ...filter,
        createdAt: { $gte: startOfYear }
      }),
      
      // Recent transactions (last 30 days)
      StockTransaction.countDocuments({
        ...filter,
        createdAt: { $gte: last30Days }
      }),
      
      // Total value
      StockTransaction.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      
      // Monthly value
      StockTransaction.aggregate([
        { $match: { ...filter, createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      
      // Yearly value
      StockTransaction.aggregate([
        { $match: { ...filter, createdAt: { $gte: startOfYear } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      
      // Transactions by type
      StockTransaction.aggregate([
        { $match: filter },
        { $group: { _id: '$transactionType', count: { $sum: 1 }, value: { $sum: '$totalAmount' } } }
      ]),
      
      // Transactions by status
      StockTransaction.aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 }, value: { $sum: '$totalAmount' } } }
      ]),
      
      // Department statistics (only for super admins)
      user.accessLevel === 'super_admin' ? StockTransaction.aggregate([
        { $group: { _id: '$department', count: { $sum: 1 }, value: { $sum: '$totalAmount' } } }
      ]) : []
    ]);

    // Process aggregation results
    const stats = {
      overview: {
        total: totalTransactions,
        pending: pendingTransactions,
        completed: completedTransactions,
        monthly: monthlyTransactions,
        yearly: yearlyTransactions,
        recent: recentTransactions
      },
      financial: {
        totalValue: totalValue[0]?.total || 0,
        monthlyValue: monthlyValue[0]?.total || 0,
        yearlyValue: yearlyValue[0]?.total || 0,
        currency: 'USD'
      },
      byType: transactionsByType.reduce((acc, item) => {
        acc[item._id] = {
          count: item.count,
          value: item.value || 0
        };
        return acc;
      }, {} as Record<string, { count: number; value: number }>),
      byStatus: transactionsByStatus.reduce((acc, item) => {
        acc[item._id] = {
          count: item.count,
          value: item.value || 0
        };
        return acc;
      }, {} as Record<string, { count: number; value: number }>),
      ...(user.accessLevel === 'super_admin' && {
        byDepartment: departmentStats.reduce((acc, item) => {
          acc[item._id] = {
            count: item.count,
            value: item.value || 0
          };
          return acc;
        }, {} as Record<string, { count: number; value: number }>)
      })
    };

    return NextResponse.json({
      success: true,
      data: stats,
      message: 'Stock transaction statistics retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching stock transaction stats:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while fetching stats' },
      { status: 500 }
    );
  }
}
