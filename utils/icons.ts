import {
  Package,
  Wrench,
  Building2,
  Users,
  Cog,
  Home,
  MapPin,
  Archive,
  BarChart3,
  Settings,
  Settings2,
  UserCog,
  Building,
  ShoppingCart,
  HardHat,
  PenToolIcon as Tool,
  ShieldCheck,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react"

const iconMap: Record<string, LucideIcon> = {
  Package,
  Wrench,
  Building2,
  Users,
  Cog,
  Home,
  MapPin,
  Archive,
  BarChart3,
  Settings,
  Settings2,
  UserCog,
  Building,
  ShoppingCart,
  HardHat,
  Tool,
  ShieldCheck, // Added
  LayoutDashboard, // Added
}

export function getIcon(iconName: string): LucideIcon {
  return iconMap[iconName] || Package // fallback to Package icon
}
