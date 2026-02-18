# Task Group 30: UX Polish

Source: specs/tasks/00-implied-features-audit.md (gaps #8, #9, #10, #16, #17)

### Priority 30: UX Polish

- [ ] **Task 30.1**: Create shared EmptyState component
  - Spec: specs/02-coach-dashboard.md
  - Acceptance: `src/components/ui/EmptyState.tsx` accepts props: `icon` (Lucide icon component), `title` (string), `description` (string), `actionLabel` (optional string), `actionHref` (optional string). Renders a centered layout with icon, heading, subtext, and optional CTA button. Uses existing Tailwind design tokens and card styling.

- [ ] **Task 30.2**: Add empty states to all coach pages
  - Spec: specs/02-coach-dashboard.md
  - Acceptance: Each page shows an appropriate empty state when no data exists:
    - `/dashboard`: "Welcome to Cannoli Trainer! Start by adding your first athlete." with "Add Athlete" CTA
    - `/athletes`: "No athletes yet. Add your first athlete to get started." with "Add Athlete" CTA
    - `/programs`: "No programs yet. Create your first training program." with "Create Program" CTA
    - `/exercises`: "Exercise library is empty." with "Seed Exercises" or "Add Exercise" CTA
    - `/analytics`: "Not enough data yet. Athletes need to log workouts before analytics appear."
    - `/meets`: "No upcoming meets. Create a meet to start planning." with "Create Meet" CTA
    - `/athlete/train` (athlete view): "No workout assigned for today. Check back later or contact your coach."

- [ ] **Task 30.3**: Install toast library and create toast wrapper
  - Spec: specs/tasks/00-implied-features-audit.md (gaps #9, #17)
  - Acceptance: `sonner` is installed as a dependency. `<Toaster />` component is added to root layout. `src/lib/toast.ts` exports convenience functions: `showSuccess(message)`, `showError(message)`, `showLoading(message)`. Toast appears in bottom-right on desktop, bottom-center on mobile. Auto-dismisses after 4 seconds (errors after 6 seconds).

- [ ] **Task 30.4**: Add success and error toasts to all mutation actions
  - Spec: specs/tasks/00-implied-features-audit.md (gap #17)
  - Acceptance: Every create/update/delete action shows a toast on completion:
    - Athlete created/updated/archived: success toast with athlete name
    - Program saved/archived: success toast with program name
    - Program assigned: success toast "Program assigned to {athlete name}"
    - Exercise created: success toast with exercise name
    - Meet created/updated: success toast with meet name
    - Set logged: no toast (too frequent, would be noisy)
    - All failed API calls: error toast with user-friendly message (not raw error)
    - Network errors: "Something went wrong. Please try again."

- [ ] **Task 30.5**: Add inline form validation to all forms
  - Spec: specs/tasks/00-implied-features-audit.md (gap #9)
  - Acceptance: All forms with required fields show inline validation messages below the field on blur or submit. Validated forms: athlete create/edit (name required), program create (name required), exercise create (name and category required), meet create (name and date required). Validation uses zod schemas that match the API route validation. Error messages are user-friendly ("Name is required", not "String expected"). Invalid fields are highlighted with a red border.

- [ ] **Task 30.6**: Create shared ConfirmDialog component
  - Spec: specs/tasks/00-implied-features-audit.md (gap #10)
  - Acceptance: `src/components/ui/ConfirmDialog.tsx` wraps Radix UI `AlertDialog`. Props: `title`, `description`, `confirmLabel` (default "Confirm"), `cancelLabel` (default "Cancel"), `variant` ("default" | "destructive"), `onConfirm`, `open`, `onOpenChange`. Destructive variant uses red confirm button. Component is used for: archive athlete, archive program, delete exercise (with usage warning), delete meet, unassign program. Each confirmation dialog explains consequences (e.g., "This athlete will be moved to archived. All training data will be preserved.").

- [ ] **Task 30.7**: Add React error boundaries to page routes
  - Spec: specs/tasks/00-implied-features-audit.md (gap #9)
  - Acceptance: Each major route group has an `error.tsx` file (Next.js App Router convention): `/dashboard/error.tsx`, `/athletes/error.tsx`, `/programs/error.tsx`, `/analytics/error.tsx`, `/meets/error.tsx`, `/athlete/error.tsx`. Error boundary shows a user-friendly message ("Something went wrong") with a "Try again" button that calls `reset()`. Error details are logged to console in development only.

- [ ] **Task 30.8**: Add skeleton loading states to all pages
  - Spec: specs/02-coach-dashboard.md
  - Acceptance: Each major route has a `loading.tsx` file with skeleton placeholders:
    - Dashboard: skeleton stat cards (4 rectangles), skeleton activity feed (4 rows), skeleton attention list
    - Athletes list: skeleton table rows (10 rows with avatar placeholder)
    - Programs list: skeleton cards (6 cards)
    - Exercise library: skeleton grid (12 cards)
    - Analytics: skeleton chart area + skeleton stat cards
    - Athlete profile: skeleton header + skeleton content sections
    Skeletons use Tailwind `animate-pulse` with grey placeholder shapes matching the actual content layout.
