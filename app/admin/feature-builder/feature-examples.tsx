import type React from "react"
import { ClipboardCheck, PenToolIcon as Tool, Calendar, AlertTriangle, Truck, Thermometer } from "lucide-react"

export const featureExamples: {
  id: string
  name: string
  description: string
  icon: React.ElementType
  details: string
}[] = [
  {
    id: "safety-inspections",
    name: "Safety Inspections",
    description: "Track safety inspections across your facilities with customizable forms and workflows.",
    icon: ClipboardCheck,
    details:
      "This feature allows you to create safety inspection records with fields for date, inspector, location, status, and notes. Perfect for compliance and safety management.",
  },
  {
    id: "equipment-calibration",
    name: "Equipment Calibration",
    description: "Manage equipment calibration schedules and records to ensure accuracy and compliance.",
    icon: Tool,
    details:
      "Track calibration dates, results, and technicians for all your precision equipment. Set up notifications for upcoming calibrations to maintain compliance.",
  },
  {
    id: "maintenance-schedules",
    name: "Maintenance Schedules",
    description: "Create and manage preventive maintenance schedules for all your assets.",
    icon: Calendar,
    details:
      "Define maintenance frequencies, track last performed dates, and automatically calculate next due dates. Assign tasks to technicians and include detailed instructions.",
  },
  {
    id: "incident-reports",
    name: "Incident Reports",
    description: "Document and track workplace incidents, near-misses, and follow-up actions.",
    icon: AlertTriangle,
    details:
      "Create a custom feature to record incident details, affected employees, root cause analysis, and corrective actions. Essential for safety management and compliance reporting.",
  },
  {
    id: "vendor-management",
    name: "Vendor Management",
    description: "Track vendors, contracts, and performance metrics in one place.",
    icon: Truck,
    details:
      "Create a custom feature to manage vendor information, contracts, contact details, and performance ratings. Streamline your procurement and vendor relationship management.",
  },
  {
    id: "environmental-monitoring",
    name: "Environmental Monitoring",
    description: "Track environmental conditions across your facilities.",
    icon: Thermometer,
    details:
      "Create a custom feature to record temperature, humidity, air quality, and other environmental metrics. Set up alerts for out-of-range conditions to protect sensitive equipment and materials.",
  },
]
