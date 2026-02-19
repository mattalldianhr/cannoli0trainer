"use client"

import { Suspense, useEffect, useState, useMemo, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Ban,
  Target,
} from "lucide-react"

interface CalendarSession {
  id: string
  date: string
  title: string | null
  status: "NOT_STARTED" | "PARTIALLY_COMPLETED" | "FULLY_COMPLETED"
  isSkipped: boolean
  completionPercentage: number
  completedItems: number
  totalItems: number
  weekNumber: number | null
  dayNumber: number | null
  programName: string | null
}

interface CalendarData {
  sessions: CalendarSession[]
  completionRate: number
}

type ViewMode = "week" | "month"

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

function getMonday(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${dd}`
}

function getFirstOfMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00")
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${dd}`
}

function formatWeekRange(mondayStr: string): string {
  const monday = new Date(mondayStr + "T00:00:00")
  const sunday = new Date(mondayStr + "T00:00:00")
  sunday.setDate(sunday.getDate() + 6)

  const monthFmt = new Intl.DateTimeFormat("en-US", { month: "short" })
  const sameMonth = monday.getMonth() === sunday.getMonth()

  if (sameMonth) {
    return `${monthFmt.format(monday)} ${monday.getDate()} - ${sunday.getDate()}, ${monday.getFullYear()}`
  }
  return `${monthFmt.format(monday)} ${monday.getDate()} - ${monthFmt.format(sunday)} ${sunday.getDate()}, ${sunday.getFullYear()}`
}

function formatMonthYear(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" })
}

function getMonthCalendarDates(monthStart: string): string[][] {
  const d = new Date(monthStart + "T00:00:00")
  const year = d.getFullYear()
  const month = d.getMonth()

  // Find the Monday of the week containing the 1st
  const firstDay = new Date(year, month, 1)
  const startDay = firstDay.getDay()
  const mondayOffset = startDay === 0 ? -6 : 1 - startDay
  const calendarStart = new Date(year, month, 1 + mondayOffset)

  // Build 6 weeks (covers all months)
  const weeks: string[][] = []
  const current = new Date(calendarStart)

  for (let w = 0; w < 6; w++) {
    const week: string[] = []
    for (let d = 0; d < 7; d++) {
      const cy = current.getFullYear()
      const cm = String(current.getMonth() + 1).padStart(2, "0")
      const cd = String(current.getDate()).padStart(2, "0")
      week.push(`${cy}-${cm}-${cd}`)
      current.setDate(current.getDate() + 1)
    }
    // Only include weeks that have at least one day in the target month
    const hasTargetMonth = week.some((dateStr) => {
      const dd = new Date(dateStr + "T00:00:00")
      return dd.getMonth() === month && dd.getFullYear() === year
    })
    if (hasTargetMonth) {
      weeks.push(week)
    }
  }

  return weeks
}

function StatusIcon({ status, isSkipped, size = "sm" }: { status: CalendarSession["status"]; isSkipped: boolean; size?: "sm" | "md" }) {
  const cls = size === "md" ? "h-4 w-4" : "h-3 w-3"
  if (isSkipped) return <Ban className={cn(cls, "text-muted-foreground")} />
  switch (status) {
    case "FULLY_COMPLETED":
      return <CheckCircle2 className={cn(cls, "text-green-600")} />
    case "PARTIALLY_COMPLETED":
      return <Clock className={cn(cls, "text-amber-500")} />
    default:
      return <Circle className={cn(cls, "text-muted-foreground")} />
  }
}

export default function AthleteCalendarPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-6 space-y-4">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-10 bg-muted animate-pulse rounded-lg" />
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        </div>
      }
    >
      <AthleteCalendarContent />
    </Suspense>
  )
}

function AthleteCalendarContent() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [calendarData, setCalendarData] = useState<CalendarData | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>(
    (searchParams.get("view") as ViewMode) || "week"
  )

  // Week view anchor (Monday)
  const currentMonday = getMonday(new Date())
  const weekStart = searchParams.get("week") || currentMonday
  const isCurrentWeek = weekStart === currentMonday

  // Month view anchor
  const currentMonthStart = getFirstOfMonth(new Date())
  const monthStart = searchParams.get("month") || currentMonthStart
  const isCurrentMonth = monthStart === currentMonthStart

  const nowDate = new Date()
  const today = `${nowDate.getFullYear()}-${String(nowDate.getMonth() + 1).padStart(2, "0")}-${String(nowDate.getDate()).padStart(2, "0")}`

  // Determine the date range based on view mode
  const { rangeStart, rangeEnd } = useMemo(() => {
    if (viewMode === "week") {
      return { rangeStart: weekStart, rangeEnd: addDays(weekStart, 6) }
    }
    // Month view: get full calendar range
    const weeks = getMonthCalendarDates(monthStart)
    return {
      rangeStart: weeks[0][0],
      rangeEnd: weeks[weeks.length - 1][6],
    }
  }, [viewMode, weekStart, monthStart])

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!session?.user) return
    setLoading(true)
    try {
      const res = await fetch(
        `/api/athlete/calendar?startDate=${rangeStart}&endDate=${rangeEnd}`
      )
      if (res.ok) {
        const data = await res.json()
        setCalendarData(data)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [session?.user, rangeStart, rangeEnd])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Build session lookup: date -> session
  const sessionMap = useMemo(() => {
    const map = new Map<string, CalendarSession>()
    if (calendarData) {
      for (const s of calendarData.sessions) {
        map.set(s.date, s)
      }
    }
    return map
  }, [calendarData])

  // Week dates (Mon-Sun)
  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  )

  // Month calendar weeks
  const monthWeeks = useMemo(() => getMonthCalendarDates(monthStart), [monthStart])
  const targetMonth = new Date(monthStart + "T00:00:00").getMonth()

  function navigate(direction: "prev" | "next") {
    const params = new URLSearchParams(searchParams.toString())
    if (viewMode === "week") {
      const offset = direction === "prev" ? -7 : 7
      params.set("week", addDays(weekStart, offset))
      params.set("view", "week")
    } else {
      const d = new Date(monthStart + "T00:00:00")
      d.setMonth(d.getMonth() + (direction === "prev" ? -1 : 1))
      params.set("month", getFirstOfMonth(d))
      params.set("view", "month")
    }
    router.push(`/athlete/calendar?${params.toString()}`)
  }

  function goToToday() {
    const params = new URLSearchParams()
    params.set("view", viewMode)
    router.push(`/athlete/calendar?${params.toString()}`)
  }

  function switchView(mode: ViewMode) {
    setViewMode(mode)
    const params = new URLSearchParams(searchParams.toString())
    params.set("view", mode)
    // When switching to month, set month param from current week
    if (mode === "month") {
      const d = new Date(weekStart + "T00:00:00")
      params.set("month", getFirstOfMonth(d))
      params.delete("week")
    } else {
      params.delete("month")
    }
    router.push(`/athlete/calendar?${params.toString()}`)
  }

  if (loading && !calendarData) {
    return (
      <div className="px-4 py-6 space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-10 bg-muted animate-pulse rounded-lg" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  return (
    <div className="px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Calendar
        </h1>
        {calendarData && calendarData.completionRate > 0 && (
          <Badge variant="secondary" className="gap-1">
            <Target className="h-3 w-3" />
            {calendarData.completionRate}%
          </Badge>
        )}
      </div>

      {/* Navigation + View Toggle */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigate("prev")}
            aria-label={viewMode === "week" ? "Previous week" : "Previous month"}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigate("next")}
            aria-label={viewMode === "week" ? "Next week" : "Next month"}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-xs sm:text-sm font-semibold ml-1 truncate">
            {viewMode === "week"
              ? formatWeekRange(weekStart)
              : formatMonthYear(monthStart)}
          </span>
          {((viewMode === "week" && !isCurrentWeek) ||
            (viewMode === "month" && !isCurrentMonth)) && (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={goToToday}>
              Today
            </Button>
          )}
        </div>

        {/* View toggle */}
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => switchView("week")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium transition-colors",
              viewMode === "week"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-muted"
            )}
          >
            Week
          </button>
          <button
            onClick={() => switchView("month")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium transition-colors",
              viewMode === "month"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-muted"
            )}
          >
            Month
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      {viewMode === "week" ? (
        <WeekView
          weekDates={weekDates}
          sessionMap={sessionMap}
          today={today}
        />
      ) : (
        <MonthView
          weeks={monthWeeks}
          sessionMap={sessionMap}
          today={today}
          targetMonth={targetMonth}
        />
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-2">
        <span className="flex items-center gap-1">
          <Circle className="h-3 w-3" /> Scheduled
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-amber-500" /> In Progress
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-green-600" /> Completed
        </span>
        <span className="flex items-center gap-1">
          <Ban className="h-3 w-3" /> Skipped
        </span>
      </div>
    </div>
  )
}

// ── Week View ──

function WeekView({
  weekDates,
  sessionMap,
  today,
}: {
  weekDates: string[]
  sessionMap: Map<string, CalendarSession>
  today: string
}) {
  return (
    <div className="space-y-2">
      {weekDates.map((date, i) => {
        const session = sessionMap.get(date)
        const isToday = date === today
        const isPast = date < today
        const dayDate = new Date(date + "T00:00:00")

        return (
          <DayCard
            key={date}
            date={date}
            dayLabel={DAY_LABELS[i]}
            dayNumber={dayDate.getDate()}
            monthLabel={dayDate.toLocaleDateString("en-US", { month: "short" })}
            session={session}
            isToday={isToday}
            isPast={isPast}
          />
        )
      })}
    </div>
  )
}

function DayCard({
  date,
  dayLabel,
  dayNumber,
  monthLabel,
  session,
  isToday,
  isPast,
}: {
  date: string
  dayLabel: string
  dayNumber: number
  monthLabel: string
  session: CalendarSession | undefined
  isToday: boolean
  isPast: boolean
}) {
  const content = (
    <Card
      className={cn(
        "transition-colors",
        isToday && "border-primary/40 bg-primary/5",
        session && !session.isSkipped && session.status === "FULLY_COMPLETED" && "border-green-200 dark:border-green-800",
        session && !session.isSkipped && session.status === "PARTIALLY_COMPLETED" && "border-amber-200 dark:border-amber-800",
        session?.isSkipped && "opacity-60"
      )}
    >
      <CardContent className="p-3 flex items-center gap-3">
        {/* Date column */}
        <div
          className={cn(
            "flex flex-col items-center justify-center min-w-[44px] h-[44px] rounded-lg",
            isToday
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          )}
        >
          <span className="text-[10px] font-medium leading-none">{dayLabel}</span>
          <span className="text-lg font-bold leading-none mt-0.5">{dayNumber}</span>
        </div>

        {/* Workout info */}
        {session ? (
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <StatusIcon status={session.status} isSkipped={session.isSkipped} size="md" />
              <span
                className={cn(
                  "text-sm font-medium truncate",
                  session.isSkipped && "line-through text-muted-foreground"
                )}
              >
                {session.title || "Training Session"}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {session.programName && (
                <span className="text-xs text-muted-foreground truncate">
                  {session.programName}
                </span>
              )}
              {session.weekNumber != null && session.dayNumber != null && (
                <span className="text-xs text-muted-foreground">
                  W{session.weekNumber}D{session.dayNumber}
                </span>
              )}
            </div>
            {/* Progress bar for partially completed */}
            {session.status === "PARTIALLY_COMPLETED" && session.totalItems > 0 && (
              <div className="mt-1.5">
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all"
                    style={{ width: `${session.completionPercentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1">
            <span className={cn(
              "text-sm",
              isPast ? "text-muted-foreground/50" : "text-muted-foreground"
            )}>
              {isPast ? "No workout" : "Rest day"}
            </span>
          </div>
        )}

        {/* Right side: completion badge or exercises count */}
        {session && !session.isSkipped && (
          <div className="shrink-0">
            {session.status === "FULLY_COMPLETED" ? (
              <Badge className="bg-green-500/15 text-green-700 border-green-500/20 text-xs">
                {Math.round(session.completionPercentage)}%
              </Badge>
            ) : session.status === "PARTIALLY_COMPLETED" ? (
              <Badge variant="secondary" className="text-xs">
                {session.completedItems}/{session.totalItems}
              </Badge>
            ) : session.totalItems > 0 ? (
              <span className="text-xs text-muted-foreground">
                {session.totalItems} ex.
              </span>
            ) : null}
          </div>
        )}

        {session?.isSkipped && (
          <Badge variant="outline" className="text-xs shrink-0">
            Skipped
          </Badge>
        )}
      </CardContent>
    </Card>
  )

  // Link to training page if session exists and is actionable
  if (session && !session.isSkipped && session.status !== "FULLY_COMPLETED" && !isPast) {
    return (
      <Link href="/athlete/train" className="block">
        {content}
      </Link>
    )
  }

  return content
}

// ── Month View ──

function MonthView({
  weeks,
  sessionMap,
  today,
  targetMonth,
}: {
  weeks: string[][]
  sessionMap: Map<string, CalendarSession>
  today: string
  targetMonth: number
}) {
  return (
    <Card>
      <CardContent className="p-2">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_LABELS.map((label) => (
            <div
              key={label}
              className="text-center text-[11px] font-medium text-muted-foreground py-1"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Month grid */}
        <div className="space-y-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1">
              {week.map((date) => {
                const d = new Date(date + "T00:00:00")
                const isCurrentMonth = d.getMonth() === targetMonth
                const isToday = date === today
                const session = sessionMap.get(date)

                return (
                  <MonthDayCell
                    key={date}
                    date={date}
                    dayNumber={d.getDate()}
                    isCurrentMonth={isCurrentMonth}
                    isToday={isToday}
                    session={session}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function MonthDayCell({
  date,
  dayNumber,
  isCurrentMonth,
  isToday,
  session,
}: {
  date: string
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
  session: CalendarSession | undefined
}) {
  const n = new Date()
  const todayStr = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`
  const isPast = date < todayStr

  const cellContent = (
    <div
      className={cn(
        "flex flex-col items-center py-1.5 rounded-lg min-h-[52px] transition-colors",
        !isCurrentMonth && "opacity-30",
        isToday && "ring-2 ring-primary ring-offset-1",
        session && !session.isSkipped && session.status === "FULLY_COMPLETED" && "bg-green-50 dark:bg-green-950/20",
        session && !session.isSkipped && session.status === "PARTIALLY_COMPLETED" && "bg-amber-50 dark:bg-amber-950/20",
        session && !session.isSkipped && session.status === "NOT_STARTED" && "bg-muted/40",
        session?.isSkipped && "bg-muted/20"
      )}
    >
      <span
        className={cn(
          "text-xs font-medium",
          isToday && "text-primary font-bold",
          !isCurrentMonth && "text-muted-foreground"
        )}
      >
        {dayNumber}
      </span>
      {session && (
        <div className="mt-0.5">
          <StatusIcon status={session.status} isSkipped={session.isSkipped} />
        </div>
      )}
    </div>
  )

  // Link actionable sessions to train page
  if (
    session &&
    !session.isSkipped &&
    session.status !== "FULLY_COMPLETED" &&
    !isPast &&
    isCurrentMonth
  ) {
    return (
      <Link href="/athlete/train" className="block">
        {cellContent}
      </Link>
    )
  }

  return cellContent
}
