# Dynamic Tournament-Aware Import System

## ✅ How It Works Now:

The import system is now **fully dynamic** and validates against each tournament's specific configuration.

---

## 🎯 Dynamic Validation Logic:

### Step 1: Read Tournament Configuration
```typescript
// Gets THIS tournament's enabled formats
tournament.formats = ['singles', 'doubles']  // Example
// or
tournament.formats = ['singles', 'mojo_lovers']  // Custom example
```

### Step 2: Validate CSV Against Tournament
```typescript
// Only accepts categories enabled for THIS tournament
validCategories = tournament.formats
// NOT hard-coded master list!
```

### Step 3: Smart Partner Field Handling
```typescript
if (category is team-based) {
  // Require partner fields
  require: partner_name, partner_email
  optional: partner_rating, partner_gender
} else {
  // Gracefully ignore partner fields
  warning: "Partner info provided but not needed"
  action: Discard partner data, import without it
}
```

---

## 📊 Examples:

### Example 1: Tournament A (Singles, Doubles)
```
Tournament Formats: [singles, doubles]

CSV Row 1: ...,singles,...  → ✅ Accepted
CSV Row 2: ...,doubles,...,partner_name,partner_email  → ✅ Accepted (partner required)
CSV Row 3: ...,mixed,...  → ❌ Rejected ("mixed not enabled for this tournament")
CSV Row 4: ...,singles,...,partner_name,partner_email  → ✅ Accepted with warning (partner data ignored)
```

### Example 2: Tournament B (Singles, Mojo_Lovers)
```
Tournament Formats: [singles, mojo_lovers]

CSV Row 1: ...,singles,...  → ✅ Accepted
CSV Row 2: ...,mojo_lovers,...,partner,partner@email  → ✅ Accepted (if mojo_lovers is team-based)
CSV Row 3: ...,doubles,...  → ❌ Rejected ("doubles not enabled for this tournament")
```

---

## 🔍 Check Your Tournament's Enabled Categories:

### Method 1: Via UI
1. Go to tournament details
2. Look at tournament info
3. See "Formats" field
4. Those are the only categories you can import

### Method 2: Via Database
```sql
SELECT id, title, formats, format
FROM tournaments
WHERE id = 'YOUR_TOURNAMENT_ID';

-- Result example:
-- formats: ["singles", "doubles", "mixed"]
-- This tournament accepts only these 3 categories!
```

### Method 3: Check Server Console
When you try to import, look for:
```
=== IMPORT VALIDATION ===
Tournament formats enabled: ["singles", "doubles"]
Valid categories for this tournament: ["singles", "doubles"]
```

---

## 🐛 Debugging Your Failed Import:

### Check Server Console for These Logs:

```
=== IMPORT VALIDATION ===
Tournament ID: ...
Tournament formats enabled: [...]
Valid categories for this tournament: [...]

Processing participant: { email: "...", category: "..." }
Checking category: mojo_dojo (normalized: mojo_dojo)
Valid categories: ["singles", "doubles"]
Failed: Category mojo_dojo not in valid list

=== IMPORT RESULTS ===
Total: 44
Successful: 0
Failed: 44
First 3 failures: [...]
```

This will tell you exactly why each row failed!

---

## 🔧 Fixing Your Import:

### If Your Tournament Has Singles + Doubles:

**Fix your CSV:**
```
Change line 30-45:
FROM: ...,mojo_dojo,...
TO:   ...,mixed,...  (or doubles)
```

Then enable "mixed" in your tournament:
1. Edit tournament
2. Add "mixed" to formats
3. Save
4. Re-import

### If You Want Mojo_Dojo Category:

**Step 1: Add to Master Data**
```sql
INSERT INTO categories (name, display_name, is_team_based, is_active, sort_order)
VALUES ('mojo_dojo', 'Mojo Dojo', true, true, 4);
```

**Step 2: Enable for Tournament**
```sql
UPDATE tournaments
SET formats = array_append(formats, 'mojo_dojo')
WHERE id = 'YOUR_TOURNAMENT_ID';
```

**Step 3: Import CSV**
Now "mojo_dojo" will be accepted!

---

## 📝 Quick Diagnostic Steps:

### 1. Check Server Console
Look for the validation logs showing:
- Which categories are valid for your tournament
- Why each row failed

### 2. Share Error Details
Please share:
- The exact error message from browser
- Server console logs (from terminal)
- Which tournament ID you're importing to

### 3. Verify Tournament Setup
```sql
-- Run in Supabase SQL Editor
SELECT 
  id, 
  title, 
  formats,
  format
FROM tournaments
WHERE id = 'YOUR_TOURNAMENT_ID';
```

This shows which categories your tournament accepts.

---

## 🎯 Most Likely Issues:

### Issue 1: Tournament Only Has Singles + Doubles
- Your CSV has "mojo_dojo"
- Tournament doesn't have "mojo_dojo" enabled
- **Fix:** Change CSV or add category to tournament

### Issue 2: Category Name Mismatch
- CSV: "Mojo_Dojo" or "MOJO_DOJO"
- Expected: "mojo_dojo" (exact match, lowercase)
- **Fix:** System now auto-normalizes to lowercase ✅

### Issue 3: Partner Fields for Non-Team Category
- No longer an issue! System now discards gracefully ✅

---

## 🚀 Next Steps:

1. **Check your server console** - Look for the validation logs
2. **Check tournament formats** - What categories are enabled?
3. **Share the error details** with me - I'll pinpoint the exact issue

**The logs will show exactly why each row is failing!** 🔍

Run the import again and check your terminal for the detailed logs starting with "=== IMPORT VALIDATION ===" and share those with me!

