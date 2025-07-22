import type { NavigationItem } from "@/types/navigation"

export const navigation: NavigationItem[] = [
  {
    name: "Dashboard",
    href: "/",
    iconName: "Home",
  },
  {
    name: "Departments",
    href: "/departments",
    iconName: "Building2",
  },
  {
    name: "Employees",
    href: "/employees",
    iconName: "Users",
  },
  {
    name: "Shift Details",
    href: "/shift-details",
    iconName: "Calendar",
  },
  // {
  //   name: "Asset Types",
  //   href: "/asset-types",
  //   iconName: "Cog",
  // },
  {
    name: "Locations",
    href: "/locations",
    iconName: "MapPin",
  },
  {
    name: "Assets",
    href: "/assets", // Parent link, can lead to "All Assets" or a general assets overview
    iconName: "Package",
    subItems: [
      { name: "All Assets", href: "/assets", iconName: "Archive" }, // Or a more specific icon
      { name: "Facilities", href: "/assets/facilities", iconName: "Building" }, // Example, choose appropriate icons
      { name: "Products", href: "/assets/products", iconName: "ShoppingCart" },
      { name: "Equipment", href: "/assets/equipment", iconName: "HardHat" },
      { name: "Tools", href: "/assets/tools", iconName: "Tool" },
    ],
  },
  {
    name: "Parts",
    href: "/parts",
    iconName: "Wrench",
  },
  {
    name: "Maintenance",
    href: "/maintenance",
    iconName: "Settings2",
  },
  {
    name: "Tickets",
    href: "/tickets",
    iconName: "FileText",
  },
  {
    name: "Inventory",
    href: "/stock-history",
    iconName: "Archive",
  },
  {
    name: "Reports",
    href: "/reports",
    iconName: "BarChart3",
  },
  {
    name: "Settings",
    href: "/settings",
    iconName: "Settings",
  },
  {
    name: "Profile",
    href: "/profile",
    iconName: "UserCog",
  },
  // New Admin Section for Feature Builder
  // {
  //   name: "Admin", // This could be a parent item if more admin features are added
  //   href: "/admin", // Or directly to feature-builder if it's the only one
  //   iconName: "ShieldCheck", // Example icon for Admin
  //   subItems: [
  //     {
  //       name: "Feature Builder",
  //       href: "/admin/feature-builder",
  //       iconName: "LayoutDashboard", // Using a generic dashboard/layout icon
  //     },
  //     // Add other admin links here if needed
  //   ],
  // },
  {
    name: "Safety Inspection",
    href: "/safety-inspection",
    iconName: "Shield",
  },
]
