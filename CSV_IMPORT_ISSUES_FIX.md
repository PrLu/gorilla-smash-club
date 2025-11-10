# CSV Import Issues - Fixes Applied

## 🔍 Issues Found in Your CSV:

### 1. **Invalid Category: "mojo_dojo"** ❌
Lines 30-45 use "mojo_dojo" which doesn't exist in your system.

**Fix:** Change "mojo_dojo" to one of:
- `singles`
- `doubles`
- `mixed`

### 2. **Gender Capitalized** ❌
All rows have "Male", "Female" but system expects lowercase.

**Auto-Fixed:** System now auto-converts to lowercase ✅

### 3. **Numeric Ratings** ❌
Using "4.5", "3.9", "4.2" but system expects: <3.2, <3.6, <3.8, open

**Auto-Fixed:** System now auto-converts numeric ratings ✅

---

## ✅ Auto-Correction Features Added:

### 1. **Gender Auto-Normalization**
```
"Male" → "male" ✅
"Female" → "female" ✅
"MALE" → "male" ✅
```

### 2. **Rating Auto-Conversion**
```
4.5 → "open" ✅
3.9 → "<3.8" ✅  
3.5 → "<3.6" ✅
3.1 → "<3.2" ✅
2.9 → "<3.2" ✅
"<3.6" → "<3.6" ✅ (already correct)
```

Conversion logic:
- Rating < 3.2 → `<3.2`
- Rating 3.2-3.5 → `<3.6`
- Rating 3.6-3.7 → `<3.8`
- Rating ≥ 3.8 → `open`

---

## 🔧 What You Need to Fix Manually:

### Change "mojo_dojo" to a Valid Category:

**Lines 30-45** in your CSV need to be changed from:
```csv
...,mojo_dojo,...
```

To one of these:
```csv
...,doubles,...  (if it's a team format)
...,mixed,...    (if it's mixed gender teams)
...,singles,...  (if it's individual)
```

### Quick Fix in Excel/Text Editor:

1. Open the CSV file
2. Find & Replace: `mojo_dojo` → `mixed` (or `doubles`)
3. Save the file
4. Try importing again

---

## 📝 Your Corrected CSV Should Look Like:

```csv
full_name,email,phone,gender,category,rating,partner_name,partner_email,partner_rating,partner_gender,payment_status
Arjun Menon,arjun.menon@gmail.com,9876543210,Male,singles,4.5,-,-,-,-,Paid
...
Gaurav Desai,gaurav.desai@gmail.com,9959990001,Male,mixed,4.3,Arjun Krishnan,arjun.krishnan@gmail.com,4.1,Male,Paid
```

**Only change:** `mojo_dojo` → `mixed` (or appropriate category)

The system will auto-handle:
- ✅ "Male" → "male"
- ✅ "4.5" → "open"
- ✅ "3.9" → "<3.8"
- ✅ "-" in partner fields → treated as empty

---

## 🎯 After Fixing:

1. **Find & Replace** `mojo_dojo` with `mixed` (or `doubles`)
2. **Save the CSV**
3. **Import again**
4. **Should work!** ✅

The validation will show:
- Gender values auto-corrected
- Ratings auto-converted
- Ready to import!

---

## 💡 Why "mojo_dojo" Failed:

The system validates categories against the `categories` master data table, which only has:
- singles
- doubles
- mixed

"mojo_dojo" is not in this list, so it's rejected.

**If "mojo_dojo" is a custom category you want to add:**
1. Go to `/settings/master-data` (admin only)
2. Add "mojo_dojo" as a new category
3. Mark it as team-based if needed
4. Then import will work

---

## 🚀 Quick Action:

**Option 1: Fix CSV (Fastest)**
```
1. Open CSV in notepad/Excel
2. Ctrl+H (Find & Replace)
3. Find: mojo_dojo
4. Replace: mixed
5. Save & Re-import
```

**Option 2: Add Custom Category**
```
1. Go to /settings/master-data
2. Add "mojo_dojo" category
3. Mark as team-based
4. Activate it
5. Re-import CSV as-is
```

**Recommendation:** Use Option 1 (fix CSV) unless "mojo_dojo" is really a separate category you need!

---

## ✅ System Enhancements Applied:

- ✅ Auto-normalizes gender (Male→male)
- ✅ Auto-converts numeric ratings (4.5→open)
- ✅ Auto-normalizes partner gender
- ✅ Auto-converts partner ratings
- ✅ Clear error messages for invalid categories
- ✅ Better validation feedback

**Fix the "mojo_dojo" category and your import will work!** 🎉

