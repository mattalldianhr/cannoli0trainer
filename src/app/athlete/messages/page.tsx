"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { MessageThread } from "@/components/messaging/MessageThread"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AthleteMessagesPage() {
  const { data: session } = useSession()
  const [coachName, setCoachName] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCoachName() {
      try {
        const res = await fetch("/api/athlete/coach")
        if (res.ok) {
          const data = await res.json()
          setCoachName(data.name)
        }
      } catch {
        // silently fail
      }
    }

    if (session?.user) {
      fetchCoachName()
    }
  }, [session])

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 56px - 76px - env(safe-area-inset-bottom, 0px))" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
        <Link
          href="/athlete"
          className="inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-base font-semibold">
            {coachName ? `Coach ${coachName.split(" ")[0]}` : "Messages"}
          </h1>
          <p className="text-xs text-muted-foreground">Your coach</p>
        </div>
      </div>

      {/* Thread */}
      <div className="flex-1 min-h-0">
        <MessageThread mode="athlete" />
      </div>
    </div>
  )
}
