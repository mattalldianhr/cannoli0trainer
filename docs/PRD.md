# Product Requirements Document: Cannoli Trainer

## Executive Summary

Cannoli Trainer is a coaching platform purpose-built for independent powerlifting and S&C coaches who need the flexibility of Google Sheets combined with the management capabilities of established platforms like TeamBuildr. The platform serves a solo coach managing 31-50 athletes across multiple locations, mostly remote, who currently spends 10-15 hours per week on programming and administration.

The product directly addresses a validated gap in the market: no existing platform delivers a fully streamlined service for independent powerlifting coaches. TeamBuildr dominates the collegiate and team space but is clunky for solo operators. TrueCoach excels at 1:1 coaching but lacks periodization depth. TrainHeroic optimizes for groups but limits individual coaching. None natively support the full range of load prescription methods (RPE, %1RM, RIR, velocity targets, autoregulated ranges, and fixed weight) that a methodologically diverse coach requires.

**Target User:** Joe Cristando (Cannoli Strength / Cannoli Gang) — 12 years competitive powerlifting, 7 years coaching, 52 USAPL New York State records, VBT practitioner, co-host of Squats & Science Podcast.

**Budget:** $150-$300/month flat rate

**Timeline:** Platform needed within 1-3 months

---

## Problem Statement

### The Coach's Core Frustration

> "All of the current platforms are excellent at one facet of coaching but none of them deliver a fully streamlined, efficient service. It would be great to have the flexibility of Google Sheets in terms of data and how it's presented combined with the management capabilities of TeamBuildr."

### Current State

The coach currently uses TeamBuildr (5 years, 6/10 satisfaction) for programming delivery and WhatsApp for athlete communication. This fragmented setup results in:

- **10-15 hours/week** spent writing and adjusting programs
- Clunky programming UX that doesn't match the coach's methodology
- Poor access to training metrics and data
- Manual load calculations across 6 different prescription methods
- Constant app-switching between TeamBuildr, WhatsApp, spreadsheets, and other tools
- Chasing athletes for training logs and check-ins
- No centralized view of long-term athlete progress

### What's Missing Everywhere

Data the coach needs but no platform provides in one place:

- Long-term strength trends per athlete
- Velocity profiles and load-velocity curves
- Cumulative volume and load tracking
- Training compliance and adherence rates
- RPE accuracy over time
- Bodyweight and weight class tracking
- Injury history and modification patterns

---

## Market Context

### Competitive Landscape

The strength and conditioning software market is valued at $594M (2025), growing to $985M by 2034 at 7.6% CAGR. Six major competitors were analyzed in depth:

| Platform | Best For | Weakness for This Coach |
|----------|----------|------------------------|
| **TeamBuildr** | Team/collegiate S&C (150+ NCAA programs) | Clunky UX, poor solo-coach experience, buggy metrics |
| **TrueCoach** | 1:1 personal trainers | Limited periodization, weak group features |
| **TrainHeroic** | Group coaching, marketplace | Only 2 templates, poor 1:1 support, no VBT |
| **BridgeAthletic** | Enterprise/professional teams | Expensive ($167+/mo), steep learning curve |
| **CoachMePlus** | Data-heavy analytics | Complex setup, requires technical sophistication |
| **Volt Athletics** | AI-powered programming | Replaces the coach rather than empowering them |

### Opportunity

No platform in the market combines:
1. Flexible multi-method load prescription (RPE + %1RM + RIR + velocity + autoregulation + fixed)
2. Multiple periodization support (block, DUP, linear, RPE-based)
3. Native VBT data integration and analytics
4. Competition prep and meet day tools
5. Solo-coach-friendly UX and pricing
6. Comprehensive athlete analytics in one place

This is the gap Cannoli Trainer fills.

---

## User Profiles

### Coach (Primary User)

**Joe Cristando** — Solo operator, independent powerlifting and S&C coach

- **Roles:** PL Coach, 1-on-1 Personal Trainer, Remote Coach, Group Coach, Meet Director
- **Athletes:** 31-50, mostly remote with some in-person, across multiple locations
- **Methodology:** Context-dependent — uses every major load prescription method and multiple periodization approaches depending on athlete and phase
- **VBT:** Active practitioner, uses velocity data selectively for specific athletes and phases
- **Competition:** About half the roster competes in USAPL meets
- **Tech comfort:** High — wants a polished, flexible platform, not a dumbed-down one
- **Growth goals:** More clients (in-person + remote), build the Cannoli Gang brand, streamline operations, better athlete results

### Athletes (End Users)

- **Types:** Competitive powerlifters, first-meet athletes, recreational lifters, general fitness clients, masters (40+)
- **Experience:** Wide range from beginners through advanced
- **Tech savvy:** 8/10 — would love a polished app
- **Self-direction:** Mostly good, but some need check-ins
- **Current logging:** Via app (sets/reps/weight)

---

## Priority Stack

Ranked by the coach's stated priorities:

1. **Save time on programming and admin** — Reduce 10-15 hr/week programming burden
2. **Better athlete data** — Fill every data gap identified (strength trends, velocity, volume, compliance, RPE accuracy, bodyweight, injury history)
3. **Better athlete experience** — Mobile-first, 10/10 importance rating
4. **Business growth tools** — Support scaling in-person + remote clients, brand building
5. **VBT integration** — Velocity profiles, preparedness, fatigue tracking, load-velocity curves
6. **Affordable for solo coach** — $150-$300/month flat rate
7. **Competition prep tools** — Meet day warm-up timing, attempt planning, multi-athlete flights
8. **Simplicity** — Powerful but not overwhelming

---

## Feature Requirements

### Must-Haves (11 Non-Negotiable Capabilities)

#### 1. Program Builder / Workout Designer
The core feature. Must support all 6 load prescription methods in a single workout:
- Percentage of 1RM
- RPE (Rate of Perceived Exertion) with ranges (e.g., "RPE 7-8")
- RIR (Reps in Reserve)
- Velocity targets (m/s)
- Autoregulated ranges ("Work up to RPE 8, then -10%")
- Fixed weight / progressive overload

Must support multiple periodization approaches: block, DUP, linear, RPE-based progressive overload. Programs structured as weeks → days → exercises → sets with copy/duplicate capabilities.

**Dealbreaker:** If the platform doesn't provide a flexible approach for the coach's programming style, it's rejected.

#### 2. Athlete Self-Logging
Athletes log sets, reps, weight, RPE, and velocity via a mobile-optimized interface. Shows prescribed workout with previous performance reference. Saves per-set (not just per-session).

#### 3. VBT Device Integration
Store velocity data per set. Generate load-velocity curves, velocity profiles, preparedness assessments, fatigue tracking. Display velocity targets in prescriptions. Manual entry initially, device API integration as follow-up.

#### 4. RPE / RIR Prescription Support
First-class support throughout — not an afterthought. RPE selector with 0.5 increments, RPE reference chart, RPE history tracking, RPE accuracy metrics, RIR auto-conversion (RIR = 10 - RPE).

#### 5. Mobile App for Athletes
Mobile-first design (10/10 importance). 375px viewport optimized. Large tap targets (44px minimum). Athletes view workouts, log training, see progress. Must work well in a gym environment.

#### 6. Progress Analytics and Charts
1RM trend lines per lift over time. Volume load tracking (weekly tonnage). Training compliance rates. RPE distribution and accuracy. Bodyweight trends. Date range selectors. CSV export for Google Sheets flexibility.

#### 7. Remote Program Delivery
Athlete portal with current program, today's workout, calendar view, workout history. Notifications on new program assignment. Coach notifications on workout completion. Magic link authentication (no passwords).

#### 8. Exercise Library with Videos
Searchable database with categories and tags. Video URL embedding (YouTube/Vimeo). Coaching cues per exercise. Pre-seeded with 30+ common powerlifting exercises. Reusable picker component for program builder.

#### 9. Reusable Program Templates
Save any program as a template. Templates preserve structure (weeks, days, exercises, prescription types) but not athlete-specific loads. Template library with search and filter. Create new programs from templates.

#### 10. Client Management / Profiles
Centralized athlete roster with search, filter, and profiles. Profile shows: basic info, current program, training history, bodyweight trend, competition history, injury notes. Quick stats: compliance rate, last workout, estimated maxes.

#### 11. Competition Prep Tools
Meet management with athlete entries and weight classes. Attempt planning (3 attempts per SBD). Warm-up timing calculator (work backward from flight start time). Multi-athlete flight tracking on a single screen. Post-meet results entry. Dream tool: real-time warm-up timing integrated with LiftingCast data.

### Nice-to-Haves (10 Bonus Capabilities)

1. **White-label / branded athlete app** — Athletes see "Cannoli Gang" not a third-party name
2. **Built-in payment and billing** — Flat monthly retainer collection
3. **Session scheduling / booking** — Replace Calendly dependency
4. **Daily readiness / wellness surveys** — Sleep, soreness, stress check-ins
5. **Sell programs / templates** — Digital product revenue stream
6. **Nutrition or macro tracking** — Basic tracking, not a full nutrition platform
7. **Community features** — Leaderboards, group challenges, shared PRs for the Cannoli Gang
8. **Video form check / review** — Athletes upload videos, coach provides feedback
9. **Automated deload / fatigue management** — Platform suggests deloads based on accumulated fatigue
10. **Bodyweight and body composition tracking** — Weight class management for competitors

---

## Technical Architecture

### Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5.9 (strict mode)
- **UI:** React 19, Tailwind CSS 4, Radix UI, CVA
- **Database:** PostgreSQL via Prisma ORM
- **Icons:** lucide-react
- **Content:** react-markdown, remark-gfm, gray-matter

### Data Model (Core Entities)

| Entity | Purpose |
|--------|---------|
| **Coach** | Coach profile and brand info |
| **Athlete** | Athlete profiles linked to coach |
| **Program** | Training programs (individual, template, group) |
| **ProgramAssignment** | Links programs to athletes |
| **Workout** | Individual training sessions within a program |
| **Exercise** | Exercise library entries with videos and cues |
| **WorkoutExercise** | Exercise within a workout with prescription details |
| **SetLog** | Individual set data (reps, weight, RPE, RIR, velocity) |
| **BodyweightLog** | Bodyweight entries over time |
| **CompetitionMeet** | Meet/competition records |
| **MeetEntry** | Athlete entries in a meet with attempts and warm-up plans |

### Key Design Decisions

- **All 6 load prescription methods as explicit typed fields** (not JSON blobs) for queryability
- **SetLog stores RPE, RIR, and velocity as optional fields** — all are first-class
- **Programs are week → day → exercise → set structure** matching how coaches think
- **Templates are programs with `isTemplate=true`** — same structure, no athlete data
- **JSON fields only for truly flexible data** (metadata, warm-up plans, attempt notes)
- **Server components by default**, client components only for interactive UI

### Existing Codebase

The project already has:
- Interview/survey flow that captured the coach's requirements
- Research library with 7 in-depth competitive analysis documents
- Submissions API with PostgreSQL storage
- Component library (Button, Card, Input, Badge, Progress, etc.)
- Markdown rendering pipeline with table of contents

New platform features build on this foundation.

---

## Implementation Plan

### 60 Tasks Across 12 Priority Tiers

| Priority | Area | Tasks | Description |
|----------|------|-------|-------------|
| 1 | Foundation | 9 | Prisma schema: enums, models, relations, migration, seed |
| 2 | Core API | 9 | REST routes for all entities + analytics endpoint |
| 3 | Athlete Management | 4 | Listing, creation, profiles, edit/delete |
| 4 | Exercise Library | 3 | Library page, create form, reusable picker |
| 5 | Program Builder | 9 | The big one: listing, types, builder, prescriptions, duplication, reorder, save, assign |
| 6 | Templates | 3 | Save as template, template listing, create from template |
| 7 | RPE/RIR Components | 2 | RPE selector, reference chart popover |
| 8 | Training Log | 4 | Today's workout, set logging, previous performance, completion summary |
| 9 | Dashboard | 5 | Overview cards, activity feed, needs attention, upcoming meets, nav update |
| 10 | Analytics | 5 | Charting library, analytics page, 1RM/volume charts, compliance/bodyweight, CSV export |
| 11 | VBT Analytics | 3 | Load-velocity chart, velocity profiles, VBT section |
| 12 | Competition Prep | 4 | Meet listing, attempt planning, warm-up timer, multi-athlete view |

Tasks are atomic (one concern each), testable, and independent where possible. Full task details in `IMPLEMENTATION_PLAN.md`.

---

## Success Metrics

### Coach Experience
- Programming time reduced from 10-15 hr/week to under 5 hr/week
- Platform satisfaction above 8/10 (vs. current 6/10 with TeamBuildr)
- All athlete data accessible from one platform (zero app-switching)

### Athlete Experience
- Athletes can view and log workouts on mobile in under 2 minutes
- Training compliance trackable (target: visible adherence rates for all athletes)
- Previous performance always visible as reference during logging

### Business Goals
- Support scaling to 50+ athletes without proportional time increase
- Competition prep manageable for 5+ athletes in same meet
- Platform supports brand identity (Cannoli Gang)

---

## Constraints

- **Solo operator** — UX must not require a team to administer
- **Budget** — $150-$300/month, no per-athlete pricing
- **Mobile-first** — 10/10 importance, all core flows must work at 375px
- **Programming flexibility is a dealbreaker** — Must support all 6 load methods and 4 periodization approaches without workarounds
- **No AI replacing the coach** — Technology should empower coaching decisions, not make them (differentiator vs. Volt's Cortex approach)

---

## Decisions & Scope

1. **LiftingCast Integration** — Out of scope. Meet day warm-up timing will be standalone (manual flight time entry), no LiftingCast API dependency.
2. **VBT Device APIs** — Out of scope for initial build. Manual velocity entry only. Device integrations are a future consideration.
3. **Branding** — This is a custom build for Cannoli Gang, not a white-label or multi-tenant platform. Cannoli Gang branding baked in throughout.
4. **Authentication** — Magic link (email-based) for athletes to start. OAuth added later as a follow-up.
5. **Hosting & Infrastructure** — Deployed on Railway. PostgreSQL on Railway. PWA manifest for "add to home screen" mobile experience. No offline support in initial build.
6. **Multi-tenancy** — Not applicable. Single coach, single brand. No need for org-level abstractions.
