# ❗ I Need This Information From You

## The Real Problem

My auto-assignment code assigns:
- ALL teams → "doubles"  
- ALL individuals → "singles"

**But you have multiple team categories** (mojo_dojo, k_db, doubles, etc.)!

Without `metadata.category` set, there's **NO WAY to know** which team belongs to which category.

---

## 🔍 I Need to Know

### Question 1: How Can I Tell Teams Apart?

**Can you identify teams by their NAMES?**

Examples:
- Teams with "mojo" in name → mojo_dojo category?
- Teams with "k_db" in name → k_db category?
- Teams with specific pattern → specific category?

OR

**Do you have a list of which team IDs belong to which category?**

---

### Question 2: Show Me Your Data

**Run this SQL and share the FULL result:**

```sql
-- REPLACE 'YOUR_TOURNAMENT_ID' with your actual tournament ID!
-- Get it from URL: /tournament/abc-123-xyz → use 'abc-123-xyz'

SELECT 
  t.name as team_name,
  r.metadata->>'category' as current_category,
  r.id as registration_id
FROM registrations r
JOIN teams t ON r.team_id = t.id
WHERE r.tournament_id = 'YOUR_TOURNAMENT_ID'
ORDER BY t.name
LIMIT 50;
```

**This will show me:**
1. What your team names look like
2. If categories are already set
3. How to identify which team goes in which category

---

### Question 3: How Were Participants Registered?

Did you:
- ✅ Import from CSV? (If yes, share a sample of the CSV)
- ✅ Manual registration through UI?
- ✅ API/script?

---

## 💡 Once I Know This

I can create a proper fix that assigns the RIGHT category to each team, not just "doubles" for everything.

For example, if teams with "mojo" in the name → mojo_dojo:

```sql
UPDATE registrations
SET metadata = jsonb_set(metadata, '{category}', '"mojo_dojo"')
WHERE team_id IN (
  SELECT id FROM teams WHERE name LIKE '%mojo%'
);
```

**But I need to know YOUR team naming pattern or some way to identify them!**

---

## 🚨 Right Now, Please Share:

1. **Team names** (result of the SQL query above)
2. **How to identify** which team belongs to which category
3. **Console output** when you last generated fixtures (just copy-paste it all)

**Then I can create a PROPER fix that actually works for your specific data!** 💪


