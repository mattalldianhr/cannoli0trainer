"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Dumbbell, Calendar, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/athlete", label: "Dashboard", icon: LayoutDashboard },
  { href: "/athlete/train", label: "Train", icon: Dumbbell },
  { href: "/athlete/calendar", label: "Calendar", icon: Calendar },
  { href: "/athlete/history", label: "History", icon: Clock },
]

export function AthleteBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = item.href === "/athlete"
            ? pathname === "/athlete"
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 min-h-[56px] min-w-[64px] transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-[11px] font-medium leading-none">{item.label}</span>
            </Link>
          )
        })}
      </div>
      {/* Safe area for devices with home indicator */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}
