export const stats = [
  {
    title: "Total Assets",
    value: "1,247",
    change: "+12%",
    iconName: "Package",
    color: "text-blue-600",
  },
  {
    title: "Active Work Orders",
    value: "23",
    change: "-5%",
    iconName: "Wrench",
    color: "text-orange-600",
  },
  {
    title: "Departments",
    value: "8",
    change: "0%",
    iconName: "Building2",
    color: "text-green-600",
  },
  {
    title: "Total Employees",
    value: "156",
    change: "+3%",
    iconName: "Users",
    color: "text-purple-600",
  },
]

export const recentActivities = [
  {
    id: 1,
    type: "Asset Added",
    description: "New HVAC Unit added to Building A",
    time: "2 hours ago",
    status: "completed",
  },
  {
    id: 2,
    type: "Maintenance Due",
    description: "Generator #3 requires scheduled maintenance",
    time: "4 hours ago",
    status: "pending",
  },
  {
    id: 3,
    type: "Part Ordered",
    description: "Replacement filters for Air Handler #2",
    time: "1 day ago",
    status: "in-progress",
  },
]

export const quickActions = [
  {
    title: "Add New Asset",
    iconName: "Package",
    color: "text-blue-600",
    href: "/assets",
  },
  {
    title: "Create Work Order",
    iconName: "Wrench",
    color: "text-orange-600",
    href: "/work-orders",
  },
  {
    title: "Schedule Maintenance",
    iconName: "Cog",
    color: "text-green-600",
    href: "/maintenance",
  },
  {
    title: "Manage Employees",
    iconName: "Users",
    color: "text-purple-600",
    href: "/employees",
  },
]
