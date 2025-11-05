# Quick Start: Tournament Participant Import

## 5-Minute Setup Guide

### Step 1: Download Template (5 seconds)
1. Go to your tournament → **Manage Participants**
2. Click **"Import CSV"**
3. Click **"Download CSV Template"**
4. Template saves as: `tournament_participants_template.csv`

### Step 2: Fill Your Data (2 minutes)

Open the CSV in Excel/Google Sheets and fill it out:

#### Column Guide (Left to Right):

| # | Column | Fill With | Example | Required? |
|---|--------|-----------|---------|-----------|
| 1 | **full_name** | Player's name | John Doe | ✅ YES |
| 2 | **email** | Player's email | john@example.com | ✅ YES |
| 3 | **category** | singles/doubles/mixed | singles | ✅ YES |
| 4 | **rating** | <3.2/<3.6/<3.8/open | <3.6 | ✅ YES |
| 5 | **gender** | male/female | male | ✅ YES |
| 6 | **partner_email** | Partner's email (doubles/mixed only) | partner@example.com | ⚠️ IF doubles/mixed |
| 7 | **phone** | Phone number | +1234567890 | ⭕ Optional |
| 8 | **dupr_id** | DUPR ID | 12345 | ⭕ Optional |
| 9 | **payment_status** | paid/pending | pending | ⭕ Optional |

### Step 3: Import (2 minutes)
1. Save your CSV file
2. Go back to import modal
3. Drag & drop or browse for your file
4. Click **"Import to Tournament"**
5. Wait for results

### Step 4: Review Results (30 seconds)
- ✅ Green = Successfully registered
- ❌ Red = Failed (check error messages)
- If failures: Fix CSV and retry

## Real World Examples

### Singles Tournament (10 players)

```csv
full_name,email,category,rating,gender,partner_email,phone,dupr_id,payment_status
Alex Johnson,alex@example.com,singles,<3.2,male,,+1111111111,AJ001,paid
Betty Davis,betty@example.com,singles,<3.2,female,,+2222222222,BD002,paid
Charlie Brown,charlie@example.com,singles,<3.6,male,,+3333333333,CB003,pending
Diana Prince,diana@example.com,singles,<3.6,female,,+4444444444,DP004,paid
Edward Norton,edward@example.com,singles,<3.8,male,,+5555555555,EN005,pending
Fiona Apple,fiona@example.com,singles,<3.8,female,,+6666666666,FA006,paid
George Lucas,george@example.com,singles,open,male,,+7777777777,GL007,pending
Hannah Montana,hannah@example.com,singles,open,female,,+8888888888,HM008,paid
Ian Fleming,ian@example.com,singles,<3.2,male,,,pending
Julia Roberts,julia@example.com,singles,<3.6,female,,,paid
```

### Doubles Tournament (4 teams = 8 players)

```csv
full_name,email,category,rating,gender,partner_email,phone,dupr_id,payment_status
Player 1A,p1a@example.com,doubles,<3.2,male,p1b@example.com,+1111111111,P1A,paid
Player 1B,p1b@example.com,doubles,<3.2,male,p1a@example.com,+1111111112,P1B,paid
Player 2A,p2a@example.com,doubles,<3.6,female,p2b@example.com,+2222222221,P2A,pending
Player 2B,p2b@example.com,doubles,<3.6,female,p2a@example.com,+2222222222,P2B,pending
Player 3A,p3a@example.com,doubles,<3.8,male,p3b@example.com,+3333333331,P3A,paid
Player 3B,p3b@example.com,doubles,<3.8,male,p3a@example.com,+3333333332,P3B,paid
Player 4A,p4a@example.com,doubles,open,female,p4b@example.com,+4444444441,P4A,pending
Player 4B,p4b@example.com,doubles,open,female,p4a@example.com,+4444444442,P4B,pending
```

**Important for Doubles:**
- Both partners must be in the CSV
- Each partner's `partner_email` must match the other's `email`
- Example: P1A's partner_email = p1b@example.com AND P1B's partner_email = p1a@example.com

### Mixed Format Tournament

```csv
full_name,email,category,rating,gender,partner_email,phone,dupr_id,payment_status
Solo Sam,solo@example.com,singles,<3.2,male,,,SS001,paid
Duo Dan,duo.dan@example.com,doubles,<3.6,male,duo.donna@example.com,+1234567890,DD002,pending
Duo Donna,duo.donna@example.com,doubles,<3.6,female,duo.dan@example.com,+0987654321,DD003,pending
Mix Mike,mix.mike@example.com,mixed,<3.8,male,mix.mary@example.com,+5555555555,MM004,paid
Mix Mary,mix.mary@example.com,mixed,<3.8,female,mix.mike@example.com,+6666666666,MM005,paid
```

## Common Mistakes (and How to Fix)

### ❌ Mistake 1: Wrong Category Format
```csv
John Doe,john@example.com,Single,<3.6,male  ← WRONG (capital S)
```
**Fix:**
```csv
John Doe,john@example.com,singles,<3.6,male  ← RIGHT (lowercase)
```

### ❌ Mistake 2: Missing < in Rating
```csv
Jane Smith,jane@example.com,singles,3.6,female  ← WRONG (no <)
```
**Fix:**
```csv
Jane Smith,jane@example.com,singles,<3.6,female  ← RIGHT (has <)
```

### ❌ Mistake 3: Doubles Without Partner
```csv
Mike,mike@example.com,doubles,<3.2,male,,+123,MJ,paid  ← WRONG (no partner)
```
**Fix:**
```csv
Mike,mike@example.com,doubles,<3.2,male,partner@example.com,+123,MJ,paid  ← RIGHT
Partner,partner@example.com,doubles,<3.2,male,mike@example.com,+456,PP,paid  ← Add partner too
```

### ❌ Mistake 4: Missing Required Columns
```csv
full_name,email,phone
John Doe,john@example.com,+1234567890  ← WRONG (missing category, rating, gender)
```
**Fix:**
```csv
full_name,email,category,rating,gender,partner_email,phone,dupr_id,payment_status
John Doe,john@example.com,singles,<3.6,male,,+1234567890,,pending  ← RIGHT (all columns present)
```

## Checklist Before Import

- [ ] Downloaded the latest template
- [ ] All required columns present (full_name, email, category, rating, gender)
- [ ] Category values are: singles, doubles, or mixed (lowercase)
- [ ] Rating values are: <3.2, <3.6, <3.8, or open (with < symbol)
- [ ] Gender values are: male or female (lowercase)
- [ ] Partner emails filled for ALL doubles/mixed players
- [ ] Partner emails are empty for singles players
- [ ] Both partners in doubles/mixed have matching partner_email values
- [ ] No empty rows in the middle of data
- [ ] Header row is the first row

## After Import Success

Once imported, players will:
- ✅ Appear in tournament participants list
- ✅ Have their category, rating, gender recorded
- ✅ Be paired with partners (for doubles/mixed)
- ✅ Have payment status tracked
- ✅ Be ready for fixture generation

---

**Need more details?** See `TOURNAMENT_CSV_FIELDS.md` for complete field reference.

