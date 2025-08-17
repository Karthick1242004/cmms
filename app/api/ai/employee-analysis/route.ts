import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getUserContext } from '@/lib/auth-helpers';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, message: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Prepare the prompt for employee analysis
    const prompt = generateEmployeeAnalysisPrompt(employeeData);

    // Generate the analysis
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysis = response.text();

    return NextResponse.json({
      success: true,
      data: {
        analysis,
        employeeName: employeeData.name,
        analysisDate: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Employee Analysis API Error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to analyze employee data',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function generateEmployeeAnalysisPrompt(employee: any): string {
  return `
You are an AI assistant specializing in employee performance analysis and workplace optimization for a Computerized Maintenance Management System (CMMS). Analyze the following employee data and provide comprehensive insights, feedback, and optimization recommendations.

**Employee Information:**
- Name: ${employee.name}
- Role: ${employee.role}
- Department: ${employee.department}
- Join Date: ${employee.joinDate || 'Not specified'}
- Status: ${employee.status}
- Work Shift: ${employee.workShift || 'Day'}

**Performance Metrics:**
- Total Tasks Completed: ${employee.performanceMetrics?.totalTasksCompleted || 0}
- Average Completion Time: ${employee.performanceMetrics?.averageCompletionTime || 0} hours
- Tickets Resolved: ${employee.performanceMetrics?.ticketsResolved || 0}
- Maintenance Tasks Completed: ${employee.performanceMetrics?.maintenanceCompleted || 0}
- Safety Inspections Completed: ${employee.performanceMetrics?.safetyInspectionsCompleted || 0}
- Daily Log Entries: ${employee.performanceMetrics?.dailyLogEntries || 0}
- Efficiency Rate: ${employee.performanceMetrics?.efficiency || 0}%
- Performance Rating: ${employee.performanceMetrics?.rating || 0}/5
- Total Work Hours: ${employee.totalWorkHours || 0}
- Productivity Score: ${employee.productivityScore || 0}
- Reliability Score: ${employee.reliabilityScore || 0}

**Skills & Certifications:**
${employee.skills ? `- Skills: ${employee.skills.join(', ')}` : '- Skills: Not specified'}
${employee.certifications ? `- Certifications: ${employee.certifications.join(', ')}` : '- Certifications: Not specified'}

**Work History Summary:**
- Total Work History Entries: ${employee.workHistory?.length || 0}
- Recent Activities: ${employee.workHistory?.slice(0, 5).map((item: any) => `${item.type}: ${item.title} (${item.status})`).join('; ') || 'No recent activities'}

**Current Asset Assignments:**
- Active Assignments: ${employee.currentAssignments?.length || 0}
- Asset Assignment History: ${employee.assetAssignments?.length || 0}

**Analysis Requirements:**
Please provide a comprehensive analysis in the following format using markdown:

## 🎯 Performance Overview
Provide a high-level summary of the employee's overall performance.

## 📊 Strengths Analysis
Identify and elaborate on the employee's key strengths based on the data.

## ⚠️ Areas for Improvement
Highlight specific areas where the employee could improve.

## 🚀 Optimization Recommendations
Provide specific, actionable recommendations for:
1. **Productivity Enhancement**
2. **Skill Development**
3. **Work Process Optimization**
4. **Career Growth Opportunities**

## 📈 Performance Insights
Analyze patterns and trends in the employee's work:
- Task completion efficiency
- Work distribution across different types
- Time management patterns
- Quality indicators

## 🎯 Goals & Targets
Suggest specific, measurable goals for the next quarter:
- Performance targets
- Skill development goals
- Process improvement objectives

## 💡 Additional Recommendations
Provide any other insights or suggestions that could benefit the employee and organization.

**Important Notes:**
- Base your analysis strictly on the provided data
- Be constructive and professional in your feedback
- Focus on actionable insights and specific recommendations
- Consider the employee's role and department context
- Highlight both achievements and growth opportunities
- Use specific numbers and metrics where applicable

Please ensure your response is well-structured, professional, and provides valuable insights for both the employee and their supervisor.
`;
}
