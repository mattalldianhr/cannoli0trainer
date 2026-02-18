# Exercise Library

The exercise library is a searchable database of 873+ exercises pre-loaded from the free-exercise-db, plus any custom exercises you add. Every exercise you assign in a program comes from this library, so keeping it organized saves you time when you're building training blocks.

## Browsing Exercises

Open the library from the top navigation at **Exercises**. You'll see every exercise listed alphabetically, with a count of the total at the top.

### Search

The search bar at the top filters exercises by name as you type. Searching "squat" returns Back Squat, Front Squat, Pause Squat, Goblet Squat, and every other variation in the database. The results update instantly -- no need to press Enter.

### Filter by Category

Below the search bar, category chips let you narrow the list:

- **Strength** -- general barbell, dumbbell, and machine work
- **Powerlifting** -- squat, bench, deadlift and their direct variations
- **Olympic** -- clean, snatch, jerk variations
- **Strongman** -- atlas stones, yoke, log press, farmer's walk
- **Plyometrics** -- box jumps, bounds, depth drops
- **Stretching** -- mobility and flexibility work
- **Cardio** -- conditioning movements

Tap a category to filter. Tap "All" to clear the filter.

### Filter by Tags

Tag chips appear below the categories and let you drill down further within whatever category you have selected:

- **Competition Lifts** -- the three contested lifts (squat, bench press, deadlift)
- **Variations** -- close-grip bench, pause squat, deficit deadlift, etc.
- **Accessory** -- supplemental work (rows, presses, curls, extensions)
- **GPP** -- general physical preparedness (sled work, carries, conditioning)

You can combine tag filters. Selecting both "Competition Lifts" and "Variations" shows exercises tagged with either label.

### Reading the Exercise Card

Each card in the list displays:

- **Name** -- with a "Competition" badge if it's a contested lift, or a "Variation" badge for comp variations
- **Category** -- e.g. "Powerlifting" or "Strength"
- **Equipment** -- barbell, dumbbell, cable, bodyweight, etc.
- **Primary muscles** -- the first two target muscles (visible on wider screens)
- **Force type** -- push, pull, or static (right side, wider screens)
- **Level** -- beginner, intermediate, or expert (right side, wider screens)

## Exercise Details

Each exercise stores the following properties:

| Field | Description |
|-------|-------------|
| Name | The exercise name (required) |
| Category | One of the seven categories above (required) |
| Force | Push, pull, or static |
| Level | Beginner, intermediate, or expert |
| Mechanic | Compound or isolation |
| Equipment | Free text -- barbell, dumbbell, cable, machine, etc. |
| Primary muscles | Target muscle groups |
| Tags | One or more of: competition lift, competition variation, accessory, GPP |
| Video URL | A YouTube or Vimeo link for demonstration |
| Coaching cues | Free-text notes on how to perform the movement |

For powerlifting coaches, the combination of category, tags, and mechanic tells you everything you need at a glance. A "Powerlifting / Competition Lift / Compound" exercise is a contested lift. A "Strength / Accessory / Isolation" exercise is supplemental work.

## Adding Custom Exercises

The pre-seeded library covers a wide range, but you'll want to add custom exercises for:

- Movements specific to your coaching (e.g., "Larsen Press", "Pin Squat at Parallel", "2-Count Pause Bench")
- Exercises with names your athletes already know from their previous programs
- Rehab or corrective work you prescribe frequently
- Federation-specific variations (e.g., "Competition Deadlift -- Sumo" vs "Competition Deadlift -- Conventional")

### Form Walkthrough

1. From the exercise library, click **Add Exercise** in the top right
2. Fill in the exercise info:
   - **Name** (required) -- be specific. "Tempo Back Squat 3-1-2" is more useful than "Squat"
   - **Category** (required) -- pick the most appropriate of the seven categories
   - **Equipment** -- what's needed to perform it
   - **Force** -- push, pull, or static (optional but helpful for filtering)
   - **Level** -- beginner, intermediate, or expert (optional)
   - **Mechanic** -- compound or isolation (optional)
3. Select **Tags** -- check the boxes that apply. A competition variation should get both "Competition Variation" and whichever other tags are relevant
4. Add a **Video URL** and **Coaching Cues** (see below)
5. Click **Create Exercise**

You'll be redirected back to the library where your new exercise appears in the list.

## Tags

Tags are how the library distinguishes between a contested lift, a close variation, a supplemental accessory, and general conditioning. They control what shows up when you use the tag filters on the main library page.

### Powerlifting Tags

| Tag | When to Use | Examples |
|-----|-------------|---------|
| Competition Lift | The exact lift as performed on the competition platform | Back Squat, Bench Press, Deadlift |
| Competition Variation | A variation of a competition lift used in training | Pause Squat, Close-Grip Bench, Deficit Deadlift, Pin Squat |
| Accessory | Supplemental strength work | Barbell Row, Dumbbell Press, Leg Press, Lat Pulldown |
| GPP | General conditioning and work capacity | Sled Push, Farmer's Walk, Prowler, Bike Sprints |

If you're building a typical powerlifting program, your main movements carry the "Competition Lift" tag, your variations carry "Competition Variation", and everything else is either "Accessory" or "GPP". This makes filtering during program building fast -- you can quickly pull up just your squat variations or just your accessories.

An exercise can have multiple tags. A Tempo Back Squat might be tagged as both "Competition Variation" and "Accessory" depending on how you use it in your programming.

## Video Links

Adding video links to exercises gives your athletes a reference for form without you having to explain the same movement in a text message for the tenth time.

### Adding a Video URL

On the Add Exercise form (or when editing an existing exercise), paste a YouTube or Vimeo URL into the **Video URL** field. The form accepts standard URLs:

- `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- `https://youtu.be/dQw4w9WgXcQ`
- `https://vimeo.com/123456789`

As soon as you paste a valid URL, a video preview appears below the input so you can confirm it's the right clip before saving.

### Tips for Video Links

- Use your own demonstration videos when possible -- athletes respond better to seeing their own coach's cues than a random YouTube tutorial
- Keep videos short and focused on the specific movement, not a full workout
- If you use the same video source across many exercises (e.g., a playlist), paste the direct link to the individual video, not the playlist URL
- Vimeo and YouTube are the two supported platforms. Other video hosts won't generate an embedded preview, though the URL will still be saved
