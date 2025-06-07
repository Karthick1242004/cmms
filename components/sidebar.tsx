"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Building2, Users, Package, MapPin, Wrench, Cog, BarChart3, Home, Settings, Archive } from "lucide-react"

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: Home,
  },
  {
    name: "Departments",
    href: "/departments",
    icon: Building2,
  },
  {
    name: "Employees",
    href: "/employees",
    icon: Users,
  },
  {
    name: "Asset Types",
    href: "/asset-types",
    icon: Cog,
  },
  {
    name: "Locations",
    href: "/locations",
    icon: MapPin,
  },
  {
    name: "Assets",
    href: "/assets",
    icon: Package,
  },
  {
    name: "Parts",
    href: "/parts",
    icon: Wrench,
  },
  {
    name: "Stock History",
    href: "/stock-history",
    icon: Archive,
  },
  {
    name: "Reports",
    href: "/reports",
    icon: BarChart3,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-card border-r">
      <div className="p-6">
        <h2 className="text-2xl font-bold tracking-tight">CMMS</h2>
        <p className="text-sm text-muted-foreground">Maintenance Management</p>
      </div>
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1">
          {navigation.map((item) => (
            <Button
              key={item.name}
              variant={pathname === item.href ? "secondary" : "ghost"}
              className={cn("w-full justify-start", pathname === item.href && "bg-secondary")}
              asChild
            >
              <Link href={item.href}>
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
              </Link>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
