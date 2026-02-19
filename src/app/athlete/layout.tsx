"use client"

import Image from "next/image"
import { AthleteBottomNav } from "@/components/athlete/AthleteBottomNav"
import { MessageFAB } from "@/components/athlete/MessageFAB"
import { OfflineIndicator } from "@/components/shared/OfflineIndicator"
import { usePathname } from "next/navigation"
import { LogOut } from "lucide-react"
import { signOut } from "next-auth/react"

const PUBLIC_ROUTES = ["/athlete/login", "/athlete/check-email"]

export default function AthleteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname)

  if (isPublicRoute) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar with branding */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <Image
            src="/logo-white.webp"
            alt="Cannoli Strength"
            width={140}
            height={35}
            className="h-7 w-auto brightness-0 dark:brightness-100"
            priority
          />
          <div className="flex items-center gap-2">
            <OfflineIndicator />
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main content area with bottom padding for nav */}
      <main className="flex-1 pb-20">
        {children}
      </main>

      {/* Message FAB (hidden on dashboard and messages pages) */}
      <MessageFAB />

      {/* Bottom navigation */}
      <AthleteBottomNav />
    </div>
  )
}
