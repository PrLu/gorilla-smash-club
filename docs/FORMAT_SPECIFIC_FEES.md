# Format-Specific Entry Fees

## Overview

Tournaments can now have **different entry fees for each format**, allowing flexible pricing for Singles, Doubles, and Mixed categories.

---

## How It Works

### Tournament Creation

When you select multiple formats:

```
Tournament Formats *

☑️ Singles
☑️ Doubles  
☑️ Mixed

Entry Fees (INR)
─────────────────
Singles:   [₹ 500.00]
Doubles:   [₹ 800.00]
Mixed:     [₹ 600.00]
```

**Each selected format gets its own entry fee field!**

---

## Example Pricing

### Example 1: Singles Only
```
Formats: [Singles]

Entry Fees:
Singles: ₹500
```

### Example 2: Multiple Formats
```
Formats: [Singles, Doubles, Mixed]

Entry Fees:
Singles: ₹400
Doubles: ₹700
Mixed:   ₹600
```

### Example 3: Doubles Event
```
Formats: [Doubles, Mixed]

Entry Fees:
Doubles: ₹1000
Mixed:   ₹800
```

---

## Display

### Tournament Card

**Before:**
```
₹500
```

**After:**
```
singles: ₹500
doubles: ₹800
mixed: ₹600
```

### Tournament Detail Page

**Before:**
```
₹500 entry fee
```

**After:**
```
singles: ₹500 • doubles: ₹800 • mixed: ₹600
```

---

## Database Structure

### New Column

```sql
entry_fees JSONB DEFAULT '{}'
```

**Example data:**
```json
{
  "singles": 500,
  "doubles": 800,
  "mixed": 600
}
```

### Backward Compatibility

**Old column preserved:**
```sql
entry_fee NUMERIC  -- Stores minimum fee
```

**Migration automatically:**
- Copies existing `entry_fee` to `entry_fees` object
- Sets minimum of all fees as `entry_fee` for old code

---

## Registration

When participants register, they select format and pay corresponding fee:

```
Registration for: Singles
Entry Fee: ₹500

Registration for: Doubles
Entry Fee: ₹800
```

The correct fee is automatically pulled from `entry_fees[selected_format]`.

---

## Benefits

✅ **Flexible Pricing** - Charge more for doubles (2 players per entry)  
✅ **Incentives** - Offer discounts for specific formats  
✅ **Fair Pricing** - Singles vs doubles cost different resources  
✅ **Multi-Format Events** - Run combined tournaments with appropriate fees  

---

## Common Pricing Strategies

### Strategy 1: Team Discount
```
Singles: ₹500 (per person)
Doubles: ₹800 (₹400 per person - 20% discount)
```

### Strategy 2: Premium Mixed
```
Singles: ₹600
Doubles: ₹1000
Mixed:   ₹1200 (premium event)
```

### Strategy 3: Flat Rate
```
Singles: ₹500
Doubles: ₹500
Mixed:   ₹500
```

---

## Migration Required

Run this SQL:

```sql
-- Copy/paste: supabase/migrations/013_format_specific_fees.sql
```

This adds:
- `entry_fees JSONB` column
- Migrates existing fees
- Keeps old `entry_fee` for compatibility

---

## Example Usage

**Create tournament with 3 formats:**
1. Select Singles, Doubles, Mixed
2. Entry fee fields appear for each:
   - Singles: ₹500
   - Doubles: ₹800
   - Mixed: ₹600
3. Save tournament
4. Participants see correct fee when registering

**View tournament card:**
```
Summer Championship
Singles, Doubles, Mixed • 24 participants

singles: ₹500
doubles: ₹800
mixed: ₹600
```

---

**Now you can set different prices for each tournament format!** 💰🎾

