# Coaching Walkthroughs

Real scenarios showing how the platform fits into your actual coaching week. These aren't feature demos -- they're the workflows you'll run over and over again.

---

## Walkthrough 1: Programming for a Powerlifting Meet

You've got an athlete 12 weeks out from a USAPL meet. Here's how to build, deliver, and manage their entire prep.

### Build the peaking program

Open **Program Builder** and create a new program. Name it something you'll recognize later (e.g., "Sarah - 2026 Spring Nationals Prep"). Set the duration to 12 weeks.

You're running block periodization, so structure it in phases:

- **Weeks 1-4: Hypertrophy** -- Higher volume, moderate intensity. Prescribe with RPE ranges (RPE 6-7) and percentage-based loading (65-75% 1RM). The program builder lets you mix prescription types within a single session, so your competition lifts can use %1RM while accessories use RPE.
- **Weeks 5-8: Strength** -- Drop volume, push intensity. Switch competition lifts to heavier percentages (78-88%) with RPE caps. If you use velocity targets for your squats, add those here too -- the platform stores velocity data per set so you can track readiness as the prep progresses.
- **Weeks 9-11: Peaking** -- Low volume, high intensity. Openers and above. Prescribe competition lifts at 90%+ with specific RPE targets. Use autoregulated ranges for top singles ("Work to RPE 8, then back off -10%").
- **Week 12: Taper** -- Light openers only. Minimal volume to keep the groove without accumulating fatigue.

Use the **duplicate week** feature to speed this up. Build Week 1, duplicate it for Weeks 2-4, then adjust loads and volumes. Same for each block. This cuts programming time significantly compared to building 12 weeks from scratch.

For exercise selection, pull from your **Exercise Library** using the picker. Every exercise you've added with demo videos and coaching cues will show up for the athlete when they're training. [See Exercise Library guide](exercises.md)

[See Program Builder guide](program-builder.md) for full details on prescription types, duplication, and drag-and-drop reordering.

### Assign to the athlete

Once the program is built, go to **Assign Program**. Select the athlete from your roster. Set the start date (12 weeks out from meet day). The program shows up in their training log and on the schedule immediately.

If the athlete is remote, this is it -- they open the app, see today's workout, and start logging. If they're in-person, the same program is there as your reference during sessions.

### Track weekly compliance and volume

Every Monday morning (see Walkthrough 3), check the athlete's **Analytics** page. You're looking at:

- **Compliance rate** -- Are they hitting all their sessions? If someone drops below 80%, that's a conversation.
- **Weekly volume** -- Tonnage should be trending the way you designed: higher in hypertrophy, tapering down into peaking.
- **RPE accuracy** -- Compare their reported RPEs against actual performance. If they're consistently rating RPE 8 but hitting velocity numbers that say RPE 6, you know they're sandbagging or need calibration.
- **1RM trend lines** -- Estimated maxes should be climbing through the strength block and holding steady into peaking.

Adjust the program week to week based on what you see. If volume is too high and recovery is lagging, pull an accessory. If strength is jumping ahead of schedule, you might shorten the strength block by a week. Edit sessions directly in the program builder -- changes push to the athlete immediately.

[See Analytics guide](analytics.md) for chart types and date range filtering.

### Enter the meet

As the meet approaches, go to **Competition Prep** and create a new meet entry. Add the meet details (federation, date, location) and enter the athlete. Set their weight class and record their current bodyweight from their latest log.

### Select attempts using analytics data

This is where all that data pays off. Open the athlete's analytics alongside the attempt planner. You're looking at:

- Recent training maxes and estimated 1RMs for squat, bench, and deadlift
- Velocity at heavy loads (if you tracked it) -- bar speed on last heavy singles tells you where they actually are
- RPE trends over the last 3-4 weeks

Pick openers conservatively (something they've tripled at RPE 7 in the last two weeks). Set second attempts based on recent singles. Leave third attempts flexible -- you'll decide those at the meet based on how the day is going.

Enter all three planned attempts into the **Attempt Planner**. The platform tracks them and gives you a clear view across all your athletes at the same meet.

[See Meets guide](meets.md) for attempt planning and multi-athlete views.

### Warm-up calculator

On meet day, the **Warm-up Timer** works backward from the flight start time. Enter when the flight starts, and it generates a warm-up schedule with progressively heavier attempts timed to have your athlete ready for their opener.

If you're handling multiple athletes in the same flight or overlapping flights, the **Multi-Athlete Flight View** shows you everyone's warm-up timelines on a single screen so you're not scrambling between platforms.

### After the meet

Enter actual attempts and results into the meet entry. Made lifts, misses, final total, placing. This becomes part of the athlete's competition history -- visible on their profile and factored into long-term analytics.

Review how the prep went: Did estimated maxes match actual performance? Was the taper length right? Use this data to program the next cycle better.

---

## Walkthrough 2: Onboarding a New Remote Athlete

A new remote athlete reaches out. Here's how to get them set up and training within a day.

### Add the athlete

Go to your **Athlete Roster** and create a new profile. Fill in the basics: name, email, weight class (if competing), training experience, any injury history or notes. Mark them as remote.

[See Athletes guide](athletes.md) for profile fields and remote setup.

### Build or pick a template program

You've got two options depending on the athlete:

**Option A: Start from a template.** If this athlete fits a common profile (beginner powerlifter, intermediate off-season, general strength), go to your **Template Library** and pick the closest match. Create a new program from that template. The structure copies over -- weeks, days, exercises, prescription types -- but without athlete-specific loads. Now customize: adjust training maxes, swap exercises for their equipment or preferences, modify volume based on their recovery capacity.

**Option B: Build from scratch.** For athletes with unique needs (unusual schedule, injury restrictions, specific competition timeline), build a fresh program in the Program Builder. You can always save it as a template later if you end up with similar athletes.

Either way, you're not starting from zero. Templates save you from rebuilding the same 4-week hypertrophy block for the tenth time.

[See Program Builder guide](program-builder.md) for saving, organizing, and creating programs from templates.

### Assign the program

Assign the program and set the start date. The athlete opens their portal and sees their full program laid out: this week's sessions, each exercise with your prescription, demo videos, and coaching cues.

### Athlete logs via their portal

The athlete trains and logs everything through the app. For each set, they enter weight, reps, and RPE. If they're using a velocity device, they add bar speed too. The interface shows them what you prescribed alongside their previous performance for that exercise -- so they know where they left off and what to aim for.

Sets save individually, not as a bulk entry. If someone gets pulled away mid-session, their data is still there.

### Coach reviews sessions weekly

Set a rhythm for reviewing remote athletes. Most coaches do this Monday mornings (see Walkthrough 3), but find what works for you. For each remote athlete:

1. Check **compliance** -- Did they complete all prescribed sessions?
2. Scan the **training log** -- Look at actual loads vs. prescribed, RPE trends, any flagged sets
3. Check **bodyweight** if they're tracking it -- Relevant for competitors managing weight classes

### Check analytics and adjust

Pull up their **Analytics** page. Look at the same metrics you'd track for a meet prep athlete: 1RM trends, volume, compliance, RPE accuracy. For remote athletes specifically, pay attention to compliance -- if they're consistently skipping Friday sessions, maybe the 4-day template doesn't fit their schedule and you need to restructure to 3 days.

Make adjustments directly in their program. Changes sync immediately. Drop them a message if anything significant changed so they're not surprised.

### The feedback loop

Over time, the analytics paint a picture of this athlete that you'd never get from text messages and spreadsheets. You'll see patterns: they respond well to higher frequency squatting, their bench stalls when volume gets too high, their RPE accuracy improves as they get more experienced. This is the data that makes your coaching better -- and it's all in one place instead of scattered across WhatsApp threads and Google Sheets.

---

## Walkthrough 3: Weekly Athlete Check-In (Monday Morning)

It's Monday morning, coffee in hand. Here's how to review your entire roster in 30 minutes instead of an hour.

### Start at the Dashboard

The **Dashboard** is your command center. It shows you:

- **Athletes needing attention** -- Anyone with low compliance, missed sessions, stalled progress, or upcoming meets. This is the priority list. Instead of scrolling through 40 athletes hoping you don't miss something, the platform flags who needs you.
- **Activity feed** -- Recent workout completions, PRs, messages. A quick scroll tells you who's been active.
- **Upcoming meets** -- Competitions in the next 30 days with athletes entered.
- **Overview cards** -- Total Athletes, Active Programs, Workouts This Week, and Needs Attention count.

### Triage the attention list

Work through the athletes flagged for attention:

- **Low compliance (below 80%):** Check if they've logged anything recently. If they've gone dark, reach out. If they're logging partial sessions, look at why -- maybe the program is too demanding for their schedule.
- **Stalled lifts:** Check analytics for someone whose estimated 1RM has flatlined or dropped. Time for a program adjustment -- different rep ranges, exercise variation, or a deload.
- **Meet prep athletes:** Anyone 8 weeks or closer to competition gets a closer look. Check their peaking progression, bodyweight, and recent training quality.

### Check this week's schedule

Review what's programmed for the week across your roster. If you have in-person athletes, confirm their sessions are scheduled and the programming makes sense for where they are in their cycle.

For group sessions or athletes training at the same time, make sure there aren't equipment conflicts (three athletes all need the monolift at 5 PM).

### Review analytics for key athletes

Spend a few minutes on your top-priority athletes -- competitors in prep, new athletes in their first few weeks, anyone coming back from injury. Pull up their analytics and look for:

- Volume trending in the right direction for their training phase
- RPE consistency (are they rating accurately?)
- Bodyweight trends for competitors managing weight classes
- Any velocity data flagging fatigue or readiness issues

### Adjust sessions

Based on what you found, make changes:

- Swap an exercise for an athlete who's reporting elbow pain on close-grip bench
- Add a set to someone who's been cruising through their sessions at RPE 5
- Pull volume for an athlete who's clearly overreaching based on declining performance

Edits happen directly in the program builder. Changes push to athletes immediately -- they'll see the updated session next time they open the app.

### Log in-person training

If you're coaching in-person sessions today, the platform works as your session reference. Pull up the athlete's workout on your phone or tablet. As they train, you can log sets for them or have them log on their own device. Either way, the data goes to the same place.

After the session, the athlete's compliance updates, their training log is complete, and you're done. No separate tracking step.

### The 30-minute Monday

Once this becomes routine, the whole check-in takes about 30 minutes:

- 5 minutes: Dashboard scan, triage attention list
- 15 minutes: Review and adjust priority athletes
- 10 minutes: Quick scan of remaining roster, respond to messages

Compare that to the old way: opening TeamBuildr, checking WhatsApp threads, scrolling through a spreadsheet, trying to remember who's in prep and who hasn't logged in two weeks. The platform puts it all in one view.

---

## Walkthrough 4: Building Training Blocks with Templates

Templates are how you stop rebuilding the same program structures over and over. Here's how to build a library of reusable blocks and assemble programs efficiently.

### Build a 4-week hypertrophy block

Start in the **Program Builder**. Create a new program: "Hypertrophy Block - General (4 weeks)." Build it as a general-purpose template -- use placeholder training maxes and focus on the structure:

- **4 sessions per week** (adjust copies for 3-day or 5-day athletes later)
- **Exercise selection:** Competition lifts plus variations and accessories. Use your exercise library so demo videos and cues are attached.
- **Prescription:** RPE 6-7 for main lifts, fixed rep ranges for accessories. Use percentage-based loading at 65-75% for athletes who respond better to that.
- **Progression:** Small weekly increases in either load or volume across the 4 weeks. Week 4 can be a deload or a push week depending on the athlete -- you'll customize this per person.

Once you're happy with the structure, go to **Save as Template**. Give it a clear name and tags (e.g., "hypertrophy," "4-week," "general," "4-day"). Good naming saves you time later when you're searching your template library with 20+ blocks.

[See Program Builder guide](program-builder.md) for naming conventions and organization.

### Duplicate and modify for a strength block

Go to your **Template Library**, find the hypertrophy block, and duplicate it. Rename to "Strength Block - General (4 weeks)." Now modify:

- Drop total sets per exercise (volume comes down)
- Increase intensity -- shift from RPE 6-7 to RPE 7-9, or from 65-75% to 78-88%
- Swap some hypertrophy accessories for heavier variations (e.g., replace leg press with pause squats)
- Adjust progression to be intensity-driven rather than volume-driven

Save as a new template. You now have two blocks that flow naturally into each other.

Repeat this process for other common blocks:

- **Peaking block (3 weeks)** -- Low volume, high intensity, competition lifts only
- **Taper (1 week)** -- Openers and light work
- **Off-season / GPP (4 weeks)** -- Higher variety, moderate everything
- **Deload (1 week)** -- 50-60% loads, reduced volume

### Assign hypertrophy to off-season athletes

When you have athletes in the off-season, create a new program from your hypertrophy template. The entire structure copies over. Now customize for the individual:

- Set their actual training maxes
- Adjust exercise selection for their weak points (more quad work for someone who's quad-limited in the squat, more upper back for someone whose deadlift lockout is weak)
- Modify volume based on their recovery capacity -- a 22-year-old training full-time can handle more than a 42-year-old with a desk job and two kids

Assign and move on. The template did 80% of the work; you're just dialing in the last 20%.

### Swap to strength when ready

When the hypertrophy block wraps up, create a new program from your strength template. Same process: copy the structure, customize for the athlete, assign. The transition is smooth because you designed these blocks to flow into each other.

The athlete's analytics will show the shift -- volume drops, intensity climbs, estimated 1RMs should start responding to the heavier loading.

### Build meet prep from the strength template

For athletes heading into competition, the strength block becomes the starting point for meet prep. Duplicate your strength template, extend it with your peaking and taper blocks, and you've got a full 8-12 week prep assembled from modular pieces.

This is where the template approach really pays off. Instead of building a 12-week meet prep from scratch every time, you're assembling it from tested blocks:

1. Strength block (4 weeks) -- from template, customized
2. Peaking block (3 weeks) -- from template, customized
3. Taper (1 week) -- from template, barely changed

You've built the entire prep in a fraction of the time, and each block is a structure you've used and refined across multiple athletes.

### Growing your template library

Over time, your template library becomes one of your most valuable coaching assets. Some tips:

- **Save any program structure you use more than twice** as a template
- **Create variations** -- "Hypertrophy - 3 Day," "Hypertrophy - 4 Day," "Hypertrophy - Bench Focus"
- **Tag consistently** so you can search and filter effectively
- **Review and update** templates each training cycle based on what worked and what didn't

Your templates encode your coaching methodology. A new athlete walks in, you assess their needs, pull the right template, customize, and assign. That's a 30-minute process instead of a 3-hour one.

If you ever bring on another coach, your template library is how they deliver programs that match your standards without you reviewing every set and rep.

---

## What's Next

These walkthroughs cover the core coaching workflows. For detailed instructions on specific features, see:

- [Getting Started](getting-started.md) -- Dashboard overview and first steps
- [Program Builder](program-builder.md) -- Building, editing, prescribing, and templates
- [Athletes](athletes.md) -- Roster, profiles, and onboarding
- [Schedule & Training](schedule-and-training.md) -- Weekly calendar and logging workouts
- [Analytics](analytics.md) -- Charts, trends, and data export
- [Meets](meets.md) -- Competition management, attempts, and warm-ups
- [Exercises](exercises.md) -- Building and organizing your exercise database
- [Glossary](glossary.md) -- Every term explained
