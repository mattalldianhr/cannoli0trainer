# Task Group 33: Coach-Athlete Messaging

Spec: specs/16-coach-athlete-messaging.md

### Priority 33: In-App Coach-Athlete Messaging

- [ ] **Task 33.1**: Add Conversation and Message models to Prisma schema
  - Spec: specs/16-coach-athlete-messaging.md
  - Acceptance: `Conversation` model with id, coachId, athleteId, lastMessageAt, lastMessagePreview, unreadCountCoach, unreadCountAthlete. `Message` model with id, conversationId, senderId, senderType (COACH/ATHLETE enum), content (Text), imageUrl (nullable), readAt, createdAt. `SenderType` enum added. Unique constraint on `[coachId, athleteId]`. Indexes on `[conversationId, createdAt]` and `[coachId, lastMessageAt]`. Migration runs successfully: `npx prisma migrate dev --name add-messaging`.

- [ ] **Task 33.2**: Create messaging API routes (send, list, read, mark-read)
  - Spec: specs/16-coach-athlete-messaging.md
  - Acceptance: `POST /api/messages` creates a Message, updates Conversation.lastMessageAt/lastMessagePreview/unreadCount. Auto-creates Conversation if none exists for coach+athlete pair. `GET /api/messages` returns coach's conversations sorted by lastMessageAt with unread counts. `GET /api/messages/[athleteId]` returns paginated messages (50 per page, newest first, `?before={messageId}` for pagination). `PATCH /api/messages/[athleteId]/read` sets `readAt` on all unread messages in conversation and resets appropriate unreadCount. All routes validate auth context (coach vs athlete). Unit tested.

- [ ] **Task 33.3**: Build conversation list (coach inbox) page
  - Spec: specs/16-coach-athlete-messaging.md
  - Acceptance: `/messages` page shows list of all conversations for the coach. Each row: athlete name, avatar placeholder, last message preview (truncated to 60 chars), relative timestamp ("2m ago", "Yesterday"), unread count badge (if > 0). Sorted by most recent message first. Clicking a row navigates to `/messages/[athleteId]`. Empty state: "No conversations yet. Message an athlete from their profile page." Unread conversations visually distinct (bold text, badge). Polls every 30 seconds for new conversations.

- [ ] **Task 33.4**: Build message thread component (shared coach + athlete)
  - Spec: specs/16-coach-athlete-messaging.md
  - Acceptance: `MessageThread` component renders messages in chronological order with date group headers (Today, Yesterday, specific dates). Coach messages aligned right (blue/accent background), athlete messages aligned left (gray background). Each message shows content, timestamp. `MessageInput` component at bottom: text input + send button. Send via Enter key or button tap. Optimistic update: message appears immediately before API confirms. Auto-scrolls to newest message on open. "Load older" button at top fetches next page of messages. Marks conversation as read on mount (calls PATCH read endpoint).

- [ ] **Task 33.5**: Build coach message thread page and athlete profile integration
  - Spec: specs/16-coach-athlete-messaging.md
  - Acceptance: `/messages/[athleteId]` page renders `MessageThread` for the selected conversation. Page header shows athlete name with back arrow to `/messages`. "Message" button added to athlete profile page (`/athletes/[id]`) action bar — clicking navigates to `/messages/[athleteId]`. If no conversation exists yet, page creates one on first message send.

- [ ] **Task 33.6**: Build athlete messaging view
  - Spec: specs/16-coach-athlete-messaging.md
  - Acceptance: `/athlete/messages` page renders `MessageThread` for the authenticated athlete's single conversation with their coach. Page header shows "Coach" / coach name. Accessible via message icon on athlete dashboard and floating action button (FAB) on other athlete pages. If no conversation exists, shows empty state: "No messages yet. Your coach will reach out here." or allows athlete to send first message. Marks messages as read on mount.

- [ ] **Task 33.7**: Add unread badge to coach navigation and implement polling
  - Spec: specs/16-coach-athlete-messaging.md
  - Acceptance: "Messages" link added to coach header navigation (between "Athletes" and "Programs"). Unread badge shows total unread count across all conversations (sum of unreadCountCoach). Badge hidden when count is 0. Badge polls `GET /api/messages/unread-count` every 60 seconds. `MessageThread` polls for new messages every 10 seconds when conversation is open. Polling stops when component unmounts / page is hidden (use `document.visibilityState`).

- [ ] **Task 33.8**: Implement delayed email notification for unread messages
  - Spec: specs/16-coach-athlete-messaging.md
  - Acceptance: When a coach sends a message to an athlete, a 5-minute delayed check fires. If the message's `readAt` is still null after 5 minutes, send an email notification to the athlete via Resend (Spec 14). Email contains: coach name, message preview (first 100 chars), link to `/athlete/messages`. Does NOT send if athlete has muted message notifications (check athlete preferences). Implementation: `setTimeout` in server action (acceptable for v1 scale). Athlete-to-coach messages do NOT trigger email (coach is expected to be in-app).
