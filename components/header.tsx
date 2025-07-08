"use client"

import { Bell, Search, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { useAuthStore } from "@/stores/auth-store"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function Header() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive"
      case "manager":
        return "default"
      case "technician":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <Card
      className={cn(
        "bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 transition-all duration-200 border shadow-sm",
        scrolled && "shadow-md",
      )}
    >
      <div className="flex h-14 items-center px-6">
        <div className="flex-1 flex items-center space-x-4">
          <SidebarTrigger className="h-8 w-8" />
          <div className="relative w-96 transition-all duration-300 hover:w-[28rem]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search assets, work orders, employees..."
              className="pl-10 transition-all duration-300 focus:ring-2 focus:ring-primary/50 bg-background/50"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative hover:bg-primary/10">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-primary text-primary-foreground text-xs animate-pulse">
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-[300px] overflow-y-auto">
                {[1, 2, 3].map((i) => (
                  <DropdownMenuItem key={i} className="cursor-pointer p-3 focus:bg-accent">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">Maintenance Alert</p>
                      <p className="text-xs text-muted-foreground">Generator #3 requires scheduled maintenance</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer justify-center text-primary">
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:bg-primary/10">
                <Avatar className="h-8 w-8 transition-transform hover:scale-110 ring-2 ring-primary/20">
                  <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {user?.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                    <Badge variant={getRoleBadgeVariant(user?.role || "")} className="text-xs">
                      {user?.role}
                    </Badge>
                  </div>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email} {user?.department}</p>
                  <p className="text-xs leading-none text-muted-foreground"></p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  )
}
