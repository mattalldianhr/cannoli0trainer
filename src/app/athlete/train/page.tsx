"use client"

import { useSession } from "next-auth/react"
import { TrainingLog } from "@/components/training/TrainingLog"
import { Loader2, Dumbbell } from "lucide-react"

export default function AthleteTrainPage() {
  const { data: session, status } = useSession()
  const athleteId = session?.user?.athleteId

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!athleteId) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
        <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Unable to load training</h2>
        <p className="text-muted-foreground text-sm">
          Your account is not linked to an athlete profile. Please contact your coach.
        </p>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Train</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Log your workout
        </p>
      </div>
      <TrainingLog
        athletes={[]}
        initialAthleteId={athleteId}
        mode="athlete"
      />
    </div>
  )
}
