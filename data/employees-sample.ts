import type { EmployeeDetail } from "@/types/employee"

export const sampleEmployeeAnalytics: EmployeeDetail = {
  id: "689aad45e3d407a4e867a91e",
  name: "Srinath VV",
  email: "srinath.vv@company.com",
  phone: "+1-555-0401",
  department: "Quality Assurance",
  role: "Senior Quality Analyst",
  status: "active",
  avatar: "/placeholder-user.jpg",
  employeeId: "QA006",
  joinDate: "2024-06-15T00:00:00.000Z",
  supervisor: "Dr. Emily Chen",
  accessLevel: "normal_user",
  skills: ["Quality Control", "Process Improvement", "Data Analysis", "Risk Assessment", "Compliance Auditing"],
  certifications: ["ISO 9001 Lead Auditor", "Six Sigma Green Belt", "Quality Management Systems"],
  shiftInfo: null,
  emergencyContact: {
    name: "Priya VV",
    relationship: "Spouse",
    phone: "+1-555-0402"
  },
  workShift: "Day",
  
  // Analytics Data - Populated for demonstration
  currentAssignments: ["ASSET-QA-001", "ASSET-QA-003", "ASSET-LAB-002"],
  totalWorkHours: 1850,
  productivityScore: 87,
  reliabilityScore: 94,
  
  workHistory: [
    {
      type: "ticket",
      title: "Quality Audit - Production Line A",
      description: "Comprehensive quality audit of production line A processes",
      assetName: "Production Line A",
      status: "completed",
      date: "2025-01-10T00:00:00.000Z",
      duration: 6
    },
    {
      type: "maintenance",
      title: "Calibration of Testing Equipment",
      description: "Monthly calibration of quality testing equipment",
      assetName: "Testing Equipment QA-001",
      status: "completed",
      date: "2025-01-08T00:00:00.000Z",
      duration: 4
    },
    {
      type: "safety-inspection",
      title: "Safety Protocol Review",
      description: "Review and update safety protocols for lab equipment",
      assetName: "Lab Equipment",
      status: "completed",
      date: "2025-01-05T00:00:00.000Z",
      duration: 3
    },
    {
      type: "daily-log",
      title: "Quality Metrics Documentation",
      description: "Daily logging of quality metrics and KPIs",
      assetName: "QA Database",
      status: "completed",
      date: "2025-01-12T00:00:00.000Z",
      duration: 2
    },
    {
      type: "ticket",
      title: "Process Documentation Review",
      description: "Reviewed and updated quality process documentation",
      assetName: "QA Documentation System",
      status: "completed",
      date: "2025-01-03T00:00:00.000Z",
      duration: 5
    },
    {
      type: "maintenance",
      title: "Equipment Maintenance Check",
      description: "Routine maintenance check for testing equipment",
      assetName: "Testing Equipment QA-002",
      status: "completed",
      date: "2025-01-01T00:00:00.000Z",
      duration: 3
    },
    {
      type: "safety-inspection",
      title: "Lab Safety Inspection",
      description: "Monthly safety inspection of quality control lab",
      assetName: "QA Lab B",
      status: "completed",
      date: "2024-12-28T00:00:00.000Z",
      duration: 4
    },
    {
      type: "ticket",
      title: "Quality Standard Update",
      description: "Updated quality standards based on new regulations",
      assetName: "Quality Standards Database",
      status: "completed",
      date: "2024-12-25T00:00:00.000Z",
      duration: 8
    }
  ],
  
  assetAssignments: [
    {
      assetName: "Quality Testing Lab A",
      assignedDate: "2024-06-15T00:00:00.000Z",
      status: "active",
      role: "Primary Inspector"
    },
    {
      assetName: "Calibration Equipment Set",
      assignedDate: "2024-07-01T00:00:00.000Z",
      status: "active",
      role: "Maintenance Lead"
    },
    {
      assetName: "Production Line Monitoring System",
      assignedDate: "2024-08-15T00:00:00.000Z",
      status: "completed",
      role: "Quality Auditor"
    },
    {
      assetName: "QA Documentation System",
      assignedDate: "2024-09-01T00:00:00.000Z",
      status: "active",
      role: "Documentation Manager"
    },
    {
      assetName: "Testing Equipment QA-002",
      assignedDate: "2024-10-15T00:00:00.000Z",
      status: "completed",
      role: "Equipment Specialist"
    }
  ],
  
  performanceMetrics: {
    totalTasksCompleted: 156,
    averageCompletionTime: 4.2,
    ticketsResolved: 45,
    maintenanceCompleted: 28,
    safetyInspectionsCompleted: 32,
    dailyLogEntries: 51,
    efficiency: 87,
    rating: 4.5,
    lastActivityDate: "2025-01-12T00:00:00.000Z"
  },
  
  createdAt: "2025-08-12T02:56:05.631Z",
  updatedAt: "2025-08-12T02:56:33.232Z"
}

// Additional sample employees for comparison
export const sampleEmployeesWithAnalytics: EmployeeDetail[] = [
  sampleEmployeeAnalytics,
  // You can add more sample employees here if needed
]
