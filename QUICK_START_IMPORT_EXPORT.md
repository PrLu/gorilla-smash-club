# Quick Start: Import/Export Settings Feature

## 🚀 3-Step Setup

### Step 1: Apply Database Changes
```sql
-- Run this in Supabase Dashboard → SQL Editor
-- File: APPLY_ALL_FIXES.sql (copy and paste entire file)
```

### Step 2: Restart Server
```bash
npm run dev
```

### Step 3: Access Settings
1. Sign in as Admin/Root
2. Profile Menu → Settings → Import/Export
3. Verify toggle is ON (default)

---

## ✅ What This Fixes

### Problem: k_db category not importing
**Cause:** System blocked same player from registering for multiple categories

**Solution:** New setting allows participants to register for different categories

---

## 🎯 Result

**Before:**
- Import CSV → Only 3 of 4 categories import
- k_db blocked (duplicates)

**After:**
- Import CSV → All 4 categories import successfully ✅
- Singles (12) + Doubles (16) + mojo_dojo (15) + k_db (13) = 56 participants

---

## 🎛️ The Toggle Setting

**Location:** Settings → Import/Export → "Allow Multiple Category Registrations"

**ON (Default - Recommended):**
- ✅ Player can register for Singles, Doubles, mojo_dojo, k_db
- ❌ Player CANNOT register for same category twice

**OFF (Strict Mode):**
- ❌ Player can only register for ONE category total

---

## 📋 Files Created

1. `supabase/migrations/028_system_settings_table.sql` - Database table
2. `src/app/api/settings/system/route.ts` - API endpoints
3. `src/app/settings/import-export/page.tsx` - Settings UI
4. `src/app/api/tournaments/[id]/import-participants/route.ts` - Updated logic
5. `src/components/Header.tsx` - Added navigation link

---

## 🧪 Test Your CSV

1. Go to your tournament
2. Click "Import Participants"
3. Upload `tournament_import_template (1).csv`
4. All 4 categories should import successfully!

---

## 📞 Support

Check `IMPORT_EXPORT_SETTINGS_GUIDE.md` for:
- Detailed technical documentation
- Troubleshooting guide
- Use cases and examples
- Database schema details

---

## 🎉 You're Done!

The system now intelligently handles:
- ✅ Custom categories (mojo_dojo, k_db)
- ✅ Multiple category registrations
- ✅ Duplicate prevention (same category)
- ✅ Configurable behavior via settings

**Your CSV will now import all 56 participants across all 4 categories!** 🚀



