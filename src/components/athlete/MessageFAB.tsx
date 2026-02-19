"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { MessageSquare } from "lucide-react"

/** Pages where the FAB should NOT appear (dashboard has its own icon, messages page is the destination) */
const HIDDEN_ON = ["/athlete", "/athlete/messages"]

export function MessageFAB() {
  const pathname = usePathname()

  if (HIDDEN_ON.includes(pathname)) return null

  return (
    <Link
      href="/athlete/messages"
      className="fixed right-4 bottom-24 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors active:scale-95"
      aria-label="Message coach"
    >
      <MessageSquare className="h-5 w-5" />
    </Link>
  )
}
