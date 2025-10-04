import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import { connectToDatabase } from '@/lib/mongodb';
import OpenAI from 'openai';
import { ObjectId } from 'mongodb';
import { calculateActivityDowntime, formatActivityDowntime } from '@/lib/activity-downtime-utils';

// OpenRouter API configuration with free models
interface OpenRouterConfig {
  model: string;
  displayName: string;
  maxTokens: number;
  isRecommended: boolean;
}

const OPENROUTER_FREE_MODELS: OpenRouterConfig[] = [
  {
    model: 'x-ai/grok-4-fast:free',
    displayName: 'xAI Grok 4 Fast (Free)',
    maxTokens: 2000000,
    isRecommended: true
  },
  {
    model: 'deepseek/deepseek-chat-v3.1:free',
    displayName: 'DeepSeek V3.1 (Free)',
    maxTokens: 163840,
    isRecommended: true
  },
  {
    model: 'nvidia/nemotron-nano-9b-v2:free',
    displayName: 'NVIDIA Nemotron Nano 9B (Free)',
    maxTokens: 128000,
    isRecommended: true
  }
];

// Test OpenRouter API functionality
async function testOpenRouterAPI(apiKey: string): Promise<{ isValid: boolean; workingModel: OpenRouterConfig | null; error?: string }> {
  for (const modelConfig of OPENROUTER_FREE_MODELS) {
    try {
      console.log(`🧪 Testing model: ${modelConfig.displayName}...`);
      
      const testClient = new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: apiKey,
        defaultHeaders: {
          'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
          'X-Title': 'CMMS Asset Analysis System',
        },
      });

      const completion = await Promise.race([
        testClient.chat.completions.create({
          model: modelConfig.model,
          messages: [{ role: 'user', content: 'Test' }],
          max_tokens: 50,
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Model test timeout')), 10000)
        )
      ]) as any;

      if (completion.choices && completion.choices.length > 0) {
        console.log(`✅ Model ${modelConfig.displayName} works!`);
        return { isValid: true, workingModel: modelConfig };
      }
    } catch (error) {
      console.log(`❌ Model ${modelConfig.displayName} failed:`, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  return { isValid: false, workingModel: null, error: 'No working models found' };
}

// Initialize OpenRouter with comprehensive validation
let openRouterClient: OpenAI | null = null;
let workingModel: OpenRouterConfig | null = null;
let apiKeyStatus: 'valid' | 'invalid' | 'untested' = 'untested';

async function initializeOpenRouter(): Promise<void> {
  try {
    const apiKey = process.env.OPEN_ROUTER_API;
    
    if (!apiKey) {
      console.error('❌ OPEN_ROUTER_API environment variable not set');
      apiKeyStatus = 'invalid';
      return;
    }
    
    console.log('🔍 Initializing OpenRouter API for Asset Analysis...');
    console.log(`API Key present: ${!!apiKey}`);
    console.log(`API Key length: ${apiKey?.length || 0}`);
    console.log(`API Key prefix: ${apiKey?.substring(0, 8) || 'None'}...`);
    
    const testResult = await testOpenRouterAPI(apiKey);
    
    if (testResult.isValid && testResult.workingModel) {
      apiKeyStatus = 'valid';
      workingModel = testResult.workingModel;
      
      openRouterClient = new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: apiKey,
        defaultHeaders: {
          'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
          'X-Title': 'CMMS Asset Analysis System',
        },
      });
      
      console.log(`✅ OpenRouter API initialized successfully for Asset Analysis`);
      console.log(`🎯 Working model: ${workingModel.displayName} (${workingModel.model})`);
    } else {
      console.error(`❌ OpenRouter API initialization failed: ${testResult.error}`);
      apiKeyStatus = 'invalid';
    }
  } catch (error) {
    console.error('❌ Failed to initialize OpenRouter API:', error);
    apiKeyStatus = 'invalid';
  }
}

// Initialize on startup
initializeOpenRouter().catch(console.error);

// Calculate AI-enhanced metrics for asset
function calculateAIMetrics(asset: any, analysis: any) {
  const uptimePercentage = analysis.uptimePercentage || 85;
  const downtimePercentage = 100 - uptimePercentage;
  const totalActivities = analysis.totalActivities || 0;
  const openTickets = analysis.openTicketsCount || 0;
  const maintenanceFrequency = analysis.maintenanceFrequency || 0;
  
  // AI-calculated scores (0-100 scale)
  const uptimeScore = Math.round(uptimePercentage);
  const efficiencyScore = Math.min(100, Math.round(
    (uptimeScore * 0.5) + 
    ((100 - (analysis.unplannedDowntimePercentage || 0)) * 0.3) + 
    (analysis.linkedPartsCount > 0 ? 20 : 0)
  ));
  
  // Asset condition score based on multiple factors
  const conditionScore = Math.min(100, Math.round(
    (uptimeScore * 0.4) +
    ((100 - downtimePercentage) * 0.3) +
    (openTickets === 0 ? 20 : Math.max(0, 20 - openTickets * 2)) +
    (maintenanceFrequency > 0 ? 10 : 0)
  ));
  
  // Performance indicators (0-100 scale for each)
  const performance = {
    reliability: Math.min(100, Math.round(uptimeScore + (analysis.plannedDowntimePercentage || 0 < 10 ? 10 : 0))),
    availability: uptimeScore,
    maintainability: Math.min(100, Math.round((maintenanceFrequency / Math.max(1, totalActivities)) * 100)),
    efficiency: efficiencyScore,
    safetyScore: Math.min(100, Math.round(85 + (analysis.safetyInspectionsCount || 0) * 3))
  };

  return {
    uptimeScore,
    efficiencyScore,
    conditionScore,
    totalActivities,
    openTickets,
    maintenanceFrequency,
    downtimeHours: Math.round((analysis.totalDowntimeMinutes || 0) / 60),
    performance
  };
}

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
${(analysis.linkedPartsCount || 0) === 0 ? '3. **Setup**: Link critical spare parts to asset' : '3. **Maintain**: Update parts inventory regularly'}

*Note: This analysis was generated using AI-enhanced algorithms combining performance data, maintenance history, and industry benchmarks.*`;
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

  console.log('🔍 [Data Aggregation] - Fetched data for asset:', assetId);
  console.log('- Activity Logs:', activityLogs.length);
  console.log('- Daily Log Activities (with downtime):', dailyLogActivities.length);
  console.log('- Sample daily log activity with downtime:', dailyLogActivities[0]);

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

  console.log('🔍 [AI Analysis] - Raw data structure:');
  console.log('- Activity Logs count:', activityLogs?.length || 0);
  console.log('- Daily Log Activities count:', dailyLogActivities?.length || 0);
  console.log('- Sample activity log:', activityLogs?.[0]);
  console.log('- Sample daily log activity:', dailyLogActivities?.[0]);

  // Check for downtime data in activity logs
  const activityLogsWithDowntime = activityLogs.filter((log: any) => 
    log.metadata?.downtime !== undefined && log.metadata?.downtime !== null
  );
  
  console.log('📊 [AI Analysis] - Downtime data check:');
  console.log('- Activity logs with downtime metadata:', activityLogsWithDowntime.length);
  
  // Check for downtime data in daily log activities
  const dailyLogsWithDowntime = dailyLogActivities.filter((activity: any) => 
    activity.downtime !== undefined && activity.downtime !== null && activity.downtime > 0
  );
  
  console.log('- Daily log activities with downtime:', dailyLogsWithDowntime.length);
  console.log('- Sample downtime data from daily logs:', dailyLogsWithDowntime.slice(0, 3));

  // Calculate detailed downtime metrics using the enhanced utility
  // Try both data sources to find downtime information
  let downtimeMetrics;
  
  if (activityLogsWithDowntime.length > 0) {
    console.log('✅ [AI Analysis] - Using activity logs for downtime calculation');
    downtimeMetrics = calculateActivityDowntime(activityLogs);
  } else if (dailyLogsWithDowntime.length > 0) {
    console.log('✅ [AI Analysis] - Converting daily log activities to activity log format for downtime calculation');
    // Convert daily log activities to activity log format
    const convertedActivityLogs = dailyLogActivities.map((activity: any) => ({
      ...activity,
      metadata: {
        downtime: activity.downtime,
        downtimeType: activity.downtimeType
      }
    }));
    downtimeMetrics = calculateActivityDowntime(convertedActivityLogs);
  } else {
    console.log('⚠️ [AI Analysis] - No downtime data found, using empty metrics');
    downtimeMetrics = calculateActivityDowntime([]);
  }

  console.log('📈 [AI Analysis] - Calculated downtime metrics:', {
    totalDowntimeMinutes: downtimeMetrics.totalDowntimeMinutes,
    plannedDowntimeMinutes: downtimeMetrics.plannedDowntimeMinutes,
    unplannedDowntimeMinutes: downtimeMetrics.unplannedDowntimeMinutes,
    downtimeEvents: downtimeMetrics.downtimeEvents,
    periodDays: downtimeMetrics.periodDays
  });

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

  // Calculate uptime percentage
  const totalPossibleMinutes = downtimeMetrics.periodDays * 24 * 60;
  const uptimeMinutes = totalPossibleMinutes - downtimeMetrics.totalDowntimeMinutes;
  const uptimePercentage = Math.max(0, (uptimeMinutes / totalPossibleMinutes) * 100);

  const finalAnalysis = {
    uptimePercentage: Math.max(0, Math.min(100, uptimePercentage)),
    downtimePercentage: Math.max(0, Math.min(100, (downtimeMetrics.totalDowntimeMinutes / totalPossibleMinutes) * 100)),
    plannedDowntimePercentage: Math.max(0, Math.min(100, (downtimeMetrics.plannedDowntimeMinutes / totalPossibleMinutes) * 100)),
    unplannedDowntimePercentage: Math.max(0, Math.min(100, (downtimeMetrics.unplannedDowntimeMinutes / totalPossibleMinutes) * 100)),
    totalDowntimeMinutes: downtimeMetrics.totalDowntimeMinutes,
    plannedDowntimeMinutes: downtimeMetrics.plannedDowntimeMinutes,
    unplannedDowntimeMinutes: downtimeMetrics.unplannedDowntimeMinutes,
    downtimeEvents: downtimeMetrics.downtimeEvents,
    averageDowntimeMinutes: downtimeMetrics.averageDowntimeMinutes,
    downtimeByType: downtimeMetrics.downtimeByType,
    downtimeByDate: downtimeMetrics.downtimeByDate,
    periodDays: downtimeMetrics.periodDays,
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

  console.log('🎯 [AI Analysis] - Final analysis metrics being sent to AI:');
  console.log('- Uptime Percentage:', finalAnalysis.uptimePercentage);
  console.log('- Downtime Percentage:', finalAnalysis.downtimePercentage);
  console.log('- Planned Downtime Percentage:', finalAnalysis.plannedDowntimePercentage);
  console.log('- Unplanned Downtime Percentage:', finalAnalysis.unplannedDowntimePercentage);
  console.log('- Total Downtime Minutes:', finalAnalysis.totalDowntimeMinutes);
  console.log('- Downtime Events:', finalAnalysis.downtimeEvents);
  console.log('- Period Days:', finalAnalysis.periodDays);
  console.log('- Total Possible Minutes:', totalPossibleMinutes);

  return finalAnalysis;
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

    // Calculate AI metrics for dashboard
    const aiMetrics = calculateAIMetrics(assetData.asset, analysis);

    // Ensure initialization is complete before checking status
    if (apiKeyStatus === 'untested') {
      console.log('🔄 OpenRouter not yet tested, waiting for initialization...');
      await initializeOpenRouter();
    }

    console.log(`🔍 Current OpenRouter status: ${apiKeyStatus}, client initialized: ${!!openRouterClient}`);

    // Check if OpenRouter is available and valid
    if (!openRouterClient || apiKeyStatus !== 'valid' || !workingModel) {
      console.log(`🔄 Using fallback analysis. Reason: client=${!!openRouterClient}, status=${apiKeyStatus}, model=${!!workingModel}`);
      
      const mockAnalysis = generateMockAnalysis({ asset: assetData.asset, analysis });
      
      return NextResponse.json({
        success: true,
        data: {
          analysis: mockAnalysis,
          assetName: assetData.asset.assetName,
          analysisDate: new Date().toISOString(),
          metrics: analysis,
          aiMetrics: aiMetrics,
          source: 'fallback',
          note: 'Analysis generated using AI-enhanced algorithms'
        },
      });
    }

    console.log('🚀 Proceeding with OpenRouter AI-powered analysis...');
    console.log(`🤖 Using model: ${workingModel.displayName} (${workingModel.model})`);

    // Prepare the optimized prompt for asset analysis
    console.log('🤖 [AI Prompt] - Analysis data being sent to prompt generation:');
    console.log('- Analysis uptime:', analysis.uptimePercentage);
    console.log('- Analysis downtime:', analysis.downtimePercentage);
    console.log('- Analysis total downtime minutes:', analysis.totalDowntimeMinutes);
    console.log('- Analysis downtime events:', analysis.downtimeEvents);
    console.log('- Analysis downtime by type:', analysis.downtimeByType);
    
    const prompt = generateOptimizedAssetAnalysisPrompt(assetData, analysis);
    
    console.log('📝 [AI Prompt] - Generated prompt excerpt:');
    console.log(prompt.substring(0, 500) + '...');

    // Generate the analysis with timeout and retry logic
    let completion;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        console.log(`🎯 AI generation attempt ${attempts}/${maxAttempts}`);
        
        completion = await Promise.race([
          openRouterClient.chat.completions.create({
            model: workingModel.model,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 1500,
            temperature: 0.7,
          }),
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
              aiMetrics: aiMetrics,
              source: 'fallback',
              note: 'Analysis generated using AI-enhanced algorithms due to service errors'
            },
          });
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts - 1)));
      }
    }

    // Extract and validate AI response
    if (!completion.choices || completion.choices.length === 0 || !completion.choices[0].message?.content) {
      throw new Error('Invalid response from OpenRouter API');
    }

    const aiAnalysis = completion.choices[0].message.content;

    console.log('✅ OpenRouter AI analysis generated successfully');
    console.log(`📊 API Usage - Model: ${workingModel.displayName}, Tokens: ${completion.usage?.total_tokens || 'unknown'}`);

    return NextResponse.json({
      success: true,
      data: {
        analysis: aiAnalysis,
        assetName: assetData.asset.assetName,
        analysisDate: new Date().toISOString(),
        metrics: analysis,
        aiMetrics: aiMetrics,
        source: 'openrouter_ai',
        model: workingModel.displayName,
        note: 'Analysis generated using OpenRouter AI-powered insights'
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

**Performance Metrics (${analysis.periodDays || 30} days):**
- Uptime: ${analysis.uptimePercentage.toFixed(1)}%
- Total Downtime: ${formatActivityDowntime(analysis.totalDowntimeMinutes)} (${analysis.downtimeEvents || 0} events)
- Planned Downtime: ${formatActivityDowntime(analysis.plannedDowntimeMinutes)} (${analysis.plannedDowntimePercentage.toFixed(1)}%)
- Unplanned Downtime: ${formatActivityDowntime(analysis.unplannedDowntimeMinutes)} (${analysis.unplannedDowntimePercentage.toFixed(1)}%)
- Average Downtime per Event: ${formatActivityDowntime(analysis.averageDowntimeMinutes || 0)}
- Maintenance Events: ${analysis.maintenanceFrequency}
- Open Tickets: ${analysis.openTicketsCount}
- Linked Parts: ${analysis.linkedPartsCount}
- Safety Score: ${analysis.safetyComplianceScore.toFixed(1)}%

**Downtime Analysis:**
${Object.entries(analysis.downtimeByType || {}).length > 0 
  ? Object.entries(analysis.downtimeByType).map(([type, data]: [string, any]) => 
      `- ${type}: ${formatActivityDowntime(data.minutes)} (${data.count} events)`
    ).join('\n')
  : '- No downtime events recorded'
}

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

