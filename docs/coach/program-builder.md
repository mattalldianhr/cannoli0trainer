# Program Builder

The program builder is where you design training programs for your athletes. It handles everything from a simple 3-day strength block to a 16-week periodized peaking cycle, and it supports six different ways to prescribe load intensity -- the same methods you already use on paper or in spreadsheets.

---

## Overview

A **program** in Cannoli Trainer has a simple hierarchy:

```
Program
  └── Week 1
  │     ├── Day 1 (e.g. "Upper Strength")
  │     │     ├── Bench Press — 4x5 @ 80%
  │     │     ├── Barbell Row — 3x8 @ RPE 7
  │     │     └── DB Lateral Raise — 3x12 @ 2 RIR
  │     └── Day 2 (e.g. "Lower Strength")
  │           ├── Back Squat — 5x3 @ 82.5%
  │           └── Romanian Deadlift — 3x8 @ 185 lbs
  └── Week 2
        └── ...
```

**Weeks** contain **days**, days contain **exercises**, and each exercise has its own prescription (sets, reps, intensity method, rest periods, tempo, and notes). You can mix prescription types freely within the same day -- a percentage-based squat, an RPE-based bench press, and a velocity-targeted deadlift can all live in the same session.

Once a program is built, you assign it to one or more athletes and they see it in their training log.

---

## Creating a Program

To start a new program, go to the **Programs** page and click **New Program**. You will see a form with these fields:

### Name

Give the program a descriptive name your athletes will recognize. Examples:

- "Off-Season Hypertrophy Block (8 Weeks)"
- "Meet Prep -- Peaking Phase"
- "GPP Phase 1"

### Description

Optional notes about the program goals, intended population, or general instructions. This is a good place to write things like "Focus on building work capacity. Keep RPEs moderate (6-7) for the first 4 weeks."

### Program Type

- **Individual** -- Built for a specific athlete or small group. This is the most common choice.
- **Template** -- A reusable starting point (more on this in [Templates](#templates)).
- **Group** -- Designed for multiple athletes running the same program simultaneously.

### Periodization Type

Select the periodization approach that matches how you have structured the program. This is a label to help you organize your programs -- it does not change how the builder works.

- **Linear** -- Progressive overload in a straight line. Intensity increases week to week while volume may decrease. Classic example: 5x5 at 70%, then 75%, then 80%, then 85%.
- **DUP (Daily Undulating Periodization)** -- Intensity and volume vary from session to session within the same week. Monday might be heavy triples, Wednesday moderate sets of 6, Friday light sets of 10.
- **Block** -- Training is divided into distinct phases (accumulation, transmutation, realization). Each block emphasizes a different quality. Common in powerlifting meet prep.
- **RPE-Based** -- Autoregulated programming where the athlete adjusts loads based on daily readiness using RPE or RIR scales.
- **Hybrid** -- Any combination of the above methods.

---

## Program Structure

After filling in the program details, you build out the week-by-week structure.

### Adding Weeks

Click **Add Week** to create a new week. Weeks are numbered automatically (Week 1, Week 2, etc.). Each week starts empty -- you then add training days to it.

### Adding Days to a Week

Inside each week card, click **+ Day** to add a training day. Days are numbered automatically (Day 1, Day 2, etc.) and you can rename them to something meaningful like "Upper Strength", "Lower Hypertrophy", or "Competition Lifts".

To rename a day, click the day name text in the header and type the new name.

### Collapsing and Expanding

Each week and day has a collapse toggle (the arrow icon on the left side of the header). Use this to keep your view manageable when working on long programs:

- Click the arrow on a **week** to collapse all its days.
- Click the arrow on a **day** to collapse its exercise list.

When collapsed, the header still shows a summary badge with the exercise count, so you can see at a glance how much content each section has.

### Duplicating Weeks

Click **Duplicate** on any week header to copy that entire week -- all days, exercises, prescriptions, notes, and settings are cloned into a new week appended at the end. This is the fastest way to build a multi-week block where each week is similar but with small intensity progressions.

Typical workflow for a 4-week linear block:

1. Build Week 1 with all your exercises and prescriptions.
2. Duplicate it three times to create Weeks 2-4.
3. Go into each duplicated week and adjust the percentages or RPE targets upward.

### Reordering

Weeks are kept in sequential order (Week 1, 2, 3...). If you remove a week from the middle, the remaining weeks are renumbered automatically. The same applies to days within a week and exercises within a day.

For exercises, use the **up/down arrow buttons** on each exercise row to move it higher or lower in the order. These arrows appear on the left side of the exercise row.

---

## Adding Exercises

### The Exercise Picker

Click **+ Exercise** on any day to open the exercise picker dialog. This is a searchable, filterable list of every exercise in your library.

**Searching**: Type in the search bar at the top to find exercises by name. Typing "squat" shows Back Squat, Front Squat, Safety Bar Squat, and other variations.

**Category filters**: Filter by training category using the pill buttons:

- All, Strength, Powerlifting, Olympic, Strongman, Plyometrics, Stretching, Cardio

**Tag filters**: Further narrow results by exercise type:

- **Competition Lifts** -- The squat, bench, and deadlift (or snatch and clean & jerk for weightlifting).
- **Variations** -- Close variations of competition lifts (pause squat, close-grip bench, deficit deadlift).
- **Accessory** -- Supporting exercises (rows, presses, curls, core work).
- **GPP** -- General physical preparedness work (sled pushes, carries, conditioning).

Each exercise in the list shows its name, category, equipment needed, and primary muscles worked. Exercises tagged as competition lifts or variations get a colored badge for quick identification.

### What Happens When You Add One

Click an exercise to add it to the day. It appears at the bottom of the exercise list with a default prescription (Fixed Weight, 3 sets of 5 reps). From there you can change the prescription type, set the intensity, add tempo, rest periods, and notes.

The picker closes after each selection. To add multiple exercises, click **+ Exercise** again.

---

## Prescription Types

Every exercise needs a prescription -- the "how much" that tells the athlete what to do. Cannoli Trainer supports six prescription methods. You can mix and match them freely within the same day.

To change an exercise's prescription type, click the **gear icon** on the exercise row to expand the editor, then select a type from the **Prescription Type** dropdown.

For detailed definitions and RPE/RIR scale tables, [see Glossary](glossary.md#prescription-types).

### 1. Percentage of 1RM (% of 1RM)

Prescribe load as a percentage of the athlete's one-rep max. The system needs a recorded 1RM for the exercise to calculate actual working weight.

**What you enter**: Sets, reps, and a percentage value.

**Example**: Back Squat -- 4 sets of 3 reps at 82.5%. If the athlete's 1RM is 500 lbs, their working weight is 412.5 lbs.

**Best for**: Structured peaking programs, percentage-based templates, competition prep. This is the most common method in powerlifting meet prep.

### 2. RPE (Rate of Perceived Exertion)

Prescribe intensity using the RPE scale (1-10). You can set a single value or a range.

**What you enter**: Sets, reps, RPE value (and optionally an RPE max for a range), and an optional load suggestion.

**Example**: Bench Press -- 3 sets of 5 at RPE 7-8. The athlete selects a weight where they finish each set feeling like they could do 2-3 more reps.

**Best for**: Autoregulated training, accommodating daily readiness variation, intermediate-to-advanced athletes who can reliably self-assess effort.

The builder shows a plain-language hint for each RPE value:
- RPE 10: max effort, no reps left
- RPE 9: could do 1 more
- RPE 8: could do 2 more
- RPE 7: could do 3 more

### 3. RIR (Reps in Reserve)

Prescribe intensity by how many reps the athlete should leave "in the tank." RIR is the inverse of RPE (2 RIR = RPE 8).

**What you enter**: Sets, reps, RIR value, and an optional load suggestion.

**Example**: Dumbbell Romanian Deadlift -- 3 sets of 10 at 2 RIR. The athlete picks a weight where they could do about 12 total reps but stops at 10.

**Best for**: Hypertrophy blocks, athletes who think better in terms of "reps left" than RPE numbers.

### 4. Velocity

Prescribe a target bar speed in meters per second. Requires velocity-measuring equipment (GymAware, PUSH band, or similar).

**What you enter**: Sets, reps, velocity target (m/s), and an optional load suggestion.

**Example**: Deadlift -- 5 sets of 2 at 0.75 m/s. The athlete loads to a weight that moves at the target speed and stops the set if bar speed drops below.

The builder shows a velocity zone indicator:
- 1.0+ m/s: Speed/power zone
- 0.75-1.0 m/s: Strength-speed zone
- 0.5-0.75 m/s: Strength zone
- Below 0.5 m/s: Max strength/grinding zone

**Best for**: Power development, velocity-based training, monitoring fatigue within a session.

### 5. Autoregulated

A flexible prescription for "work up to" protocols with optional backoff sets. This covers complex autoregulation schemes that do not fit neatly into a single RPE or percentage.

**What you enter**: Sets, reps, target RPE (with optional RPE range), backoff percentage, backoff sets, and free-text instructions.

**Example**: Competition Squat -- Work up to a top single at RPE 8, then -10% for 3 sets of 3. The athlete ramps to their RPE 8 single, drops the weight 10%, and does back-off volume.

The builder generates a summary like: "Work up to RPE 8, -10% x3"

**Best for**: Top-set-plus-backoff schemes, daily max work, flexible competition prep.

### 6. Fixed Weight

Prescribe a specific weight in pounds or kilograms. The simplest method -- just tell the athlete what weight to use.

**What you enter**: Sets, reps, load value, and unit (lbs or kg).

**Example**: Barbell Curl -- 3 sets of 12 at 65 lbs.

**Best for**: Accessory work, rehabilitation exercises, warm-up protocols, beginner athletes who need explicit weights.

---

## Supersets

Group exercises into supersets using letter-based grouping. Exercises with the same letter group are performed back to back with minimal rest between them.

Superset groups use an alphanumeric naming convention:

- **A1 / A2** -- First superset pair (e.g., Bench Press + Barbell Row)
- **B1 / B2** -- Second superset pair (e.g., DB Incline Press + Face Pulls)
- **C1 / C2 / C3** -- A tri-set (three exercises performed in sequence)

Each superset group gets a distinct color for visual clarity, so you can quickly see which exercises belong together when scanning a day's layout.

**Example**: A typical upper-body session might look like:

```
A1  Bench Press       — 4x5 @ 80%        [blue]
A2  Barbell Row       — 4x5 @ RPE 7      [blue]
B1  DB Incline Press  — 3x10 @ 2 RIR     [green]
B2  Face Pulls        — 3x15 @ 25 lbs    [green]
C1  Tricep Pushdown   — 3x12 @ 50 lbs    [orange]
C2  Hammer Curl       — 3x12 @ 35 lbs    [orange]
```

---

## Tempo Notation

Tempo controls how fast the athlete moves through each phase of a rep. Cannoli Trainer uses the standard **4-digit tempo notation**: each digit represents seconds spent in one phase of the lift.

The format is **E-P1-C-P2** (four numbers separated by hyphens):

| Position | Phase | Description |
|----------|-------|-------------|
| 1st digit | **Eccentric** | The lowering or lengthening phase |
| 2nd digit | **Pause 1** | Pause at the bottom/stretch position |
| 3rd digit | **Concentric** | The lifting or shortening phase |
| 4th digit | **Pause 2** | Pause at the top/lockout position |

### Examples

- **3-1-2-0** on a bench press: 3 seconds lowering the bar, 1-second pause on the chest, 2 seconds pressing up, 0-second pause at lockout.
- **4-0-1-0** on a squat: 4 seconds descending, no pause at the bottom, 1 second (explosive) standing up, no pause at the top.
- **2-2-1-1** on a Romanian deadlift: 2 seconds lowering, 2-second pause at the bottom stretch, 1 second pulling up, 1-second squeeze at the top.

A value of **0** for the concentric phase typically means "as fast as possible" (explosive intent).

Enter tempo in the exercise editor using the format `3-1-2-0`. Leave the tempo field empty for exercises where tempo is not prescribed.

---

## Unilateral Exercises

For exercises performed one side at a time (Bulgarian split squats, single-arm dumbbell rows, lunges), toggle the **"Each side"** flag in the exercise editor.

When this flag is on:

- The athlete understands the prescribed sets and reps apply to **each side individually**.
- Total volume is effectively doubled. If you prescribe 3x10 with the "each side" flag, the athlete does 3x10 on the left AND 3x10 on the right (60 total reps, not 30).

Keep this in mind when planning weekly volume. A prescription of 3x10 per side for Bulgarian split squats is 60 total reps of single-leg work.

---

## Rest Periods

Set the rest interval between sets for any exercise. Enter rest time in seconds in the exercise editor.

Common rest prescriptions:

| Goal | Typical Rest |
|------|-------------|
| Maximal strength (1-3 reps) | 180-300 seconds (3-5 min) |
| Strength (3-6 reps) | 120-180 seconds (2-3 min) |
| Hypertrophy (8-12 reps) | 60-120 seconds (1-2 min) |
| Muscular endurance (12+ reps) | 30-60 seconds |
| Supersets (between exercises) | 0-30 seconds |

Leave the rest field empty if you prefer not to prescribe rest intervals and let the athlete self-regulate.

---

## Notes

You can add coaching cues and instructions at three levels:

### Exercise Notes

Click the gear icon to expand the exercise editor and type into the **Exercise Notes** field. Use this for specific coaching cues:

- "Pause 2 seconds at the bottom"
- "Use a medium grip"
- "Brace hard -- this is your top set"
- "Supinate at the top of the curl"

### Day Notes

Click the **Notes** button on a day's header to reveal the day-level notes area. Use this for session-wide instructions:

- "Start with 10 min bike warm-up"
- "Deload week -- keep everything light and fast"
- "Film all top sets for form review"

### Program Description

The program description field at the top serves as program-level notes. Use it for overarching goals and context that applies to the entire training block.

---

## Templates

Templates are reusable program structures. They save the week/day/exercise layout and prescriptions, but they are designed to be starting points that you customize for each athlete.

### Saving a Program as a Template

After building and saving a program, click **Save as Template** on the program detail page. A dialog lets you:

1. Set a **template name** (defaults to the program name with "(Template)" appended).
2. Add an optional **description** explaining the intended use.
3. Click **Save Template**.

The template is a separate copy -- changing the original program does not affect the template, and vice versa.

### Building a New Program from a Template

On the programs page, go to your template library. Click **Use Template** on any template to start a new program pre-populated with its entire structure:

- All weeks and days are copied.
- All exercises and their prescription types are copied.
- Set/rep schemes are copied.
- You give the new program its own name and description.

From there, customize as needed -- adjust percentages for the specific athlete, swap exercises for variations, add or remove weeks.

### Why Templates Save Time

Consider a coach running a standard 4-week hypertrophy block for multiple athletes. Without templates, you rebuild the same 4-week, 16-session structure from scratch each time. With templates:

1. Build it once.
2. Save as template.
3. For each new athlete, create from template, tweak the loads and exercise selections, assign.

If you typically run 3-4 program archetypes (off-season hypertrophy, strength block, peaking cycle, deload), saving each as a template means you rarely start from a blank page.

---

## Assigning to Athletes

Once a program is saved, you can assign it to one or more athletes.

### How to Assign

Click **Assign to Athletes** on the program detail page. A dialog opens with:

1. **Athlete list** -- Check the box next to each athlete who should receive this program. Athletes who are already assigned appear checked and greyed out.
2. **Start date** -- Defaults to the next Monday. Change this to whenever you want the program to begin.
3. **Training days** -- Select which days of the week the athlete trains. Use the preset buttons (3-Day, 4-Day, 5-Day) for common splits, or click individual day buttons for a custom schedule.

Click **Assign** to link the program to the selected athletes.

### Single vs. Multi Assignment

You can assign the same program to multiple athletes at once. Each athlete gets their own independent copy of the training schedule. One athlete's logged results do not affect another's.

### What Happens After Assignment

Once assigned:

- The program appears in each athlete's **training log**, mapped to specific calendar dates based on the start date and training day selections.
- Athletes can view their prescribed exercises, sets, reps, and intensity targets for each session.
- As athletes complete workouts and log results, you can review their performance data.

---

## Editing After Assignment

You can continue editing a program after it has been assigned to athletes.

### What You Can Change

- Add, remove, or reorder exercises within a day.
- Change prescription types, sets, reps, and intensity targets.
- Add or remove days and weeks.
- Update notes at any level.
- Change program metadata (name, description, periodization type).

### Things to Keep in Mind

- Changes apply to the program structure. Workouts that athletes have **already completed and logged** retain their original prescription data -- you are not rewriting history.
- If an athlete is mid-program and you change Week 3, they will see the updated version when they get to Week 3 (assuming they have not already completed it).
- Communicate changes to your athletes. Cannoli Trainer does not currently send automatic notifications when a program is modified, so let them know if something changed in their upcoming sessions.
- If you need to make major structural changes (adding weeks, removing exercises), consider whether it would be cleaner to create a new program rather than heavily modifying an assigned one.
