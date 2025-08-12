import type { NoticeBoardFormData } from "@/types/notice-board";

// Sample employee data for creating realistic notice board entries
const sampleEmployees = [
  {
    id: "6895a3eea908f4c0db6b6304",
    name: "Karthick",
    email: "karthick1242004@gmail.com",
    role: "Super Administrator",
    department: "Quality Assurance",
    accessLevel: "super_admin"
  },
  {
    id: "689aad45e3d407a4e867a91e",
    name: "Srinath VV",
    email: "srinath.vv@company.com",
    role: "Senior Quality Analyst",
    department: "Quality Assurance",
    accessLevel: "department_admin"
  },
  {
    id: "689aad45e3d407a4e867a91f",
    name: "Dr. Emily Chen",
    email: "emily.chen@company.com",
    role: "Quality Assurance Manager",
    department: "Quality Assurance",
    accessLevel: "department_admin"
  },
  {
    id: "689aad45e3d407a4e867a920",
    name: "Mike Johnson",
    email: "mike.johnson@company.com",
    role: "Maintenance Supervisor",
    department: "Maintenance",
    accessLevel: "department_admin"
  },
  {
    id: "689aad45e3d407a4e867a921",
    name: "Sarah Williams",
    email: "sarah.williams@company.com",
    role: "Safety Officer",
    department: "Safety & Compliance",
    accessLevel: "department_admin"
  },
  {
    id: "689aad45e3d407a4e867a922",
    name: "David Rodriguez",
    email: "david.rodriguez@company.com",
    role: "Production Manager",
    department: "Production",
    accessLevel: "department_admin"
  },
  {
    id: "689aad45e3d407a4e867a923",
    name: "Lisa Thompson",
    email: "lisa.thompson@company.com",
    role: "HR Director",
    department: "Human Resources",
    accessLevel: "department_admin"
  }
];

// Sample notice board entries with realistic content
export const sampleNoticeBoardEntries: NoticeBoardFormData[] = [
  {
    title: "Annual Safety Training Program - 2025",
    content: "All employees are required to complete the annual safety training program by March 31st, 2025. This comprehensive training covers workplace safety protocols, emergency procedures, and updated safety regulations. Please contact your department safety coordinator for scheduling.",
    type: "text",
    priority: "high",
    targetAudience: "all",
    tags: ["safety", "training", "mandatory", "2025"],
    isPublished: true,
    expiresAt: "2025-03-31T23:59:59.000Z"
  },
  {
    title: "New Quality Management System Implementation",
    content: "We are implementing a new Quality Management System (QMS) to enhance our quality control processes. The system will be rolled out in phases starting next month. Training sessions will be scheduled for all quality assurance personnel and department managers.",
    type: "text",
    priority: "medium",
    targetAudience: "department",
    targetDepartments: ["Quality Assurance", "Production", "Maintenance"],
    tags: ["quality", "system", "implementation", "training"],
    isPublished: true,
    expiresAt: "2025-06-30T23:59:59.000Z"
  },
  {
    title: "Maintenance Schedule Updates - February 2025",
    content: "Updated maintenance schedules for February 2025 are now available. Please review the schedules for your assigned equipment and ensure all preventive maintenance tasks are completed on time. Contact the maintenance department for any scheduling conflicts.",
    type: "text",
    priority: "medium",
    targetAudience: "department",
    targetDepartments: ["Maintenance", "Production"],
    tags: ["maintenance", "schedule", "february", "preventive"],
    isPublished: true,
    expiresAt: "2025-02-28T23:59:59.000Z"
  },
  {
    title: "Employee Wellness Program Launch",
    content: "We're excited to announce the launch of our new Employee Wellness Program! This program includes health screenings, fitness challenges, mental health support, and wellness workshops. Registration opens next week. Stay healthy, stay productive!",
    type: "text",
    priority: "low",
    targetAudience: "all",
    tags: ["wellness", "health", "program", "launch"],
    isPublished: true,
    expiresAt: "2025-12-31T23:59:59.000Z"
  },
  {
    title: "ISO 9001:2015 Certification Renewal",
    content: "Our ISO 9001:2015 certification renewal audit is scheduled for April 15-17, 2025. All departments must ensure their quality documentation is up to date and processes are being followed correctly. This is critical for maintaining our certification status.",
    type: "text",
    priority: "high",
    targetAudience: "department",
    targetDepartments: ["Quality Assurance", "All Departments"],
    tags: ["ISO", "certification", "audit", "quality"],
    isPublished: true,
    expiresAt: "2025-04-17T23:59:59.000Z"
  },
  {
    title: "New Equipment Installation - Production Line B",
    content: "New automated equipment will be installed on Production Line B from March 10-15, 2025. During this period, the line will be temporarily shut down. Production planning has been adjusted accordingly. Training for the new equipment will be provided to operators.",
    type: "text",
    priority: "medium",
    targetAudience: "department",
    targetDepartments: ["Production", "Maintenance"],
    tags: ["equipment", "installation", "production", "training"],
    isPublished: true,
    expiresAt: "2025-03-15T23:59:59.000Z"
  },
  {
    title: "Emergency Contact Information Update",
    content: "All employees are requested to update their emergency contact information in the HR system by January 31st, 2025. This information is crucial for workplace safety and emergency response procedures. Please log into the employee portal to make any necessary updates.",
    type: "text",
    priority: "medium",
    targetAudience: "all",
    tags: ["emergency", "contact", "HR", "safety"],
    isPublished: true,
    expiresAt: "2025-01-31T23:59:59.000Z"
  }
];

// Function to create a notice board entry with employee details
export function createNoticeWithEmployee(
  noticeData: NoticeBoardFormData,
  employeeIndex: number = 0
) {
  const employee = sampleEmployees[employeeIndex % sampleEmployees.length];
  
  return {
    ...noticeData,
    // Add employee information
    createdBy: employee.id,
    createdByName: employee.name,
    createdByRole: employee.role,
    createdByEmail: employee.email,
    createdByDepartment: employee.department,
    createdByAccessLevel: employee.accessLevel,
    // Add timestamps
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // Add additional metadata
    isActive: true,
    publishedAt: noticeData.isPublished ? new Date().toISOString() : undefined,
    viewCount: Math.floor(Math.random() * 50), // Random view count for demo
    viewedBy: [] // Empty array for new notices
  };
}

// Function to get all sample notices with employee details
export function getAllSampleNotices() {
  return sampleNoticeBoardEntries.map((notice, index) => 
    createNoticeWithEmployee(notice, index)
  );
}

// Export sample employees for use in other parts of the application
export { sampleEmployees };
