# Quick Setup Guide

Follow these steps to get your Gorilla Smash Club tournament manager up and running.

## 1. Install Dependencies

```bash
npm install
```

## 2. Configure Environment Variables

Create `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 3. Set Up Supabase Database

### Option A: Using Supabase Dashboard

1. Go to your Supabase project: https://app.supabase.com
2. Click on "SQL Editor" in the left sidebar
3. Create a new query
4. Copy the entire contents of `supabase/migrations/001_init.sql`
5. Paste into the SQL Editor
6. Click "Run" to execute the migration

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI globally
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Push the migration
supabase db push
```

## 4. Enable Realtime in Supabase

1. Go to Database → Replication in your Supabase dashboard
2. Enable replication for these tables:
   - `matches`
   - `registrations`

## 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app!

## 6. Test the Application

Create a test tournament:
1. Sign up for an account
2. Go to Dashboard
3. Click "Create Tournament"
4. Fill in the form
5. View the tournament detail page

## Deployment to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add environment variables in Vercel dashboard
4. Deploy!

## Troubleshooting

### Database Connection Issues

- Verify your Supabase URL and keys are correct
- Check that your Supabase project is active
- Ensure RLS policies are enabled (they're created by the migration)

### Build Errors

```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run build
```

### TypeScript Errors

```bash
# Regenerate types from Supabase
npx supabase gen types typescript --project-id your-project-id > src/lib/database.types.ts
```

## Next Steps

- Implement the double elimination bracket logic in `src/lib/bracket.ts`
- Complete the Stripe payment integration in `src/pages/api/stripe-webhook.ts`
- Add more comprehensive tests in `tests/`
- Customize the styling in `src/styles/globals.css`
- Add player profiles and team management features

## Support

Need help? Check the [README.md](./README.md) for detailed documentation.

