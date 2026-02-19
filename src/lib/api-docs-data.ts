// ─── Types ────────────────────────────────────────────────────────────
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface Param {
  name: string;
  location: "path" | "query" | "body";
  type: string;
  required: boolean;
  description: string;
}

export type JsonExample = Record<string, unknown> | Record<string, unknown>[];

export interface Endpoint {
  id: string;
  method: HttpMethod;
  path: string;
  summary: string;
  coachTip: string;
  params: Param[];
  requestExample?: JsonExample;
  responseExample: JsonExample;
  errorCodes?: { code: number; meaning: string }[];
}

export interface EndpointGroup {
  id: string;
  title: string;
  description: string;
  endpoints: Endpoint[];
}

// ─── Data ─────────────────────────────────────────────────────────────
export const apiGroups: EndpointGroup[] = [
  // ── 1. Athletes ─────────────────────────────────────────────────────
  {
    id: "athletes",
    title: "Athletes",
    description: "Create, view, update, and remove athletes on your roster.",
    endpoints: [
      {
        id: "list-athletes",
        method: "GET",
        path: "/api/athletes",
        summary: "List all athletes",
        coachTip:
          "Use this to populate your roster page. Returns every athlete assigned to you.",
        params: [],
        responseExample: [
          {
            id: 1,
            name: "Jane Doe",
            email: "jane@example.com",
            bodyweight: 72.5,
            createdAt: "2026-01-15T10:00:00Z",
          },
        ],
      },
      {
        id: "create-athlete",
        method: "POST",
        path: "/api/athletes",
        summary: "Add a new athlete",
        coachTip:
          "Add an athlete before assigning programs. Name and email are required.",
        params: [
          { name: "name", location: "body", type: "string", required: true, description: "Athlete full name" },
          { name: "email", location: "body", type: "string", required: true, description: "Contact email" },
          { name: "bodyweight", location: "body", type: "number", required: false, description: "Current bodyweight in kg" },
        ],
        requestExample: { name: "Jane Doe", email: "jane@example.com", bodyweight: 72.5 },
        responseExample: { id: 1, name: "Jane Doe", email: "jane@example.com", bodyweight: 72.5 },
      },
      {
        id: "get-athlete",
        method: "GET",
        path: "/api/athletes/:id",
        summary: "Get athlete details",
        coachTip:
          "Fetch a single athlete's profile including their current bodyweight and metadata.",
        params: [
          { name: "id", location: "path", type: "number", required: true, description: "Athlete ID" },
        ],
        responseExample: {
          id: 1,
          name: "Jane Doe",
          email: "jane@example.com",
          bodyweight: 72.5,
          createdAt: "2026-01-15T10:00:00Z",
        },
      },
      {
        id: "update-athlete",
        method: "PUT",
        path: "/api/athletes/:id",
        summary: "Update athlete info",
        coachTip:
          "Change name, email, or bodyweight. Only include the fields you want to change.",
        params: [
          { name: "id", location: "path", type: "number", required: true, description: "Athlete ID" },
          { name: "name", location: "body", type: "string", required: false, description: "New name" },
          { name: "email", location: "body", type: "string", required: false, description: "New email" },
          { name: "bodyweight", location: "body", type: "number", required: false, description: "Updated bodyweight in kg" },
        ],
        requestExample: { bodyweight: 73.0 },
        responseExample: { id: 1, name: "Jane Doe", email: "jane@example.com", bodyweight: 73.0 },
      },
      {
        id: "delete-athlete",
        method: "DELETE",
        path: "/api/athletes/:id",
        summary: "Remove an athlete",
        coachTip:
          "Permanently removes the athlete and all their data. This cannot be undone.",
        params: [
          { name: "id", location: "path", type: "number", required: true, description: "Athlete ID" },
        ],
        responseExample: { success: true },
        errorCodes: [{ code: 404, meaning: "Athlete not found" }],
      },
      {
        id: "athlete-history",
        method: "GET",
        path: "/api/athletes/:id/history",
        summary: "Get training history",
        coachTip:
          "Pull the full training log for an athlete — great for reviewing progress over time.",
        params: [
          { name: "id", location: "path", type: "number", required: true, description: "Athlete ID" },
          { name: "from", location: "query", type: "string", required: false, description: "Start date (YYYY-MM-DD)" },
          { name: "to", location: "query", type: "string", required: false, description: "End date (YYYY-MM-DD)" },
        ],
        responseExample: [
          {
            date: "2026-02-01",
            sessionName: "Squat Day",
            exercises: [
              { name: "Back Squat", sets: 5, topSet: "140kg x 3" },
            ],
          },
        ],
      },
    ],
  },

  // ── 2. Programs ─────────────────────────────────────────────────────
  {
    id: "programs",
    title: "Programs",
    description: "Build and manage training programs with weeks, sessions, and exercises.",
    endpoints: [
      {
        id: "list-programs",
        method: "GET",
        path: "/api/programs",
        summary: "List all programs",
        coachTip:
          "See every program you've created. Use this to populate the program picker.",
        params: [],
        responseExample: [
          { id: 1, name: "Off-Season Hypertrophy", weeks: 8, status: "active" },
        ],
      },
      {
        id: "create-program",
        method: "POST",
        path: "/api/programs",
        summary: "Create a new program",
        coachTip:
          "Start a new program shell. You'll add weeks and sessions separately via the template endpoint.",
        params: [
          { name: "name", location: "body", type: "string", required: true, description: "Program name" },
          { name: "description", location: "body", type: "string", required: false, description: "Short description" },
          { name: "weeks", location: "body", type: "number", required: true, description: "Number of weeks" },
        ],
        requestExample: { name: "Off-Season Hypertrophy", description: "8-week block", weeks: 8 },
        responseExample: { id: 1, name: "Off-Season Hypertrophy", weeks: 8, status: "draft" },
      },
      {
        id: "get-program",
        method: "GET",
        path: "/api/programs/:id",
        summary: "Get program details",
        coachTip:
          "Fetch the full program including its weeks, sessions, and prescribed exercises.",
        params: [
          { name: "id", location: "path", type: "number", required: true, description: "Program ID" },
        ],
        responseExample: {
          id: 1,
          name: "Off-Season Hypertrophy",
          weeks: 8,
          sessions: [
            { id: 1, weekNumber: 1, dayOfWeek: 1, name: "Squat Day" },
          ],
        },
      },
      {
        id: "update-program",
        method: "PUT",
        path: "/api/programs/:id",
        summary: "Update a program",
        coachTip:
          "Rename, change description, or adjust week count for an existing program.",
        params: [
          { name: "id", location: "path", type: "number", required: true, description: "Program ID" },
          { name: "name", location: "body", type: "string", required: false, description: "New name" },
          { name: "description", location: "body", type: "string", required: false, description: "New description" },
          { name: "weeks", location: "body", type: "number", required: false, description: "New week count" },
        ],
        requestExample: { name: "Updated Hypertrophy Block" },
        responseExample: { id: 1, name: "Updated Hypertrophy Block", weeks: 8 },
      },
      {
        id: "delete-program",
        method: "DELETE",
        path: "/api/programs/:id",
        summary: "Delete a program",
        coachTip:
          "Permanently deletes the program. Won't affect already-completed workouts.",
        params: [
          { name: "id", location: "path", type: "number", required: true, description: "Program ID" },
        ],
        responseExample: { success: true },
      },
      {
        id: "program-template",
        method: "GET",
        path: "/api/programs/:id/template",
        summary: "Get program template",
        coachTip:
          "Returns the full template structure with all weeks, sessions, and exercise prescriptions. Useful for duplicating or editing a program.",
        params: [
          { name: "id", location: "path", type: "number", required: true, description: "Program ID" },
        ],
        responseExample: {
          id: 1,
          name: "Off-Season Hypertrophy",
          template: {
            weeks: [
              {
                weekNumber: 1,
                sessions: [
                  {
                    name: "Squat Day",
                    dayOfWeek: 1,
                    exercises: [
                      { exerciseId: 10, sets: 5, reps: 5, rpe: 8 },
                    ],
                  },
                ],
              },
            ],
          },
        },
      },
    ],
  },

  // ── 3. Program Assignment ───────────────────────────────────────────
  {
    id: "program-assignment",
    title: "Program Assignment",
    description: "Assign programs to athletes and set start dates.",
    endpoints: [
      {
        id: "assign-program",
        method: "POST",
        path: "/api/programs/:id/assign",
        summary: "Assign program to athlete",
        coachTip:
          "This is how you start an athlete on a program. Pick a start date and the schedule auto-generates.",
        params: [
          { name: "id", location: "path", type: "number", required: true, description: "Program ID" },
          { name: "athleteId", location: "body", type: "number", required: true, description: "Athlete to assign" },
          { name: "startDate", location: "body", type: "string", required: true, description: "Start date (YYYY-MM-DD)" },
        ],
        requestExample: { athleteId: 1, startDate: "2026-03-01" },
        responseExample: { assignmentId: 42, athleteId: 1, programId: 1, startDate: "2026-03-01" },
      },
      {
        id: "unassign-program",
        method: "DELETE",
        path: "/api/programs/:id/assign",
        summary: "Unassign program from athlete",
        coachTip:
          "Removes an active program assignment. Past completed sessions stay in history.",
        params: [
          { name: "id", location: "path", type: "number", required: true, description: "Program ID" },
          { name: "athleteId", location: "body", type: "number", required: true, description: "Athlete to unassign" },
        ],
        requestExample: { athleteId: 1 },
        responseExample: { success: true },
      },
    ],
  },

  // ── 4. Exercises ────────────────────────────────────────────────────
  {
    id: "exercises",
    title: "Exercises",
    description: "Manage the exercise library used across programs.",
    endpoints: [
      {
        id: "list-exercises",
        method: "GET",
        path: "/api/exercises",
        summary: "List all exercises",
        coachTip:
          "Fetch your full exercise library. Use the search param to find specific movements.",
        params: [
          { name: "search", location: "query", type: "string", required: false, description: "Filter by name (partial match)" },
        ],
        responseExample: [
          { id: 10, name: "Back Squat", category: "squat", equipment: "barbell" },
        ],
      },
      {
        id: "create-exercise",
        method: "POST",
        path: "/api/exercises",
        summary: "Create a custom exercise",
        coachTip:
          "Add exercises that aren't in the default library. Great for accessory variations.",
        params: [
          { name: "name", location: "body", type: "string", required: true, description: "Exercise name" },
          { name: "category", location: "body", type: "string", required: false, description: "Movement category (squat, bench, deadlift, accessory)" },
          { name: "equipment", location: "body", type: "string", required: false, description: "Equipment type (barbell, dumbbell, machine, bodyweight)" },
        ],
        requestExample: { name: "Pause Bench Press", category: "bench", equipment: "barbell" },
        responseExample: { id: 25, name: "Pause Bench Press", category: "bench", equipment: "barbell" },
      },
      {
        id: "get-exercise",
        method: "GET",
        path: "/api/exercises/:id",
        summary: "Get exercise details",
        coachTip:
          "Look up details for a specific exercise, including category and equipment.",
        params: [
          { name: "id", location: "path", type: "number", required: true, description: "Exercise ID" },
        ],
        responseExample: { id: 10, name: "Back Squat", category: "squat", equipment: "barbell" },
      },
      {
        id: "update-exercise",
        method: "PUT",
        path: "/api/exercises/:id",
        summary: "Update an exercise",
        coachTip:
          "Rename or re-categorize an exercise. Changes apply everywhere it's used.",
        params: [
          { name: "id", location: "path", type: "number", required: true, description: "Exercise ID" },
          { name: "name", location: "body", type: "string", required: false, description: "New name" },
          { name: "category", location: "body", type: "string", required: false, description: "New category" },
        ],
        requestExample: { name: "Competition Bench Press" },
        responseExample: { id: 10, name: "Competition Bench Press", category: "bench", equipment: "barbell" },
      },
      {
        id: "delete-exercise",
        method: "DELETE",
        path: "/api/exercises/:id",
        summary: "Delete an exercise",
        coachTip:
          "Removes a custom exercise. Cannot delete exercises that are used in active programs.",
        params: [
          { name: "id", location: "path", type: "number", required: true, description: "Exercise ID" },
        ],
        responseExample: { success: true },
        errorCodes: [{ code: 409, meaning: "Exercise is used in active programs" }],
      },
    ],
  },

  // ── 5. Schedule ─────────────────────────────────────────────────────
  {
    id: "schedule",
    title: "Schedule",
    description: "View and adjust the training calendar for assigned programs.",
    endpoints: [
      {
        id: "view-schedule",
        method: "GET",
        path: "/api/schedule",
        summary: "View training schedule",
        coachTip:
          "Get the calendar view of upcoming sessions. Filter by athlete or date range.",
        params: [
          { name: "athleteId", location: "query", type: "number", required: false, description: "Filter to one athlete" },
          { name: "from", location: "query", type: "string", required: false, description: "Start date (YYYY-MM-DD)" },
          { name: "to", location: "query", type: "string", required: false, description: "End date (YYYY-MM-DD)" },
        ],
        responseExample: [
          {
            id: 100,
            athleteId: 1,
            date: "2026-03-01",
            sessionName: "Squat Day",
            status: "scheduled",
          },
        ],
      },
      {
        id: "move-session",
        method: "PATCH",
        path: "/api/schedule/:sessionId/move",
        summary: "Move a session to a different date",
        coachTip:
          "Reschedule a session when an athlete misses a day. Just pick the new date.",
        params: [
          { name: "sessionId", location: "path", type: "number", required: true, description: "Scheduled session ID" },
          { name: "newDate", location: "body", type: "string", required: true, description: "New date (YYYY-MM-DD)" },
        ],
        requestExample: { newDate: "2026-03-03" },
        responseExample: { id: 100, date: "2026-03-03", status: "scheduled" },
      },
      {
        id: "skip-session",
        method: "PATCH",
        path: "/api/schedule/:sessionId/skip",
        summary: "Skip a session",
        coachTip:
          "Mark a session as skipped (e.g., athlete is sick). The session won't count toward completion.",
        params: [
          { name: "sessionId", location: "path", type: "number", required: true, description: "Scheduled session ID" },
          { name: "reason", location: "body", type: "string", required: false, description: "Reason for skipping" },
        ],
        requestExample: { reason: "Athlete feeling unwell" },
        responseExample: { id: 100, status: "skipped", reason: "Athlete feeling unwell" },
      },
    ],
  },

  // ── 6. Training / Sets ──────────────────────────────────────────────
  {
    id: "training",
    title: "Training / Sets",
    description: "Log individual sets and view completed workout data.",
    endpoints: [
      {
        id: "log-set",
        method: "POST",
        path: "/api/sets",
        summary: "Log a completed set",
        coachTip:
          "Record a set as the athlete completes it. Include weight, reps, and optionally RPE.",
        params: [
          { name: "sessionId", location: "body", type: "number", required: true, description: "Scheduled session ID" },
          { name: "exerciseId", location: "body", type: "number", required: true, description: "Exercise ID" },
          { name: "setNumber", location: "body", type: "number", required: true, description: "Set number (1, 2, 3…)" },
          { name: "weight", location: "body", type: "number", required: true, description: "Weight in kg" },
          { name: "reps", location: "body", type: "number", required: true, description: "Reps completed" },
          { name: "rpe", location: "body", type: "number", required: false, description: "Rate of perceived exertion (6-10)" },
        ],
        requestExample: { sessionId: 100, exerciseId: 10, setNumber: 1, weight: 140, reps: 3, rpe: 8 },
        responseExample: { id: 500, sessionId: 100, exerciseId: 10, setNumber: 1, weight: 140, reps: 3, rpe: 8 },
      },
      {
        id: "list-sets",
        method: "GET",
        path: "/api/sets",
        summary: "List sets for a session",
        coachTip:
          "View all logged sets for a given session. Great for reviewing an athlete's workout.",
        params: [
          { name: "sessionId", location: "query", type: "number", required: true, description: "Session to query" },
        ],
        responseExample: [
          { id: 500, exerciseId: 10, setNumber: 1, weight: 140, reps: 3, rpe: 8 },
          { id: 501, exerciseId: 10, setNumber: 2, weight: 140, reps: 3, rpe: 8.5 },
        ],
      },
      {
        id: "update-set",
        method: "PUT",
        path: "/api/sets/:id",
        summary: "Update a logged set",
        coachTip:
          "Fix a typo in a logged set — wrong weight, reps, or RPE.",
        params: [
          { name: "id", location: "path", type: "number", required: true, description: "Set ID" },
          { name: "weight", location: "body", type: "number", required: false, description: "Corrected weight" },
          { name: "reps", location: "body", type: "number", required: false, description: "Corrected reps" },
          { name: "rpe", location: "body", type: "number", required: false, description: "Corrected RPE" },
        ],
        requestExample: { weight: 142.5 },
        responseExample: { id: 500, weight: 142.5, reps: 3, rpe: 8 },
      },
      {
        id: "delete-set",
        method: "DELETE",
        path: "/api/sets/:id",
        summary: "Delete a logged set",
        coachTip:
          "Remove a set that was logged by mistake.",
        params: [
          { name: "id", location: "path", type: "number", required: true, description: "Set ID" },
        ],
        responseExample: { success: true },
      },
      {
        id: "get-workout",
        method: "GET",
        path: "/api/train",
        summary: "Get today's workout for an athlete",
        coachTip:
          "Fetches the prescribed workout for today (or a given date). Shows what the athlete should do.",
        params: [
          { name: "athleteId", location: "query", type: "number", required: true, description: "Athlete ID" },
          { name: "date", location: "query", type: "string", required: false, description: "Date (YYYY-MM-DD), defaults to today" },
        ],
        responseExample: {
          sessionId: 100,
          sessionName: "Squat Day",
          exercises: [
            { exerciseId: 10, name: "Back Squat", prescribedSets: 5, prescribedReps: 5, prescribedRpe: 8 },
          ],
        },
      },
      {
        id: "submit-workout",
        method: "POST",
        path: "/api/submissions",
        summary: "Submit a completed workout",
        coachTip:
          "Mark a full workout session as completed. Athletes see this as their 'done' confirmation.",
        params: [
          { name: "sessionId", location: "body", type: "number", required: true, description: "Scheduled session ID" },
          { name: "completedAt", location: "body", type: "string", required: false, description: "Completion timestamp (ISO 8601)" },
        ],
        requestExample: { sessionId: 100 },
        responseExample: { id: 200, sessionId: 100, completedAt: "2026-03-01T18:30:00Z" },
      },
    ],
  },

  // ── 7. Notes ────────────────────────────────────────────────────────
  {
    id: "notes",
    title: "Notes",
    description: "Add coaching notes to sessions and individual exercises.",
    endpoints: [
      {
        id: "session-notes",
        method: "POST",
        path: "/api/sessions/:sessionId/notes",
        summary: "Add a note to a session",
        coachTip:
          "Leave session-level feedback like 'Great energy today' or 'Drop volume next week.'",
        params: [
          { name: "sessionId", location: "path", type: "number", required: true, description: "Session ID" },
          { name: "content", location: "body", type: "string", required: true, description: "Note text" },
          { name: "authorRole", location: "body", type: "string", required: false, description: "'coach' or 'athlete'" },
        ],
        requestExample: { content: "Solid session — increase squat weight next week", authorRole: "coach" },
        responseExample: { id: 300, sessionId: 100, content: "Solid session — increase squat weight next week", authorRole: "coach" },
      },
      {
        id: "exercise-notes",
        method: "POST",
        path: "/api/workout-exercises/:id/notes",
        summary: "Add a note to an exercise",
        coachTip:
          "Leave exercise-specific feedback like 'Widen grip' or 'Knees caving on rep 3.'",
        params: [
          { name: "id", location: "path", type: "number", required: true, description: "Workout exercise ID" },
          { name: "content", location: "body", type: "string", required: true, description: "Note text" },
          { name: "authorRole", location: "body", type: "string", required: false, description: "'coach' or 'athlete'" },
        ],
        requestExample: { content: "Widen grip slightly next session", authorRole: "coach" },
        responseExample: { id: 301, workoutExerciseId: 50, content: "Widen grip slightly next session", authorRole: "coach" },
      },
    ],
  },

  // ── 8. Analytics ────────────────────────────────────────────────────
  {
    id: "analytics",
    title: "Analytics",
    description: "Track trends, compare athletes, and export training data.",
    endpoints: [
      {
        id: "athlete-analytics",
        method: "GET",
        path: "/api/analytics/:athleteId",
        summary: "Get athlete analytics",
        coachTip:
          "Pull trend data for an athlete — volume, intensity, e1RM over time. Powers the progress charts.",
        params: [
          { name: "athleteId", location: "path", type: "number", required: true, description: "Athlete ID" },
          { name: "exerciseId", location: "query", type: "number", required: false, description: "Filter to one exercise" },
          { name: "from", location: "query", type: "string", required: false, description: "Start date (YYYY-MM-DD)" },
          { name: "to", location: "query", type: "string", required: false, description: "End date (YYYY-MM-DD)" },
        ],
        responseExample: {
          athleteId: 1,
          trends: [
            { date: "2026-02-01", exercise: "Back Squat", e1rm: 165, volume: 4200 },
            { date: "2026-02-08", exercise: "Back Squat", e1rm: 167.5, volume: 4500 },
          ],
        },
      },
      {
        id: "compare-athletes",
        method: "GET",
        path: "/api/analytics/compare",
        summary: "Compare athletes side-by-side",
        coachTip:
          "Compare up to 4 athletes on a specific exercise. Great for team overview.",
        params: [
          { name: "athleteIds", location: "query", type: "string", required: true, description: "Comma-separated athlete IDs" },
          { name: "exerciseId", location: "query", type: "number", required: true, description: "Exercise to compare" },
        ],
        responseExample: {
          exercise: "Back Squat",
          athletes: [
            { id: 1, name: "Jane Doe", currentE1rm: 165, trend: "up" },
            { id: 2, name: "John Smith", currentE1rm: 180, trend: "flat" },
          ],
        },
      },
      {
        id: "export-csv",
        method: "GET",
        path: "/api/analytics/:athleteId/export",
        summary: "Export training data as CSV",
        coachTip:
          "Download a CSV of all training data for an athlete. Useful for external analysis in spreadsheets.",
        params: [
          { name: "athleteId", location: "path", type: "number", required: true, description: "Athlete ID" },
          { name: "from", location: "query", type: "string", required: false, description: "Start date (YYYY-MM-DD)" },
          { name: "to", location: "query", type: "string", required: false, description: "End date (YYYY-MM-DD)" },
        ],
        responseExample: { url: "/downloads/athlete-1-export.csv", rows: 1250 },
      },
    ],
  },

  // ── 9. Bodyweight ───────────────────────────────────────────────────
  {
    id: "bodyweight",
    title: "Bodyweight",
    description: "Track athlete bodyweight entries over time.",
    endpoints: [
      {
        id: "list-bodyweight",
        method: "GET",
        path: "/api/bodyweight",
        summary: "List bodyweight entries",
        coachTip:
          "Get bodyweight history for an athlete. Use for weight-class tracking and meet prep.",
        params: [
          { name: "athleteId", location: "query", type: "number", required: true, description: "Athlete ID" },
          { name: "from", location: "query", type: "string", required: false, description: "Start date" },
          { name: "to", location: "query", type: "string", required: false, description: "End date" },
        ],
        responseExample: [
          { id: 1, athleteId: 1, weight: 72.5, date: "2026-02-01" },
          { id: 2, athleteId: 1, weight: 72.8, date: "2026-02-08" },
        ],
      },
      {
        id: "add-bodyweight",
        method: "POST",
        path: "/api/bodyweight",
        summary: "Log a bodyweight entry",
        coachTip:
          "Record a new weigh-in. Athletes can also log their own from the app.",
        params: [
          { name: "athleteId", location: "body", type: "number", required: true, description: "Athlete ID" },
          { name: "weight", location: "body", type: "number", required: true, description: "Weight in kg" },
          { name: "date", location: "body", type: "string", required: false, description: "Date (YYYY-MM-DD), defaults to today" },
        ],
        requestExample: { athleteId: 1, weight: 72.3, date: "2026-02-15" },
        responseExample: { id: 3, athleteId: 1, weight: 72.3, date: "2026-02-15" },
      },
      {
        id: "get-bodyweight",
        method: "GET",
        path: "/api/bodyweight/:id",
        summary: "Get a bodyweight entry",
        coachTip: "Fetch a specific bodyweight record by ID.",
        params: [
          { name: "id", location: "path", type: "number", required: true, description: "Entry ID" },
        ],
        responseExample: { id: 1, athleteId: 1, weight: 72.5, date: "2026-02-01" },
      },
      {
        id: "update-bodyweight",
        method: "PUT",
        path: "/api/bodyweight/:id",
        summary: "Update a bodyweight entry",
        coachTip: "Fix a typo in a weigh-in — wrong weight or wrong date.",
        params: [
          { name: "id", location: "path", type: "number", required: true, description: "Entry ID" },
          { name: "weight", location: "body", type: "number", required: false, description: "Corrected weight" },
          { name: "date", location: "body", type: "string", required: false, description: "Corrected date" },
        ],
        requestExample: { weight: 72.6 },
        responseExample: { id: 1, athleteId: 1, weight: 72.6, date: "2026-02-01" },
      },
      {
        id: "delete-bodyweight",
        method: "DELETE",
        path: "/api/bodyweight/:id",
        summary: "Delete a bodyweight entry",
        coachTip: "Remove an incorrect weigh-in.",
        params: [
          { name: "id", location: "path", type: "number", required: true, description: "Entry ID" },
        ],
        responseExample: { success: true },
      },
    ],
  },

  // ── 10. Meets ───────────────────────────────────────────────────────
  {
    id: "meets",
    title: "Meets",
    description: "Manage competitions and meet entries for athletes.",
    endpoints: [
      {
        id: "list-meets",
        method: "GET",
        path: "/api/meets",
        summary: "List all meets",
        coachTip:
          "See all upcoming and past competitions. Use this for your meet calendar.",
        params: [],
        responseExample: [
          { id: 1, name: "Provincial Championships", date: "2026-06-15", federation: "CPU", status: "upcoming" },
        ],
      },
      {
        id: "create-meet",
        method: "POST",
        path: "/api/meets",
        summary: "Create a new meet",
        coachTip:
          "Register an upcoming competition so you can plan peaking blocks around it.",
        params: [
          { name: "name", location: "body", type: "string", required: true, description: "Meet name" },
          { name: "date", location: "body", type: "string", required: true, description: "Meet date (YYYY-MM-DD)" },
          { name: "federation", location: "body", type: "string", required: false, description: "Federation (e.g., CPU, USAPL, IPF)" },
          { name: "location", location: "body", type: "string", required: false, description: "Venue / city" },
        ],
        requestExample: { name: "Provincial Championships", date: "2026-06-15", federation: "CPU", location: "Toronto" },
        responseExample: { id: 1, name: "Provincial Championships", date: "2026-06-15", federation: "CPU" },
      },
      {
        id: "get-meet",
        method: "GET",
        path: "/api/meets/:id",
        summary: "Get meet details",
        coachTip:
          "Fetch full details for a meet including all registered entries.",
        params: [
          { name: "id", location: "path", type: "number", required: true, description: "Meet ID" },
        ],
        responseExample: {
          id: 1,
          name: "Provincial Championships",
          date: "2026-06-15",
          entries: [
            { id: 10, athleteId: 1, weightClass: "74kg", squat: null, bench: null, deadlift: null },
          ],
        },
      },
      {
        id: "update-meet",
        method: "PUT",
        path: "/api/meets/:id",
        summary: "Update a meet",
        coachTip: "Change the date, name, or other details for a meet.",
        params: [
          { name: "id", location: "path", type: "number", required: true, description: "Meet ID" },
          { name: "name", location: "body", type: "string", required: false, description: "New name" },
          { name: "date", location: "body", type: "string", required: false, description: "New date" },
          { name: "federation", location: "body", type: "string", required: false, description: "New federation" },
        ],
        requestExample: { date: "2026-06-22" },
        responseExample: { id: 1, name: "Provincial Championships", date: "2026-06-22" },
      },
      {
        id: "delete-meet",
        method: "DELETE",
        path: "/api/meets/:id",
        summary: "Delete a meet",
        coachTip: "Remove a meet that was cancelled or entered by mistake.",
        params: [
          { name: "id", location: "path", type: "number", required: true, description: "Meet ID" },
        ],
        responseExample: { success: true },
      },
      {
        id: "list-entries",
        method: "GET",
        path: "/api/meets/:id/entries",
        summary: "List meet entries",
        coachTip:
          "See which athletes are registered for a meet and their weight classes.",
        params: [
          { name: "id", location: "path", type: "number", required: true, description: "Meet ID" },
        ],
        responseExample: [
          { id: 10, athleteId: 1, athleteName: "Jane Doe", weightClass: "74kg" },
        ],
      },
      {
        id: "add-entry",
        method: "POST",
        path: "/api/meets/:id/entries",
        summary: "Register an athlete for a meet",
        coachTip:
          "Sign up an athlete for a competition and set their weight class.",
        params: [
          { name: "id", location: "path", type: "number", required: true, description: "Meet ID" },
          { name: "athleteId", location: "body", type: "number", required: true, description: "Athlete ID" },
          { name: "weightClass", location: "body", type: "string", required: true, description: "Weight class (e.g., 74kg)" },
        ],
        requestExample: { athleteId: 1, weightClass: "74kg" },
        responseExample: { id: 10, athleteId: 1, weightClass: "74kg", meetId: 1 },
      },
      {
        id: "update-entry",
        method: "PUT",
        path: "/api/meets/:id/entries/:entryId",
        summary: "Update a meet entry",
        coachTip:
          "Update weight class or record attempt results for a meet entry.",
        params: [
          { name: "id", location: "path", type: "number", required: true, description: "Meet ID" },
          { name: "entryId", location: "path", type: "number", required: true, description: "Entry ID" },
          { name: "weightClass", location: "body", type: "string", required: false, description: "New weight class" },
          { name: "squat", location: "body", type: "number", required: false, description: "Best squat (kg)" },
          { name: "bench", location: "body", type: "number", required: false, description: "Best bench (kg)" },
          { name: "deadlift", location: "body", type: "number", required: false, description: "Best deadlift (kg)" },
        ],
        requestExample: { squat: 200, bench: 130, deadlift: 240 },
        responseExample: { id: 10, weightClass: "74kg", squat: 200, bench: 130, deadlift: 240, total: 570 },
      },
    ],
  },

  // ── 11. Messaging ───────────────────────────────────────────────────
  {
    id: "messaging",
    title: "Messaging",
    description: "Coach-athlete messaging threads and inbox management.",
    endpoints: [
      {
        id: "coach-inbox",
        method: "GET",
        path: "/api/messages",
        summary: "Get coach inbox",
        coachTip:
          "Fetch all message threads. Shows latest message and unread count per athlete.",
        params: [],
        responseExample: [
          {
            athleteId: 1,
            athleteName: "Jane Doe",
            lastMessage: "How did squats feel today?",
            unreadCount: 2,
            updatedAt: "2026-02-19T10:30:00Z",
          },
        ],
      },
      {
        id: "unread-count",
        method: "GET",
        path: "/api/messages/unread",
        summary: "Get total unread count",
        coachTip:
          "Quick check for the notification badge — returns total unread messages across all threads.",
        params: [],
        responseExample: { unreadCount: 5 },
      },
      {
        id: "get-thread",
        method: "GET",
        path: "/api/messages/:athleteId",
        summary: "Get message thread with athlete",
        coachTip:
          "Load the full conversation history with a specific athlete.",
        params: [
          { name: "athleteId", location: "path", type: "number", required: true, description: "Athlete ID" },
        ],
        responseExample: [
          { id: 1, content: "How did squats feel today?", authorRole: "coach", createdAt: "2026-02-19T10:30:00Z" },
          { id: 2, content: "Felt great, RPE 7 on top sets", authorRole: "athlete", createdAt: "2026-02-19T10:35:00Z" },
        ],
      },
      {
        id: "send-message",
        method: "POST",
        path: "/api/messages/:athleteId",
        summary: "Send a message to an athlete",
        coachTip:
          "Send a direct message to an athlete. They'll see it in their app inbox.",
        params: [
          { name: "athleteId", location: "path", type: "number", required: true, description: "Athlete ID" },
          { name: "content", location: "body", type: "string", required: true, description: "Message text" },
        ],
        requestExample: { content: "Great work today! Let's bump squat weight next week." },
        responseExample: { id: 3, content: "Great work today! Let's bump squat weight next week.", authorRole: "coach", createdAt: "2026-02-19T11:00:00Z" },
      },
      {
        id: "mark-read",
        method: "POST",
        path: "/api/messages/:athleteId/read",
        summary: "Mark thread as read",
        coachTip:
          "Clears the unread badge for a specific athlete's thread.",
        params: [
          { name: "athleteId", location: "path", type: "number", required: true, description: "Athlete ID" },
        ],
        requestExample: {},
        responseExample: { success: true },
      },
    ],
  },

  // ── 12. Settings ────────────────────────────────────────────────────
  {
    id: "settings",
    title: "Settings",
    description: "Coach account configuration and preferences.",
    endpoints: [
      {
        id: "get-settings",
        method: "GET",
        path: "/api/settings",
        summary: "Get coach settings",
        coachTip:
          "Fetch your current account settings — units, timezone, notification preferences.",
        params: [],
        responseExample: {
          units: "metric",
          timezone: "America/Toronto",
          emailNotifications: true,
          defaultRpeScale: "6-10",
        },
      },
      {
        id: "update-settings",
        method: "PUT",
        path: "/api/settings",
        summary: "Update coach settings",
        coachTip:
          "Change your preferred units, timezone, or notification settings.",
        params: [
          { name: "units", location: "body", type: "string", required: false, description: "'metric' or 'imperial'" },
          { name: "timezone", location: "body", type: "string", required: false, description: "IANA timezone (e.g., America/Toronto)" },
          { name: "emailNotifications", location: "body", type: "boolean", required: false, description: "Enable email notifications" },
        ],
        requestExample: { units: "imperial" },
        responseExample: { units: "imperial", timezone: "America/Toronto", emailNotifications: true },
      },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────
export const totalEndpoints = apiGroups.reduce(
  (sum, g) => sum + g.endpoints.length,
  0
);
