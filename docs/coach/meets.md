# Competition & Meet Management

Meet day is where months of training either come together or fall apart, and the difference is usually logistics. This tool handles warm-up timing, attempt selection, and multi-athlete coordination so you can focus on coaching instead of doing math on a whiteboard in the warm-up room.

## Creating a Meet

Navigate to **Meets** from the top navigation and click **New Meet**. The form asks for four fields:

| Field | Required | Description |
|-------|----------|-------------|
| Meet Name | Yes | e.g. "2026 North Brooklyn Classic" |
| Date | Yes | Competition date |
| Federation | No | USAPL, IPF, USPA, RPS, etc. |
| Location | No | Venue city and state |

After creation, the meet appears in your list. Upcoming meets show a countdown badge (e.g., "14d away"). Past meets are marked "Completed". You can search meets by name, federation, or location, and filter between upcoming and past.

## Entering Athletes

Open a meet to see its detail page. Click **Add Athlete** to add lifters from your roster.

1. Select the athlete from the dropdown (only athletes not already in this meet appear)
2. Set their **weight class** for this competition -- this auto-fills from their profile if one is set, but you can override it (athletes sometimes move classes)
3. Click **Add to Meet**

The athlete appears as a card on the meet page with their weight class, bodyweight, and an empty attempt grid. You can add as many athletes as you're handling at the meet. To remove someone, click the trash icon on their card and confirm.

## Attempt Selection

Each athlete card has an attempt planning grid with three rows (Squat, Bench, Deadlift) and three columns (Opener, 2nd, 3rd).

### Estimated Maxes as Reference

The "Est. 1RM" column shows the athlete's current estimated max for each lift, pulled from their training data. Use this to sanity-check attempt selections. If an athlete's estimated squat max is 200 kg, an opener at 185 kg (92.5%) is aggressive. An opener at 170 kg (85%) gives room to build.

As you type attempt values, the percentage of estimated max appears below each input so you can see where attempts fall relative to training numbers.

### Planning Attempts

The standard approach for most coaches:

- **Opener**: Something the athlete can hit on their worst day. Typically 88-92% of estimated max. The goal is to get on the board.
- **2nd attempt**: A moderate jump. Usually the athlete's current gym max or slightly above. This is the safe PR.
- **3rd attempt**: The reach. This is where you go for a competition PR or a number needed for a placement goal.

Type the weight in kilograms for each attempt. Click **Save** on the athlete card to persist the values. The "Best" column on the right auto-calculates the highest entered attempt per lift, and the total badge at the top sums the three best lifts.

You don't need to fill in all three attempts upfront. Many coaches only plan openers before meet day and fill in 2nd and 3rd attempts live based on how the opener moves.

## Warmup Calculator

Every athlete card has an expandable **Warm-up Calculator** section. This generates a timed warm-up schedule working backward from the flight start time.

### How It Works

1. Expand the warm-up calculator on an athlete's card
2. Select the **lift** (Squat, Bench, or Deadlift)
3. Enter the **flight start time** -- the time the flight is expected to begin lifting on the platform
4. The **opener** auto-fills from the attempt plan. You can override it if plans changed
5. Set the **minutes between sets** (default: 3 minutes, adjustable from 1-10)
6. Click **Generate Warm-up Schedule**

The calculator produces 6 warm-up sets at standard percentages of the opener:

| Set | Percentage | Example (200 kg opener) |
|-----|-----------|------------------------|
| Warm-up 1 | 50% | 100 kg |
| Warm-up 2 | 60% | 120 kg |
| Warm-up 3 | 70% | 140 kg |
| Warm-up 4 | 80% | 160 kg |
| Warm-up 5 | 90% | 180 kg |
| Opener | 100% | 200 kg |

All weights are rounded to the nearest 2.5 kg (standard plate math). The schedule times are calculated backward from the flight start time. If the flight starts at 10:30 AM with 3 minutes between sets, your first warm-up is at 10:12 AM and the opener is at 10:27 AM.

### Live Timer

After generating a schedule, hit **Start** to activate the countdown timer. It shows:

- A large countdown to the next warm-up set
- The weight and label for the upcoming set
- Each set in the list highlighted as "NOW" when it's time, dimmed when complete
- Color changes: green when it's go time, amber when under a minute away

Hit **Pause** to freeze the timer, or the reset button to start over with new inputs.

## Flight Tracker

When you have two or more athletes in the same meet, the **Flight Tracker** appears at the top of the meet page. This is the multi-athlete warm-up view -- one screen showing all your lifters' warm-up progress simultaneously.

### Setup

1. Select the **lift** (Squat, Bench, or Deadlift)
2. Enter the **flight start time**
3. Set the **minutes between sets**
4. Click **Generate**

The tracker only includes athletes who have an opener planned for the selected lift. If three athletes have squat openers but only two have bench openers, the bench tracker will show two columns.

### The Grid

The flight tracker displays a table:

- **Rows** = warm-up sets (same timing for everyone since they share a flight)
- **Columns** = one per athlete, showing their name and opener weight
- **Each cell** = the warm-up weight for that athlete at that percentage

Each cell is a button you can tap to mark a set as completed. Completed sets turn green with a checkmark. This lets you track which athletes have finished which warm-ups at a glance.

The global countdown at the top shows time until the next warm-up set across all athletes. At the bottom, progress indicators show each athlete's completion (e.g., "Matt 4/6", "Chris 5/6").

### Why This Matters

If you're handling three lifters in the same flight, you need to stagger their warm-ups. The flight tracker makes it obvious who needs to get under the bar next. You're not flipping between three spreadsheets or trying to remember whose turn it is while the expediter is calling names.

## Meet Day Workflow

Here's the practical flow for using these tools at an actual meet.

### Before the Meet

1. **Create the meet** with the correct date, federation, and location
2. **Add all your athletes** and set their competition weight classes
3. **Plan openers** for all three lifts. Second and third attempts can wait -- you'll adjust those after seeing how openers move

### Morning of the Meet

1. Open the meet on your phone or tablet
2. After the rules briefing, note the **flight assignments** and **estimated start times** from the head referee or expediter
3. For each athlete, open their warm-up calculator and enter the flight start time
4. Generate warm-up schedules for squats first

### In the Warm-Up Room

1. Open the **Flight Tracker** for squats with the flight start time
2. Hit **Start** on the timer
3. Load plates and call your athletes to the warm-up bar according to the schedule
4. Tap each cell to mark sets complete as athletes hit them
5. Watch the countdown -- when it turns amber, your next lifter needs to be ready

### Between Lifts

1. After squats finish, generate new warm-up schedules for bench press
2. Update any openers based on how squats went (if someone bombed squats, their bench opener strategy might change)
3. Repeat the Flight Tracker workflow for bench, then deadlifts

### Filling in Attempts Live

As each attempt happens on the platform:

1. Enter the actual weight in the attempt grid on the athlete's card
2. The best and total auto-update
3. For 2nd and 3rd attempts, you're often deciding on the spot based on how the previous attempt looked -- enter the number as you call it to the table

### After the Meet

Once the competition wraps, all attempts should be entered. The **Results Summary** card at the bottom of the meet page shows:

- Each athlete ranked by total
- Best successful attempt per lift
- Weight class
- Squat / Bench / Deadlift / Total breakdown

Review the results with your athletes. Compare planned attempts to actual results. If someone opened too heavy and missed, that's coaching feedback for the next meet cycle. If someone left kilos on the platform with conservative attempts, you know to push harder next time.

The meet data stays in the system, so when you're planning the next competition prep block, you can reference previous meet results to set realistic goals.
