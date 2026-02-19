"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dumbbell,
  Flame,
  Calendar,
  Target,
  ChevronRight,
  Clock,
  CheckCircle2,
  Moon,
  MessageSquare,
} from "lucide-react"

interface DashboardData {
  todayWorkout: {
    id: string
    title: string | null
    status: string
    completionPercentage: number
    completedItems: number
    totalItems: number
    programName: string | null
  } | null
  nextWorkout: {
    date: string
    title: string | null
    programName: string | null
  } | null
  stats: {
    streak: number
    workoutsThisWeek: number
    completionRate: number
  }
  recentSessions: Array<{
    id: string
    date: string
    title: string | null
    status: string
    completionPercentage: number
    completedItems: number
    totalItems: number
    programName: string | null
  }>
  currentProgram: {
    name: string
  } | null
}

export default function AthleteDashboardPage() {
  const { data: session } = useSession()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/athlete/dashboard")
        if (res.ok) {
          const data = await res.json()
          setDashboardData(data)
        }
      } catch {
        // silently fail, show empty state
      } finally {
        setLoading(false)
      }
    }

    if (session?.user) {
      fetchData()
    }
  }, [session])

  if (loading) {
    return (
      <div className="px-4 py-6 space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-40 bg-muted animate-pulse rounded-lg" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
        <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Welcome to Cannoli Strength</h2>
        <p className="text-muted-foreground">
          Your dashboard will appear once your coach assigns you a program.
        </p>
      </div>
    )
  }

  const { todayWorkout, nextWorkout, stats, recentSessions, currentProgram } = dashboardData
  const firstName = session?.user?.name?.split(" ")[0] || "Athlete"

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Greeting + Message button */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Hey, {firstName}
          </h1>
          {currentProgram && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {currentProgram.name}
            </p>
          )}
        </div>
        <Link href="/athlete/messages">
          <Button variant="outline" size="icon" className="h-10 w-10 shrink-0">
            <MessageSquare className="h-5 w-5" />
            <span className="sr-only">Messages</span>
          </Button>
        </Link>
      </div>

      {/* Hero Card: Today's Workout or Rest Day */}
      {todayWorkout ? (
        <Link href="/athlete/train">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Today&apos;s Workout
                  </p>
                  <h2 className="text-lg font-bold">
                    {todayWorkout.title || "Training Session"}
                  </h2>
                  {todayWorkout.programName && (
                    <p className="text-sm text-muted-foreground">
                      {todayWorkout.programName}
                    </p>
                  )}
                  {todayWorkout.totalItems > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {todayWorkout.totalItems} exercises
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {todayWorkout.status === "FULLY_COMPLETED" ? (
                    <Badge className="bg-green-500/15 text-green-700 border-green-500/20">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Done
                    </Badge>
                  ) : todayWorkout.status === "PARTIALLY_COMPLETED" ? (
                    <Badge variant="secondary">
                      {Math.round(todayWorkout.completionPercentage)}%
                    </Badge>
                  ) : (
                    <Badge variant="outline">Ready</Badge>
                  )}
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>

              {/* Progress bar for in-progress workouts */}
              {todayWorkout.status === "PARTIALLY_COMPLETED" && todayWorkout.totalItems > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{todayWorkout.completedItems} / {todayWorkout.totalItems} exercises</span>
                    <span>{Math.round(todayWorkout.completionPercentage)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${todayWorkout.completionPercentage}%` }}
                    />
                  </div>
                </div>
              )}

              {todayWorkout.status === "NOT_STARTED" && (
                <Button className="mt-4 w-full" size="lg">
                  <Dumbbell className="h-4 w-4 mr-2" />
                  Start Workout
                </Button>
              )}
            </CardContent>
          </Card>
        </Link>
      ) : nextWorkout ? (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Moon className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Rest Day
                </p>
                <p className="text-sm font-medium mt-1">
                  Next: {nextWorkout.title || "Training Session"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatRelativeDate(nextWorkout.date)}
                  {nextWorkout.programName && ` \u00B7 ${nextWorkout.programName}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Calendar className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">No workouts scheduled</p>
                <p className="text-xs text-muted-foreground">
                  Your coach hasn&apos;t assigned a program yet.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mt-2">
        <Card>
          <CardContent className="p-3 text-center">
            <Flame className="h-5 w-5 text-orange-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.streak}</p>
            <p className="text-[11px] text-muted-foreground">Day Streak</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Dumbbell className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.workoutsThisWeek}</p>
            <p className="text-[11px] text-muted-foreground">This Week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Target className="h-5 w-5 text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.completionRate}%</p>
            <p className="text-[11px] text-muted-foreground">Completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions */}
      {recentSessions.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Recent Sessions
          </h2>
          <div className="space-y-2">
            {recentSessions.map((s) => {
              // Parse date as local to avoid UTC shift
              const dateParts = s.date.split("T")[0].split("-").map(Number)
              const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2])
              const isCompleted = s.status === "FULLY_COMPLETED"

              return (
                <Card key={s.id} className="hover:bg-muted/50 transition-colors">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        isCompleted
                          ? "bg-green-500/10 text-green-600"
                          : "bg-yellow-500/10 text-yellow-600"
                      }`}>
                        {isCompleted ? (
                          <CheckCircle2 className="h-4.5 w-4.5" />
                        ) : (
                          <Clock className="h-4.5 w-4.5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {s.title || "Training Session"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {date.toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                          {s.totalItems > 0 && (
                            <> &middot; {s.completedItems}/{s.totalItems} exercises</>
                          )}
                        </p>
                      </div>
                      <Badge
                        variant={isCompleted ? "default" : "secondary"}
                        className="text-xs shrink-0"
                      >
                        {Math.round(s.completionPercentage)}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function formatRelativeDate(dateStr: string): string {
  // Parse as local date to avoid UTC shift
  const parts = dateStr.split("T")[0].split("-").map(Number)
  const target = new Date(parts[0], parts[1] - 1, parts[2])
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Tomorrow"
  if (diffDays < 7) {
    return target.toLocaleDateString("en-US", { weekday: "long" })
  }
  return target.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}
