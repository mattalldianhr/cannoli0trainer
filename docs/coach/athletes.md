# Managing Your Athletes

Your athlete roster lives at **Athletes** in the top navigation (`/athletes`). This is where you add new athletes, track who needs attention, and drill into individual profiles for training history and analytics.

---

## Athletes List

The athletes page shows every athlete on your roster, sorted alphabetically. Each row is a card with:

- **Name** -- always visible, linked to their full profile.
- **Badges** -- Competitor (blue), Remote (gray), Needs Attention (red). Badges appear automatically based on athlete settings and activity.
- **Current program** -- the most recently assigned program name, if any.
- **Bodyweight** -- displayed in kg when set.
- **Experience level** -- Beginner, Intermediate, or Advanced.
- **Sessions** -- total workout sessions logged.
- **Sets** -- total sets logged across all sessions.
- **Last Workout** -- shows "Today", "Yesterday", or "Xd ago". Turns red if 3+ days since their last session.

### Search and filter

- **Search bar** -- filters by name or email as you type. Useful when you have 40+ athletes and need to find someone fast.
- **Filter chips** -- toggle between All, Competitors, Remote, and Needs Attention. Only one filter active at a time.
  - **All** -- every athlete on the roster.
  - **Competitors** -- athletes flagged as competitors.
  - **Remote** -- athletes flagged as remote.
  - **Needs Attention** -- anyone whose last workout was 3+ days ago, or who has never logged a session. Check this filter daily.

The result count updates live as you search and filter (e.g., "12 athletes").

---

## Adding an Athlete

Click **Add Athlete** in the top right of the athletes list. This opens a form at `/athletes/new` with three sections.

### Basic Info

| Field | Required | Details |
|-------|----------|---------|
| Name | Yes | Full name. This is the only required field. |
| Email | No | Contact email for the athlete. |
| Bodyweight | No | Current bodyweight in kg (e.g., 82.5). Accepts decimals. |
| Weight Class | No | Competition weight class as text (e.g., "83 kg", "74 kg"). |
| Experience Level | No | Dropdown: Beginner, Intermediate, or Advanced. Defaults to Intermediate. |

### Training Details

| Field | Default | Details |
|-------|---------|---------|
| Remote athlete | On | Check this for athletes you coach online. Checked by default. |
| Competitor | Off | Check this for athletes who compete in powerlifting meets. |
| Federation | -- | Only appears when Competitor is checked. Free text (e.g., USAPL, IPF, USPA). |

### Notes

| Field | Details |
|-------|---------|
| Coach Notes | Free-text area for injury history, goals, preferences, or anything else you want to remember. |

Click **Create Athlete** to save. You return to the athletes list automatically. Only the name is required -- you can fill in the rest later from the athlete's profile.

---

## Athlete Profile -- Info Tab

Click any athlete card to open their full profile at `/athletes/[id]`. The profile header shows:

- Athlete name
- Badges for Competitor, Remote, experience level, and federation
- **Edit** and **Delete** buttons in the top right

Below the header are four quick-stat cards:

| Stat | Description |
|------|-------------|
| Sessions | Total workout sessions logged |
| Sets Logged | Total individual sets across all sessions |
| PRs Tracked | Number of current max snapshots on file |
| Last Workout | Days since last session, turns red at 3+ days |

The **Info** tab (default) has three sections:

### Profile

Contact and physical details: email, bodyweight (kg), weight class, and the date they were added to your roster.

### Current Program

Shows the most recently assigned program with its name, type, assignment date, and date range if set. If the athlete has been through multiple programs, previous assignments are listed below (up to 3 shown). If no program is assigned, you see "No program assigned."

### Notes

Your coach notes, displayed exactly as entered (line breaks preserved). Only shows if notes exist.

### Competition History

If the athlete has meet entries, a table shows each competition with:

- Meet name and location
- Date
- Best squat, bench, and deadlift (best successful attempt from the three attempts)
- Calculated total (sum of best attempts)

All weights displayed in kg.

---

## Athlete Profile -- Training Tab

The **Training** tab focuses on session history and current strength levels.

### Current Estimated Maxes

A grid of cards showing every exercise where the athlete has a current max on record. Each card shows:

- Exercise name
- Date the max was recorded
- Working max in kg

### Recent Training

A list of the 20 most recent workout sessions, each showing:

- Session title (or date if no title)
- Date
- Completed exercises vs. total exercises (e.g., "8/10 exercises")
- Completion percentage badge: blue at 80%+, gray at 50-79%, outline below 50%

If the athlete has more than 20 sessions, a note at the bottom shows how many are displayed out of the total (e.g., "Showing 20 of 87 sessions").

---

## Athlete Profile -- Analytics Tab

The **Analytics** tab gives you a high-level snapshot of the athlete's training volume and activity.

### Summary Stats

Five stat cards across the top:

| Stat | Description |
|------|-------------|
| Sessions | Total workout sessions |
| Sets | Total sets logged (formatted with commas for large numbers) |
| PRs | Total max snapshots tracked |
| Meets | Total competition entries |
| Weigh-ins | Total bodyweight log entries |

### Recent Training Frequency

A 4-week heatmap grid (28 squares, 7 per row). Filled squares indicate days the athlete trained. Use this to spot gaps in training consistency at a glance.

### Detailed Charts

A placeholder section for detailed analytics charts (volume over time, strength trends). These will be available once the charting library is integrated.

---

## Editing an Athlete

From any athlete's profile, click **Edit** in the top right. The profile switches to an edit form with the same fields as the Add Athlete form, pre-filled with current values.

You can change any field:

- **Name** -- still required, cannot be blank.
- **Email, bodyweight, weight class** -- update as needed.
- **Experience level** -- change when an athlete progresses (e.g., Beginner to Intermediate).
- **Remote / Competitor / Federation** -- toggle as their situation changes.
- **Notes** -- add or update coach notes.

Click **Save Changes** to apply, or **Cancel** to discard. The profile refreshes automatically after saving.

### When to update bodyweight and weight class

- Update **bodyweight** whenever you get a new weigh-in, especially during meet prep.
- Update **weight class** when an athlete decides to move up or down a class, or after they officially compete in a new class.

---

## Deleting an Athlete

From an athlete's profile, click **Delete** in the top right. A confirmation dialog appears with a warning:

> This will permanently remove their profile, training history, and all associated data. This action cannot be undone.

Click **Delete Athlete** to confirm, or **Cancel** to go back. Deletion removes:

- The athlete's profile and all personal info
- All workout sessions and set logs
- Program assignment history
- Max snapshots and PR records
- Meet entries and competition data
- Bodyweight logs

You are redirected to the athletes list after deletion. There is no way to recover a deleted athlete's data.
