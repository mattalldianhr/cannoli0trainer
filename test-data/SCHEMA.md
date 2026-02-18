# TeamBuildr API Data Schema

Field-level documentation derived from live API responses.

## Athlete Profile

From `GET /accounts/{id}/users?userType=0`

```
{
  id: number              // User ID (e.g., 3534583)
  first: string           // First name
  last: string            // Last name
  email: string           // Email address
  username: string        // Username
  pic: string|null        // Profile photo URL
  admin: number           // 0=athlete, 1=coach
  primaryAdmin: number    // Primary admin flag
  gradientColors: object  // Avatar gradient colors
  pinEnabled: boolean     // PIN login enabled
  calendarAssignment: {
    id: number
    calendarId: number    // Assigned program calendar
    dateStart: string     // Assignment start date (YYYY-MM-DD)
    dateEnd: string       // Assignment end date
    active: number        // 0/1
    suspended: number     // 0/1
    addedBy: number       // Coach user ID who assigned
    addedTime: number     // Unix timestamp
  }
  groupAssignments: [{
    id: number
    name: string          // Group name (e.g., "CMM Punk")
    groupId: number       // Group ID
    userId: number        // Athlete user ID
    addedBy: number       // Coach user ID
    addedTime: number     // Unix timestamp
  }]
}
```

## Workout Overview

From `GET /accounts/{id}/users/{userId}/workouts/overview?dateRangeStart={}&dateRangeEnd={}`

Returns an array of day entries (one per day in range):

```
{
  date: string                    // "YYYY-MM-DD"
  actionableItems: number         // Number of prescribed exercises
  completedItems: number          // Number of completed exercises
  completionPercentage: number|null // 0-100 or null if no workout
  statusColorCode: string|null    // Hex color for status
  statusDescription: string       // "NOT_STARTED" | "PARTIALLY_COMPLETED" | "FULLY_COMPLETED" | "NO_WORKOUT"
  backgroundColorCode: string|null
  title: string|null              // Workout title
  totalItems: number              // Total items in workout
}
```

## Workout Detail

From `GET /accounts/{id}/users/{userId}/workouts/{date}`

```
{
  color: string|null
  sessionDurationInSeconds: number
  sessionDurationDescription: string  // "HH:MM:SS"
  title: string|null
  assignedDayBasedProgramsData: array
  activeDayBasedProgramsData: array
  workoutItems: [WorkoutItem]
}
```

### WorkoutItem

```
{
  // Identity
  assignedId: number              // Unique assignment ID
  completionId: number            // Completion tracking ID

  // Exercise
  exercise: {
    id: number                    // Exercise library ID
    name: string                  // Exercise name (e.g., "Comp Squat")
    type: string                  // "L" (Lift), "S" (SAQ+C), "C" (Circuit), etc.
    typeDescription: string       // "LIFT", "SAQC", "CIRCUIT"
    trackingEnabled: boolean
    trackingType: number          // 4 = Highest Entered Weight
    trackingTypeDescription: string
    description: string|null
    media: string|null            // Video URL
    documentId: number|null
  }

  // Prescription
  additionalInformation: string|null  // Coach notes (e.g., "RPE 6, repeat for 2 more")
  formType: string                    // "TwoColumns" (Weight+Reps), etc.
  icon: string                        // "lift", "saqc", etc.
  type: string                        // Exercise type code
  typeDescription: string             // Exercise type label
  title: string                       // Display title
  subTitle: string                    // Display subtitle

  // Completion
  fullyCompleted: boolean
  completeableItem: boolean
  completionCheckbox: boolean
  completionRequired: boolean
  athleteAddedItem: boolean
  coachCompletionOnly: boolean
  optedOut: boolean
  optedOutReason: string|null

  // Tracking
  totalLoad: number               // Total volume load (sets * reps * weight)
  totalReps: number               // Total reps completed
  trackingLoad: boolean           // Whether load is tracked
  trackingRepCount: boolean       // Whether rep count is tracked

  // Max/PR
  workingMax: {
    dateSet: string               // "YYYY-MM-DD"
    id: number
    isCurrentMax: boolean
    rawValue: number              // Max value in kg
    value: number                 // Display value
  }
  generatedMax: {                 // Max generated from this session
    dateSet: string
    id: number
    isCurrentMax: boolean
    rawValue: number
    value: number
  }
  maxTrackingEnabled: boolean

  // Grouping
  eachSide: boolean               // Left/right tracking
  groupingColorCode: string|null  // Superset grouping color
  groupingLetter: string|null     // Superset grouping letter

  // Features
  historyEnabled: boolean
  journalEntriesEnabled: boolean
  optOutEnabled: boolean
  substitutionEnabled: boolean
  progressionLevel: number|null
  progressionMasteredInputEnabled: boolean
  progressionStepMastered: boolean

  // Table structure
  tableHeaders: [{
    valueDescription: string      // "Weight", "Reps", "Time", etc.
    valueName: string             // "primary1", "reps", "time", etc.
  }]

  tableData: [SetData]            // Actual set-by-set data (see below)

  // Related
  documents: array
  journalEntries: array
  questions: array
}
```

### SetData (within tableData)

```
{
  setId: number                   // 1-indexed set number
  percentage: number|null         // Percentage of max (if percentage-based)
  recordedValues: object|null     // Recorded completion data
  values: [{
    placeholder: string|null      // Placeholder text
    readOnly: boolean
    timerEnabled: boolean
    value: number|null            // Actual value (weight in kg, reps count, etc.)
    valueDescription: string      // "Weight", "Reps"
    valueName: string             // "primary1", "reps"
    valueType: string             // "FLOAT", "INTEGER"
  }]
}
```

### Common valueName mappings

| valueName | Description | valueType |
|-----------|-------------|-----------|
| `primary1` | Weight/load (kg) | FLOAT |
| `reps` | Rep count | INTEGER |
| `time` | Time in seconds | INTEGER |
| `distance` | Distance | FLOAT |

## Session Summary

From `GET /accounts/{id}/users/{userId}/workouts/{date}/summary`

```
{
  hasData: boolean
  setsCompleted: number
  repsCompleted: number
  tonnage: number                 // Total volume load in kg
  sessionDurationInSeconds: number
  sessionDurationDescription: string  // "HH:MM:SS"
  sessionDate: string             // "YYYY-MM-DD"
  userId: number
  zeroBasedDayNum: number|null
  trueDayNum: number|null
  newPRs: [{
    exerciseId: number
    exerciseName: string
    maxValue: number              // PR value in kg
  }]
}
```

## Units

- All weights are in **kilograms** (as configured for this account)
- Durations are in **seconds** (with human-readable HH:MM:SS description)
- Dates are **YYYY-MM-DD** format
- Timestamps are **Unix epoch seconds**
