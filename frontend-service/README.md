# D-LITE ChatApp — Frontend Service

Next.js 16 web client for D-LITE ChatApp. Handles all user-facing UI: authentication with mandatory 2FA, real-time direct messages, group chats, AI assistant, video calls, notifications, and theming.

**Port:** `3002`

---

## Tech Stack

| Layer | Library / Version |
|---|---|
| Framework | Next.js `16.2.4` (App Router) |
| UI library | React `19.2.4` |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 + CSS custom properties (theming) |
| Animations | Framer Motion `12` |
| Auth | Supabase Auth (`@supabase/supabase-js` `2.x` + `@supabase/ssr`) |
| Database | Supabase Postgres + RLS + Realtime `postgres_changes` |
| Real-time presence | Socket.IO client `4.x` (connected to realtime-service) |
| Media uploads | `next-cloudinary` + Cloudinary upload widget |
| Video calls | `@zegocloud/zego-uikit-prebuilt` `2.x` |
| Icons | Lucide React `1.x` |
| Virtualisation | `@tanstack/react-virtual` (message lists) |
| UI primitives | Radix UI Dialog, Slot |

---

## Features

### Authentication & Security
- Sign up with email + password
- **Mandatory TOTP 2FA** — every user must enroll an authenticator app before accessing any page; the `proxy.ts` middleware enforces this on every request
- MFA assurance level checked via `supabase.auth.mfa.getAuthenticatorAssuranceLevel()`:
  - `aal1` + no factor enrolled → redirect to `/setup-authenticator`
  - `aal1` + factor enrolled → redirect to `/verify-authenticator`
  - `aal2` → access granted
- Password reset via email link
- `auth/callback` route handles OAuth + magic-link redirects

### Direct Messages
- Real-time chat powered by Supabase Realtime `postgres_changes` subscriptions
- Emoji reactions with grouped counts (animated picker)
- Edit and delete own messages
- Block users (prevents sending/receiving)
- Typing indicators via Socket.IO
- Unread message badge with count
- Date separators in message list
- Message scroll virtualization via `@tanstack/react-virtual`

### Groups
- Create groups (name, description, public/private)
- **Invite flow** — adding a member sends a `group_invites` row; the target user must accept before appearing in `group_members`
- Accept / decline group invites from the sidebar or notifications panel
- Owner can cancel pending invites
- Owner/admin can remove members
- Block users from within the group members panel
- Mute group notifications (silences unread badge)
- Leave group (with confirmation dialog)
- **Group avatar & background customization** — owner can upload a logo via Cloudinary and choose from 16 color/gradient background presets
- Roles: `owner`, `admin`, `mod`, `member` (displayed as badges)
- Real-time message reactions in groups

### AI Assistant
- Multi-turn streaming chat with the D-Lite persona
- Connects to `ai-backend` via SSE (`/chat/stream`)
- Typewriter animation as chunks arrive
- Text-to-speech playback (Deepgram TTS via `ai-backend`)
- Voice input (Deepgram STT via `ai-backend`)

### Video / Audio Calls
- ZEGOCLOUD UIKit prebuilt room component
- Kit Token fetched from `call-service` on call initiation
- Room ID derived from sorted user IDs — no coordination needed
- Supports 1:1 audio and video calls

### Dashboard & Notifications
- Greeting based on time of day
- Favourite chats widget (most recent DMs)
- **Notifications panel** — shows pending group invites with accept/decline actions; empty state when all caught up

### Theming
- Light, dark, and system modes
- All colours defined as CSS custom properties (`var(--brand-text)`, `var(--surface)`, `var(--border)`, etc.)
- Theme toggle in settings

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/                  # Public: login, signup, forgot-password, reset-password
│   │   └── layout.tsx
│   ├── (app)/                   # Protected: requires aal2 session
│   │   ├── dashboard/           # Dashboard page
│   │   ├── chat/[userId]/       # DM conversation page
│   │   ├── groups/
│   │   │   ├── page.tsx         # Groups landing (redirects to first group)
│   │   │   └── [groupId]/       # Group chat page
│   │   ├── ai/                  # AI assistant page
│   │   ├── calls/               # Call history page
│   │   └── settings/            # Profile & appearance settings
│   ├── auth/callback/           # Supabase OAuth/magic-link callback
│   ├── setup-authenticator/     # TOTP enrollment page
│   ├── verify-authenticator/    # TOTP challenge page
│   └── layout.tsx
├── features/
│   ├── auth/                    # Auth forms, MFA components
│   ├── chat/
│   │   ├── hooks/
│   │   │   └── use-messages.ts  # DM messages + realtime subscription
│   │   └── components/          # ChatHeader, MessageBubble, Composer, EmojiPicker, etc.
│   ├── group/
│   │   ├── hooks/
│   │   │   ├── use-group-messages.ts   # Group messages + realtime
│   │   │   ├── use-group-list.ts       # Sidebar group list
│   │   │   └── use-group-invites.ts    # Pending invites for current user
│   │   └── components/
│   │       ├── GroupListSidebar.tsx    # Left sidebar with group list + invite cards
│   │       ├── GroupHeader.tsx         # Chat header with avatar, mute, leave
│   │       ├── GroupMessageBubble.tsx  # Message bubble with reactions/edit/delete
│   │       ├── MembersPanel.tsx        # Right panel: members, pending invites, manage
│   │       ├── GroupInfoModal.tsx      # Group info overlay
│   │       ├── GroupEditModal.tsx      # Owner: change logo + background color
│   │       ├── AddMemberModal.tsx      # Search & invite users
│   │       ├── CreateGroupModal.tsx    # Create new group
│   │       └── RoleBadge.tsx           # owner/admin/mod/member badge
│   ├── dashboard/
│   │   ├── components/
│   │   │   ├── Greeting.tsx
│   │   │   ├── FavouriteChats.tsx
│   │   │   └── NotificationsPanel.tsx  # Group invite accept/decline
│   │   └── lib/mock-data.ts            # Shared type definitions (User, GroupPreview, etc.)
│   └── ai/                             # AI chat UI components and hooks
├── shared/
│   ├── components/
│   │   ├── Avatar.tsx           # User avatar with online indicator
│   │   ├── Badge.tsx            # Unread count badge
│   │   ├── Toast.tsx            # Toast notification system
│   │   └── ...
│   └── hooks/                   # Shared hooks (useDebounce, etc.)
├── core/
│   └── auth/
│       └── supabase-client.ts   # Supabase browser client factory (singleton)
└── proxy.ts                     # Route protection + MFA enforcement (Next.js middleware)
```

---

## Route Protection (`proxy.ts`)

The `proxy.ts` file runs as Next.js middleware on every request except static assets. Logic:

```
Request
  │
  ├── No session → redirect /login
  │     (except: /login, /signup, /forgot-password, /reset-password, /auth/callback)
  │
  ├── Session exists → check MFA assurance level
  │     │
  │     ├── currentLevel === aal2 (fully verified)
  │     │     ├── Visiting auth/MFA page → redirect /dashboard
  │     │     └── Anywhere else → allow ✓
  │     │
  │     ├── Visiting /setup-authenticator or /verify-authenticator → allow ✓
  │     │
  │     ├── nextLevel === aal1 (no MFA enrolled) → redirect /setup-authenticator
  │     │
  │     └── nextLevel === aal2 + currentLevel !== aal2 → redirect /verify-authenticator
```

Matcher excludes: `_next/static`, `_next/image`, `favicon.ico`, and image file extensions.

---

## Supabase Realtime Subscriptions

| Hook | Table | Events |
|---|---|---|
| `use-messages` | `direct_messages` | INSERT, UPDATE, DELETE |
| `use-group-messages` | `group_messages` | INSERT, UPDATE, DELETE |
| `use-group-messages` | `group_message_reactions` | INSERT, DELETE |
| `use-group-invites` | `group_invites` | INSERT |
| `use-group-list` | Triggered via `dlite:group-created` custom event |

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Cloudinary (group avatar uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
# Upload preset configured in Cloudinary dashboard (unsigned, folder: dlite_avatars)

# ZEGOCLOUD (video calls)
NEXT_PUBLIC_ZEGO_APP_ID=12345678

# Backend service URLs
NEXT_PUBLIC_CALL_SERVICE_URL=http://localhost:5060
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:5070
NEXT_PUBLIC_REALTIME_SERVICE_URL=http://localhost:5050
```

---

## Running Locally

```bash
npm install

cp .env.example .env.local   # fill in all env vars

npm run dev      # starts at http://localhost:3002
npm run build    # production build
npm run lint     # ESLint check
```

---

## Docker

```bash
# From project root
docker compose up frontend-service

# Or build directly
docker build -t dlite-frontend .
docker run -p 3002:3002 --env-file .env.local dlite-frontend
```

---

## Key Design Decisions

- **Flat Supabase queries over nested joins** — Group message hooks use separate queries for messages, members, and reactions to avoid PostgREST FK disambiguation issues when a table has multiple foreign keys to the same target table.
- **Invite-then-accept group flow** — Owners cannot directly add users to `group_members`; they send a `group_invites` row, and the invitee must accept. This respects user privacy and Supabase RLS boundaries.
- **CSS variables for theming** — All colours are `var(--token)` references defined per-theme on `:root`, so switching themes is a single class change with no React re-renders.
- **`proxy.ts` not `middleware.ts`** — This Next.js version uses `proxy.ts` as the middleware file convention. Both cannot coexist.
