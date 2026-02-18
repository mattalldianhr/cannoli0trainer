# Getting Started with Cannoli Trainer

Welcome to Cannoli Trainer — your all-in-one platform for programming, tracking, and analyzing strength training. No more juggling spreadsheets, WhatsApp, and separate apps. Everything lives in one place.

This guide walks you through the basics: what you'll see when you log in, how to add athletes, build your first program, and start tracking training.

---

## Your Dashboard

When you open Cannoli Trainer, you land on the **Dashboard** — the home base for your coaching practice.

At the top, you'll see four stat cards:

| Card | What It Shows |
|------|---------------|
| **Total Athletes** | How many athletes you're coaching. Click to go to your roster. |
| **Active Programs** | Number of programs currently in use (not counting templates). |
| **Workouts This Week** | Total training sessions across all athletes this week. |
| **Needs Attention** | Athletes who haven't trained in 3+ days. Click to jump to the list. |

Below the stats:

- **Recent Activity** — A feed of training sessions from the last 7 days, grouped by date. Each entry shows the athlete's name, session title, exercises completed, and completion percentage. Click any entry to go to that athlete's profile.
- **Needs Attention** — Athletes who haven't logged a session in 3+ days. Shows their name and how many days since their last session. This is your "check in on these people" list.
- **Upcoming Meets** — Any competitions scheduled in the next 30 days, with date, location, federation, and how many athletes are entered.

Quick action buttons in the top right let you jump straight to **New Program**, **Add Athlete**, or **Analytics**.

---

## Main Navigation

The top navigation bar gives you access to everything:

| Link | What It Does |
|------|--------------|
| **Dashboard** | Home base — stats, activity feed, alerts |
| **Athletes** | Your full athlete roster |
| **Programs** | All programs and templates |
| **Schedule** | Weekly calendar view of all athletes' workouts |
| **Exercises** | Exercise library — browse, search, add custom exercises |
| **Meets** | Competition management |

On mobile, tap the menu icon (three lines) to open the navigation.

You'll also find **Train** and **Analytics** accessible from the dashboard and athlete profiles, even though they're not in the main nav bar.

---

## Step 1: Add Your First Athlete

From the Dashboard, click **Add Athlete** (or go to Athletes → Add Athlete).

Fill in the form:

| Field | Required? | What to Enter |
|-------|-----------|---------------|
| **Name** | Yes | Athlete's full name |
| **Email** | No | For notifications and portal access (when available) |
| **Body Weight** | No | Current weight in kg |
| **Weight Class** | No | Competition weight class (e.g., 83kg, 93kg) |
| **Experience Level** | No | Beginner, Intermediate, or Advanced — affects how the system interprets their training data |
| **Remote** | No | Check if this athlete trains remotely (not in your gym) |
| **Competitor** | No | Check if they compete in powerlifting meets |
| **Federation** | No | Shows when Competitor is checked — IPF, USAPL, etc. |
| **Notes** | No | Anything you want to remember — injuries, goals, preferences |

Click **Save**. Your athlete now appears in the Athletes list and is ready to be assigned a program.

> For the full guide on managing athletes, see [Athletes](athletes.md).

---

## Step 2: Build Your First Program

Go to Programs → **New Program** (or click "New Program" from the Dashboard).

### Name and Setup

Give your program a name (e.g., "Matt - Offseason Hypertrophy") and pick a periodization style:

- **Program Type**: Individual (for a specific athlete), Template (reusable starting point), or Group (for multiple athletes)
- **Periodization**: Block, Linear, DUP (Daily Undulating), RPE-Based, or Hybrid

### Add Structure

1. Click **Add Week** to create Week 1
2. Click **Add Day** inside that week — this creates a training day (e.g., Monday Upper)
3. Click **Add Exercise** inside that day — this opens the exercise picker

### Add Exercises

The exercise picker lets you search by name or filter by category, muscle group, and equipment. Select an exercise to add it to the day.

For each exercise, you'll set:

- **Prescription Type** — How you want to prescribe the load. The six options:
  - **Percentage**: "4x5 @ 80% of 1RM"
  - **RPE**: "3x3 @ RPE 8"
  - **RIR**: "3x8, leave 2 in the tank"
  - **Velocity**: "5x3 @ 0.8 m/s target"
  - **Autoregulated**: "Work up to RPE 9, back off 10%"
  - **Fixed Load**: "3x10 @ 60kg"
- **Sets and Reps** — How many sets, how many reps per set
- **Rest Time** — Seconds between sets (optional)
- **Notes** — Coaching cues like "pause at bottom" or "RPE 6-7, keep it smooth"

> For the full program builder guide including supersets, tempo, templates, and unilateral exercises, see [Program Builder](program-builder.md).
>
> For a breakdown of what each prescription type means, see the [Glossary](glossary.md#prescription-types).

### Save

Click **Save Program** when you're done. You can always come back and edit later.

---

## Step 3: Assign the Program

From the program page (after saving), click **Assign Athletes**.

Select one or more athletes from the list and confirm. The program is now active for those athletes — their workouts will appear on the Schedule and in the Training Log.

---

## Step 4: Track Training

### View the Schedule

Go to **Schedule** to see a weekly calendar of all your athletes' workouts. Each cell shows:

- Whether the session is **not started**, **in progress**, **completed**, or **skipped**
- A completion percentage badge

You can move sessions to different days or skip them if an athlete needs to adjust.

### Log a Workout

Go to **Train** (accessible from the dashboard). Select an athlete and a date to see their assigned workout for that day.

For each exercise, log sets by entering:

- **Weight** (kg)
- **Reps** completed
- **RPE** (if using RPE-based programming)

The system shows the athlete's previous performance on the same exercise for quick reference. Hit **Log Set** after each set — the completion percentage updates automatically.

> For the full training and schedule guide, see [Schedule & Training](schedule-and-training.md).

---

## Step 5: Review Progress

### Athlete Profile

Click any athlete's name to see their profile with three tabs:

- **Info** — Profile details, current program, program history
- **Training** — Recent sessions with completion percentages
- **Analytics** — Strength trends, volume, compliance, RPE data, bodyweight, VBT

### Analytics Dashboard

Go to **Analytics** (from the dashboard or an athlete's profile) for deeper analysis:

- **Strength Trends** — Estimated 1RM over time for any exercise
- **Volume** — Weekly tonnage (weight x reps) with trend arrows
- **Compliance** — What percentage of assigned workouts are getting done
- **RPE Distribution** — Are your athletes training at the right intensity?
- **Bodyweight** — Weight trends over time
- **VBT** — Velocity data if you're using bar speed tracking

You can export analytics to CSV for athlete check-ins or your own records.

> For the full analytics guide with coaching interpretation tips, see [Analytics](analytics.md).

---

## What's Next?

Now that you've got the basics, dive deeper into the features you use most:

- [Program Builder](program-builder.md) — Advanced programming: supersets, tempo, templates, percentage-based training
- [Athletes](athletes.md) — Managing your roster, reading athlete profiles
- [Schedule & Training](schedule-and-training.md) — Weekly calendar, logging workouts, session management
- [Analytics](analytics.md) — Reading charts, interpreting data, export
- [Exercises](exercises.md) — Browsing and adding custom exercises
- [Meets](meets.md) — Competition management, attempt selection, warmup calculator
- [Glossary](glossary.md) — Every term explained: RPE, RIR, e1RM, tonnage, VBT, and more
- [Walkthroughs](walkthroughs.md) — End-to-end scenarios: meet prep, onboarding remote athletes, weekly check-ins
