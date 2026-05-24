# D-LITE ChatApp — Frontend Service

Next.js 15 web client for D-LITE ChatApp. Handles UI, auth (with mandatory 2FA), real-time chat, group management, AI assistant, and video calls.

**Port:** `3002`

## Tech Stack

| Layer | Library |
|---|---|
| Framework | Next.js 15 (App Router) |
| Auth | Supabase Auth + TOTP MFA (mandatory aal2) |
| Database | Supabase (Postgres + RLS + Realtime) |
| Styling | Tailwind CSS + CSS variables (theming) |
| Animations | Framer Motion |
| Media uploads | Cloudinary (`CldUploadWidget`, preset `dlite_avatars`) |
| Video calls | ZEGOCLOUD UIKit |
| Icons | Lucide React |

## Features

- **Auth flow** — Sign up → set up TOTP authenticator → verify → dashboard (middleware enforces aal2 on every route)
- **Direct messages** — Real-time chat with reactions, edit, delete, block user
- **Groups** — Create, invite members (invite-then-accept flow), mute, leave, manage members, custom group avatar + background
- **AI assistant** — Streaming chat via ai-backend, TTS/STT via Deepgram
- **Video calls** — ZEGOCLOUD UIKit with token from call-service
- **Notifications** — Dashboard panel showing pending group invites (accept/decline)
- **Theming** — Light/dark/system modes with CSS variable tokens

## Project Structure

```
src/
  app/              # Next.js App Router pages
    (auth)/         # Login, signup, password reset
    (app)/          # Protected: dashboard, chat, groups, ai, calls
  features/
    auth/           # Auth forms, MFA setup/verify pages
    chat/           # DM chat hooks + components
    group/          # Group hooks (messages, list, invites) + components
    dashboard/      # Dashboard page components
    ai/             # AI chat interface
  shared/
    components/     # Avatar, Badge, Toast, Composer, etc.
  core/
    auth/           # Supabase client factory
  middleware.ts     # Route protection + MFA enforcement
```

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=dlite_avatars
NEXT_PUBLIC_ZEGO_APP_ID=
NEXT_PUBLIC_CALL_SERVICE_URL=http://localhost:5060
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:5070
```

## Running Locally

```bash
npm install
npm run dev       # http://localhost:3002
```

## Middleware (2FA Enforcement)

`src/middleware.ts` runs on every request (except static assets). Logic:

1. No session → redirect to `/login`
2. Logged in, no MFA factor enrolled → redirect to `/setup-authenticator`
3. Logged in, MFA enrolled but session is aal1 → redirect to `/verify-authenticator`
4. Session is aal2 → allow through
5. Already aal2, visiting auth/MFA pages → redirect to `/dashboard`
