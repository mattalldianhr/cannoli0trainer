# Athlete Features Audit — Research Review

## Purpose

Systematic review of all research documents, PRD, and existing specs to identify athlete-facing features that were discovered in research but never made it into specifications or the implementation plan. The project has focused heavily on the coach experience (program builder, dashboard, analytics); this audit surfaces gaps in the athlete experience.

---

## Source: TeamBuildr Mobile Apps Comprehensive (`summaries/teambuildr-mobile-apps-comprehensive.md`)

### Features Found

- **Athlete video recording for coach review**: Athletes capture form videos from within the app for coach feedback — Status: **Not in spec** (PRD lists "Video form check / review" as nice-to-have #8 but no spec exists)
- **Exercise instructional videos during workout**: Athletes access demonstration videos inline while viewing their workout — Status: **Partially covered** (Spec 05 has exercise library with video URLs, but no spec describes how athletes VIEW these videos inline during training)
- **1RM progress visualization for athletes**: Athletes see linear graphs tracking their one-rep max improvements over time — Status: **Not in spec for athlete view** (Spec 07 analytics is coach-only; athletes don't have access to their own analytics)
- **Feed posting / social features**: Athletes share personal records, media uploads, and team announcements — Status: **Not in spec** (PRD nice-to-have #7 mentions community features but no spec)
- **Leaderboards**: Dynamic leaderboards showing performance rankings among athletes — Status: **Not in spec** (PRD nice-to-have #7 mentions leaderboards but no spec)
- **Private messaging (coach-athlete)**: Push-enabled messaging for individual communication — Status: **Not in spec** (coach uses WhatsApp; no in-app messaging specced anywhere)
- **Private messaging (athlete-athlete)**: Peer messaging for team community — Status: **Not in spec**
- **Offline workout access**: Athletes view and log workouts without internet connectivity — Status: **Partially covered** (Spec 06 lists offline queueing as a stretch goal; Spec 10 explicitly defers offline support)
- **Wearable device integration (athlete side)**: Athletes connect Apple Watch/Garmin/Whoop and sync health data — Status: **Not in spec** (no wearable integration anywhere in specs)
- **Athlete bodyweight logging from athlete side**: Athletes self-log bodyweight — Status: **Not in spec for athlete view** (BodyweightLog model exists in schema, but no athlete-facing UI to enter it)
- **Custom app branding on home screen**: Athletes see branded app icon — Status: **Partially covered** (Spec 10 has PWA manifest with Cannoli branding)
- **Push notifications**: Real-time push for program updates, messages — Status: **Not in spec** (Spec 10 uses email notifications only; push notifications explicitly deferred)

---

## Source: TeamBuildr Comprehensive Analysis (`summaries/teambuildr-comprehensive-analysis.md`)

### Features Found

- **Athlete report cards**: Summary reports of individual athlete progress — Status: **Not in spec** (no exportable/shareable athlete progress summary)
- **Attendance tracking**: Coach tracks which athletes showed up — Status: **Not in spec** (compliance rate in Spec 07 measures workout completion, not physical attendance)
- **Exercise video demonstrations for lesser-known movements**: Robust video library — Status: **Partially covered** (Spec 05 supports video URL embedding but limited to 30+ pre-seeded exercises per PRD)
- **Athlete empowerment through visible progress**: Transparent progress tracking visible to athletes — Status: **Not in spec for athlete view** (all analytics are coach-side only)

---

## Source: TeamBuildr Competitive Landscape Analysis (`summaries/teambuildr-competitive-landscape-analysis.md`)

### Features Found

- **Athlete video submission for coach feedback**: Unique to TeamBuildr vs. TrainHeroic; athletes film movements for coach review — Status: **Not in spec** (PRD nice-to-have only)
- **Exercise substitution for injured athletes**: Athletes can swap exercises when injured or lacking equipment — Status: **Not in spec** (programs are coach-authored; no athlete modification capability specced)
- **Customizable reminders for athletes**: Automated nudges to train — Status: **Not in spec** (no reminder/notification system beyond program assignment emails)
- **Smooth, user-friendly athlete app**: Praised as key differentiator — Status: **Partially covered** (Spec 10 describes mobile-first athlete portal but limited to 4 pages: dashboard, train, calendar, history)

---

## Source: TeamBuildr Comprehensive Platform Analysis (`summaries/teambuildr-comprehensive-platform-analysis.md`)

### Features Found

- **Team Feed social system**: Athletes post PRs, comment on posts, share announcements — Status: **Not in spec**
- **Athlete-to-athlete commenting**: Community engagement between athletes — Status: **Not in spec**
- **Coach announcements via mobile**: Broadcast messages to all athletes — Status: **Not in spec**
- **Leaderboards for motivation**: Competitive rankings across lifts — Status: **Not in spec**
- **Pain & injury tracking (athlete-initiated)**: Athletes complete daily check-ins logging pain location, severity — Status: **Not in spec** (injury notes exist on athlete profile but are coach-edited, not athlete-reported)
- **Habit tracking**: Athletes track daily habits (nutrition, sleep, recovery behaviors) — Status: **Not in spec** (PRD nice-to-have #4 mentions wellness surveys but no spec)
- **Daily readiness/wellness questionnaires (athlete-facing)**: Athletes complete wellness surveys on mobile — Status: **Not in spec** (PRD nice-to-have #4; no spec exists)
- **Class booking via athlete app**: Athletes book sessions — Status: **Not applicable** (OS module feature; out of scope for solo coach)
- **Remote video evaluation with coach feedback loop**: Coach reviews athlete video, provides written feedback visible in app — Status: **Not in spec**

---

## Source: TeamBuildr Strength Platform Analysis (`summaries/teambuildr-strength-platform-comprehensive-analysis.md`)

### Features Found

- **1RM tracking visible to athletes on mobile**: Athletes see current 1RM, goal 1RM, and progress on their phone — Status: **Not in spec for athlete view** (all 1RM data is coach analytics)
- **Goals and standards visible to athletes**: Athletes see their targets and how they compare to benchmarks — Status: **Not in spec** (no goal-setting system for athletes)
- **Team Feed with PR posting**: Athletes announce personal records in a social feed — Status: **Not in spec**
- **Video recording directly from mobile camera**: Camera integration for form checks — Status: **Not in spec**
- **Personal records and achievement history**: Athletes access their PR history — Status: **Not in spec for athlete view** (SetLog data exists but athlete portal has no PR view)
- **Wearable data visible to athletes**: Heart rate, sleep, recovery data on athlete profile — Status: **Not in spec**
- **Custom app icon branding**: White-label mobile experience — Status: **Partially covered** (PWA manifest in Spec 10)

---

## Source: Competitor Deep Dive (`summaries/competitor-deep-dive.md`)

### Features Found

#### From TrueCoach (best-in-class 1:1 athlete experience)
- **In-app real-time messaging with rich media (GIFs, photos, videos)**: Coach-athlete communication within the app — Status: **Not in spec**
- **Habit tracking (custom daily/weekly/monthly habits)**: Coach creates habits, athletes track completion — Status: **Not in spec**
- **MyFitnessPal integration for nutrition**: Athletes log nutrition, coach sees data — Status: **Not in spec** (PRD nice-to-have #6 mentions basic macro tracking)
- **Wearable integration (Apple Health, Garmin, Whoop, Oura)**: Athletes sync wearable data — Status: **Not in spec**
- **Client subscription/payment within app**: Athletes manage their billing — Status: **Not in spec** (PRD nice-to-have #2 mentions payments but no spec)
- **Progress visualization on athlete mobile**: Graphical progress visible to athletes — Status: **Not in spec for athlete view**

#### From TrainHeroic
- **Free athlete workout tracker**: Athletes can track independently — Status: **Not applicable** (Cannoli is a coaching platform, not a standalone tracker)
- **Readiness insights for athletes**: Athletes see their recovery/mood data — Status: **Not in spec**
- **Program marketplace**: Athletes browse and buy programs — Status: **Not in spec** (PRD nice-to-have #5 mentions selling templates)

#### From BridgeAthletic
- **Flexible "playlist" scheduling**: Programs not tied to rigid calendar; athletes can do workouts in flexible order — Status: **Not in spec** (Spec 13 scheduling is calendar-based only)
- **Real-time video/image communication**: Within-app media exchange — Status: **Not in spec**
- **1,200+ HD exercise video library**: Large video library during workout — Status: **Partially covered** (30+ pre-seeded, extensible by coach)
- **Bodyweight, sleep, nutrition, hydration tracking for athletes**: Multi-dimensional wellness logging — Status: **Not in spec** (only bodyweight model exists)

#### From Volt Athletics
- **Smart Sets with real-time RPE adjustment**: Load automatically adjusts set-by-set based on athlete feedback — Status: **Partially covered** (RPE logging exists in Spec 12, but no auto-adjustment of load based on athlete feedback during session)
- **Equipment filter**: Athletes filter exercises by available equipment — Status: **Not in spec**
- **No-testing required**: AI adjusts without max testing — Status: **Not applicable** (Cannoli is coach-driven, not AI-driven)

#### From CoachMePlus
- **Daily wellness questionnaires on athlete mobile**: Custom surveys for sleep, fatigue, stress — Status: **Not in spec**
- **Wearable data aggregation from 60+ devices**: Centralized health data — Status: **Not in spec**
- **Nutrition and hydration monitoring**: Multi-metric wellness — Status: **Not in spec**

#### From PLT4M
- **Student/athlete progress visualization as engagement driver**: Showing athletes their progress boosts motivation — Status: **Not in spec for athlete view**

---

## Source: Cannoli Gang Trainer Profile (`summaries/cannoli-gang-trainer-profile.md`)

### Features Found (from Joe's business analysis)

- **Community features for "Cannoli Gang" brand**: Leaderboards, group challenges, shared wins for the community — Status: **Not in spec** (identified as Tier 4 priority in trainer profile)
- **Exercise video library with movement demos attached to programs**: Athletes see demos during workout — Status: **Partially covered** (exercise library exists but athlete-side inline video playback not specced)
- **Injury/rehab tracking**: Track rehab protocols, pain scores, return-to-training progressions — Status: **Not in spec** (injury notes are free-text on athlete profile, not structured)
- **Branded client-facing app**: Athletes see "Cannoli Gang" branding — Status: **Partially covered** (PWA manifest)
- **Scheduling integration / booking**: Athletes book sessions — Status: **Not in spec** (PRD nice-to-have #3; no spec)
- **Content delivery to athletes**: Coach attaches educational content (videos, articles, cues) to exercises — Status: **Partially covered** (exercise coaching cues exist but no general content delivery system)

---

## Source: PRD (`PRD.md`)

### PRD Promises vs. Spec Coverage

| PRD Feature | Category | Spec Status |
|---|---|---|
| Athletes log sets, reps, weight, RPE, velocity via mobile | Must-have #2 | **In spec** (Spec 06) |
| Mobile app for athletes (10/10 importance) | Must-have #5 | **In spec** (Spec 10) |
| Remote program delivery with athlete portal | Must-have #7 | **In spec** (Spec 10) |
| Exercise library with videos | Must-have #8 | **In spec** (Spec 05) |
| Athletes see previous performance as reference | Must-have (within #2) | **In spec** (Spec 06) |
| White-label / branded athlete app | Nice-to-have #1 | **Partially covered** (PWA manifest only) |
| Built-in payment and billing | Nice-to-have #2 | **Not in spec** |
| Session scheduling / booking | Nice-to-have #3 | **Not in spec** |
| Daily readiness / wellness surveys | Nice-to-have #4 | **Not in spec** |
| Sell programs / templates | Nice-to-have #5 | **Not in spec** |
| Nutrition or macro tracking | Nice-to-have #6 | **Not in spec** |
| Community features (leaderboards, group challenges, shared PRs) | Nice-to-have #7 | **Not in spec** |
| Video form check / review | Nice-to-have #8 | **Not in spec** |
| Automated deload / fatigue management | Nice-to-have #9 | **Not in spec** |
| Bodyweight and body composition tracking | Nice-to-have #10 | **Partially covered** (model exists, no athlete UI) |
| Athlete tech savvy: 8/10, would love a polished app | User profile | **Partially covered** |
| Athletes view workouts, log training, see progress | Must-have #5 | **"See progress" NOT in spec for athlete view** |

---

## Source: Current Specs — What Athletes CAN Do Today

Based on specs 06 and 10, here is the complete athlete experience as currently specced:

1. **Login via magic link** (Spec 10)
2. **View today's workout** (Spec 10 + Spec 06)
3. **Log sets with reps, weight, RPE, velocity** (Spec 06)
4. **See previous performance reference** (Spec 06)
5. **View workout calendar** (Spec 10)
6. **View workout history** (Spec 10)
7. **Leave notes on workouts** (Spec 10)
8. **Receive email when new program assigned** (Spec 10)
9. **Add to home screen via PWA** (Spec 10)

That is the **entirety** of the athlete experience. Everything else is coach-only.

---

## Cross-Cutting Gaps

These features appear across multiple research documents but are completely absent from any spec:

### 1. Athlete Progress Visibility (Critical Gap)
**Appears in:** Mobile apps research, comprehensive analysis, strength platform analysis, competitor deep dive (all competitors), PRD (must-have #5 says "see progress"), trainer profile
**Description:** Athletes cannot see ANY of their own analytics, progress charts, 1RM trends, or performance data. All analytics (Spec 07) are coach-only. The PRD explicitly states the mobile app must let athletes "view workouts, log training, see progress" but the "see progress" part was never specced for the athlete portal.
**Impact:** This is arguably the most critical gap. Every competitor offers athletes visibility into their own progress. The PRD explicitly requires it.

### 2. In-App Messaging / Coach-Athlete Communication (Critical Gap)
**Appears in:** Mobile apps research (private messaging), platform analysis (messaging system), competitor deep dive (TrueCoach messaging, BridgeAthletic communication), trainer profile (currently uses WhatsApp)
**Description:** No messaging system exists in any spec. The coach currently uses WhatsApp, which the PRD identifies as a core problem ("constant app-switching between TeamBuildr, WhatsApp, spreadsheets"). Yet no spec addresses replacing WhatsApp with in-app messaging.
**Impact:** Without messaging, athletes and coach still rely on external tools. This directly contradicts the PRD goal of "zero app-switching."

### 3. Athlete Bodyweight Self-Logging (Significant Gap)
**Appears in:** PRD nice-to-have #10, trainer profile (Tier 2 priority), competitor deep dive (BridgeAthletic, CoachMePlus), platform analysis (habit tracking)
**Description:** The `BodyweightLog` model exists in the schema (Spec 01), and bodyweight trends appear in coach analytics (Spec 07), but there is no athlete-facing UI for athletes to log their own bodyweight. For competitive powerlifters managing weight classes, this is essential.
**Impact:** High for the target user base (competitive powerlifters needing weight class management).

### 4. Video Form Check / Review System (Significant Gap)
**Appears in:** Mobile apps research (video recording + coach review), comprehensive analysis (unique differentiator vs TrainHeroic), strength platform analysis (remote coaching via video), competitor deep dive (TrueCoach messaging with video), PRD nice-to-have #8, trainer profile
**Description:** Athletes filming themselves and sending video to coach for feedback appears in almost every research document as a key feature. It's listed as a TeamBuildr differentiator vs. competitors. Yet it has no spec. The PRD lists it as nice-to-have #8 but the coach's target athletes are "mostly remote" — video form checks are essential for remote coaching quality.
**Impact:** High for remote coaching (majority of roster).

### 5. Daily Readiness / Wellness Surveys (Moderate Gap)
**Appears in:** Platform analysis (Load Monitoring with wellness questionnaires), strength platform analysis (questionnaire integration), competitor deep dive (CoachMePlus wellness, BridgeAthletic wellness tracking), PRD nice-to-have #4
**Description:** Athletes completing daily readiness surveys (sleep, stress, soreness, fatigue) on their mobile app. No spec exists. Every major competitor offers some form of wellness check-in.
**Impact:** Moderate. Would enhance coaching quality for fatigue management.

### 6. Athlete Notifications & Reminders (Moderate Gap)
**Appears in:** Mobile apps research (push notifications), competitive landscape (customizable reminders), PRD (email notifications only in Spec 10)
**Description:** Only email notifications are specced (program assignment, workout completion). No push notifications, no training reminders, no nudges for athletes who haven't logged. Push notifications are explicitly deferred in Spec 10.
**Impact:** Moderate. Push notifications are table stakes for mobile apps.

### 7. Exercise Video Playback During Workout (Minor Gap)
**Appears in:** Mobile apps research (video integration during workout), strength platform analysis (700 exercises with video tutorials inline), competitor deep dive (all competitors offer inline video)
**Description:** Spec 05 has an exercise library with video URLs. Spec 06 (training log) does not mention showing exercise videos inline during the workout. Athletes should be able to tap an exercise and see a demo video while training.
**Impact:** Low-moderate. Important for newer athletes; experienced powerlifters may not need it.

### 8. Athlete Profile Self-Management (Minor Gap)
**Appears in:** Spec 10 deferred features list ("Athlete profile editing — photo, display name, preferences")
**Description:** Athletes cannot update their own profile information. All profile data is coach-managed via Spec 03.
**Impact:** Low. Acceptable for a solo-coach platform where the coach manages everything.

---

## Recommendations

### New Specs Needed

1. **Spec 14: Athlete Progress Dashboard** (HIGH PRIORITY)
   - Athlete-facing analytics accessible from `/athlete/progress`
   - Shows: 1RM trends per lift, volume trends, training streak/compliance, bodyweight trend, personal records list
   - Reuse Spec 07 chart components but filter to authenticated athlete
   - Add "Progress" tab to athlete bottom navigation (5th tab)
   - This directly fulfills the PRD must-have requirement for athletes to "see progress"

2. **Spec 15: Coach-Athlete Messaging** (HIGH PRIORITY)
   - In-app messaging between coach and individual athletes
   - Text + image/video support (for form check videos)
   - Message thread per athlete, accessible from both coach and athlete views
   - Push/email notification on new message
   - Replaces WhatsApp dependency (core PRD goal: zero app-switching)

3. **Spec 16: Athlete Bodyweight & Wellness Logging** (MEDIUM PRIORITY)
   - Athlete-facing UI to log bodyweight (quick entry from athlete dashboard)
   - Optional daily wellness check-in (sleep quality, soreness, stress — 3-5 quick taps)
   - Data feeds into existing coach analytics (bodyweight chart, future load monitoring)
   - Weight class tracking for competitors (current weight vs. weight class)

4. **Spec 17: Video Form Check System** (MEDIUM PRIORITY)
   - Athletes record or upload video from within the app
   - Video attached to a specific exercise within a workout session
   - Coach receives notification, reviews video, leaves feedback comment
   - Feedback visible to athlete on that workout session
   - Replaces WhatsApp video sharing workflow

### Spec Updates Needed

1. **Spec 10 (Remote Program Delivery)**: Add 5th tab "Progress" to athlete bottom navigation. Currently has 4 tabs: Dashboard, Train, Calendar, History.

2. **Spec 06 (Athlete Training Log)**: Add inline exercise video playback — when athlete taps an exercise name during a workout, show the exercise video from the library (Spec 05 data).

3. **Spec 07 (Progress Analytics)**: Explicitly note that the "Per-Athlete Analytics" deferred feature should also be accessible to athletes themselves via the athlete portal, not just coaches.

4. **Spec 03 (Athlete Management)**: Add structured injury tracking fields (beyond free-text notes) to support athlete-reported pain/soreness data if wellness logging is implemented.

### Estimated Additional Tasks

| Area | Est. Tasks | Priority |
|---|---|---|
| Athlete Progress Dashboard (new spec) | 5-7 tasks | High — fulfills PRD must-have |
| Coach-Athlete Messaging (new spec) | 6-8 tasks | High — eliminates WhatsApp dependency |
| Athlete Bodyweight/Wellness Logging (new spec) | 3-4 tasks | Medium — enables weight class management |
| Video Form Check System (new spec) | 4-6 tasks | Medium — critical for remote coaching |
| Inline exercise video in training log | 1 task | Low — enhancement to Spec 06 |
| Athlete navigation update (5th tab) | 1 task | Low — UI change in Spec 10 |
| **Total estimated new tasks** | **20-27 tasks** | |

---

## Summary

The current spec set provides athletes with a functional but minimal experience: log in, see workout, log sets, view history. This covers the bare minimum for training delivery but misses significant opportunities identified across all research:

- **Athletes are blind to their own progress** — the single biggest gap
- **Coach-athlete communication requires WhatsApp** — directly contradicts PRD goals
- **Remote athletes can't send form check videos** — critical for a mostly-remote roster
- **Competitive powerlifters can't log bodyweight** — essential for weight class management
- **No social/community features** — misses the "Cannoli Gang" brand opportunity

The most urgent additions are the Athlete Progress Dashboard and Coach-Athlete Messaging, as these fulfill explicit PRD requirements that were dropped during the spec writing phase.
