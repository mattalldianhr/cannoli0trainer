# TeamBuildr Test Data Export

Real workout data extracted via the TeamBuildr REST API for migration testing.

## Source

- **API Base**: `https://api.teambuildr.com`
- **Auth**: Bearer token (from `accessToken` cookie on `app-v3.teambuildr.com`)
- **Account ID**: `20731`
- **Extraction**: 4,066 API calls, zero errors

## Athletes

| Athlete | User ID | Workout Dates | Date Range | History |
|---------|---------|---------------|------------|---------|
| Matt Alldian | 3534583 | 114 | 2025-05-05 to 2026-02-14 | ~9 months |
| Chris Laakko | 3534582 | 115 | 2025-05-05 to 2026-02-14 | ~9 months |
| Michael Odermatt | 3534584 | 113 | 2025-05-05 to 2026-02-14 | ~9 months |
| Hannah Jenny | 1211113 | 899 | 2021-05-17 to 2026-02-15 | ~4.7 years |
| Maddy Corman | 1207702 | 792 | 2021-05-18 to 2026-02-17 | ~4.7 years |

**Total**: 2,033 workout dates across 5 athletes.

## Files

| File | Size | Description |
|------|------|-------------|
| `teambuildr-full-export-5-athletes.json` | 37 MB | Full export with all history (primary file) |
| `teambuildr-test-data-export.json` | 1.6 MB | Earlier partial export (Dec 2025 - Feb 2026 only, 3 athletes) |
| `SCHEMA.md` | — | Complete field-level API data schema |
| `EXTRACTION_GUIDE.md` | — | How to run a fresh extraction (endpoints, auth, pagination) |

### JSON structure

```json
{
  "metadata": { ... },
  "athletes": {
    "Hannah Jenny": {
      "profile": { ... },
      "dateRange": { "first": "2021-05-17", "last": "2026-02-15", "totalDates": 899 },
      "workoutOverview": [ ... ],
      "workouts": { "2021-05-17": { ... }, ... },
      "summaries": { "2021-05-17": { ... }, ... }
    },
    ...
  }
}
```

## Data Schema

See `SCHEMA.md` for complete field-level documentation.

## API Endpoints Used

| Endpoint | Description |
|----------|-------------|
| `GET /accounts/{id}/users?userType=0` | List all athletes |
| `GET /accounts/{id}/users/{userId}/workouts/overview?dateRangeStart={}&dateRangeEnd={}` | Workout calendar overview (120 day max range, paginate with 90-day windows) |
| `GET /accounts/{id}/users/{userId}/workouts/{date}` | Full workout detail for a date (no range limit) |
| `GET /accounts/{id}/users/{userId}/workouts/{date}/summary` | Session summary (tonnage, reps, duration, PRs) |

## Not Yet Extracted

The following data types are available via the API but not included in this export:

- **Maxes/PR History** - Available via legacy endpoint `GET /assets/max_data_beta.php` (requires separate auth)
- **Body Heat Maps** - `GET /accounts/{id}/users/{userId}/body-heat-map/{date}`
- **Wearable Imports** - `GET /accounts/{id}/integrations/users/{userId}/imports/{date}/summary`
- **Evaluations** - Available via v3 API
- **Journal Entries** - Available via legacy app
- **Exercise Library** - Embedded in workout data (exercise names, types, tracking settings)
