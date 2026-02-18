# Task Group 22: Coach Dashboard Enhancements

Spec: specs/02-coach-dashboard.md

### Priority 22: Dashboard Quick Actions & Loading States

- [ ] **Task 22.1**: Build quick action buttons (create program, add athlete, view analytics)
  - Spec: specs/02-coach-dashboard.md
  - Acceptance: Dashboard has prominent CTA buttons or FAB menu with links to `/programs/new`, `/athletes/new`, `/analytics`. Buttons visible on mobile. Click navigates to correct page.

- [ ] **Task 22.2**: Add skeleton loading states for all dashboard sections
  - Spec: specs/02-coach-dashboard.md
  - Acceptance: `DashboardSkeleton` component renders pulse-animated placeholders for stat cards, activity feed, needs-attention list, and upcoming meets. Each section wrapped in React Suspense boundary so sections load independently. No layout shift when real data replaces skeleton.
