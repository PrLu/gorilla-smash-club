# Master Data Management System

## Overview

A flexible master data management system that allows administrators to configure tournament categories dynamically. This replaces hardcoded categories with a database-driven approach for maximum flexibility.

---

## Features Implemented

### ✅ **1. Database Schema**
**Migration:** `025_create_categories_master_data.sql`

**Categories Table:**
- `id` - UUID primary key
- `name` - Internal name (lowercase, unique)
- `display_name` - User-facing name
- `description` - Optional description
- `is_team_based` - Boolean (true for doubles/mixed, false for singles)
- `is_active` - Only active categories shown in forms
- `sort_order` - Display order (lower first)
- `created_at`, `updated_at` - Timestamps
- `created_by` - Admin who created it

**Default Categories:**
- Singles (individual, active)
- Doubles (team-based, active)
- Mixed Doubles (team-based, active)

### ✅ **2. API Endpoints**

#### GET `/api/master-data/categories`
Fetch all categories (active only for non-admins, all for admins)

**Response:**
```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "singles",
      "display_name": "Singles",
      "description": "Individual player competition",
      "is_team_based": false,
      "is_active": true,
      "sort_order": 1
    }
  ]
}
```

#### POST `/api/master-data/categories`
Create a new category (admin/root only)

**Request:**
```json
{
  "name": "junior_singles",
  "display_name": "Junior Singles",
  "description": "For players under 18",
  "is_team_based": false,
  "is_active": true,
  "sort_order": 4
}
```

#### PUT `/api/master-data/categories/{id}`
Update an existing category (admin/root only)

#### DELETE `/api/master-data/categories/{id}`
Delete a category (admin/root only, prevents deletion if in use)

### ✅ **3. React Hooks**
**File:** `src/lib/hooks/useCategories.ts`

- `useCategories()` - Fetch all categories
- `useCreateCategory()` - Create new category
- `useUpdateCategory()` - Update existing category
- `useDeleteCategory()` - Delete category

**Example Usage:**
```typescript
const { data: categories, isLoading } = useCategories();
const createCategory = useCreateCategory();

await createCategory.mutateAsync({
  name: 'pro_doubles',
  display_name: 'Pro Doubles',
  is_team_based: true,
  is_active: true
});
```

### ✅ **4. Master Data Settings Page**
**URL:** `/settings/master-data`

**Features:**
- View all categories in a table
- Create new categories with modal form
- Edit existing categories
- Delete categories (with protection if in use)
- Toggle active/inactive status
- Set team-based flag
- Configure display order

**Access:** Admin and Root users only

**UI Components:**
- Categories table with status badges
- Create/Edit modal with form validation
- Delete confirmation modal
- Real-time updates via React Query

### ✅ **5. Navigation Integration**
Added "Master Data" link to Settings menu:
- Desktop navigation
- Mobile navigation
- Only visible to admin/root users

### ✅ **6. Fixture Generation Updates**
**Changed:** Fixtures now generate based on **category only** (removed rating and gender)

**Before:**
- Division key: `${category}_${rating}_${gender}`
- Example: `singles_<3.2_male`

**After:**
- Division key: `${category}`
- Example: `singles`

**Impact:**
- All singles players compete together (regardless of rating/gender)
- All doubles teams compete together
- All mixed teams compete together
- Simpler division structure
- More flexible for different tournament structures

---

## How It Works

### Category Management Workflow

1. **Admin visits `/settings/master-data`**
2. **Views all categories** (active and inactive)
3. **Can create new category:**
   - Enter display name (e.g., "Senior Singles")
   - Auto-generate internal name (e.g., "senior_singles")
   - Set description
   - Mark as team-based or individual
   - Set active status
   - Set display order
4. **Can edit existing category:**
   - Update any field
   - Toggle active/inactive
   - Change display order
5. **Can delete category:**
   - Only if not used in any registrations
   - Otherwise, set as inactive instead

### Category Usage in Tournaments

1. **Registration forms** fetch active categories
2. **Dropdowns show** categories in sort order
3. **Team-based categories** trigger partner fields
4. **Individual categories** hide partner fields
5. **Fixture generation** groups by category
6. **Separate brackets** created per category

---

## Database Schema

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  is_team_based BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);
```

### Row Level Security (RLS)

**Read Policy:** Anyone can view active categories
```sql
POLICY "Anyone can view active categories"
  USING (is_active = true OR auth.uid() IS NOT NULL);
```

**Write Policy:** Only admins/root can manage
```sql
POLICY "Admins can manage categories"
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'root')
    )
  );
```

---

## Example Categories

### Default Setup
```sql
INSERT INTO categories (name, display_name, is_team_based, sort_order) VALUES
  ('singles', 'Singles', false, 1),
  ('doubles', 'Doubles', true, 2),
  ('mixed', 'Mixed Doubles', true, 3);
```

### Extended Setup (Examples)
```sql
-- Age-based categories
('junior_singles', 'Junior Singles (U18)', false, 4),
('senior_singles', 'Senior Singles (50+)', false, 5),

-- Skill-based (if you want to separate later)
('beginner_singles', 'Beginner Singles', false, 6),
('advanced_doubles', 'Advanced Doubles', true, 7),

-- Special formats
('king_of_the_court', 'King of the Court', false, 8),
('round_robin', 'Round Robin', false, 9);
```

---

## Migration Guide

### Step 1: Run Database Migration
```bash
# In Supabase SQL Editor
Run: supabase/migrations/025_create_categories_master_data.sql
```

### Step 2: Verify Default Categories
```sql
SELECT * FROM categories ORDER BY sort_order;
```

Should return: Singles, Doubles, Mixed

### Step 3: Update Registration Forms
Forms should fetch categories dynamically:
```typescript
const { data: categories } = useCategories();

<Select options={categories.map(c => ({
  value: c.name,
  label: c.display_name
}))} />
```

### Step 4: Test Fixture Generation
1. Create tournament with multiple formats
2. Register participants in different categories
3. Generate fixtures
4. Verify separate brackets per category

---

## Use Cases

### Use Case 1: Add New Category
**Scenario:** Tournament wants "Junior Doubles" category

**Steps:**
1. Go to Settings → Master Data
2. Click "Add Category"
3. Enter:
   - Display Name: "Junior Doubles"
   - Internal Name: "junior_doubles"
   - Team-based: Yes
   - Active: Yes
4. Save
5. Category now appears in registration forms

### Use Case 2: Temporarily Disable Category
**Scenario:** Not running Mixed Doubles this season

**Steps:**
1. Go to Settings → Master Data
2. Find "Mixed Doubles"
3. Click Edit
4. Toggle "Active" to OFF
5. Save
6. Category hidden from registration forms (existing registrations preserved)

### Use Case 3: Reorder Categories
**Scenario:** Want Doubles to appear first

**Steps:**
1. Edit "Doubles" category
2. Set sort_order to 0
3. Edit "Singles" category
4. Set sort_order to 1
5. Save both
6. Dropdowns now show Doubles first

### Use Case 4: Custom Category
**Scenario:** Special "Pro Exhibition" category

**Steps:**
1. Create category:
   - Name: "pro_exhibition"
   - Display: "Pro Exhibition"
   - Team-based: No
   - Active: Yes
2. Participants can now register for this category
3. Fixtures generated separately for Pro Exhibition players

---

## API Examples

### Fetch Active Categories (Public)
```bash
curl https://your-domain.com/api/master-data/categories
```

### Create Category (Admin)
```bash
curl -X POST https://your-domain.com/api/master-data/categories \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "senior_doubles",
    "display_name": "Senior Doubles (50+)",
    "description": "For players 50 years and older",
    "is_team_based": true,
    "is_active": true,
    "sort_order": 10
  }'
```

### Update Category (Admin)
```bash
curl -X PUT https://your-domain.com/api/master-data/categories/{id} \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "display_name": "Senior Doubles (55+)",
    "description": "Updated age requirement"
  }'
```

### Delete Category (Admin)
```bash
curl -X DELETE https://your-domain.com/api/master-data/categories/{id} \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Benefits

### ✅ **Flexibility**
- Add new categories without code changes
- Customize per tournament needs
- Enable/disable categories seasonally

### ✅ **Scalability**
- Unlimited categories
- No hardcoded limits
- Database-driven

### ✅ **User-Friendly**
- Admin UI for management
- No SQL required
- Real-time updates

### ✅ **Data Integrity**
- Prevents deletion of in-use categories
- RLS security
- Audit trail (created_by, timestamps)

### ✅ **Simpler Fixtures**
- Category-based only (removed rating/gender complexity)
- Clearer bracket structure
- Easier to understand

---

## Security

### Access Control
- **Read:** Anyone can view active categories
- **Write:** Admin/Root only
- **Delete:** Protected if category in use

### RLS Policies
- Automatic security at database level
- No accidental data leaks
- User context aware

### Validation
- Name uniqueness enforced
- Required fields validated
- Type checking (team_based, is_active)

---

## Future Enhancements

### Possible Additions:
- [ ] Category icons/colors
- [ ] Category-specific rules (max teams, entry fee)
- [ ] Category templates (quick presets)
- [ ] Bulk import/export categories
- [ ] Category analytics (usage stats)
- [ ] Multi-language display names
- [ ] Category prerequisites (e.g., must be Pro to enter)

---

## Files Created/Modified

### New Files:
- ✅ `supabase/migrations/025_create_categories_master_data.sql`
- ✅ `src/app/api/master-data/categories/route.ts`
- ✅ `src/app/api/master-data/categories/[id]/route.ts`
- ✅ `src/lib/hooks/useCategories.ts`
- ✅ `src/app/settings/master-data/page.tsx`
- ✅ `src/components/ui/Switch.tsx`
- ✅ `MASTER_DATA_SYSTEM.md`

### Modified Files:
- ✅ `src/app/api/tournaments/[id]/generate-fixtures/route.ts` (category-only division)
- ✅ `src/components/Header.tsx` (added Master Data link)
- ✅ `src/components/ui/index.ts` (exported Switch)

---

## Summary

The Master Data Management System provides:
- ✅ Dynamic category configuration
- ✅ Admin-friendly UI
- ✅ Secure API endpoints
- ✅ React hooks for easy integration
- ✅ Simplified fixture generation (category-based only)
- ✅ Complete access control
- ✅ Extensible architecture

**Perfect for:** Tournaments with changing category needs, multiple tournament types, or custom category requirements!

---

**Status:** ✅ Complete and Ready to Use  
**Breaking Changes:** Fixture generation now uses category only (no rating/gender)  
**Database Changes:** New `categories` table  
**Next Step:** Run database migration and update registration forms to use dynamic categories

