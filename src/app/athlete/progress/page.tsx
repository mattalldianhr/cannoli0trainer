"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { TrendingUp, Loader2, Dumbbell } from "lucide-react"
import { E1RMTrendChart } from "@/components/athlete/progress/E1RMTrendChart"
import { WeeklyVolumeChart } from "@/components/athlete/progress/WeeklyVolumeChart"
import { ComplianceRing } from "@/components/athlete/progress/ComplianceRing"
import { PersonalRecordsList } from "@/components/athlete/progress/PersonalRecordsList"
import { BodyweightTrendChart } from "@/components/athlete/progress/BodyweightTrendChart"

interface AthleteProgressData {
  e1rmTrends: Record<string, { date: string; value: number }[]>
  weeklyVolume: { weekStart: string; tonnage: number }[]
  compliance: { assigned: number; completed: number; streak: number }
  personalRecords: {
    exerciseId: string
    exerciseName: string
    weight: number
    reps: number
    date: string
    isRecent: boolean
    category: string
    tags: string[]
  }[]
  bodyweight: { date: string; weight: number }[] | null
  availableExercises: { id: string; name: string }[]
  weightClass: string | null
}

const RANGE_OPTIONS = [
  { value: "4w", label: "4 Weeks" },
  { value: "8w", label: "8 Weeks" },
  { value: "12w", label: "12 Weeks" },
  { value: "all", label: "All Time" },
] as const

export default function AthleteProgressPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<AthleteProgressData | null>(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState("8w")

  const fetchProgress = useCallback(async (rangeValue: string) => {
    if (!session?.user) return
    setLoading(true)
    try {
      const res = await fetch(`/api/athlete/progress?range=${rangeValue}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [session?.user])

  useEffect(() => {
    fetchProgress(range)
  }, [fetchProgress, range])

  function handleRangeChange(newRange: string) {
    setRange(newRange)
  }

  if (loading) {
    return (
      <div className="px-4 py-6 space-y-4">
        <div className="h-8 w-40 bg-muted animate-pulse rounded" />
        <div className="h-10 w-full bg-muted animate-pulse rounded-lg" />
        <div className="h-[300px] bg-muted animate-pulse rounded-lg" />
        <div className="h-[300px] bg-muted animate-pulse rounded-lg" />
        <div className="h-[180px] bg-muted animate-pulse rounded-lg" />
        <div className="h-[250px] bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  // Full-page empty state when no training data at all
  if (!data || isEmptyData(data)) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
        <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No progress data yet</h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          Complete your first workout to start tracking your progress.
        </p>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Progress
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Track your training improvements
        </p>
      </div>

      {/* Date range selector */}
      <div className="flex gap-1.5">
        {RANGE_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => handleRangeChange(option.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors min-h-[36px] ${
              range === option.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Compliance Ring */}
      <ComplianceRing compliance={data.compliance} />

      {/* E1RM Trend Chart */}
      <E1RMTrendChart
        e1rmTrends={data.e1rmTrends}
        availableExercises={data.availableExercises}
      />

      {/* Weekly Volume Chart */}
      <WeeklyVolumeChart weeklyVolume={data.weeklyVolume} />

      {/* Personal Records */}
      <PersonalRecordsList personalRecords={data.personalRecords} />

      {/* Bodyweight Trend (conditional) */}
      {data.bodyweight && (
        <BodyweightTrendChart
          bodyweight={data.bodyweight}
          weightClass={data.weightClass}
        />
      )}

      {/* Prompt to log bodyweight if no data */}
      {!data.bodyweight && (
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Log your bodyweight to see trends here.
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * Check if all progress data is empty (no training data at all).
 */
function isEmptyData(data: AthleteProgressData): boolean {
  const hasE1rm = Object.keys(data.e1rmTrends).length > 0
  const hasVolume = data.weeklyVolume.length > 0
  const hasCompliance = data.compliance.assigned > 0 || data.compliance.completed > 0 || data.compliance.streak > 0
  const hasPRs = data.personalRecords.length > 0
  const hasBodyweight = data.bodyweight !== null

  return !hasE1rm && !hasVolume && !hasCompliance && !hasPRs && !hasBodyweight
}
