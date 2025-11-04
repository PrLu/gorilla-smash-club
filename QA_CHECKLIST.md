# Phase 1 Manual QA Checklist

Test these features to verify the MVP is working correctly.

## 1. Authentication Flow
- [ ] Sign up with email/password
- [ ] Receive confirmation email (if enabled in Supabase)
- [ ] Sign in with email/password
- [ ] Request magic link
- [ ] Sign in via magic link
- [ ] Sign out successfully

## 2. Profile Management
- [ ] Navigate to Profile page
- [ ] Update full name and phone
- [ ] Save changes and verify toast notification
- [ ] Reload page and confirm data persists

## 3. Tournament Creation
- [ ] Go to Dashboard
- [ ] Click "Create Tournament"
- [ ] Fill out tournament form with all required fields
- [ ] Submit form
- [ ] Verify redirect to tournament detail page
- [ ] Verify tournament appears in "My Tournaments" section

## 4. Tournament Registration
- [ ] Navigate to an open tournament (not as organizer)
- [ ] Click "Register Now"
- [ ] Fill out player registration form
- [ ] Submit registration
- [ ] Verify success toast
- [ ] Confirm registration appears in database

## 5. Fixtures Generation
- [ ] Create tournament with at least 2 confirmed registrations
- [ ] Click "Generate Fixtures" (must be organizer)
- [ ] Verify matches are created
- [ ] Check fixtures view displays correctly
- [ ] Verify tournament status changes to "in_progress"

## 6. Live Scoreboard & Real-time Updates
- [ ] Open tournament in two browser windows (or incognito)
- [ ] Window 1: Navigate to tournament detail page
- [ ] Window 2: Navigate to Live Scoreboard (`/tournament/{id}/live`)
- [ ] In Window 1 (as organizer): Update a match score
- [ ] Window 2: Verify score updates automatically without refresh
- [ ] Verify match status changes to "completed"

## 7. Match Management
- [ ] As organizer, go to Live Scoreboard
- [ ] Click "Update Score" on a pending match
- [ ] Enter scores for both players/teams
- [ ] Click "Save"
- [ ] Verify winner is determined correctly
- [ ] Check if winner auto-advances to next round (if applicable)

## 8. Data Persistence
- [ ] Create tournament, add registrations, generate fixtures
- [ ] Close browser
- [ ] Reopen and sign in
- [ ] Verify all data is still present
- [ ] Check "My Tournaments" shows created tournaments

---

## Known Limitations (Phase 1)

- Payments are stubbed (Stripe integration incomplete)
- Double elimination fixtures not implemented (only single elimination)
- Team creation UI not included (can be done via SQL)
- Court assignments are manual
- No automated scheduling
- Email notifications not configured
- Image uploads not implemented

## Success Criteria

✅ All 8 test sections pass
✅ Realtime updates work between browser windows
✅ No console errors in browser
✅ All forms validate correctly
✅ Data persists across sessions

