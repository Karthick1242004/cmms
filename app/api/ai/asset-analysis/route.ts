import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import { connectToDatabase } from '@/lib/mongodb';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ObjectId } from 'mongodb';

// Test API key functionality
async function testApiKey(apiKey: string): Promise<boolean> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    await model.generateContent('Test');
    return true;
  } catch (error) {
    console.error('API Key validation failed:', error);
    return false;
  }
}

// Initialize Gemini AI with comprehensive validation
let genAI: GoogleGenerativeAI | null = null;
let apiKeyStatus: 'valid' | 'invalid' | 'untested' = 'untested';

async function initializeGeminiAI(): Promise<void> {
  try {
    // Check multiple environment variable sources
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    console.log('🔍 Checking API key availability...');
    console.log(`API Key present: ${!!apiKey}`);
    console.log(`API Key length: ${apiKey?.length || 0}`);
    console.log(`API Key prefix: ${apiKey?.substring(0, 10) || 'None'}...`);
    
    if (apiKey && apiKey.trim() !== '') {
      genAI = new GoogleGenerativeAI(apiKey);
      
      // Test the API key
      console.log('🧪 Testing API key validity...');
      const isValid = await testApiKey(apiKey);
      apiKeyStatus = isValid ? 'valid' : 'invalid';
      
      console.log(`✅ API Key status: ${apiKeyStatus}`);
    } else {
      console.error('❌ No API key found in environment variables');
      apiKeyStatus = 'invalid';
    }
  } catch (error) {
    console.error('❌ Failed to initialize Gemini AI:', error);
    apiKeyStatus = 'invalid';
  }
}

// Initialize on startup
initializeGeminiAI().catch(console.error);

function generateMockAnalysis(assetData: any): string {
  const { asset, analysis } = assetData;
  const uptimePercentage = analysis.uptimePercentage || 85;
  const downtimePercentage = 100 - uptimePercentage;
  
  return `## 🏭 Asset Performance Analysis

| **Metric** | **Value** | **Status** | **Recommendation** |
|------------|-----------|------------|-------------------|
| **Overall Uptime** | ${uptimePercentage.toFixed(1)}% | ${uptimePercentage >= 90 ? '🟢 Excellent' : uptimePercentage >= 80 ? '🟡 Good' : '🔴 Needs Attention'} | ${uptimePercentage < 85 ? 'Investigate frequent downtime causes' : 'Maintain current performance'} |
| **Total Downtime** | ${downtimePercentage.toFixed(1)}% | ${downtimePercentage <= 10 ? '🟢 Low' : downtimePercentage <= 20 ? '🟡 Moderate' : '🔴 High'} | ${downtimePercentage > 15 ? 'Implement preventive maintenance' : 'Continue monitoring'} |
| **Planned Downtime** | ${analysis.plannedDowntimePercentage?.toFixed(1) || '0.0'}% | ${(analysis.plannedDowntimePercentage || 0) < 10 ? '🟢 Optimal' : '🟡 Review'} | Schedule during low-demand periods |
| **Unplanned Downtime** | ${analysis.unplannedDowntimePercentage?.toFixed(1) || '0.0'}% | ${(analysis.unplannedDowntimePercentage || 0) < 5 ? '🟢 Excellent' : '🔴 Critical'} | Focus on predictive maintenance |
| **Activity Volume** | ${analysis.totalActivities || 0} events | ${(analysis.totalActivities || 0) > 50 ? '🟡 High' : '🟢 Normal'} | ${(analysis.totalActivities || 0) > 100 ? 'Review maintenance frequency' : 'Standard monitoring'} |
| **Parts Health** | ${analysis.linkedPartsCount || 0} tracked | ${(analysis.linkedPartsCount || 0) > 0 ? '🟢 Monitored' : '🟡 Limited'} | Ensure all critical parts are tracked |

## 🎯 Key Insights
${uptimePercentage < 80 ? '• **Critical**: Low uptime indicates potential equipment issues' : '• **Good**: Asset maintaining acceptable uptime levels'}
${(analysis.unplannedDowntimePercentage || 0) > 10 ? '• **Alert**: High unplanned downtime suggests reactive maintenance' : '• **Stable**: Minimal unplanned disruptions'}
${(analysis.criticalMaintenanceCount || 0) > 5 ? '• **Action Required**: Multiple critical maintenance items pending' : '• **On Track**: Maintenance activities under control'}

## 🔧 Priority Actions
${uptimePercentage < 75 ? '1. **Immediate**: Conduct comprehensive asset inspection' : '1. **Continue**: Regular preventive maintenance schedule'}
${(analysis.unplannedDowntimePercentage || 0) > 15 ? '2. **Urgent**: Implement condition-based monitoring' : '2. **Monitor**: Track performance trends'}
${(analysis.linkedPartsCount || 0) === 0 ? '3. **Setup**: Link critical spare parts to asset' : '3. **Maintain**: Update parts inventory regularly'}`;
}

// Function to aggregate comprehensive asset data
async function aggregateAssetData(assetId: string, db: any, user: any = null) {
  const assetObjectId = new ObjectId(assetId);
  
  // Build asset query with department filter if needed
  const assetQuery: any = { _id: assetObjectId };
  
  // Get asset details
  const asset = await db.collection('assets').findOne(assetQuery);
  if (!asset) {
    throw new Error('Asset not found');
  }

  // Check department access if user context available
  if (user && user.accessLevel !== 'super_admin' && asset.departmentName !== user.department) {
    throw new Error('Access denied - Asset not in your department');
  }

  // Build department filter for related data
  const departmentFilter = user && user.accessLevel !== 'super_admin' 
    ? { departmentName: user.department } 
    : {};

  // Get all activity logs for this asset
  const activityLogs = await db.collection('activitylogs')
    .find({ assetId, ...departmentFilter })
    .sort({ createdAt: -1 })
    .toArray();

  // Get daily log activities with downtime data
  const dailyLogActivities = await db.collection('dailylogactivities')
    .find({ 
      assetId,
      downtime: { $exists: true, $ne: null },
      ...departmentFilter
    })
    .sort({ createdAt: -1 })
    .toArray();

  // Get maintenance records
  const maintenanceRecords = await db.collection('maintenance')
    .find({ assetId, ...departmentFilter })
    .sort({ createdAt: -1 })
    .toArray();

  // Get tickets related to this asset
  const tickets = await db.collection('tickets')
    .find({ assetId, ...departmentFilter })
    .sort({ createdAt: -1 })
    .toArray();

  // Get safety inspections
  const safetyInspections = await db.collection('safetyinspections')
    .find({ assetId, ...departmentFilter })
    .sort({ createdAt: -1 })
    .toArray();

  // Get linked parts
  const linkedParts = asset.partsBOM || [];

  return {
    asset,
    activityLogs,
    dailyLogActivities,
    maintenanceRecords,
    tickets,
    safetyInspections,
    linkedParts
  };
}

// Function to calculate asset analysis metrics
function calculateAssetAnalysis(data: any) {
  const { dailyLogActivities, activityLogs, maintenanceRecords, tickets, safetyInspections, linkedParts } = data;

  // Calculate uptime/downtime metrics
  const totalDowntimeMinutes = dailyLogActivities.reduce((total: number, activity: any) => {
    return total + (activity.downtime || 0);
  }, 0);

  const plannedDowntimeMinutes = dailyLogActivities
    .filter((activity: any) => activity.downtimeType === 'planned')
    .reduce((total: number, activity: any) => total + (activity.downtime || 0), 0);

  const unplannedDowntimeMinutes = dailyLogActivities
    .filter((activity: any) => activity.downtimeType === 'unplanned')
    .reduce((total: number, activity: any) => total + (activity.downtime || 0), 0);

  // Assume 24/7 operation for the analysis period (last 30 days)
  const analysisWindowDays = 30;
  const totalPossibleMinutes = analysisWindowDays * 24 * 60; // 30 days in minutes
  const uptimeMinutes = totalPossibleMinutes - totalDowntimeMinutes;
  
  const uptimePercentage = (uptimeMinutes / totalPossibleMinutes) * 100;
  const downtimePercentage = (totalDowntimeMinutes / totalPossibleMinutes) * 100;
  const plannedDowntimePercentage = (plannedDowntimeMinutes / totalPossibleMinutes) * 100;
  const unplannedDowntimePercentage = (unplannedDowntimeMinutes / totalPossibleMinutes) * 100;

  // Activity statistics
  const totalActivities = activityLogs.length + dailyLogActivities.length + tickets.length + safetyInspections.length;
  const criticalMaintenanceCount = maintenanceRecords.filter((m: any) => m.priority === 'high' || m.priority === 'critical').length;
  const openTicketsCount = tickets.filter((t: any) => t.status === 'open' || t.status === 'in_progress').length;
  const linkedPartsCount = linkedParts.length;

  // Performance indicators
  const averageRepairTime = maintenanceRecords.length > 0 
    ? maintenanceRecords.reduce((total: number, m: any) => {
        if (m.completedAt && m.createdAt) {
          const duration = new Date(m.completedAt).getTime() - new Date(m.createdAt).getTime();
          return total + (duration / (1000 * 60 * 60)); // Convert to hours
        }
        return total;
      }, 0) / maintenanceRecords.filter((m: any) => m.completedAt).length
    : 0;

  return {
    uptimePercentage: Math.max(0, Math.min(100, uptimePercentage)),
    downtimePercentage: Math.max(0, Math.min(100, downtimePercentage)),
    plannedDowntimePercentage: Math.max(0, Math.min(100, plannedDowntimePercentage)),
    unplannedDowntimePercentage: Math.max(0, Math.min(100, unplannedDowntimePercentage)),
    totalDowntimeMinutes,
    plannedDowntimeMinutes,
    unplannedDowntimeMinutes,
    totalActivities,
    criticalMaintenanceCount,
    openTicketsCount,
    linkedPartsCount,
    averageRepairTime: Math.round(averageRepairTime * 100) / 100,
    maintenanceFrequency: maintenanceRecords.length,
    safetyComplianceScore: safetyInspections.length > 0 
      ? (safetyInspections.filter((s: any) => s.status === 'passed').length / safetyInspections.length) * 100
      : 100
  };
}

export async function POST(request: NextRequest) {
  try {
    // Extract JWT token from the request
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required', code: 'NO_TOKEN' },
        { status: 401 }
      );
    }

    // Get user context for authentication
    const user = await getUserContext(request);
    
    // TEMPORARY: Allow access even without user context for testing (following employee analysis pattern)
    if (!user) {
      console.log('⚠️ Asset Analysis API: No user context found, proceeding with fallback');
    }

    const { assetId } = await request.json();

    if (!assetId) {
      return NextResponse.json(
        { success: false, message: 'Asset ID is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Generating AI analysis for asset:', assetId);

    // Connect to database and aggregate asset data
    const { db } = await connectToDatabase();
    const assetData = await aggregateAssetData(assetId, db, user);
    const analysis = calculateAssetAnalysis(assetData);

    // Ensure initialization is complete before checking status
    if (apiKeyStatus === 'untested') {
      console.log('🔄 API key not yet tested, waiting for initialization...');
      await initializeGeminiAI();
    }

    console.log(`🔍 Current API status: ${apiKeyStatus}, genAI initialized: ${!!genAI}`);

    // Check if Gemini AI is available and valid
    if (!genAI || apiKeyStatus !== 'valid') {
      console.log(`🔄 Using fallback analysis. Reason: genAI=${!!genAI}, status=${apiKeyStatus}`);
      
      const mockAnalysis = generateMockAnalysis({ asset: assetData.asset, analysis });
      
      return NextResponse.json({
        success: true,
        data: {
          analysis: mockAnalysis,
          assetName: assetData.asset.assetName,
          analysisDate: new Date().toISOString(),
          metrics: analysis,
          source: 'fallback',
          note: 'Analysis generated using internal algorithms due to AI service limitations'
        },
      });
    }

    console.log('🚀 Proceeding with AI-powered analysis...');

    // Get the generative model with safety settings
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    });

    // Prepare the optimized prompt for asset analysis
    const prompt = generateOptimizedAssetAnalysisPrompt(assetData, analysis);

    // Generate the analysis with timeout and retry logic
    let result;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        console.log(`🎯 AI generation attempt ${attempts}/${maxAttempts}`);
        
        result = await Promise.race([
          model.generateContent(prompt),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('AI analysis timeout')), 30000)
          )
        ]) as any;
        
        break; // Success, exit retry loop
      } catch (error) {
        console.error(`❌ Attempt ${attempts} failed:`, error);
        
        if (attempts === maxAttempts) {
          // All attempts failed, use fallback
          console.log('🔄 All AI attempts failed, using fallback analysis');
          const mockAnalysis = generateMockAnalysis({ asset: assetData.asset, analysis });
          
          return NextResponse.json({
            success: true,
            data: {
              analysis: mockAnalysis,
              assetName: assetData.asset.assetName,
              analysisDate: new Date().toISOString(),
              metrics: analysis,
              source: 'fallback',
              note: 'Analysis generated using internal algorithms due to AI service errors'
            },
          });
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }

    const response = await result.response;
    const aiAnalysis = response.text();

    console.log('✅ AI analysis generated successfully');

    return NextResponse.json({
      success: true,
      data: {
        analysis: aiAnalysis,
        assetName: assetData.asset.assetName,
        analysisDate: new Date().toISOString(),
        metrics: analysis,
        source: 'ai',
        note: 'Analysis generated using AI-powered insights'
      },
    });

  } catch (error) {
    console.error('Asset Analysis API Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to analyze asset data',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}

function generateOptimizedAssetAnalysisPrompt(assetData: any, analysis: any): string {
  const { asset, linkedParts, activityLogs, maintenanceRecords, tickets, safetyInspections } = assetData;
  
  return `
Analyze this CMMS asset's performance and provide a CONCISE analysis in TABLE FORMAT (max 400 words):

**Asset:** ${asset.assetName} - ${asset.categoryName} (${asset.departmentName || 'N/A'})
**Status:** ${asset.statusText} | **Type:** ${asset.assetType}

**Performance Metrics:**
- Uptime: ${analysis.uptimePercentage.toFixed(1)}%
- Total Downtime: ${analysis.totalDowntimeMinutes} minutes
- Planned Downtime: ${analysis.plannedDowntimePercentage.toFixed(1)}%
- Unplanned Downtime: ${analysis.unplannedDowntimePercentage.toFixed(1)}%
- Maintenance Events: ${analysis.maintenanceFrequency}
- Open Tickets: ${analysis.openTicketsCount}
- Linked Parts: ${analysis.linkedPartsCount}
- Safety Score: ${analysis.safetyComplianceScore.toFixed(1)}%

**Recent Activity Summary:**
- Activity Logs: ${activityLogs.length}
- Maintenance Records: ${maintenanceRecords.length}
- Tickets: ${tickets.length}
- Safety Inspections: ${safetyInspections.length}

Provide analysis in this EXACT TABLE FORMAT:

## 🏭 Asset Performance Analysis

| **Metric** | **Value** | **Status** | **Recommendation** |
|------------|-----------|------------|-------------------|
| **Overall Uptime** | [%] | [🟢/🟡/🔴 Status] | [Brief action item] |
| **Total Downtime** | [%] | [🟢/🟡/🔴 Status] | [Brief action item] |
| **Planned Downtime** | [%] | [🟢/🟡/🔴 Status] | [Brief action item] |
| **Unplanned Downtime** | [%] | [🟢/🟡/🔴 Status] | [Brief action item] |
| **Activity Volume** | [count] events | [🟢/🟡/🔴 Status] | [Brief action item] |
| **Parts Health** | [count] tracked | [🟢/🟡/🔴 Status] | [Brief action item] |

## 🎯 Key Insights
• [One critical insight about performance]
• [One insight about maintenance patterns]
• [One insight about reliability trends]

## 🔧 Priority Actions
1. **[Priority Level]**: [Specific actionable recommendation]
2. **[Priority Level]**: [Specific actionable recommendation]  
3. **[Priority Level]**: [Specific actionable recommendation]

Focus on actionable insights. Use 🟢 (good), 🟡 (caution), 🔴 (critical) for status. Keep recommendations specific and measurable.
`;
}
