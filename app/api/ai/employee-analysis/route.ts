import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getUserContext } from '@/lib/auth-helpers';


// Test if API key is valid
async function testApiKey(apiKey: string): Promise<boolean> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Simple test request
    const result = await model.generateContent('Test');
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

// Mock AI response for fallback
function generateMockAnalysis(employee: any): string {
  const performanceMetrics = employee.performanceMetrics || {};
  const efficiency = performanceMetrics.efficiency || 0;
  const rating = performanceMetrics.rating || 0;
  const tasksCompleted = performanceMetrics.totalTasksCompleted || 0;
  const ticketsResolved = performanceMetrics.ticketsResolved || 0;

  return `
## 📊 Performance Summary
${employee.name} demonstrates ${efficiency > 80 ? 'excellent' : efficiency > 60 ? 'good' : 'developing'} performance as a ${employee.role} in ${employee.department}. Current efficiency rating of ${efficiency}% with ${tasksCompleted} tasks completed shows ${rating >= 4 ? 'strong' : rating >= 3 ? 'solid' : 'emerging'} contribution to team objectives.

## ✅ Key Strengths
• ${tasksCompleted > 50 ? 'High task completion rate' : 'Consistent task engagement'}
• ${ticketsResolved > 20 ? 'Strong problem-solving skills' : 'Growing technical capabilities'}

## ⚠️ Areas to Improve
• ${efficiency < 70 ? 'Focus on improving work efficiency' : 'Maintain current performance levels'}
• ${rating < 4 ? 'Enhance overall performance quality' : 'Continue excellence in current role'}

## 🎯 Quick Recommendations
• ${efficiency < 80 ? 'Implement time management strategies to boost efficiency' : 'Share best practices with team members'}
• ${ticketsResolved < 30 ? 'Focus on technical skill development' : 'Take on more complex problem-solving tasks'}

## 📈 Next Quarter Goals
• ${efficiency < 80 ? `Increase efficiency from ${efficiency}% to ${Math.min(efficiency + 15, 95)}%` : `Maintain efficiency above ${efficiency}%`}
• ${tasksCompleted < 50 ? `Complete ${tasksCompleted + 20} tasks per quarter` : `Complete ${Math.floor(tasksCompleted * 1.1)} tasks per quarter`}

*Note: This analysis was generated using fallback data processing due to AI service limitations.*
`;
}

export async function POST(request: NextRequest) {
  try {
    // Get user context for authentication
    const user = await getUserContext(request);
    
    // TEMPORARY: Allow access even without authentication for testing
    if (!user) {
      console.log('⚠️ Employee Analysis API: No user context found, proceeding with fallback');
    }

    const { employeeData } = await request.json();

    if (!employeeData) {
      return NextResponse.json(
        { success: false, message: 'Employee data is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Generating AI analysis for employee:', employeeData.name);

    // Ensure initialization is complete before checking status
    if (apiKeyStatus === 'untested') {
      console.log('🔄 API key not yet tested, waiting for initialization...');
      await initializeGeminiAI();
    }

    console.log(`🔍 Current API status: ${apiKeyStatus}, genAI initialized: ${!!genAI}`);

    // Check if Gemini AI is available and valid
    if (!genAI || apiKeyStatus !== 'valid') {
      console.log(`🔄 Using fallback analysis. Reason: genAI=${!!genAI}, status=${apiKeyStatus}`);
      
      const mockAnalysis = generateMockAnalysis(employeeData);
      
      return NextResponse.json({
        success: true,
        data: {
          analysis: mockAnalysis,
          employeeName: employeeData.name,
          analysisDate: new Date().toISOString(),
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
        maxOutputTokens: 1024, // Limit response length
      }
    });

    // Prepare the optimized prompt for employee analysis
    const prompt = generateOptimizedEmployeeAnalysisPrompt(employeeData);

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
          const mockAnalysis = generateMockAnalysis(employeeData);
          
          return NextResponse.json({
            success: true,
            data: {
              analysis: mockAnalysis,
              employeeName: employeeData.name,
              analysisDate: new Date().toISOString(),
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
    const analysis = response.text();

    console.log('✅ AI analysis generated successfully');

    return NextResponse.json({
      success: true,
      data: {
        analysis,
        employeeName: employeeData.name,
        analysisDate: new Date().toISOString(),
        source: 'ai',
        note: 'Analysis generated using AI-powered insights'
      },
    });

  } catch (error) {
    console.error('Employee Analysis API Error:', error);
    
    // Always provide fallback response instead of failing
    try {
      const { employeeData } = await request.json();
      const mockAnalysis = generateMockAnalysis(employeeData);
      
      return NextResponse.json({
        success: true,
        data: {
          analysis: mockAnalysis,
          employeeName: employeeData.name,
          analysisDate: new Date().toISOString(),
          source: 'fallback',
          note: 'Analysis generated using internal algorithms due to technical issues'
        },
      });
    } catch (fallbackError) {
      // Final fallback if everything fails
      return NextResponse.json(
        { 
          success: false,
          message: 'Unable to generate employee analysis at this time',
          error: 'Service temporarily unavailable'
        },
        { status: 503 }
      );
    }
  }
}

function generateOptimizedEmployeeAnalysisPrompt(employee: any): string {
  const performanceMetrics = employee.performanceMetrics || {};
  
  return `
Analyze this CMMS employee's performance and provide a CONCISE analysis (max 300 words):

**Employee:** ${employee.name} - ${employee.role} (${employee.department})
**Key Metrics:**
- Tasks Completed: ${performanceMetrics.totalTasksCompleted || 0}
- Tickets Resolved: ${performanceMetrics.ticketsResolved || 0}
- Efficiency: ${performanceMetrics.efficiency || 0}%
- Rating: ${performanceMetrics.rating || 0}/5
- Work Hours: ${employee.totalWorkHours || 0}

Provide analysis in this EXACT format:

## 📊 Performance Summary
[2-3 sentences highlighting overall performance]

## ✅ Key Strengths
• [One strength]
• [Another strength]

## ⚠️ Areas to Improve
• [One improvement area]
• [Another improvement area]

## 🎯 Quick Recommendations
• [One actionable recommendation]
• [Another actionable recommendation]

## 📈 Next Quarter Goals
• [One specific goal with number]
• [Another specific goal with number]

Keep it professional, specific, and under 300 words total. Focus only on the most important insights.
`;
}
