# Spec: Coach-Athlete Messaging

## Job to Be Done
Replace the WhatsApp dependency for coach-athlete communication with in-app messaging — directly addressing the PRD's core problem statement: "constant app-switching between TeamBuildr, WhatsApp, spreadsheets." Every research document and competitor analysis (TrueCoach, BridgeAthletic, CoachMePlus) identifies in-app messaging as a standard feature. The coach currently manages 31-50 athletes via WhatsApp, which creates context-switching overhead and makes it impossible to keep training-related conversations alongside training data.

## Context
- No messaging system exists in any current spec
- Coach currently uses WhatsApp for all athlete communication
- Spec 10 defines the athlete portal at `/athlete/*` — messaging will be accessible from both coach and athlete sides
- Spec 14 (Notifications) defines the notification model and email service — messaging triggers notifications
- Authentication (Spec 10, NextAuth) is required for athlete-side messaging

## Requirements

### Data Model
- `Message` model: id, conversationId, senderId, senderType (COACH | ATHLETE), content (text), imageUrl (optional), createdAt, readAt
- `Conversation` model: id, coachId, athleteId, lastMessageAt, lastMessagePreview, unreadCountCoach, unreadCountAthlete
- One conversation per coach-athlete pair (auto-created when first message is sent or when athlete is added)
- Messages are text-only for v1 (image/video support deferred to Phase 2)

### Coach View
- **Inbox** at `/messages` showing all conversations sorted by most recent message
- Each row: athlete name, avatar, last message preview (truncated), timestamp, unread badge
- **Conversation view** at `/messages/[athleteId]` showing message thread
- Message input: text field + send button at bottom (WhatsApp-style layout)
- Quick-access: "Message" button on athlete profile page (`/athletes/[id]`)
- Unread message count badge in header navigation on "Messages" link

### Athlete View
- **Single conversation** at `/athlete/messages` — athletes only message their coach
- No inbox needed (only one conversation partner)
- Same message thread UI as coach view but simpler navigation
- Accessible from athlete bottom navigation or athlete dashboard
- Note: This does NOT add a 6th bottom nav tab — instead, a message icon button appears on the athlete dashboard and a floating action button (FAB) on other athlete pages

### Notifications
- When coach sends a message: athlete gets email notification (via Resend, Spec 14) if they haven't read the message within 5 minutes
- When athlete sends a message: coach sees unread badge on Messages nav item (no email — coach is likely already in the app)
- Notification preferences: athletes can mute email notifications for messages (stored in athlete preferences)

### Message Features (v1)
- Text messages only (plain text, no markdown/rich text)
- Read receipts: messages marked as read when the conversation is opened
- Unread count: per-conversation, shown as badge
- Timestamp grouping: messages grouped by date (today, yesterday, date headers)
- Auto-scroll to newest message on conversation open

## Acceptance Criteria
- [ ] `Message` and `Conversation` Prisma models created with migration
- [ ] `POST /api/messages` creates a message and updates conversation metadata
- [ ] `GET /api/messages/[athleteId]` returns paginated messages for a conversation
- [ ] `GET /api/messages` returns coach's conversation list sorted by lastMessageAt
- [ ] `PATCH /api/messages/[athleteId]/read` marks all messages in conversation as read
- [ ] `/messages` page shows conversation list with unread badges
- [ ] `/messages/[athleteId]` shows message thread with text input
- [ ] `/athlete/messages` shows single conversation with coach
- [ ] Sending a message appears immediately in the thread (optimistic update)
- [ ] Unread badge appears on "Messages" nav link when unread > 0
- [ ] Email notification sent to athlete if message unread after 5 minutes
- [ ] Read receipts update unread counts when conversation is opened
- [ ] Messages paginated (load 50, then "Load older" button)
- [ ] Mobile-optimized (375px viewport, large tap targets, full-height thread)
- [ ] Conversation auto-created when coach first messages an athlete

## Test Cases
| Input | Expected Output |
|-------|-----------------|
| Coach sends "Great session today" to Matt | Message appears in thread, Matt's unread count increments |
| Matt opens `/athlete/messages` | Sees coach's message, unread count resets to 0 |
| Matt replies "Thanks!" | Message appears in thread, coach sees unread badge |
| Coach opens `/messages` | Sees Matt's conversation at top with "Thanks!" preview |
| Coach has 3 unread conversations | Header "Messages" link shows badge with "3" |
| Athlete with no messages opens messaging | Empty state: "No messages yet. Your coach will reach out here." |
| Coach clicks "Message" on athlete profile | Navigates to `/messages/[athleteId]`, creates conversation if needed |
| Message sent, athlete doesn't read within 5min | Email notification sent to athlete |
| Athlete mutes message notifications | No email sent, in-app badge still shows |

## Technical Notes

### Schema
```prisma
model Conversation {
  id                 String    @id @default(uuid())
  coachId            String
  athleteId          String
  lastMessageAt      DateTime?
  lastMessagePreview String?
  unreadCountCoach   Int       @default(0)
  unreadCountAthlete Int       @default(0)
  createdAt          DateTime  @default(now())

  coach    Coach     @relation(fields: [coachId], references: [id])
  athlete  Athlete   @relation(fields: [athleteId], references: [id])
  messages Message[]

  @@unique([coachId, athleteId])
  @@index([coachId, lastMessageAt])
  @@index([athleteId])
}

model Message {
  id             String       @id @default(uuid())
  conversationId String
  senderId       String
  senderType     SenderType
  content        String       @db.Text
  imageUrl       String?
  readAt         DateTime?
  createdAt      DateTime     @default(now())

  conversation Conversation @relation(fields: [conversationId], references: [id])

  @@index([conversationId, createdAt])
}

enum SenderType {
  COACH
  ATHLETE
}
```

### API Routes
- `GET /api/messages` — coach: list conversations with unread counts
- `GET /api/messages/[athleteId]` — get messages for a conversation (paginated, newest first)
- `POST /api/messages` — send a message `{ athleteId, content }`
- `PATCH /api/messages/[athleteId]/read` — mark conversation as read (resets unread count)

### Component Architecture
- `ConversationList` — coach inbox, list of athlete conversations
- `MessageThread` — shared between coach and athlete, renders messages with date grouping
- `MessageInput` — text input + send button, handles optimistic update
- `MessageBubble` — individual message, styled by sender (left/right alignment)
- `UnreadBadge` — reusable badge component for nav items

### Polling vs Real-time
- **v1: Polling** — `MessageThread` polls `GET /api/messages/[athleteId]?after={lastMessageId}` every 10 seconds when the conversation is open. `ConversationList` polls every 30 seconds. Header unread badge polls every 60 seconds.
- **v2 (deferred)**: Replace polling with Server-Sent Events (SSE) or WebSocket for instant message delivery.

### Delayed Email Notification
- When a message is created, schedule a check after 5 minutes
- Implementation: use a simple `setTimeout` in a server action (adequate for v1 scale of 50 athletes)
- If `readAt` is still null after 5 minutes, send email via Resend
- For production scale: replace with a proper job queue (BullMQ, Inngest) — deferred

### Navigation Updates
- Coach header: Add "Messages" link between "Athletes" and "Programs" in nav
- Coach header: Show unread badge on Messages link (fetch unread count via API)
- Athlete: Message icon on dashboard page; floating action button on other pages
- Athlete profile page: "Message" button in the action bar

## Deferred Features (Phase 2)
- **Image/video messages**: Upload media via S3/Cloudflare R2, render inline in thread
- **Form check videos**: Athlete attaches video to a specific exercise (combines with Video Form Check spec)
- **Group messages / announcements**: Coach broadcasts to all athletes
- **Typing indicators**: Show "Coach is typing..." in real-time
- **Message reactions**: Quick emoji reactions (thumbs up, fire, etc.)
- **Real-time delivery**: SSE or WebSocket replacing polling
- **Message search**: Full-text search across all conversations

## Revision History
| Date | Change |
|------|--------|
| 2026-02-18 | Initial spec created from athlete features audit recommendation |
