# Task Group 21: Athlete Training Log — Deferred Features

Source spec: specs/06-athlete-training-log.md

### Priority 21: Training Log Enhancements

- [ ] **Task 21.1**: Implement rest timer between sets
  - Spec: specs/06-athlete-training-log.md
  - Acceptance: After completing a set, an optional rest timer appears. Timer duration defaults to WorkoutExercise.restTimeSeconds if set, otherwise a global default of 120 seconds. Timer has start, pause, and dismiss controls. Countdown is visible inline or as a floating overlay. Audio beep or device vibration fires when timer reaches zero. Dismissing the timer does not block logging the next set. Timer state resets when starting a new set.

- [ ] **Task 21.2**: Add per-exercise notes field for athlete comments
  - Spec: specs/06-athlete-training-log.md
  - Acceptance: Each exercise in the training log view has a collapsible "Notes" text area below the set logging grid. Athlete can type free-text notes during the workout. Notes are saved to the WorkoutExercise.notes field (or SetLog.notes if per-set granularity is needed). Notes persist after page reload. Coach can view athlete notes on the athlete profile training history view.

- [ ] **Task 21.3**: Document offline queueing approach (stretch goal)
  - Spec: specs/06-athlete-training-log.md
  - Acceptance: A markdown document or code comments describe the offline queueing strategy: on set completion, if the fetch to save the SetLog fails, the payload is stored in localStorage with a timestamp. A background sync function (setInterval or navigator.onLine listener) retries queued requests when connectivity returns. A "pending sync" badge appears in the training log UI when items are queued. This task covers design documentation and basic localStorage queue implementation — full resilience and conflict resolution are out of scope.

- [ ] **Task 21.4**: Implement offline queue for set logs with localStorage
  - Spec: specs/06-athlete-training-log.md
  - Acceptance: When a set log POST request fails due to network error, the payload is saved to localStorage under a `pendingSetLogs` key as a JSON array. When the app detects connectivity (navigator.onLine event or successful API call), queued items are replayed in order via POST requests. Successfully synced items are removed from the queue. A small badge or indicator shows "N sets pending sync" in the training log header. Queue is limited to 100 entries to prevent unbounded storage growth.
