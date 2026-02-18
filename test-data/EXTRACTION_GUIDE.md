# TeamBuildr Full Data Extraction Guide

How to pull all athlete data from TeamBuildr via their REST API.

## API Details

| Field | Value |
|-------|-------|
| **Base URL** | `https://api.teambuildr.com` |
| **Auth** | `Authorization: Bearer {token}` |
| **Token Source** | `accessToken` cookie from `app-v3.teambuildr.com` (JWT, 192 chars) |
| **Account ID** | `20731` |
| **Content-Type** | `application/json` |

## Getting the Auth Token

1. Log into TeamBuildr at `https://app-v3.teambuildr.com`
2. Open browser DevTools > Application > Cookies > `app-v3.teambuildr.com`
3. Copy the value of the `accessToken` cookie
4. Use as: `Authorization: Bearer {accessToken}`

Or from the browser console:
```js
document.cookie.split('accessToken=')[1].split(';')[0]
```

Token refreshes periodically. If you get 401s, grab a fresh token.

## Target Athletes

| Athlete | User ID |
|---------|---------|
| Matt Alldian | `3534583` |
| Chris Laakko | `3534582` |
| Michael Odermatt | `3534584` |

## Endpoints

### 1. List All Athletes

```
GET /accounts/20731/users?userType=0
```

Returns array of user objects with `id`, `first`, `last`, `email`, `calendarAssignment`, `groupAssignments`.

### 2. Workout Overview (Calendar)

```
GET /accounts/20731/users/{userId}/workouts/overview?dateRangeStart={YYYY-MM-DD}&dateRangeEnd={YYYY-MM-DD}
```

Returns one entry per day with `date`, `actionableItems`, `completedItems`, `completionPercentage`, `statusDescription`.

**Max range: 120 days per request.** Paginate with sliding windows for full history.

Use `statusDescription` values:
- `"NO_WORKOUT"` — no prescribed workout
- `"NOT_STARTED"` — prescribed but not started
- `"PARTIALLY_COMPLETED"` — some exercises done
- `"FULLY_COMPLETED"` — all exercises done

### 3. Workout Detail (Per Date)

```
GET /accounts/20731/users/{userId}/workouts/{YYYY-MM-DD}
```

Returns full workout with exercises, sets, reps, weights, completion status, maxes, and coach notes. **No date range limit** — works for any single date.

Key fields per workout item:
- `exercise.name` — Exercise name
- `exercise.type` — "L" (Lift), "S" (SAQ+C), "C" (Circuit)
- `tableData[].values[]` — Set-level data (weight as `primary1`, reps as `reps`)
- `fullyCompleted` — Whether athlete completed the exercise
- `workingMax` — Current working max at time of workout
- `generatedMax` — Max generated from this session
- `additionalInformation` — Coach notes (RPE, instructions)
- `totalLoad` / `totalReps` — Aggregate metrics

### 4. Session Summary (Per Date)

```
GET /accounts/20731/users/{userId}/workouts/{YYYY-MM-DD}/summary
```

Returns:
- `setsCompleted` — Total sets done
- `repsCompleted` — Total reps done
- `tonnage` — Total volume load (kg)
- `sessionDurationInSeconds` — Time spent
- `newPRs[]` — Array of `{exerciseId, exerciseName, maxValue}` for PRs hit that session

### 5. Other Endpoints (Not Yet Fully Tested)

```
GET /accounts/20731/users/{userId}/body-heat-map/{YYYY-MM-DD}
GET /accounts/20731/integrations/users/{userId}/imports/{YYYY-MM-DD}/summary
GET /me
GET /account
GET /accounts/20731/organization/settings
```

## Full Export Strategy

### Step 1: Get all athletes

```
GET /accounts/20731/users?userType=0
```

Save the user list. Extract `id`, `first`, `last`, `calendarAssignment`, `groupAssignments` for each.

### Step 2: Discover all workout dates per athlete

Paginate the overview endpoint in **90-day windows** (safe margin under 120-day limit), walking backward from today until you get empty results.

```
Window 1: today - 90 days  →  today
Window 2: today - 180 days →  today - 90 days
Window 3: today - 270 days →  today - 180 days
...continue until a window returns zero actionableItems
```

Collect all dates where `actionableItems > 0`.

### Step 3: Fetch workout details

For each date with data, fetch both:
```
GET /accounts/20731/users/{userId}/workouts/{date}
GET /accounts/20731/users/{userId}/workouts/{date}/summary
```

**Concurrency**: 5 parallel requests works fine. No rate limiting observed at this level.

### Step 4: Store results

Save as structured JSON per athlete:
```json
{
  "profile": { ... },
  "workoutOverview": [ ... ],
  "workouts": { "2025-12-01": { ... }, ... },
  "summaries": { "2025-12-01": { ... }, ... }
}
```

## Pagination Example (JavaScript)

```js
async function getAllWorkoutDates(userId) {
  const allDates = [];
  const today = new Date();
  let endDate = new Date(today);

  while (true) {
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 90);

    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];

    const overview = await tbApi(
      `/accounts/20731/users/${userId}/workouts/overview?dateRangeStart=${start}&dateRangeEnd=${end}`
    );

    const datesWithWorkouts = overview
      .filter(d => d.actionableItems > 0)
      .map(d => d.date);

    if (datesWithWorkouts.length === 0) break; // No more data

    allDates.push(...datesWithWorkouts);
    endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() - 1); // Move window back
  }

  return allDates;
}
```

## Data Not Available via V3 REST API

These require the **legacy PHP endpoints** on `app.teambuildr.com`:

| Data | Legacy Endpoint | Notes |
|------|----------------|-------|
| Maxes/PR History | `GET /assets/max_data_beta.php` | Full PR history with dates, values, sources. Uses query-string auth (session_id, session_key cookies). |
| Calendar Program Data | `GET /assets/cal_data-beta.php` | Prescribed program per calendar (not per athlete). |

These legacy endpoints use different authentication (PHP session cookies: `session_id`, `session_key`, `v2token`) and are server-rendered — they may return HTML rather than JSON. For these, the Raw Data CSV export from Reporting may be more reliable.

## Rate Limits & Practical Notes

- **No explicit rate limiting observed** at 5 concurrent requests
- **Token expiry**: The `accessToken` JWT expires periodically (check `tokenExpiration` cookie for Unix timestamp). If calls start returning 401, refresh the token from the browser.
- **Units**: All weights in kilograms for this account. Check account settings for unit preference.
- **Date format**: Always `YYYY-MM-DD`
- **Overview max range**: 120 days inclusive. Use 90-day windows for safety margin.
- **Empty workouts**: The overview may show dates with `actionableItems > 0` but the workout detail shows no tableData if exercises were prescribed but had no sets configured.
