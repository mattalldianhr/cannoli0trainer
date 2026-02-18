"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Loader2,
  History,
} from "lucide-react"

interface HistorySession {
  id: string
  date: string
  title: string | null
  status: string
  completionPercentage: number
  completedItems: number
  totalItems: number
  programName: string | null
  weekNumber: number | null
  dayNumber: number | null
  exerciseNames: string[]
  exerciseCount: number
  totalVolume: number
  totalSets: number
}

interface SessionDetail {
  id: string
  date: string
  title: string | null
  status: string
  completionPercentage: number
  completedItems: number
  totalItems: number
  programName: string | null
  weekNumber: number | null
  dayNumber: number | null
  exercises: Array<{
    id: string
    name: string
    category: string
    sets: Array<{
      id: string
      setNumber: number
      reps: number
      weight: number
      unit: string
      rpe: number | null
      velocity: number | null
    }>
    totalVolume: number
  }>
}

export default function AthleteHistoryPage() {
  const { data: session } = useSession()
  const [sessions, setSessions] = useState<HistorySession[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [detailCache, setDetailCache] = useState<Record<string, SessionDetail>>({})
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null)

  const fetchSessions = useCallback(async (pageNum: number, append: boolean) => {
    if (!session?.user) return
    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }

    try {
      const res = await fetch(`/api/athlete/history?page=${pageNum}&limit=20`)
      if (res.ok) {
        const data = await res.json()
        if (append) {
          setSessions((prev) => [...prev, ...data.data])
        } else {
          setSessions(data.data)
        }
        setHasMore(data.hasMore)
        setTotal(data.total)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [session?.user])

  useEffect(() => {
    fetchSessions(1, false)
  }, [fetchSessions])

  async function loadMore() {
    const nextPage = page + 1
    setPage(nextPage)
    await fetchSessions(nextPage, true)
  }

  async function toggleExpand(sessionId: string) {
    if (expandedId === sessionId) {
      setExpandedId(null)
      return
    }

    setExpandedId(sessionId)

    if (detailCache[sessionId]) return

    setLoadingDetail(sessionId)
    try {
      const res = await fetch(`/api/athlete/history?sessionId=${sessionId}`)
      if (res.ok) {
        const data = await res.json()
        setDetailCache((prev) => ({ ...prev, [sessionId]: data.session }))
      }
    } catch {
      // silently fail
    } finally {
      setLoadingDetail(null)
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-6 space-y-4">
        <div className="h-8 w-36 bg-muted animate-pulse rounded" />
        <div className="h-5 w-48 bg-muted animate-pulse rounded" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
        <History className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No training history</h2>
        <p className="text-muted-foreground text-sm">
          Your completed workouts will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <History className="h-5 w-5" />
          History
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {total} completed workout{total !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Session List */}
      <div className="space-y-2">
        {sessions.map((s) => {
          const isExpanded = expandedId === s.id
          const detail = detailCache[s.id]
          const isLoadingThis = loadingDetail === s.id
          const date = new Date(s.date)
          const isCompleted = s.status === "FULLY_COMPLETED"

          return (
            <div key={s.id}>
              <Card
                className={cn(
                  "transition-colors cursor-pointer",
                  isExpanded && "border-primary/30"
                )}
                onClick={() => toggleExpand(s.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    {/* Status icon */}
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full mt-0.5",
                        isCompleted
                          ? "bg-green-500/10 text-green-600"
                          : "bg-amber-500/10 text-amber-600"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-4.5 w-4.5" />
                      ) : (
                        <Clock className="h-4.5 w-4.5" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {s.title || "Training Session"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {date.toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year:
                                date.getFullYear() !== new Date().getFullYear()
                                  ? "numeric"
                                  : undefined,
                            })}
                            {s.programName && (
                              <> &middot; {s.programName}</>
                            )}
                            {s.weekNumber != null && s.dayNumber != null && (
                              <> &middot; W{s.weekNumber}D{s.dayNumber}</>
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            variant={isCompleted ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {Math.round(s.completionPercentage)}%
                          </Badge>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      {/* Summary stats */}
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span>{s.exerciseCount} exercises</span>
                        <span>{s.totalSets} sets</span>
                        {s.totalVolume > 0 && (
                          <span>{formatVolume(s.totalVolume)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="ml-4 mt-1 mb-2 space-y-1.5">
                  {isLoadingThis && !detail && (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}

                  {detail && detail.exercises.length > 0 && (
                    <div className="space-y-1.5">
                      {detail.exercises.map((ex) => (
                        <Card key={ex.id} className="bg-muted/30">
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Dumbbell className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="text-sm font-medium truncate">
                                {ex.name}
                              </span>
                              {ex.totalVolume > 0 && (
                                <span className="text-xs text-muted-foreground ml-auto shrink-0">
                                  {formatVolume(ex.totalVolume)}
                                </span>
                              )}
                            </div>

                            {ex.sets.length > 0 ? (
                              <div className="space-y-0.5">
                                {ex.sets.map((set) => (
                                  <div
                                    key={set.id}
                                    className="flex items-center gap-2 text-xs"
                                  >
                                    <span className="text-muted-foreground w-5 text-right shrink-0">
                                      {set.setNumber}
                                    </span>
                                    <span className="font-medium">
                                      {set.weight > 0
                                        ? `${formatWeight(set.weight)} ${set.unit}`
                                        : "BW"}
                                      {" x "}
                                      {set.reps}
                                    </span>
                                    {set.rpe != null && (
                                      <span className="text-muted-foreground">
                                        @{set.rpe}
                                      </span>
                                    )}
                                    {set.velocity != null && (
                                      <span className="text-muted-foreground">
                                        {set.velocity.toFixed(2)} m/s
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                No sets logged
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {detail && detail.exercises.length === 0 && (
                    <p className="text-xs text-muted-foreground py-2 text-center">
                      No exercise data available
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center pt-2 pb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={loadMore}
            disabled={loadingMore}
            className="min-h-[44px]"
          >
            {loadingMore ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Load More
          </Button>
        </div>
      )}
    </div>
  )
}

function formatVolume(volume: number): string {
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}k kg`
  }
  return `${Math.round(volume)} kg`
}

function formatWeight(weight: number): string {
  return weight % 1 === 0 ? weight.toString() : weight.toFixed(1)
}
