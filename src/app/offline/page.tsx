"use client"

import { WifiOff } from "lucide-react"

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <WifiOff className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">You&apos;re Offline</h1>
        <p className="text-muted-foreground">
          Check your internet connection and try again. Any sets you logged while
          offline will sync automatically when you reconnect.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center rounded-md bg-orange-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
