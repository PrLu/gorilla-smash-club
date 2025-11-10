# ✅ Import/Export Settings - CORRECTED Logic

## 🎯 How It Actually Works (Updated)

The toggle controls whether participants can register for multiple categories **of the same type**.

### 📊 Category Types

**Individual Categories:**
- Singles
- Singles-Advanced
- Singles-Open
- (Any category with `is_team_based = false`)

**Team-Based Categories:**
- Doubles
- Mixed
- mojo_dojo
- k_db
- (Any category with `is_team_based = true`)

---

## 🎛️ Toggle Behavior

### Setting: ON (Default - Recommended) ✅

**Allowed:**
- ✅ Register for multiple individual categories (Singles + Singles-Advanced)
- ✅ Register for multiple team categories (Doubles + Mixed + mojo_dojo + k_db)
- ✅ Register for both types (Singles + Doubles + Mixed)

**Blocked:**
- ❌ Same exact category twice (Doubles → Doubles again)

**Example with your CSV:**
```
John's Registrations:
1. Singles (individual) ✅
2. Doubles (team) ✅
3. mojo_dojo (team) ✅
4. k_db (team) ✅

Result: ALL ALLOWED ✓
```

---

### Setting: OFF (Strict Mode) ⚠️

**Allowed:**
- ✅ ONE individual category maximum
- ✅ ONE team category maximum
- ✅ Can have one of each (1 individual + 1 team)

**Blocked:**
- ❌ Multiple individual categories
- ❌ Multiple team categories
- ❌ Same exact category twice

**Example with your CSV:**
```
John's Registrations:
1. Singles (individual) ✅
2. Doubles (team) ✅
3. mojo_dojo (team) ❌ BLOCKED (already has Doubles which is team-based)
4. k_db (team) ❌ BLOCKED (already has Doubles which is team-based)

Result: Only Singles + Doubles allowed
```

---

## 🧪 Testing with Your CSV

### Your CSV Structure:
- 12 participants: Singles only (individual)
- 16 participants: Doubles only (team)
- 15 participants: mojo_dojo only (team)
- 13 participants: k_db only (team)

**Some participants appear in MULTIPLE team categories:**
- Varun Mehta: Doubles + mojo_dojo + k_db
- Aisha Khan: Doubles + mojo_dojo + k_db
- etc.

---

## ✅ Expected Results

### With Toggle ON (Recommended for your case):
```
Import Results:
✅ Singles: 12 participants
✅ Doubles: 16 participants
✅ mojo_dojo: 15 participants
✅ k_db: 13 participants

Total: 56 rows imported successfully
Players appearing in multiple team categories: ALLOWED ✓
```

### With Toggle OFF:
```
Import Results:
✅ Singles: 12 participants
✅ Doubles: 16 participants
❌ mojo_dojo: Only participants NOT in Doubles
❌ k_db: Only participants NOT in Doubles or mojo_dojo

Total: Fewer imports (first team category per player only)
Players appearing in multiple team categories: BLOCKED ✗
```

---

## 🔍 Technical Implementation

### Import Logic (Updated):

```typescript
// Get existing registrations for this player
const existingRegistrations = await db.registrations
  .where('tournament_id', tournamentId)
  .where('player_id', playerId);

if (allowMultipleCategoryRegistrations) {
  // ON: Only block if EXACT same category
  const duplicate = existingRegistrations.find(reg => 
    reg.category === currentCategory
  );
  if (duplicate) {
    return 'Already registered for this category';
  }
} else {
  // OFF: Block if same TYPE (individual vs team-based)
  const duplicateType = existingRegistrations.find(reg => {
    const existingCategory = categories.find(c => c.name === reg.category);
    const currentCategory = categories.find(c => c.name === newCategory);
    
    // Block if both are individual OR both are team-based
    return existingCategory.is_team_based === currentCategory.is_team_based;
  });
  
  if (duplicateType) {
    const type = currentCategory.is_team_based ? 'team-based' : 'individual';
    return `Already registered for a ${type} category`;
  }
}
```

---

## 🎯 Use Cases

### When to Enable (ON):
✅ **Your tournament setup!**
- Tournaments with multiple team categories (Doubles, Mixed, mojo_dojo, k_db)
- Want players to compete in all divisions
- Maximum participation and flexibility

### When to Disable (OFF):
- Players can only pick ONE individual category (e.g., Singles-Open OR Singles-Advanced)
- Players can only pick ONE team category (e.g., Doubles OR Mixed, not both)
- More restrictive, controlled entries

---

## 📝 Key Differences from Original

### What Changed:

**OLD Logic (Incorrect):**
- Toggle OFF = Block ALL duplicate registrations
- Toggle ON = Allow different categories only

**NEW Logic (Correct):**
- Toggle OFF = Block duplicates **of same type** (individual or team)
- Toggle ON = Allow multiple **of any type**
- **Always allows mixing types** (e.g., Singles + Doubles works even when OFF)

---

## 🚀 Ready to Test!

1. ✅ Database is already set up
2. ✅ Code has been updated with correct logic
3. ✅ Settings UI reflects new behavior
4. ✅ Restart your server: `npm run dev`
5. ✅ Import your CSV with toggle ON
6. ✅ All 4 categories should import successfully!

---

## 💡 Summary

**The key insight:** The system now respects **category types** (individual vs team), not just category names. This gives you fine-grained control over registration policies while still allowing flexible multi-category participation.

Perfect for your tournament with multiple team-based categories! 🎉



