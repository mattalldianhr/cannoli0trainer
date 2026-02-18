# Athlete Analytics & Progress Tracking

This guide walks through every analytics feature available in Cannoli Trainer, explains what the data means in practical coaching terms, and offers guidance on how to act on what you see.

---

## Accessing Analytics

There are two ways to view analytics:

1. **Analytics page** -- Navigate to `/analytics` from the main navigation. This gives you the full analytics dashboard with athlete and date range selectors at the top.
2. **Athlete profile** -- Open an athlete's profile and click the **Analytics** tab. This loads the same dashboard pre-filtered to that athlete.

When you first land on the analytics page, the first athlete in your roster is selected and the date range defaults to **12 Weeks**. Use the controls at the top to change either:

- **Athlete dropdown** -- Switch between athletes.
- **Date range buttons** -- Choose from 4 Weeks, 8 Weeks, 12 Weeks, or All Time. Changing the range updates every chart on the page.

A summary row of four cards appears at the top showing total sessions, compliance percentage, average RPE, and number of lifts being tracked.

---

## Strength Trends (Estimated 1RM)

The **Estimated 1RM Trends** section shows a line chart for each exercise where the athlete has logged enough data to calculate an estimated one-rep max.

### What estimated 1RM means

Estimated 1RM (e1RM) is a calculated projection of the heaviest single rep an athlete could perform on a given lift, derived from the sets they actually logged. If an athlete squats 100 kg for 5 reps, the system uses the Epley formula (weight x (1 + reps / 30)) to estimate their max at roughly 117 kg. This lets you track strength progress without requiring actual max-effort singles.

### Reading the chart

- Each exercise gets its own line chart. Up to six exercises are shown.
- The X-axis is the date, Y-axis is estimated 1RM in kg.
- A badge next to each exercise name shows how many data points are included.
- Hover over any point to see the exact date and value.

### Exercise selection and date range

The charts respond to the date range selector at the top of the page. If you switch to "4 Weeks," you will only see data points from the last 28 days. Choose "All Time" when you want the full picture for a training cycle review.

If a chart shows "Not enough data yet," the athlete either has not logged that lift or has not recorded enough sets with weight and reps to generate an e1RM estimate.

---

## Volume Tracking

The **Weekly Volume** section shows a bar chart of total tonnage per week.

### What tonnage is

Tonnage is the total weight moved, calculated as sets x reps x weight for every logged set in a given week. If an athlete does 4 sets of 5 reps at 80 kg on squats, that exercise contributes 1,600 kg of tonnage for the week. All exercises are summed together.

### Reading the chart

- Each bar represents one week's total tonnage in kg.
- The current (in-progress) week is included and will be shorter than completed weeks -- this is normal.
- Hover over any bar to see the exact tonnage value.

### Important note on bodyweight exercises

Bodyweight exercises (pull-ups, push-ups, dips without added weight) show as 0 tonnage. This is expected behavior. The system only counts external load, so a week heavy on bodyweight work will appear lower in volume than it actually was. Keep this in mind when reviewing athletes who do a lot of calisthenics.

### Trend arrows

Look at the general shape of the bars across weeks. A gradual upward trend over a mesocycle indicates progressive overload is happening. A sudden spike or drop warrants a conversation with the athlete.

---

## Compliance

The **Weekly Compliance** section shows a bar chart of workout completion rate by week.

### What it measures

Compliance rate is the percentage of assigned workouts that the athlete actually completed. If you assigned 5 sessions in a week and they completed 4, compliance is 80%.

The summary card at the top of the page shows the overall compliance percentage for the entire selected date range.

### Weekly and monthly view

The bar chart breaks compliance down week by week. Each bar shows the percentage for that week. This helps you spot patterns -- maybe compliance drops every other week, or it dips on weeks with higher volume.

### Streaks

Watch for consecutive weeks at or above your target compliance. Consistency matters more than any single week.

### Greater than 100%

If an athlete completes extra work beyond what was assigned (additional sessions, extra exercises), compliance can exceed 100%. This is not an error. It means the athlete is doing more than programmed, which may be positive (motivated athlete) or a concern (not following the program, potential overtraining).

---

## RPE Distribution

The **RPE Distribution** section has two parts: a histogram of RPE values and a weekly average RPE trend line.

### The histogram

- X-axis shows RPE values from 6 to 10 (in 0.5 increments where data exists).
- Y-axis shows how many sets were logged at each RPE.
- This gives you a snapshot of how the athlete's effort is distributed.

### What a healthy distribution looks like

For most training phases, you want to see a bell curve roughly centered around RPE 7-8, with fewer sets at RPE 6 and fewer at RPE 9-10. A distribution skewed heavily toward 9-10 suggests the athlete is training too close to failure too often. A distribution sitting mostly at 6-7 might mean the loads are too conservative or the athlete is sandbagging RPE reports.

### Weekly average RPE

The line chart below the histogram tracks the average RPE per week. This is useful for monitoring fatigue accumulation across a mesocycle. A well-designed program should show average RPE creeping up over the weeks of a block, with a drop during deload weeks.

If no RPE data has been recorded, the section displays "No RPE data recorded yet." Encourage athletes to log RPE for every working set to get the most out of this feature.

---

## Bodyweight Trends

The **Bodyweight Trend** section shows a line chart of the athlete's bodyweight over time.

### Requirements

The chart requires at least two bodyweight entries to draw a line. If the athlete has zero or one entry, you will see "No bodyweight data recorded yet."

### Reading the chart

- X-axis is date, Y-axis is weight in the athlete's configured unit (kg or lb).
- Hover over points to see exact values.

### Target weight class line

If a target weight class is configured for the athlete, a horizontal reference line appears on the chart. This makes it easy to see at a glance whether the athlete is trending toward or away from their target.

### Coaching notes

Bodyweight data is only as good as the athlete's consistency in logging it. Encourage weigh-ins at the same time of day (ideally morning, before eating) for the most reliable trend. Short-term fluctuations of 1-2 kg are normal and not meaningful -- focus on the trend over 2-4 weeks.

---

## VBT Analytics

The **Velocity-Based Training** section appears when an athlete has logged velocity data (m/s) on their sets. All velocity data is entered manually in the training log.

### Exercise selector

A dropdown at the top of the VBT section lets you pick which exercise to analyze. Each option shows how many sets and sessions have velocity data.

### Load-velocity profile

A scatter plot showing every set plotted as load (kg) on the X-axis and velocity (m/s) on the Y-axis. A dashed red regression line shows the overall trend. Key stats appear below the chart:

- **R-squared** -- How well the linear model fits the data. Values closer to 1.0 indicate a strong, consistent load-velocity relationship. Below 0.7 suggests a lot of variability.
- **Slope** -- The rate at which velocity decreases per kg of load added. A steeper (more negative) slope means the athlete is more velocity-sensitive to load changes.

### Velocity profile table

When the athlete has an estimated 1RM for the selected exercise, a table appears showing average velocity at different percentages of 1RM (60%, 70%, 80%, 90%). This is the athlete's characteristic velocity profile and is useful for setting velocity targets in future programming. Columns:

- **% 1RM** -- The load bracket.
- **Avg Velocity** -- Mean bar speed at that intensity.
- **Samples** -- How many sets contributed to the average.

### Preparedness indicator

Compares the athlete's most recent session velocity to a rolling baseline from prior sessions. Three states:

- **Above Baseline** (green) -- Velocity is higher than average. The athlete is well-prepared and may be able to handle heavier loads or more volume.
- **At Baseline** (blue) -- Velocity is within normal range. Proceed as planned.
- **Below Baseline** (amber) -- Velocity is lower than average. Consider whether fatigue, sleep, nutrition, or accumulated training stress is a factor. It may be worth autoregulating the session.

The indicator also shows the exact percentage difference and both the current and 4-week average velocities.

### Session fatigue (velocity decay)

Shows the percentage drop in velocity from set 1 to the final set within the most recent session. This is calculated as:

```
((set 1 velocity - final set velocity) / set 1 velocity) x 100
```

A velocity drop of 10-15% within a session is typical for strength work. Drops exceeding 20% may indicate the athlete is pushing past productive fatigue. If velocity drop is consistently high, consider reducing set counts or adding longer rest periods.

Requires at least 2 sets in a session to calculate.

### Velocity-based 1RM estimation

The system can estimate 1RM from the load-velocity profile by extrapolating the regression line to a minimum velocity threshold (the velocity at which the athlete would fail a rep). This provides an alternative 1RM estimate that does not rely on RPE or rep-max formulas, which can be useful for cross-validation.

---

## Exporting Data

Click the **CSV** button in the top-right controls to download training data for the selected athlete and date range.

### What is included

The CSV file contains one row per logged set with the following columns:

| Column | Description |
|--------|-------------|
| Date | The date the set was completed |
| Exercise | Exercise name |
| Set | Set number within the exercise |
| Reps | Number of reps performed |
| Weight | Load used |
| Unit | kg or lb |
| RPE | Rate of perceived exertion (if logged) |
| RIR | Reps in reserve (if logged) |
| Velocity | Bar velocity in m/s (if logged) |
| Notes | Any notes the athlete added to the set |

### File naming

The downloaded file is named `{AthleteName}_training_data.csv` with spaces replaced by underscores.

### Using the export

Open in any spreadsheet application (Google Sheets, Excel, Numbers). The CSV is useful for:

- Building custom reports or charts outside of Cannoli Trainer.
- Sharing data with other coaches or sports science staff.
- Archiving training blocks for long-term records.
- Running your own analysis in tools the athlete or organization already uses.

---

## Coaching Interpretation

The charts and numbers only matter if you act on them. Here are practical guidelines for turning analytics into coaching decisions.

### Flat e1RM = time to change the stimulus

If an athlete's estimated 1RM has been flat for 3-4 weeks, the current training stimulus is no longer driving adaptation. Consider:

- Changing the rep scheme (if they have been doing sets of 5, try sets of 3 or sets of 8).
- Adjusting intensity (add 2-5% to working weights).
- Introducing a variation of the lift (pause squats, tempo bench, deficit deadlifts).
- Reviewing whether recovery factors (sleep, nutrition, stress) are limiting progress.

A flat e1RM is not a failure -- it is information. The program did its job for a while and now needs to evolve.

### Compliance below 80% = check in with the athlete

Consistent compliance below 80% is a signal that something is off. It might be:

- **The program is too demanding.** Too many sessions, too long, too mentally draining. Simplify.
- **Life factors.** Work, travel, family. The program may need to flex around their schedule.
- **Motivation.** The athlete might not see the point of certain exercises. Explain the "why" or swap in exercises they enjoy more.
- **Injury or discomfort.** They might be skipping sessions because something hurts but have not told you.

Do not assume the worst. Start with a conversation, not a lecture.

### RPE always at 9-10 = possible overreaching

If the RPE histogram is stacked at 9 and 10 with almost nothing below 8, the athlete is consistently training near failure. Short-term this might be intentional (peaking block), but sustained across multiple weeks it often leads to:

- Accumulated fatigue that masks true strength.
- Higher injury risk.
- Diminishing returns on hypertrophy and strength.
- Mental burnout.

Consider inserting a deload week, reducing the number of top sets, or adding back-off sets at lower RPE. Some athletes also overreport RPE -- if the weights are moving well on video, a calibration conversation might be in order.

### RPE always at 6-7 = the athlete might need a push

The opposite problem. If RPE is consistently low and e1RM is flat, the training intensity might not be high enough to drive adaptation. This can also indicate an athlete who underreports RPE to avoid harder programming. Review their actual loads relative to known maxes.

### Volume spikes and drops

A sudden doubling of weekly tonnage is a red flag for injury risk, even if the athlete feels fine in the moment. Similarly, a sharp drop might indicate the athlete is burned out or dealing with something outside the gym. Gradual, planned increases (roughly 5-10% per week) are safer.

### Bodyweight trending in the wrong direction

If an athlete is in a weight class sport and their bodyweight is trending away from their target class, bring it up sooner rather than later. Small corrections early are much easier than crash cuts before competition.

### VBT: velocity dropping at the same load across weeks

If the athlete's velocity at a given load is declining session over session, accumulated fatigue is likely building faster than recovery. This is one of the earliest indicators of overreaching and often shows up before RPE or subjective feel changes. Back off before performance craters.

### VBT: preparedness below baseline on competition day

If the preparedness indicator shows "Below Baseline" on a day that matters, consider adjusting the warm-up strategy, reducing planned attempts, or having a frank conversation about expectations. A single below-baseline reading is not the end of the world, but it is data worth acknowledging.

### When in doubt, zoom out

Switch to "All Time" and look at the big picture. A bad week does not define a training block. Trends over 8-12 weeks tell you whether the program is working. Use the shorter date ranges for week-to-week adjustments, but make major programming decisions based on longer-term data.
