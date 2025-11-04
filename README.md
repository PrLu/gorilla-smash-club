# Pickle Tourney - Pickleball Tournament Manager

A modern, real-time tournament management system built with Next.js, TypeScript, Supabase, and React Query.

## Features

### Phase 1 (Core MVP)
- ✅ **Auth & Profiles**: Email/password + magic link authentication
- 🏆 **Tournament CRUD**: Create and manage tournaments
- 👥 **Player Registration**: Singles and doubles registration
- 📊 **Fixtures Generation**: Automatic single-elimination fixtures
- 🔴 **Live Scoreboards**: Real-time match updates via Supabase Realtime
- 📱 **Mobile-first UI**: Responsive design with Tailwind CSS
- ⚡ **Optimistic Updates**: React Query for fast, cached data

### Phase 2 (Invitations)
- ✉️ **Manual Participant Invites**: Add participants by email
- 👤 **Placeholder Profiles**: Create temporary profiles for invited users
- 🔗 **Secure Invite Links**: Token-based invitation acceptance
- 📧 **Email Integration**: SendGrid or Resend for notifications
- 🔄 **Profile Merging**: Automatic merge when invited user signs up
- 📊 **Participant Management**: Dedicated page for organizers

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Backend**: Supabase (Postgres, Auth, Realtime, Storage)
- **Testing**: Vitest + Testing Library
- **Payment**: Stripe (stub implementation)
- **Hosting**: Vercel (frontend) + Supabase Cloud (backend)

## Quick Start

### Prerequisites

- Node.js 20+
- Supabase account
- Vercel account (for deployment)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd pickle-tourney
npm install
```

### 2. Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup

#### Option A: Supabase Dashboard

1. Go to https://app.supabase.com
2. Select your project → SQL Editor
3. Copy contents of `supabase/migrations/001_init.sql`
4. Paste and run

#### Option B: Supabase CLI

```bash
npm install -g supabase
supabase login
supabase link --project-ref your-project-ref
supabase db push
```

### 4. Enable Realtime

In Supabase Dashboard:
1. Go to Database → Replication
2. Enable replication for:
   - `matches`
   - `registrations`

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
pickle-tourney/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout + providers
│   │   ├── page.tsx            # Landing page
│   │   ├── dashboard/          # Tournament dashboard
│   │   ├── tournament/[id]/    # Tournament detail & live
│   │   ├── profile/            # User profile
│   │   ├── auth/               # Sign in/up pages
│   │   └── api/                # API routes
│   ├── components/             # React components
│   ├── lib/                    # Utilities
│   │   ├── supabaseClient.ts   # Supabase client
│   │   ├── useUser.ts          # Auth hook
│   │   ├── fixtures.ts         # Fixtures generator
│   │   └── hooks/              # React Query hooks
│   └── styles/                 # Global CSS
├── supabase/
│   └── migrations/             # Database migrations
├── tests/                      # Test files
└── package.json
```

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run test         # Run tests
npm run test:ui      # Run tests with UI
```

## Phase 2: Participant Invitations

See [PHASE2_INVITATIONS.md](./PHASE2_INVITATIONS.md) for detailed documentation on:
- Manual participant management
- Email invitation system
- Placeholder profiles and merging
- API endpoints and flows
- Local testing instructions

## Deployment

### Deploy to Vercel

1. Push code to GitHub

2. Import to Vercel:
   - Visit https://vercel.com/new
   - Import your repository
   - Add environment variables from `.env.local`
   - Deploy

3. Configure Supabase:
   - Update authentication redirect URLs in Supabase Dashboard
   - Add your Vercel domain to allowed origins

### Database Migration

Production migrations:
```bash
supabase link --project-ref your-prod-project
supabase db push
```

## Testing Realtime Locally

1. Open two browser windows side-by-side
2. Window 1: Organizer view (`/tournament/{id}`)
3. Window 2: Live scoreboard (`/tournament/{id}/live`)
4. Update match scores in Window 1
5. See real-time updates in Window 2

## Features Walkthrough

### 1. Create Tournament

1. Sign in/up
2. Go to Dashboard
3. Click "Create Tournament"
4. Fill form and submit
5. Tournament created in `draft` or `open` status

### 2. Register Players

1. Navigate to tournament detail page
2. Click "Register Now"
3. Fill player information
4. Registration created with `pending` status

### 3. Generate Fixtures

1. As organizer, go to your tournament
2. Click "Generate Fixtures"
3. Server generates matches based on registrations
4. Fixtures appear on tournament page
5. Tournament status → `in_progress`

### 4. Update Scores

1. Go to Live Scoreboard
2. As organizer, click "Update Score" on any match
3. Enter scores
4. Winner auto-advances to next round
5. All viewers see updates in real-time

## Auto-Advance Logic

When a match is completed:
1. System determines winner (highest score)
2. Winner's ID is saved to `winner_player_id` or `winner_team_id`
3. If `next_match_id` exists, winner auto-fills next match slot
4. Match status → `completed`

## Payment Integration (Stub)

The Stripe integration is stubbed. To implement:

1. Replace stub functions in `src/app/api/stripe/webhook/route.ts`
2. Add Stripe checkout flow in registration
3. Configure webhook endpoint: `https://your-domain.com/api/stripe/webhook`
4. Test with Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (server-only) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ❌ | Stripe publishable key |
| `STRIPE_SECRET_KEY` | ❌ | Stripe secret key (server-only) |
| `STRIPE_WEBHOOK_SECRET` | ❌ | Stripe webhook secret |
| `EMAIL_PROVIDER` | ⚠️ | Email provider (resend/sendgrid/console) |
| `EMAIL_API_KEY` | ⚠️ | Email service API key |
| `EMAIL_FROM` | ⚠️ | Sender email address |
| `INVITE_TOKEN_EXPIRY_HOURS` | ❌ | Invitation expiry (default: 72) |
| `NEXT_PUBLIC_APP_URL` | ❌ | Your app URL |

⚠️ = Required for Phase 2 (Invitations)

## Troubleshooting

### Realtime not working

- Check if replication is enabled in Supabase
- Verify RLS policies allow `SELECT` on tables
- Check browser console for websocket errors

### Fixtures generation fails

- Ensure at least 2 confirmed registrations
- Check `SUPABASE_SERVICE_ROLE_KEY` is set
- Verify organizer permissions

### Build errors

```bash
rm -rf .next node_modules
npm install
npm run build
```

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit pull request

## License

MIT

---

Built with ❤️ for the pickleball community
