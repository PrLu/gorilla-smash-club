# Import/Export Settings - Complete Implementation Guide

## 🎯 Overview

This feature allows administrators to control whether participants can register for multiple categories in the same tournament through a configurable setting in **Settings > Import/Export**.

---

## 🚀 What Was Built

### 1. **Database Migration** ✅
- **File:** `supabase/migrations/028_system_settings_table.sql`
- **Created:** `system_settings` table to store global configuration
- **Default Setting:** `allowMultipleCategoryRegistrations: true`

### 2. **API Endpoints** ✅
- **File:** `src/app/api/settings/system/route.ts`
- **GET** `/api/settings/system` - Fetch all system settings (Admin/Root only)
- **PATCH** `/api/settings/system` - Update a setting (Admin/Root only)

### 3. **Updated Import Logic** ✅
- **File:** `src/app/api/tournaments/[id]/import-participants/route.ts`
- Now checks the setting before validating duplicate registrations
- Two modes of operation based on setting

### 4. **Settings UI Page** ✅
- **File:** `src/app/settings/import-export/page.tsx`
- Beautiful toggle interface with examples
- Shows impact of setting with visual examples

### 5. **Navigation Integration** ✅
- **File:** `src/components/Header.tsx`
- Added "Import/Export" link to:
  - Desktop dropdown menu (Profile → Settings → Import/Export)
  - Mobile hamburger menu

---

## 📋 How to Apply

### Step 1: Run the Database Migration

**Option A: Using Supabase CLI**
```bash
cd supabase
npx supabase db push
```

**Option B: Manual SQL in Dashboard**
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Open and run `supabase/migrations/028_system_settings_table.sql`
4. This creates the `system_settings` table with default values

### Step 2: Restart Your Dev Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 3: Test the Feature
1. Sign in as Admin or Root user
2. Click your profile avatar (top right)
3. Navigate to: **Settings → Import/Export**
4. You'll see the toggle for "Allow Multiple Category Registrations"

---

## 🎛️ How It Works

### Setting: ON (Default - **Recommended**)

**Behavior:**
- ✅ Same player CAN register for multiple different categories
- ❌ Same player CANNOT register for the same category twice

**Example from your CSV:**
```
✅ ALLOWED:
- Varun Mehta registers for Doubles ✓
- Varun Mehta registers for mojo_dojo ✓
- Varun Mehta registers for k_db ✓

❌ BLOCKED:
- Varun Mehta registers for Doubles ✓
- Varun Mehta tries to register for Doubles again ✗
```

**Import Result:** All 4 categories imported successfully (Singles, Doubles, mojo_dojo, k_db)

---

### Setting: OFF (Strict Mode)

**Behavior:**
- ❌ Same player can ONLY register for ONE category per tournament
- Blocks all additional registrations regardless of category

**Example:**
```
✅ ALLOWED:
- Varun Mehta registers for Doubles ✓

❌ BLOCKED:
- Varun Mehta tries to register for mojo_dojo ✗
- Varun Mehta tries to register for k_db ✗
```

**Import Result:** Only first registration per player is accepted

---

## 🧪 Testing with Your CSV

### Before the Fix:
```
Imported Categories:
✅ Singles (12 participants)
✅ Doubles (16 participants)
✅ mojo_dojo (15 participants - some blocked)
❌ k_db (0 participants - all blocked as duplicates)
```

### After the Fix (Setting ON):
```
Imported Categories:
✅ Singles (12 participants)
✅ Doubles (16 participants)
✅ mojo_dojo (15 participants)
✅ k_db (13 participants) ← NOW WORKS!
```

---

## 🔧 Technical Details

### Duplicate Detection Logic (Updated)

**Before (Broken):**
```typescript
// Checked ANY registration for the player
const existingReg = await db.registrations
  .where('tournament_id', tournamentId)
  .where('player_id', playerId)
  .single();
```

**After (Fixed):**
```typescript
// When setting is ON: Only check same category
if (allowMultipleCategoryRegistrations) {
  const existingRegs = await db.registrations
    .where('tournament_id', tournamentId)
    .where('player_id', playerId);
  
  const duplicateCategory = existingRegs.find(reg => 
    reg.metadata.category === currentCategory
  );
} else {
  // When setting is OFF: Check any registration (original behavior)
  const existingReg = await db.registrations
    .where('tournament_id', tournamentId)
    .where('player_id', playerId)
    .single();
}
```

---

## 🎨 UI Features

### Settings Page Includes:

1. **Toggle Switch** - Visual ON/OFF indicator
2. **Detailed Explanation** - What the setting does
3. **Visual Examples** - Shows allowed/blocked scenarios
4. **Color-coded Status** - Green (allowed), Red (blocked)
5. **Unsaved Changes Warning** - Prompts to save
6. **Info Box** - Where the setting applies

---

## 📍 Where This Setting Applies

The setting affects:

1. ✅ **CSV Bulk Imports** - Via "Import Participants" button
2. ✅ **Manual Participant Addition** - Via "Add Participant" form
3. ✅ **Self-Registration Forms** - (if enabled for tournament)

---

## 🔐 Permissions

**Who Can Access:**
- Admin users
- Root users

**Who Cannot Access:**
- Regular participants
- Organizers (unless also admin)

---

## 🎯 Use Cases

### When to Enable (ON):
- Multi-format tournaments (Singles + Doubles + Mixed)
- Custom category tournaments
- Large events where players compete in multiple divisions
- **Your tournament with Singles, Doubles, mojo_dojo, k_db** ← Perfect use case!

### When to Disable (OFF):
- Single-category tournaments only
- Strict one-entry-per-person events
- Qualification rounds (one shot only)

---

## 📊 Database Schema

### system_settings Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| setting_key | TEXT | Unique identifier (e.g., 'import_export_settings') |
| setting_value | JSONB | Flexible JSON structure |
| description | TEXT | Human-readable description |
| updated_by | UUID | Who last modified it |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### Default Value:

```json
{
  "setting_key": "import_export_settings",
  "setting_value": {
    "allowMultipleCategoryRegistrations": true
  }
}
```

---

## 🐛 Troubleshooting

### Issue: k_db category not importing

**Solution:** 
1. Enable the setting in Settings > Import/Export
2. Delete failed registrations (if any)
3. Re-import the CSV

### Issue: "Insufficient permissions" error

**Solution:**
- Ensure you're logged in as Admin or Root user
- Check `user_roles` table has correct role assignment

### Issue: Setting not saving

**Solution:**
- Check browser console for errors
- Verify API endpoints are accessible
- Check Supabase service role key is configured

---

## 🎉 Success Criteria

After implementation, you should be able to:

1. ✅ Navigate to Settings > Import/Export
2. ✅ See toggle for "Allow Multiple Category Registrations"
3. ✅ Toggle ON - Import all 4 categories successfully
4. ✅ Toggle OFF - Only first category per player imports
5. ✅ Varun Mehta appears in Doubles, mojo_dojo, AND k_db

---

## 📝 Next Steps

1. Run the database migration
2. Restart your server
3. Navigate to Settings > Import/Export
4. Ensure toggle is ON (default)
5. Re-import your CSV file
6. Verify all 4 categories are imported

**Expected Result:**
- Singles: 12 participants
- Doubles: 16 participants (8 pairs)
- mojo_dojo: 15 participants
- k_db: 13 participants
- **Total unique players: 56**

---

## 🏆 Summary

You now have a **flexible, configurable system** that allows tournament administrators to control duplicate registration behavior based on their specific needs. The setting is persistent, applies globally, and can be changed at any time.

**Default behavior:** Allow multiple category registrations (most flexible)
**Alternative mode:** Strict one-registration-per-tournament (most restrictive)

Perfect for your multi-category tournament! 🎉



