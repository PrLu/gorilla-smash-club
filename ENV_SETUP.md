# Environment Variables Setup

## Required Environment Variables

Create or update your `.env.local` file in the project root with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Service Role Key (Required for admin features)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Application URL (Required for invitation emails)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Where to Get These Values

### 1. Supabase URL and Anon Key

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Find:
   - **Project URL** → Copy to `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → Copy to `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Service Role Key

**⚠️ IMPORTANT: Keep this secret! Never commit to git!**

1. In the same **Settings** → **API** page
2. Find **service_role key** (you may need to click "Reveal")
3. Copy to `SUPABASE_SERVICE_ROLE_KEY`

**What it's used for:**
- Creating user accounts (bulk import, add players)
- Deleting users (root only)
- Admin operations that bypass RLS

### 3. Application URL

**Development:**
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Production:**
```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

**What it's used for:**
- Invitation email redirect links
- Password reset links
- Email verification links

## Example `.env.local` File

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYyMzQwMjA4MCwiZXhwIjoxOTM4OTc4MDgwfQ.example_key_here

# Service Role (KEEP SECRET!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjIzNDAyMDgwLCJleHAiOjE5Mzg5NzgwODB9.example_service_key_here

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Security Best Practices

### ✅ DO:
- Keep `.env.local` in `.gitignore` (should already be there)
- Use different keys for development and production
- Store production keys in your hosting platform's environment variables
- Rotate service role key if compromised

### ❌ DON'T:
- Never commit `.env.local` to git
- Never share service role key publicly
- Never use service role key in client-side code
- Never expose service role key in frontend

## Verifying Your Setup

### Test if environment variables are loaded:

Create a test API route or check in terminal:

```bash
# In project directory
npm run dev

# In another terminal
curl http://localhost:3000/api/health
```

### Check if variables are set:

```typescript
// In any API route
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET ✅' : 'MISSING ❌');
console.log('Service Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET ✅' : 'MISSING ❌');
console.log('App URL:', process.env.NEXT_PUBLIC_APP_URL ? 'SET ✅' : 'MISSING ❌');
```

## Troubleshooting

### "Service role key is undefined"
**Problem:** `SUPABASE_SERVICE_ROLE_KEY` not set
**Solution:** 
1. Check `.env.local` exists in project root
2. Verify the key is copied correctly
3. Restart your dev server (`npm run dev`)

### "Failed to send invitation email"
**Problem:** `NEXT_PUBLIC_APP_URL` not set or incorrect
**Solution:**
1. Set `NEXT_PUBLIC_APP_URL` in `.env.local`
2. Use full URL with protocol (http:// or https://)
3. Restart dev server

### "Insufficient permissions" even with service role
**Problem:** Using anon key instead of service role
**Solution:**
1. Check you're creating admin client correctly:
   ```typescript
   const supabaseAdmin = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.SUPABASE_SERVICE_ROLE_KEY!, // Not anon key!
     { auth: { autoRefreshToken: false, persistSession: false } }
   );
   ```

## Features Requiring Service Role Key

These features will NOT work without `SUPABASE_SERVICE_ROLE_KEY`:

- ❌ Add Player (manual)
- ❌ Bulk Import Players (general)
- ❌ Import Participants to Tournament
- ❌ Delete Players (root only)

## Features Requiring App URL

These features need `NEXT_PUBLIC_APP_URL` for email links:

- ❌ Tournament participant import (invitation emails)
- ❌ Password reset emails
- ❌ Email verification links

## Production Deployment

### Vercel
1. Go to your project settings
2. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL`
3. Redeploy

### Other Platforms
Similar process - add env vars in your platform's dashboard/settings.

---

**After setting up:** Restart your dev server for changes to take effect!

