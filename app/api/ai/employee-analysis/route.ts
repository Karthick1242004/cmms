import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import OpenAI from 'openai';


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
  },
  {
    model: 'openai/gpt-oss-120b:free',
    displayName: 'OpenAI GPT-OSS 120B (Free)',
    maxTokens: 32768,
    isRecommended: false
  },
  {
    model: 'z-ai/glm-4.5-air:free',
    displayName: 'Z.AI GLM 4.5 Air (Free)',
    maxTokens: 131072,
    isRecommended: false
  },
  {
    model: 'google/gemma-3n-e2b-it:free',
    displayName: 'Google Gemma 3n 2B (Free)',
    maxTokens: 8192,
    isRecommended: false
  }
];

// Input validation for employee data
function validateEmployeeData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data || typeof data !== 'object') {
    errors.push('Employee data must be an object');
    return { isValid: false, errors };
  }
  
  // Required fields validation
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('Employee name is required and must be a non-empty string');
  }
  
  if (!data.role || typeof data.role !== 'string') {
    errors.push('Employee role is required and must be a string');
  }
  
  if (!data.department || typeof data.department !== 'string') {
    errors.push('Employee department is required and must be a string');
  }
  
  // Performance metrics validation
  if (data.performanceMetrics) {
    const metrics = data.performanceMetrics;
    
    if (metrics.efficiency !== undefined) {
      if (typeof metrics.efficiency !== 'number' || metrics.efficiency < 0 || metrics.efficiency > 100) {
        errors.push('Efficiency must be a number between 0 and 100');
      }
    }
    
    if (metrics.totalTasksCompleted !== undefined) {
      if (typeof metrics.totalTasksCompleted !== 'number' || metrics.totalTasksCompleted < 0) {
        errors.push('Total tasks completed must be a non-negative number');
      }
    }
    
    if (metrics.rating !== undefined) {
      if (typeof metrics.rating !== 'number' || metrics.rating < 0 || metrics.rating > 5) {
        errors.push('Rating must be a number between 0 and 5');
      }
    }
  }
  
  return { isValid: errors.length === 0, errors };
}

// Test OpenRouter API key and find working model
async function testOpenRouterAPI(apiKey: string): Promise<{ isValid: boolean; workingModel?: OpenRouterConfig; error?: string }> {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    return { isValid: false, error: 'API key is required' };
  }
  
  const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: apiKey,
    defaultHeaders: {
      'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
      'X-Title': 'CMMS Employee Analysis System',
    },
  });
  
  // Test with recommended models first
  const modelsToTest = OPENROUTER_FREE_MODELS.sort((a, b) => 
    b.isRecommended ? 1 : -1
  );
  
  for (const modelConfig of modelsToTest) {
    try {
      console.log(`🧪 Testing OpenRouter model: ${modelConfig.displayName}`);
      
      const completion = await Promise.race([
        openai.chat.completions.create({
          model: modelConfig.model,
          messages: [
            { role: 'system', content: 'You are a helpful assistant. Respond with just "OK" to confirm the connection.' },
            { role: 'user', content: 'Test connection' }
          ],
          max_tokens: 10,
          temperature: 0
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        )
      ]) as any;
      
      if (completion.choices && completion.choices.length > 0) {
        console.log(`✅ Success with OpenRouter model: ${modelConfig.displayName}`);
        return { isValid: true, workingModel: modelConfig };
      }
    } catch (error: any) {
      console.log(`❌ Model ${modelConfig.displayName} failed: ${error.message}`);
      
      // Log specific error types
      if (error.message?.includes('401')) {
        console.log(`   📝 Authentication failed - check API key`);
      } else if (error.message?.includes('429')) {
        console.log(`   📝 Rate limit exceeded`);
      } else if (error.message?.includes('timeout')) {
        console.log(`   📝 Request timeout`);
      }
    }
  }
  
  return { isValid: false, error: 'No working models found' };
}

// OpenRouter API state management
let openRouterClient: OpenAI | null = null;
let apiKeyStatus: 'valid' | 'invalid' | 'untested' = 'untested';
let workingModel: OpenRouterConfig | null = null;

// Rate limiting for API calls (following custom rules)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 30; // 30 requests per minute per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const key = ip || 'anonymous';
  const current = rateLimitMap.get(key);
  
  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (current.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  current.count++;
  return true;
}

async function initializeOpenRouter(): Promise<void> {
  try {
    // Environment variable validation (following custom rules)
    const apiKey = process.env.OPEN_ROUTER_API;
    
    if (!apiKey) {
      console.error('❌ OPEN_ROUTER_API environment variable not set');
      apiKeyStatus = 'invalid';
      return;
    }
    
    console.log('🔍 Initializing OpenRouter API...');
    console.log(`API Key present: ${!!apiKey}`);
    console.log(`API Key length: ${apiKey?.length || 0}`);
    console.log(`API Key prefix: ${apiKey?.substring(0, 8) || 'None'}...`);
    
    // Test the API with multiple free models
    console.log('🧪 Testing OpenRouter API with free models...');
    const testResult = await testOpenRouterAPI(apiKey);
    
    if (testResult.isValid && testResult.workingModel) {
      apiKeyStatus = 'valid';
      workingModel = testResult.workingModel;
      
      openRouterClient = new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: apiKey,
        defaultHeaders: {
          'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
          'X-Title': 'CMMS Employee Analysis System',
        },
      });
      
      console.log(`✅ OpenRouter API initialized successfully`);
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
    // Authentication validation (following custom rules)
    const user = await getUserContext(request);
    if (!user) {
      console.warn('⚠️ Employee Analysis API: Unauthorized access attempt');
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Rate limiting check (following custom rules)
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'anonymous';
    
    if (!checkRateLimit(clientIP)) {
      console.warn(`⚠️ Rate limit exceeded for IP: ${clientIP}`);
      return NextResponse.json(
        { success: false, message: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Input validation (following custom rules - no trusting client data)
    let requestData;
    try {
      requestData = await request.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    const { employeeData } = requestData;
    
    // Comprehensive input validation
    const validation = validateEmployeeData(employeeData);
    if (!validation.isValid) {
      console.warn('⚠️ Invalid employee data received:', validation.errors);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid employee data', 
          errors: validation.errors 
        },
        { status: 400 }
      );
    }

    console.log(`🔍 Generating AI analysis for employee: ${employeeData.name} (${user.name})`);

    // Ensure OpenRouter initialization is complete
    if (apiKeyStatus === 'untested') {
      console.log('🔄 OpenRouter API not yet tested, waiting for initialization...');
      await initializeOpenRouter();
    }

    console.log(`🔍 Current OpenRouter status: ${apiKeyStatus}, client initialized: ${!!openRouterClient}`);

    // Check if OpenRouter is available and valid
    if (!openRouterClient || apiKeyStatus !== 'valid' || !workingModel) {
      console.log(`🔄 Using fallback analysis. Reason: client=${!!openRouterClient}, status=${apiKeyStatus}, model=${!!workingModel}`);
      
      const mockAnalysis = generateMockAnalysis(employeeData);
      
      return NextResponse.json({
        success: true,
        data: {
          analysis: mockAnalysis,
          employeeName: employeeData.name,
          analysisDate: new Date().toISOString(),
          source: 'fallback',
          note: 'Analysis generated using internal algorithms due to AI service limitations',
          userId: user.id
        },
      });
    }

    console.log('🚀 Proceeding with OpenRouter AI-powered analysis...');
    console.log(`🤖 Using model: ${workingModel.displayName} (${workingModel.model})`);

    // Generate optimized prompt
    const prompt = generateOptimizedEmployeeAnalysisPrompt(employeeData);

    // AI generation with timeout and retry logic (following custom rules)
    let completion;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        console.log(`🎯 OpenRouter AI generation attempt ${attempts}/${maxAttempts}`);
        
        completion = await Promise.race([
          openRouterClient.chat.completions.create({
            model: workingModel.model,
            messages: [
              { role: 'system', content: 'You are an expert HR analyst specializing in employee performance evaluation for CMMS (Computerized Maintenance Management Systems). Provide professional, data-driven analysis in the exact markdown format requested.' },
              { role: 'user', content: prompt }
            ],
            max_tokens: Math.min(workingModel.maxTokens, 1024),
            temperature: 0.7,
            top_p: 0.95,
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('OpenRouter request timeout')), 30000)
          )
        ]) as any;
        
        break; // Success, exit retry loop
      } catch (error: any) {
        console.error(`❌ OpenRouter attempt ${attempts} failed:`, error.message);
        
        if (attempts === maxAttempts) {
          // All attempts failed, use fallback
          console.log('🔄 All OpenRouter attempts failed, using fallback analysis');
          const mockAnalysis = generateMockAnalysis(employeeData);
          
          return NextResponse.json({
            success: true,
            data: {
              analysis: mockAnalysis,
              employeeName: employeeData.name,
              analysisDate: new Date().toISOString(),
              source: 'fallback',
              note: 'Analysis generated using internal algorithms due to AI service errors',
              userId: user.id
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

    const analysis = completion.choices[0].message.content;
    console.log('✅ OpenRouter AI analysis generated successfully');

    // Log successful API usage (following custom rules)
    console.log(`📊 API Usage - Model: ${workingModel.displayName}, Tokens: ${completion.usage?.total_tokens || 'unknown'}, User: ${user.name}`);

    return NextResponse.json({
      success: true,
      data: {
        analysis,
        employeeName: employeeData.name,
        analysisDate: new Date().toISOString(),
        source: 'openrouter_ai',
        model: workingModel.displayName,
        note: 'Analysis generated using OpenRouter AI-powered insights',
        userId: user.id
      },
    });

  } catch (error: any) {
    // Error logging (following custom rules - no sensitive data)
    console.error('Employee Analysis API Error:', {
      message: error.message,
      stack: error.stack?.substring(0, 200),
      timestamp: new Date().toISOString()
    });
    
    // Always provide fallback response instead of failing (following custom rules)
    try {
      const { employeeData } = await request.json();
      if (employeeData) {
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
      }
    } catch (fallbackError) {
      console.error('Fallback analysis failed:', fallbackError);
    }
    
    // Final error response (following custom rules - consistent format)
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

