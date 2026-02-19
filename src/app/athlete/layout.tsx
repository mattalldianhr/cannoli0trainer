"use client"

import { SessionProvider } from "next-auth/react"
import { AthleteBottomNav } from "@/components/athlete/AthleteBottomNav"
import { MessageFAB } from "@/components/athlete/MessageFAB"
import { OfflineIndicator } from "@/components/shared/OfflineIndicator"
import { usePathname } from "next/navigation"

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
    <SessionProvider>
      <div className="flex min-h-screen flex-col bg-background">
        {/* Top bar with branding */}
        <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center justify-between px-4">
            <span className="text-lg font-bold tracking-tight">Cannoli Trainer</span>
            <OfflineIndicator />
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
    </SessionProvider>
  )
}
