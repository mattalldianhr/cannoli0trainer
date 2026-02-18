# TeamBuildr API Structure & Data Migration Analysis

## Executive Summary

This document captures the findings from a live monitoring session of TeamBuildr's web application API. TeamBuildr operates a hybrid architecture with two distinct app domains: a legacy jQuery-based server-rendered app (`app.teambuildr.com`) and a modern SPA (`app-v3.teambuildr.com`). The v3 app communicates with a separate REST API at **`https://api.teambuildr.com`** using Bearer token authentication, following the pattern `/accounts/{accountId}/...`. This API has been validated with a successful extraction of ~1.6 MB of workout data for 3 athletes (91 workout dates, 182 API calls, zero errors). Combined with built-in export tools (Raw Data CSV export, user export), we have multiple viable paths for migrating athlete data to our new platform.

### Validated API Extraction (2026-02-17)

A test extraction was successfully completed for 3 athletes:
- **Matt Alldian** (ID: 3534583): 31 prescribed days, 15 completed, 19 exercises, 1,127 reps, 73,134 kg tonnage, 13 PRs
- **Chris Laakko** (ID: 3534582): 30 prescribed days, 7 completed, 15 exercises, 773 reps, 54,374 kg tonnage, 2 PRs
- **Michael Odermatt** (ID: 3534584): 30 prescribed days, 7 completed, 15 exercises, 182 reps, 10,098 kg tonnage, 2 PRs

Test data is stored in `/test-data/` with full schema documentation.

## Architecture Overview

### Dual-Domain Hybrid Architecture

TeamBuildr runs three domains that share authentication:

| Domain | Stack | Role |
|---|---|---|
| `app.teambuildr.com` | jQuery 1.11.1, Bootstrap, jQuery UI, server-rendered PHP | Legacy app handling Calendar, Feed, Maxes/PRs, Journal, Exercises, Goals, Whiteboard, Attendance, Packets & Sheets |
| `app-v3.teambuildr.com` | Modern SPA (React, Redux, Material UI, Emotion) | Newer features: Daily Brief, Workout Entry, Weightroom View, Leaderboard, Evaluations, Planner, Reporting, Calendars, Documents, AMS, Messaging, Settings, Payments |
| **`api.teambuildr.com`** | REST API | Backend API serving the v3 SPA. Bearer token auth via `Authorization` header. |

The legacy app uses PHP endpoints (`/assets/*.php`) with query-string authentication. The v3 SPA makes XHR calls to `api.teambuildr.com` with Bearer token authentication (token sourced from the `accessToken` cookie, 192 chars, JWT format).

### Account Identifiers

From captured API calls:
- **Account ID**: Numeric (e.g., `20731`)
- **User ID**: Numeric (e.g., `3534583` for Matt Alldian)
- API base pattern: `/accounts/{accountId}/users/{userId}/...`

## Captured API Endpoints

### V3 REST API (api.teambuildr.com)

#### Workout Data
| Method | Endpoint | Description |
|---|---|---|
| GET | `/accounts/{id}/users/{userId}/day-based-workouts` | List of all workout days for an athlete |
| GET | `/accounts/{id}/users/{userId}/workouts/overview` | Workout overview/summary for athlete |
| GET | `/accounts/{id}/users/{userId}/workouts/{date}` | Full workout data for a specific date (exercises, sets, reps, loads) |
| GET | `/accounts/{id}/users/{userId}/workouts/{date}/summary` | Session summary (sets completed, total reps, tonnage, duration) |
| GET | `/accounts/{id}/users/{userId}/body-heat-map/{date}` | Body heat map data showing muscle groups worked |

#### Integrations & Imports
| Method | Endpoint | Description |
|---|---|---|
| GET | `/accounts/{id}/integrations/users/{userId}/imports/{date}/summary` | Imported data from wearables/integrations for a date |

#### Account & User Management
| Method | Endpoint | Description |
|---|---|---|
| GET | `/accounts/{id}/users?userType=0` | List all athletes (userType=0 for athletes) |
| GET | `/me` | Current authenticated user profile |
| GET | `/me/features/viewed-features` | Feature flags / viewed features |
| GET | `/me/messages/unread` | Unread message count |
| GET | `/account` | Account details |
| GET | `/accounts/{id}/organization/settings` | Organization-level settings |

#### Content
| Method | Endpoint | Description |
|---|---|---|
| GET | `/category` | Categories (likely exercise or content categories) |
| GET | `/article` | Articles (likely education center content) |

### Legacy PHP Endpoints (app.teambuildr.com)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/assets/cal_data-beta.php` | Calendar workout data (exercises per day for a calendar) |
| GET | `/assets/max_data_beta.php` | Maxes/PRs data for an athlete |
| POST | `/assets/user_upload.php` | User import/upload |
| POST | `/assets/log_action.php` | Logging/auth actions (logout) |

## Complete Navigation Map

### Top-Level Navigation

| Page | Domain | Path | Data Domain |
|---|---|---|---|
| Daily Brief | v3 | `/dashboard` | Athlete compliance, exercises completed per week, questionnaire alerts |
| Feed | legacy | `/feed` | Social feed, posts, comments, fist bumps |
| Calendar | legacy | `/calendar` | Program design, workout prescription per calendar |
| Workout Entry | v3 | `/workouts` | Individual athlete workout logging and session data |
| Weightroom View | v3 | `/weightroom-view` | Live weightroom monitoring |
| Whiteboard | legacy | `/whiteboard` | Daily whiteboard display |
| Maxes/PRs | legacy | `/maxes` | Personal records across Lifts, SAQ+C, Circuits, Health |
| Journal | legacy | `/journal` | Athlete journal entries |
| Leaderboard | v3 | `/leaderboard` | Exercise-based leaderboards |
| Evaluations | v3 | `/evaluations` | Testing protocols and results |

### Coach Tools

| Page | Domain | Path | Data Domain |
|---|---|---|---|
| Manage Users | legacy | `/manage_users` | Athletes, Coaches, Groups, Easy-Join Codes |
| Manage Calendars | v3 | `/calendars` | Calendar/program management |
| The Planner | v3 | `/planner` | Macro periodization planning (Platinum Pro) |
| Exercises | legacy | `/exercises` | Exercise library management |
| Goals | legacy | `/goals` | Athlete goals |
| Documents & Links | v3 | `/documents` | Shared documents |
| Packets & Sheets | legacy | `/printables` | Printable workout sheets |
| Attendance | legacy | `/attendance` | Attendance tracking |
| Reporting | v3 | `/reporting` | 12+ report types |
| Payments | v3 | `/reseller` | Payment management |
| AMS | v3 | `/ams` | Athlete Management System |
| Messaging | v3 | `/messaging` | Coach-athlete messaging |
| Settings | v3 | `/settings` | Account, notifications, SSO |

## Data Model (Observed from UI)

### User Entities

#### Athletes
- First name, last name, email
- Avatar/profile photo
- Assigned groups (multiple)
- Assigned calendar
- Registration status (Active/Archived)
- Gender, phone number (optional)
- Timezone

#### Coaches
- First name, last name, email
- Assigned groups (All or specific)
- Assigned calendars (All or specific)
- Last activity timestamp

#### Groups
- Group name
- Member athletes
- Linked calendar(s)

### Workout & Programming Data

#### Calendar (Program Container)
- Calendar name (e.g., "Joe's Athletes", "Monday Morning Crew", "CMM Punk")
- Two types: Calendar Groups and Athlete Calendars
- Day-based workout structure

#### Workout (Per Day)
- Workout title (defaults to "Untitled Workout")
- Date
- Ordered list of exercises
- Visibility toggle (hidden from athletes option)

#### Exercise Prescription (Per Exercise in Workout)
- Exercise name (from searchable library)
- Exercise type categories: Lift (default), SAQ+C, Circuit, Science, Notes, Warm-Up, More
- Sets (1-10)
- Reps/Time (Reps count, or "A" for AMRAP, "C" for Custom)
- Each Side toggle (left & right)
- Additional Information (free text, 255 char max)
- Workout Grouping (N/A or superset grouping)
- Tempo (exercise tempo notation)
- Rest Time (seconds between sets)
- Recurring toggle
- Load prescription (on/off)
- Percentage-based loading (on/off)
- Tag Select

#### Exercise Options (Booleans)
- Completion Lift (no user input required)
- Body Weight Lift (input reps only)
- Coach Completion (coach inputs data)
- Disable Max Tracking (skip 1RM/PR tracking)
- Force Max/PR Update (override current max)
- Bar Speed (adds m/s input)
- Peak Power
- Track Rep Count
- Track Volume Load

#### Session Data (Athlete Completion)
- Sets completed count
- Total reps
- Tonnage (total volume load)
- Session duration
- Imported data (from wearables)
- New PRs achieved

### Maxes/PRs Data

#### Categories
1. **Lifts** - Traditional strength exercises
2. **SAQ+C** - Speed, Agility, Quickness + Conditioning
3. **Circuits** - Circuit training exercises
4. **Health** - Health metrics

#### Per Exercise Per Athlete
- Current max value (weight in kgs/lbs, or time/distance for SAQ+C)
- Date of current max
- Goal value
- Lock status (can lock a max to prevent auto-updates)

#### PR History Records
- Date
- Result (value achieved)
- Change (delta from previous entry)
- Source: "Workout" (auto-captured) or "Manual" (coach-entered)
- Actions: Set as Max, View Workout, Archive
- Visual: Line chart of values over time

### Evaluations

Pre-built evaluation templates including:
- Beep Test, Bench Skill Ranking, Bench Test Day
- Combine, Deadlift Skill Ranking, Deadlift Test Day
- FMS Test, Movement Assessment, Onboarding
- PT Eval, Squat Skill Ranking, Squat Test Day
- Custom evaluations (e.g., "Test nordic curl evaluation")
- Each has: Name, Last Used date, Date Added

### Reporting Types

12+ report types covering different data dimensions:
1. **Activity** - Activity over past 7 days
2. **Completion Report** - Completion percentage over time (Legacy)
3. **Workout Results** - Detailed workout results for date range
4. **Progress Report** - Progress for selected exercises (Legacy)
5. **Max** - Max chart per athlete per exercise
6. **Questionnaire** - Fatigue state from questionnaire responses
7. **Evaluation Report** - Compare evaluation periods
8. **Comparison Report** - Compare athlete maxes over time
9. **Opt Out/Notes Report** - Opt-out information and notes
10. **Rep & Load Report** - Rep count and volume load over time (Legacy)
11. **Assessment Report** - Strengths/weaknesses by exercise tags (Legacy)
12. **Raw Data** - Download raw workout data as CSV

### The Planner (Platinum Pro Feature)
- Week-based periodization timeline (W1, W2, W3...)
- Training blocks as colored bars spanning weeks
- Program phases mapped to blocks
- Plan view and Record Notes view
- Export PDF capability
- Calendar-scoped (select which calendar to plan for)

### Settings & Integration Points
- Notification categories: Feed (comments, fist bumps, media, mentions), Journal (entries, comments), Wearables (sync), Workout (summary)
- SSO: Google authentication
- Wearable integrations (import data per athlete per day)

## Data Migration Strategy

### Extraction Paths (Ranked by Reliability)

#### Path 1: Raw Data CSV Export (Recommended First Step)
The Reporting page includes a "Raw Data" export that downloads workout data as CSV. This is the safest, most sanctioned way to get bulk workout history.

#### Path 2: V3 REST API Programmatic Access (Validated)
The REST API at `api.teambuildr.com` follows clean patterns and has been validated with a successful extraction:
```
GET /accounts/{accountId}/users?userType=0                                    # List all athletes
GET /accounts/{accountId}/users/{userId}/workouts/overview?dateRangeStart=X&dateRangeEnd=Y  # Calendar overview (~90 day max range)
GET /accounts/{accountId}/users/{userId}/workouts/{date}                      # Full workout detail (exercises, sets, reps, weights)
GET /accounts/{accountId}/users/{userId}/workouts/{date}/summary              # Session summary (tonnage, reps, duration, PRs)
```
Auth: `Authorization: Bearer {accessToken}` header. Token is a JWT from the `accessToken` cookie.
The overview endpoint has a **120-day max range** per call. The app itself paginates using 70-day sliding windows. For full history, walk backward in 90-day windows until no more data is returned. The `/workouts/{date}` detail endpoint has **no date limit** — any single date works.
Tested with 182 API calls at 5 concurrent with zero errors.

#### Path 3: Legacy PHP Endpoints
For data only available in the legacy app (maxes/PRs, journal):
```
GET /assets/max_data_beta.php  (with auth params)
GET /assets/cal_data-beta.php  (with auth params)
```

#### Path 4: Manage Users Export
The legacy app has an "Export Data" tool under Manage Users that may provide user rosters.

### Data Categories to Extract

| Category | Priority | Source | Notes |
|---|---|---|---|
| User roster (athletes + coaches) | P0 | Manage Users / Export | Names, emails, groups |
| Exercise library | P0 | Exercises page / Calendar data | Custom exercise names and categories |
| Workout history | P0 | Raw Data export + V3 API | Prescribed vs completed per athlete per day |
| Maxes/PRs | P0 | Legacy max_data endpoint | Current maxes + full history per exercise |
| Groups/calendars | P1 | Manage Users + Manage Calendars | Group structure and calendar assignments |
| Evaluation results | P1 | Evaluations API | Test results and evaluation history |
| Session metrics | P1 | V3 workouts API (summary) | Tonnage, reps, duration per session |
| Journal entries | P2 | Legacy journal page | Athlete notes and coach comments |
| Body heat map data | P2 | V3 body-heat-map endpoint | Muscle group tracking |
| Wearable import data | P2 | V3 integrations endpoint | External device data |
| Feed/social data | P3 | Legacy feed page | Posts, comments, fist bumps |
| Documents/links | P3 | V3 documents endpoint | Shared files |

## Test Data Extraction Plan

### Target Athletes for Beta Migration
1. **Matt Alldian** (User ID: 3534583)
2. **Chris Laakko** (to be identified)
3. **Michael Odermatt** (to be identified)

### Extraction Steps
1. Use Raw Data CSV export from Reporting for bulk workout history
2. Use V3 API to pull per-athlete workout data, session summaries, and body heat maps
3. Use legacy max_data endpoint to pull complete PR history with dates and sources
4. Export user profiles from Manage Users
5. Capture exercise library from calendar/workout data
6. Store as structured JSON/CSV for import into new platform

### Data Mapping Considerations
- TeamBuildr uses numeric IDs for accounts, users, exercises
- Dates are in YYYY-MM-DD format in the API
- Weights can be in kgs or lbs (per account/user setting)
- Exercise names are free-text strings (no standardized IDs across accounts)
- Max records track source (Workout vs Manual) which we should preserve
- Session duration and tonnage are derived metrics we may want to recalculate
