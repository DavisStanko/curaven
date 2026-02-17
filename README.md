# Friendr Project Reference (`claude.md`)

## System Overview

Friendr is a high-stakes, ephemeral social platform for 24-hour anonymous pairings.

- **Core Loop**: Auth -> Phone Onboarding -> Queue -> 24h Chat -> Mutual Reveal OR Disconnect.
- **Strict Constraint**: One active match per user. Users are "locked" into the chat view until the match is terminated (manually or by time).

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Backend**: Supabase (Auth, PostgreSQL, Realtime, Edge Functions)
- **Styling**: shadcn/ui (Radix UI) + Tailwind CSS
- **Auth**: Google OAuth (Required) + Phone Number (Metadata/Profile)
- **Notifications**: Resend (Email) + Browser Push API

## Data Schema & Logic

### 1. Database Tables

- **`profiles`**:
  - `id` (uuid, fk to auth.users)
  - `phone_number` (text)
  - `is_searching` (boolean)
- **`matches`**:
  - `id` (uuid)
  - `user_1`, `user_2` (uuid, fk to profiles)
  - `user_1_opt_in`, `user_2_opt_in` (boolean, default: false)
  - `status` (enum: 'active', 'disconnected', 'expired')
  - `created_at` (timestamp, default: now())
- **`messages`**:
  - `id`, `match_id`, `sender_id`, `content`, `created_at`

### 2. State Rules

- **The 24h Clock**: Expiry is calculated as `created_at + interval '24 hours'`.
- **The Reveal**:
  - If `user_1_opt_in` AND `user_2_opt_in` are **TRUE** at the time of expiry/completion: **Send Email**.
  - If either is **FALSE**: **Wipe Data** and end session.
- **Forced Routing**: Middleware or Root Layout should check for an 'active' match. If present, redirect all traffic from `/queue` or `/home` to `/chat/[id]`.

## Notification Logic

| Event                     | Channel              | Delivery Method                              |
| :------------------------ | :------------------- | :------------------------------------------- |
| **New Match Found**       | Browser Notification | Web Push API / Service Worker                |
| **Match Disconnected**    | In-App Toast         | shadcn `use-toast` via Realtime subscription |
| **Mutual Reveal Success** | Email                | Supabase Edge Function + Resend API          |

## Key Components to Build

1.  **`MatchingQueue.tsx`**: Polls or subscribes to a 'searching' status.
2.  **`ChatRoom.tsx`**: Uses Supabase Realtime for messages. Features the "End Chat" (harrassment protection) and "Opt-in to Reveal" toggles.
3.  **`CountdownTimer.tsx`**: Client-side countdown to the 24h mark.
4.  **Edge Function (`process-expiry`)**: A cron job that runs every minute to find matches where `now() > created_at + 24h`, checks opt-in status, and fires emails.

## Technical Goals

- **Zero Persistence**: Messages and match data should be treated as ephemeral.
- **Simplicity**: Use Google Sign-in to offload security and verification concerns.
- **Realism**: No "fluff" features; focus on the 24-hour tension.
