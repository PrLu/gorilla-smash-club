# 🔍 Check Category Filter in UI

## Issue: Only Seeing Singles

The console shows all 4 categories exist, but UI only shows singles.

## Most Likely Causes:

### 1. Category Filter Not Visible
The category filter tabs might not be showing at the top

### 2. Category Filter Stuck on "Singles"
You might be filtering to singles only

### 3. Matches Missing Category in Court Field
The `court` field might not have the category name

---

## 🔍 Check This in UI:

### Look at the Fixtures Page:

**At the TOP of the fixtures page, do you see tabs like this?**

```
┌─────────────┬─────────┬────────────┬──────┐
│ All (100)   │ Singles │ Doubles    │ ...  │
└─────────────┴─────────┴────────────┴──────┘
```

**If YES:**
- Click on "Doubles", "K_DB", "MOJO_DOJO" tabs
- Each should show their matches

**If NO (no tabs visible):**
- This is the problem - matches don't have category info
- Run the SQL check to see what's in the database

---

## 🔍 Check in Browser Console:

Open browser console (F12) and type:

```javascript
// Check what categories are in matches
document.querySelectorAll('[data-category]').forEach(el => 
  console.log(el.getAttribute('data-category'))
);
```

---

## 🔧 Quick Fix If Matches Missing Category:

If the SQL shows matches don't have proper `court` field:

```sql
-- Check what's in court field
SELECT DISTINCT court, COUNT(*) 
FROM matches 
WHERE tournament_id = '54e0c9bc-d14a-42a6-bfd6-51d97185aede'
GROUP BY court;
```

**If court is NULL or not showing categories, we need to fix fixture generation!**

---

## 📸 Can You Share:

1. **Screenshot** of the Fixtures page (showing if category filter exists)
2. **Result** of the SQL query in `CHECK_UI_ISSUE.sql`
3. **Tell me:** Do you see category filter tabs at the top?

This will help me fix the exact issue!


