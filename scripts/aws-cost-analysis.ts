import mongoose from 'mongoose';

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://karthick1242004:9894783774@karthick124.8ruyxjc.mongodb.net/cmms';

interface ModuleAnalysis {
  moduleName: string;
  collectionName: string;
  totalRecords: number;
  estimatedSizePerRecord: number; // in KB
  totalSizeKB: number;
  totalSizeMB: number;
  totalSizeGB: number;
  breakdown: {
    textData: number; // KB
    images: number; // KB
    videos: number; // KB
    metadata: number; // KB
  };
  notes: string[];
}

interface AWSCostEstimate {
  totalStorageGB: number;
  totalStorageTB: number;
  
  // AWS RDS for MongoDB (DocumentDB) costs
  documentDB: {
    storageGB: number;
    storageCostPerMonth: number; // $0.10 per GB/month
    instanceType: string;
    instanceCostPerMonth: number;
    backupStorageGB: number;
    backupCostPerMonth: number; // $0.02 per GB/month
    totalMonthly: number;
  };
  
  // AWS S3 for media storage
  s3Storage: {
    storageGB: number;
    storageCostPerMonth: number; // $0.023 per GB/month for Standard storage
    requestsCost: number; // Estimated API requests cost
    dataTransferCost: number; // Estimated data transfer cost
    totalMonthly: number;
  };
  
  // CloudFront CDN for media delivery
  cloudFront: {
    dataTransferGB: number;
    costPerMonth: number; // $0.085 per GB for first 10TB
  };
  
  // Backup and disaster recovery
  backup: {
    storageGB: number;
    costPerMonth: number;
  };
  
  totalMonthlyCost: number;
  totalYearlyCost: number;
}

// Module data size estimates
const dataEstimates = {
  tickets: {
    textData: 2, // KB - ticket details, descriptions, solutions, activity logs
    singleImage: 500, // KB average per image (compressed)
    singleVideo: 5000, // KB (5MB) average per video (compressed)
    avgImages: 2, // average images per ticket
    avgVideos: 0.5, // average videos per ticket (not all tickets have videos)
    metadata: 1, // KB - timestamps, IDs, status, etc.
  },
  assets: {
    textData: 3, // KB - asset details, specifications, descriptions
    singleImage: 400, // KB - asset image + QR code
    singleVideo: 0, // Assets typically don't have videos
    avgImages: 1.5, // asset image + optional QR code
    avgVideos: 0,
    metadata: 1, // KB
  },
  assetActivityLogs: {
    textData: 1, // KB - activity log entries
    singleImage: 0,
    singleVideo: 0,
    avgImages: 0,
    avgVideos: 0,
    metadata: 0.5, // KB
  },
  dailyLogActivities: {
    textData: 2, // KB - problem description, solution, comments
    singleImage: 500, // KB
    singleVideo: 0,
    avgImages: 1.5, // average images per activity
    avgVideos: 0,
    metadata: 1, // KB
  },
  maintenance: {
    textData: 2.5, // KB - maintenance details, checklists, parts
    singleImage: 400, // KB
    singleVideo: 0,
    avgImages: 2, // maintenance documentation images
    avgVideos: 0,
    metadata: 1, // KB
  },
  safetyInspection: {
    textData: 3, // KB - detailed checklists, violations, standards
    singleImage: 400, // KB
    singleVideo: 0,
    avgImages: 2.5, // inspection documentation
    avgVideos: 0,
    metadata: 1, // KB
  },
  parts: {
    textData: 2, // KB - part details, specifications
    singleImage: 300, // KB - part image
    singleVideo: 0,
    avgImages: 0.8, // not all parts have images
    avgVideos: 0,
    metadata: 1, // KB
  },
  stockTransactions: {
    textData: 2, // KB - transaction details, items, notes
    singleImage: 0,
    singleVideo: 0,
    avgImages: 0,
    avgVideos: 0,
    metadata: 1, // KB
  },
  employees: {
    textData: 2, // KB - employee details, shift info, skills
    singleImage: 150, // KB - avatar
    singleVideo: 0,
    avgImages: 0.7, // not all employees have custom avatars
    avgVideos: 0,
    metadata: 0.5, // KB
  },
  shiftDetails: {
    textData: 1, // KB - shift information
    singleImage: 0,
    singleVideo: 0,
    avgImages: 0,
    avgVideos: 0,
    metadata: 0.5, // KB
  },
  locations: {
    textData: 1, // KB - location details
    singleImage: 0,
    singleVideo: 0,
    avgImages: 0,
    avgVideos: 0,
    metadata: 0.5, // KB
  },
  departments: {
    textData: 1, // KB - department info
    singleImage: 0,
    singleVideo: 0,
    avgImages: 0,
    avgVideos: 0,
    metadata: 0.5, // KB
  },
  meetingMinutes: {
    textData: 5, // KB - detailed meeting notes, attendees, action items
    singleImage: 400, // KB - meeting documentation
    singleVideo: 0,
    avgImages: 1, // optional meeting images
    avgVideos: 0,
    metadata: 1, // KB
  },
  noticeBoard: {
    textData: 3, // KB - notice content, attachments
    singleImage: 400, // KB
    singleVideo: 0,
    avgImages: 0.5, // some notices have images
    avgVideos: 0,
    metadata: 1, // KB
  },
  logTracking: {
    textData: 1, // KB - audit log entries
    singleImage: 0,
    singleVideo: 0,
    avgImages: 0,
    avgVideos: 0,
    metadata: 0.5, // KB
  },
};

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

function calculateModuleSize(
  moduleName: string,
  recordCount: number,
  estimates: typeof dataEstimates.tickets
): ModuleAnalysis {
  const textDataKB = recordCount * estimates.textData;
  const imagesKB = recordCount * estimates.avgImages * estimates.singleImage;
  const videosKB = recordCount * estimates.avgVideos * estimates.singleVideo;
  const metadataKB = recordCount * estimates.metadata;
  
  const totalKB = textDataKB + imagesKB + videosKB + metadataKB;
  
  const notes: string[] = [];
  if (estimates.avgImages > 0) {
    notes.push(`Avg ${estimates.avgImages} images/record @ ${estimates.singleImage}KB each`);
  }
  if (estimates.avgVideos > 0) {
    notes.push(`Avg ${estimates.avgVideos} videos/record @ ${estimates.singleVideo}KB each`);
  }
  
  return {
    moduleName,
    collectionName: moduleName.toLowerCase(),
    totalRecords: recordCount,
    estimatedSizePerRecord: totalKB / recordCount || 0,
    totalSizeKB: totalKB,
    totalSizeMB: totalKB / 1024,
    totalSizeGB: totalKB / (1024 * 1024),
    breakdown: {
      textData: textDataKB,
      images: imagesKB,
      videos: videosKB,
      metadata: metadataKB,
    },
    notes,
  };
}

async function getCollectionCount(collectionName: string): Promise<number> {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    const collection = db.collection(collectionName);
    return await collection.countDocuments();
  } catch (error) {
    console.error(`Error counting ${collectionName}:`, error);
    return 0;
  }
}

async function analyzeAllModules(): Promise<ModuleAnalysis[]> {
  const analyses: ModuleAnalysis[] = [];
  
  console.log('\n📊 Fetching record counts from MongoDB...\n');
  
  // Tickets
  const ticketCount = await getCollectionCount('tickets');
  console.log(`📝 Tickets: ${ticketCount} records`);
  analyses.push(calculateModuleSize('Tickets', ticketCount, dataEstimates.tickets));
  
  // Assets
  const assetCount = await getCollectionCount('assets');
  console.log(`🏭 Assets: ${assetCount} records`);
  analyses.push(calculateModuleSize('Assets', assetCount, dataEstimates.assets));
  
  // Asset Activity Logs
  const assetActivityCount = await getCollectionCount('assetactivitylogs');
  console.log(`📋 Asset Activity Logs: ${assetActivityCount} records`);
  analyses.push(calculateModuleSize('Asset Activity Logs', assetActivityCount, dataEstimates.assetActivityLogs));
  
  // Daily Log Activities
  const dailyLogCount = await getCollectionCount('dailylogactivities');
  console.log(`📅 Daily Log Activities: ${dailyLogCount} records`);
  analyses.push(calculateModuleSize('Daily Log Activities', dailyLogCount, dataEstimates.dailyLogActivities));
  
  // Maintenance Schedules
  const maintenanceScheduleCount = await getCollectionCount('maintenanceschedules');
  console.log(`🔧 Maintenance Schedules: ${maintenanceScheduleCount} records`);
  
  // Maintenance Records
  const maintenanceRecordCount = await getCollectionCount('maintenancerecords');
  console.log(`🔧 Maintenance Records: ${maintenanceRecordCount} records`);
  const totalMaintenanceCount = maintenanceScheduleCount + maintenanceRecordCount;
  analyses.push(calculateModuleSize('Maintenance (Schedules + Records)', totalMaintenanceCount, dataEstimates.maintenance));
  
  // Safety Inspection Schedules
  const safetyScheduleCount = await getCollectionCount('safetyinspectionschedules');
  console.log(`🛡️ Safety Inspection Schedules: ${safetyScheduleCount} records`);
  
  // Safety Inspection Records
  const safetyRecordCount = await getCollectionCount('safetyinspectionrecords');
  console.log(`🛡️ Safety Inspection Records: ${safetyRecordCount} records`);
  const totalSafetyCount = safetyScheduleCount + safetyRecordCount;
  analyses.push(calculateModuleSize('Safety Inspection (Schedules + Records)', totalSafetyCount, dataEstimates.safetyInspection));
  
  // Parts
  const partCount = await getCollectionCount('parts');
  console.log(`🔩 Parts: ${partCount} records`);
  analyses.push(calculateModuleSize('Parts Inventory', partCount, dataEstimates.parts));
  
  // Stock Transactions
  const stockTransactionCount = await getCollectionCount('stocktransactions');
  console.log(`📦 Stock Transactions: ${stockTransactionCount} records`);
  analyses.push(calculateModuleSize('Stock Transactions', stockTransactionCount, dataEstimates.stockTransactions));
  
  // Employees
  const employeeCount = await getCollectionCount('employees');
  console.log(`👥 Employees: ${employeeCount} records`);
  analyses.push(calculateModuleSize('Employees', employeeCount, dataEstimates.employees));
  
  // Shift Details (stored in employee records, estimate based on employees)
  const shiftDetailCount = employeeCount; // Each employee has shift details
  console.log(`⏰ Shift Details: ${shiftDetailCount} records (embedded in employees)`);
  analyses.push(calculateModuleSize('Shift Details', shiftDetailCount, dataEstimates.shiftDetails));
  
  // Locations
  const locationCount = await getCollectionCount('locations');
  console.log(`📍 Locations: ${locationCount} records`);
  analyses.push(calculateModuleSize('Locations', locationCount, dataEstimates.locations));
  
  // Departments
  const departmentCount = await getCollectionCount('departments');
  console.log(`🏢 Departments: ${departmentCount} records`);
  analyses.push(calculateModuleSize('Departments', departmentCount, dataEstimates.departments));
  
  // Meeting Minutes
  const meetingCount = await getCollectionCount('meetingminutes');
  console.log(`📝 Meeting Minutes: ${meetingCount} records`);
  analyses.push(calculateModuleSize('Meeting Minutes', meetingCount, dataEstimates.meetingMinutes));
  
  // Notice Board
  const noticeCount = await getCollectionCount('noticeboard');
  console.log(`📢 Notice Board: ${noticeCount} records`);
  analyses.push(calculateModuleSize('Notice Board', noticeCount, dataEstimates.noticeBoard));
  
  // Log Tracking (audit logs)
  const logTrackingCount = await getCollectionCount('logtrackings');
  console.log(`📊 Log Tracking (Audit Logs): ${logTrackingCount} records`);
  analyses.push(calculateModuleSize('Log Tracking', logTrackingCount, dataEstimates.logTracking));
  
  return analyses;
}

function calculateAWSCosts(totalStorageGB: number, mediaStorageGB: number): AWSCostEstimate {
  const databaseStorageGB = totalStorageGB - mediaStorageGB;
  
  // AWS DocumentDB (MongoDB-compatible) costs
  const documentDB = {
    storageGB: databaseStorageGB,
    storageCostPerMonth: databaseStorageGB * 0.10, // $0.10 per GB/month
    instanceType: 'db.t3.medium', // 2 vCPUs, 4 GB RAM - suitable for small to medium workloads
    instanceCostPerMonth: 87.60, // $0.12/hour * 730 hours
    backupStorageGB: databaseStorageGB * 1.5, // Keep 1.5x for backups
    backupCostPerMonth: (databaseStorageGB * 1.5) * 0.02, // $0.02 per GB/month
    totalMonthly: 0,
  };
  documentDB.totalMonthly = documentDB.storageCostPerMonth + documentDB.instanceCostPerMonth + documentDB.backupCostPerMonth;
  
  // If storage grows significantly, recommend upgrading instance
  if (databaseStorageGB > 50) {
    documentDB.instanceType = 'db.r5.large'; // 2 vCPUs, 16 GB RAM
    documentDB.instanceCostPerMonth = 182.50; // $0.25/hour * 730 hours
    documentDB.totalMonthly = documentDB.storageCostPerMonth + documentDB.instanceCostPerMonth + documentDB.backupCostPerMonth;
  }
  
  // AWS S3 for media storage (images, videos)
  const s3Storage = {
    storageGB: mediaStorageGB,
    storageCostPerMonth: mediaStorageGB * 0.023, // $0.023 per GB/month (Standard storage)
    requestsCost: 10, // Estimated $10/month for PUT/GET requests
    dataTransferCost: 15, // Estimated $15/month for data transfer
    totalMonthly: 0,
  };
  s3Storage.totalMonthly = s3Storage.storageCostPerMonth + s3Storage.requestsCost + s3Storage.dataTransferCost;
  
  // CloudFront CDN for media delivery
  const estimatedMonthlyTraffic = mediaStorageGB * 0.1; // Assume 10% of media is accessed monthly
  const cloudFront = {
    dataTransferGB: estimatedMonthlyTraffic,
    costPerMonth: estimatedMonthlyTraffic * 0.085, // $0.085 per GB for first 10TB
  };
  
  // Additional backup and disaster recovery
  const backup = {
    storageGB: totalStorageGB * 0.5, // Additional backup snapshots
    costPerMonth: (totalStorageGB * 0.5) * 0.02, // $0.02 per GB/month for S3 Glacier
  };
  
  const totalMonthlyCost = documentDB.totalMonthly + s3Storage.totalMonthly + cloudFront.costPerMonth + backup.costPerMonth;
  
  return {
    totalStorageGB,
    totalStorageTB: totalStorageGB / 1024,
    documentDB,
    s3Storage,
    cloudFront,
    backup,
    totalMonthlyCost,
    totalYearlyCost: totalMonthlyCost * 12,
  };
}

function printReport(analyses: ModuleAnalysis[], costEstimate: AWSCostEstimate) {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('                    AWS COST ANALYSIS REPORT                        ');
  console.log('                   CMMS Application Data Analysis                   ');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('\n');
  
  console.log('📊 MODULE-WISE DATA BREAKDOWN:');
  console.log('─────────────────────────────────────────────────────────────────');
  console.log(
    '| Module                              | Records | Size/Record | Total Size  |'
  );
  console.log('─────────────────────────────────────────────────────────────────');
  
  let totalRecords = 0;
  let totalSizeGB = 0;
  let totalMediaGB = 0;
  
  analyses.forEach((analysis) => {
    const moduleName = analysis.moduleName.padEnd(35);
    const records = analysis.totalRecords.toString().padStart(7);
    const sizePerRecord = `${analysis.estimatedSizePerRecord.toFixed(2)} KB`.padStart(11);
    const totalSize = analysis.totalSizeGB >= 0.01
      ? `${analysis.totalSizeGB.toFixed(3)} GB`
      : `${analysis.totalSizeMB.toFixed(2)} MB`;
    const totalSizeStr = totalSize.padStart(11);
    
    console.log(`| ${moduleName} | ${records} | ${sizePerRecord} | ${totalSizeStr} |`);
    
    if (analysis.notes.length > 0) {
      analysis.notes.forEach(note => {
        console.log(`|   └─ ${note.padEnd(71)} |`);
      });
    }
    
    // Calculate media size
    const mediaGB = (analysis.breakdown.images + analysis.breakdown.videos) / (1024 * 1024);
    totalMediaGB += mediaGB;
    
    totalRecords += analysis.totalRecords;
    totalSizeGB += analysis.totalSizeGB;
  });
  
  console.log('─────────────────────────────────────────────────────────────────');
  console.log(`| TOTAL                               | ${totalRecords.toString().padStart(7)} |             | ${totalSizeGB.toFixed(3)} GB |`);
  console.log('═══════════════════════════════════════════════════════════════════');
  
  console.log('\n');
  console.log('💾 STORAGE BREAKDOWN:');
  console.log('─────────────────────────────────────────────────────────────────');
  console.log(`Database Storage (Text + Metadata):    ${(totalSizeGB - totalMediaGB).toFixed(3)} GB`);
  console.log(`Media Storage (Images + Videos):       ${totalMediaGB.toFixed(3)} GB`);
  console.log(`Total Application Data:                ${totalSizeGB.toFixed(3)} GB`);
  console.log(`Total with Backups (1.5x):             ${(totalSizeGB * 1.5).toFixed(3)} GB`);
  console.log(`Total with Growth Buffer (2x):         ${(totalSizeGB * 2).toFixed(3)} GB`);
  console.log('═══════════════════════════════════════════════════════════════════');
  
  console.log('\n');
  console.log('💰 AWS MONTHLY COST ESTIMATE:');
  console.log('─────────────────────────────────────────────────────────────────');
  console.log('\n1️⃣  AWS DocumentDB (MongoDB-compatible Database):');
  console.log(`    Instance Type:              ${costEstimate.documentDB.instanceType}`);
  console.log(`    Instance Cost:              $${costEstimate.documentDB.instanceCostPerMonth.toFixed(2)}/month`);
  console.log(`    Storage (${costEstimate.documentDB.storageGB.toFixed(2)} GB):           $${costEstimate.documentDB.storageCostPerMonth.toFixed(2)}/month`);
  console.log(`    Backup Storage (${costEstimate.documentDB.backupStorageGB.toFixed(2)} GB):    $${costEstimate.documentDB.backupCostPerMonth.toFixed(2)}/month`);
  console.log(`    ──────────────────────────────────────────`);
  console.log(`    Subtotal:                   $${costEstimate.documentDB.totalMonthly.toFixed(2)}/month`);
  
  console.log('\n2️⃣  AWS S3 (Media Storage - Images & Videos):');
  console.log(`    Storage (${costEstimate.s3Storage.storageGB.toFixed(2)} GB):           $${costEstimate.s3Storage.storageCostPerMonth.toFixed(2)}/month`);
  console.log(`    API Requests:               $${costEstimate.s3Storage.requestsCost.toFixed(2)}/month`);
  console.log(`    Data Transfer:              $${costEstimate.s3Storage.dataTransferCost.toFixed(2)}/month`);
  console.log(`    ──────────────────────────────────────────`);
  console.log(`    Subtotal:                   $${costEstimate.s3Storage.totalMonthly.toFixed(2)}/month`);
  
  console.log('\n3️⃣  AWS CloudFront (CDN for Media Delivery):');
  console.log(`    Data Transfer (${costEstimate.cloudFront.dataTransferGB.toFixed(2)} GB):    $${costEstimate.cloudFront.costPerMonth.toFixed(2)}/month`);
  
  console.log('\n4️⃣  Additional Backup & DR (S3 Glacier):');
  console.log(`    Backup Storage (${costEstimate.backup.storageGB.toFixed(2)} GB):    $${costEstimate.backup.costPerMonth.toFixed(2)}/month`);
  
  console.log('\n─────────────────────────────────────────────────────────────────');
  console.log(`💵 TOTAL MONTHLY COST:           $${costEstimate.totalMonthlyCost.toFixed(2)}`);
  console.log(`💵 TOTAL YEARLY COST:            $${costEstimate.totalYearlyCost.toFixed(2)}`);
  console.log('═══════════════════════════════════════════════════════════════════');
  
  console.log('\n');
  console.log('📝 ADDITIONAL CONSIDERATIONS:');
  console.log('─────────────────────────────────────────────────────────────────');
  console.log('• Frontend (Vercel Free Tier):           $0/month');
  console.log('• AWS Data Transfer OUT:                 Included up to 100GB/month');
  console.log('• Monitoring (CloudWatch):               ~$5-10/month');
  console.log('• AWS VPC & Networking:                  ~$5-15/month');
  console.log('• SSL Certificates (ACM):                Free');
  console.log('─────────────────────────────────────────────────────────────────');
  console.log(`Estimated Total with Extras:             $${(costEstimate.totalMonthlyCost + 20).toFixed(2)}/month`);
  console.log('═══════════════════════════════════════════════════════════════════');
  
  console.log('\n');
  console.log('🎯 RECOMMENDATIONS:');
  console.log('─────────────────────────────────────────────────────────────────');
  console.log('1. Use AWS DocumentDB for MongoDB database hosting');
  console.log('2. Store all media files (images/videos) in AWS S3');
  console.log('3. Use CloudFront CDN for fast media delivery globally');
  console.log('4. Implement S3 Lifecycle policies to move old backups to Glacier');
  console.log('5. Enable S3 Intelligent-Tiering for cost optimization');
  console.log('6. Set up automated backups with 30-day retention');
  console.log('7. Use AWS Lambda for serverless functions (if needed)');
  console.log('8. Monitor costs with AWS Cost Explorer and set up billing alerts');
  console.log('9. Consider Reserved Instances for 30-40% discount on long-term commitment');
  console.log('10. Implement proper image compression to reduce storage costs');
  console.log('═══════════════════════════════════════════════════════════════════');
  
  console.log('\n');
  console.log('📈 GROWTH PROJECTIONS (Based on Current Data):');
  console.log('─────────────────────────────────────────────────────────────────');
  
  const currentGB = totalSizeGB;
  const growthRates = [
    { period: '3 months', multiplier: 1.5, monthly: (costEstimate.totalMonthlyCost * 1.5) },
    { period: '6 months', multiplier: 2, monthly: (costEstimate.totalMonthlyCost * 2) },
    { period: '1 year', multiplier: 3, monthly: (costEstimate.totalMonthlyCost * 3) },
    { period: '2 years', multiplier: 5, monthly: (costEstimate.totalMonthlyCost * 5) },
  ];
  
  growthRates.forEach(({ period, multiplier, monthly }) => {
    console.log(`${period.padEnd(10)} - Storage: ${(currentGB * multiplier).toFixed(2)} GB | Est. Cost: $${monthly.toFixed(2)}/month`);
  });
  
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('\n✅ Analysis complete! Report saved to console.\n');
}

async function main() {
  try {
    console.log('🚀 Starting AWS Cost Analysis for CMMS Application...\n');
    
    await connectDB();
    
    const analyses = await analyzeAllModules();
    
    const totalStorageGB = analyses.reduce((sum, a) => sum + a.totalSizeGB, 0);
    const totalMediaGB = analyses.reduce((sum, a) => {
      const mediaKB = a.breakdown.images + a.breakdown.videos;
      return sum + (mediaKB / (1024 * 1024));
    }, 0);
    
    const costEstimate = calculateAWSCosts(totalStorageGB, totalMediaGB);
    
    printReport(analyses, costEstimate);
    
    // Generate JSON output for further processing
    const jsonOutput = {
      timestamp: new Date().toISOString(),
      modules: analyses,
      totalStorageGB,
      totalMediaGB,
      costEstimate,
    };
    
    const fs = require('fs');
    const outputPath = '/Users/karthicks/Desktop/cmms/cms-dashboard-frontend/AWS_COST_ANALYSIS_REPORT.json';
    fs.writeFileSync(outputPath, JSON.stringify(jsonOutput, null, 2));
    console.log(`\n📄 Detailed JSON report saved to: ${outputPath}\n`);
    
  } catch (error) {
    console.error('❌ Error during analysis:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

main();

