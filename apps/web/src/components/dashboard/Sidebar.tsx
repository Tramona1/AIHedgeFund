"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  BarChart3, 
  Bell, 
  LineChart, 
  Settings, 
  Briefcase, 
  Eye, 
  DollarSign,
  Home,
  List,
  Search,
  BrainCircuit
} from "lucide-react"
import { cn } from "@/lib/utils"

const sidebarLinks = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Watchlist", href: "/watchlist", icon: List },
  { name: "AI Query", href: "/ai-query", icon: BrainCircuit },
  { name: "Alerts", href: "/dashboard/alerts", icon: Bell },
  { name: "Hedge Funds", href: "/dashboard/hedge-funds", icon: Briefcase },
  { name: "Insider Trading", href: "/dashboard/insider-trading", icon: Eye },
  { name: "Options Flow", href: "/dashboard/options", icon: DollarSign },
  { name: "Technical Analysis", href: "/dashboard/technical", icon: LineChart },
  { name: "Notifications", href: "/dashboard/notifications", icon: BarChart3 },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="border-r w-[240px] min-h-screen py-8 px-4 hidden lg:block">
      <div className="font-bold text-lg mb-8 px-4">AI Hedge Fund</div>
      <nav className="space-y-1">
        {sidebarLinks.map((link) => {
          const Icon = link.icon
          
          // Special case for Dashboard - only active when exactly on /dashboard
          // For other links, keep the existing behavior
          let isActive;
          if (link.href === "/dashboard") {
            isActive = pathname === "/dashboard";
          } else {
            isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`);
          }
          
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4" />
              {link.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
} 