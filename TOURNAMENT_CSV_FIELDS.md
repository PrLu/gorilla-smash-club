# Tournament Import CSV Field Reference

## Complete Field List

Your CSV file must have these columns in the header row (order doesn't matter):

```csv
full_name,email,category,rating,gender,partner_email,phone,dupr_id,payment_status
```

## Field Definitions

### ✅ Required Fields (Must have value for every player)

| Column | Description | Valid Values | Example |
|--------|-------------|--------------|---------|
| **full_name** | Player's full name | Any text | `John Doe` |
| **email** | Player's email address | Valid email format | `john@example.com` |
| **category** | Tournament category | `singles`, `doubles`, `mixed` | `singles` |
| **rating** | Player skill rating | `<3.2`, `<3.6`, `<3.8`, `open` | `<3.6` |
| **gender** | Player gender | `male`, `female` | `male` |

### ⚠️ Conditionally Required

| Column | When Required | Valid Values | Example |
|--------|---------------|--------------|---------|
| **partner_email** | For `doubles` or `mixed` category | Valid email | `partner@example.com` |

**Important:** Leave empty for singles category!

### ⭕ Optional Fields

| Column | Description | Valid Values | Example |
|--------|-------------|--------------|---------|
| **phone** | Phone number | Any format | `+1234567890` |
| **dupr_id** | DUPR rating ID | Any text | `12345` |
| **payment_status** | Payment status | `paid`, `pending` (default: `pending`) | `paid` |

## Example CSV Files

### Example 1: Singles Tournament
```csv
full_name,email,category,rating,gender,partner_email,phone,dupr_id,payment_status
John Doe,john@example.com,singles,<3.2,male,,+1234567890,JD123,paid
Jane Smith,jane@example.com,singles,<3.6,female,,+0987654321,JS456,pending
Mike Wilson,mike@example.com,singles,open,male,,,pending
```

**Note:** partner_email is empty (leave blank for singles)

### Example 2: Doubles Tournament
```csv
full_name,email,category,rating,gender,partner_email,phone,dupr_id,payment_status
Alice Brown,alice@example.com,doubles,<3.2,female,bob@example.com,+1111111111,AB123,paid
Bob Green,bob@example.com,doubles,<3.2,male,alice@example.com,+2222222222,BG456,paid
Carol White,carol@example.com,doubles,<3.6,female,david@example.com,+3333333333,CW789,pending
David Black,david@example.com,doubles,<3.6,male,carol@example.com,+4444444444,DB012,pending
```

**Note:** Both partners must be in the CSV with matching partner_email

### Example 3: Mixed Categories
```csv
full_name,email,category,rating,gender,partner_email,phone,dupr_id,payment_status
Tom Singles,tom@example.com,singles,<3.8,male,,,TS123,paid
Sarah Doubles,sarah@example.com,doubles,<3.6,female,partner@example.com,+5555555555,SD456,pending
Partner Jones,partner@example.com,doubles,<3.6,male,sarah@example.com,+6666666666,PJ789,pending
Emma Mixed,emma@example.com,mixed,open,female,frank@example.com,+7777777777,EM012,paid
Frank Mixed,frank@example.com,mixed,open,male,emma@example.com,+8888888888,FM345,paid
```

## Field Validation Rules

### Category
- ✅ **Valid:** `singles`, `doubles`, `mixed`
- ❌ **Invalid:** `single`, `double`, `SINGLES`, empty

### Rating
- ✅ **Valid:** `<3.2`, `<3.6`, `<3.8`, `open`
- ❌ **Invalid:** `3.2`, `under 3.6`, `Open`, `3.5`, empty

### Gender
- ✅ **Valid:** `male`, `female`
- ❌ **Invalid:** `m`, `f`, `Male`, `Female`, `other`, empty

### Partner Email (for doubles/mixed)
- ✅ **Valid:** `partner@example.com` (valid email)
- ✅ **Valid for singles:** Empty/blank
- ❌ **Invalid:** Missing for doubles/mixed
- ❌ **Invalid:** Invalid email format

### Payment Status
- ✅ **Valid:** `paid`, `pending`, empty (defaults to pending)
- ❌ **Invalid:** `not paid`, `complete`

## Common Errors and Fixes

### Error: "Category is required and must be: singles, doubles, or mixed"
**Problem:** Category column is empty or has invalid value
**Fix:** 
```csv
# Wrong
John Doe,john@example.com,,<3.2,male

# Right
John Doe,john@example.com,singles,<3.2,male
```

### Error: "Rating is required and must be: <3.2, <3.6, <3.8, or open"
**Problem:** Rating missing or wrong format
**Fix:**
```csv
# Wrong
John Doe,john@example.com,singles,3.2,male

# Right
John Doe,john@example.com,singles,<3.2,male
```

### Error: "Gender is required and must be: male or female"
**Problem:** Gender column empty or invalid value
**Fix:**
```csv
# Wrong
John Doe,john@example.com,singles,<3.2,

# Right
John Doe,john@example.com,singles,<3.2,male
```

### Error: "Partner email is required for doubles category"
**Problem:** Doubles/mixed registration missing partner email
**Fix:**
```csv
# Wrong
Jane Smith,jane@example.com,doubles,<3.6,female,

# Right
Jane Smith,jane@example.com,doubles,<3.6,female,partner@example.com
```

## Tips for Success

### ✅ Do This:
1. **Download template first** - Always use the provided template
2. **Keep header row** - First row must be column names
3. **Match exact values** - Use lowercase for category, rating, gender
4. **Leave blank, don't delete** - For optional fields, leave empty (don't remove column)
5. **Check partner emails** - Both partners should have matching emails in their partner_email column

### ❌ Avoid This:
1. **Don't change column names** - Keep exact names from template
2. **Don't mix case** - Use lowercase (not "Singles" or "MALE")
3. **Don't skip required fields** - All 5 required fields must have values
4. **Don't use wrong rating format** - Must include `<` symbol
5. **Don't forget partner emails** - Required for doubles/mixed

## Complete Example with All Fields

```csv
full_name,email,category,rating,gender,partner_email,phone,dupr_id,payment_status
John Doe,john@example.com,singles,<3.2,male,,+1234567890,12345,paid
Jane Smith,jane@example.com,doubles,<3.6,female,partner@example.com,+0987654321,67890,pending
Partner Pro,partner@example.com,doubles,<3.6,male,jane@example.com,+1112223333,PP111,pending
Mike Johnson,mike@example.com,mixed,<3.8,male,alice@example.com,+4445556666,MJ222,paid
Alice Williams,alice@example.com,mixed,<3.8,female,mike@example.com,+7778889999,AW333,paid
Sarah Open,sarah@example.com,singles,open,female,,+1231231234,SO444,pending
```

## What Happens with Each Field

| Field | Player Profile | Player Record | Registration | Notes |
|-------|----------------|---------------|--------------|-------|
| full_name | ✅ Stored | ✅ Split to first/last | ✅ In metadata | |
| email | ✅ Stored | | | Cannot be changed later |
| category | | | ✅ In metadata | Required for registration |
| rating | | ✅ Stored | ✅ In metadata | Tournament rating |
| gender | ✅ Stored | ✅ Stored | ✅ In metadata | Required for mixed/gender categories |
| partner_email | | | ✅ In metadata | For doubles/mixed pairing |
| phone | ✅ Stored | | | Can be edited later |
| dupr_id | ✅ Stored | | | Official DUPR rating |
| payment_status | | | ✅ Stored | paid or pending |

## Quick Reference Card

```
REQUIRED FOR ALL:
- full_name
- email
- category
- rating
- gender

REQUIRED FOR DOUBLES/MIXED ONLY:
- partner_email

OPTIONAL:
- phone
- dupr_id
- payment_status
```

## Download Template

The template button in the import modal generates this exact format with examples for all three categories.

