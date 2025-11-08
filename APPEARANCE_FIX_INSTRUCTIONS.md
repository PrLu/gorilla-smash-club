# Appearance Customization - Troubleshooting & Testing

## Issue: Colors Not Applying After Save

If you saved your custom colors but don't see changes on the website, follow these steps:

### Quick Fix Steps:

1. **Hard Refresh the Page**
   - Windows/Linux: `Ctrl + Shift + R` or `Ctrl + F5`
   - Mac: `Cmd + Shift + R`
   - This clears the browser cache and reloads CSS

2. **Clear Browser Cache**
   - Chrome: Settings → Privacy and security → Clear browsing data → Cached images and files
   - Firefox: Options → Privacy & Security → Cookies and Site Data → Clear Data
   - Safari: Develop → Empty Caches

3. **Check Browser Console**
   - Press `F12` to open Developer Tools
   - Go to Console tab
   - Look for any error messages
   - Check if CSS variables are being set in the Elements/Inspector tab

### Testing Your Custom Colors:

Visit the test page: **`/test-appearance`**

This page shows:
- Your current custom color settings
- Sample content using those colors
- Visual swatches of each color
- Instructions for testing

### Verify CSS Variables are Set:

1. Open Developer Tools (F12)
2. Go to Elements/Inspector tab
3. Select the `<html>` element
4. Look in the Styles panel for:
   ```css
   :root {
     --custom-primary-font: #yourcolor;
     --custom-secondary-font: #yourcolor;
     --custom-heading-font: #yourcolor;
     ...
   }
   ```

If you don't see these variables, the AppearanceProvider might not be loading.

### Common Issues & Solutions:

#### 1. Colors Not Updating Immediately
**Solution**: Hard refresh the page (Ctrl+Shift+R)

#### 2. Only Some Colors Change
**Solution**: Some UI components have specific color overrides. The custom colors apply to:
- Main headings and titles
- Body text and paragraphs
- Page backgrounds
- Card backgrounds
- Most gray text elements

#### 3. Button Colors Don't Change
**Note**: Primary buttons use the theme's primary color (blue) by design. Your custom colors affect text and backgrounds, not button colors (which would be a separate customization).

#### 4. Changes Don't Persist
**Check**: Make sure you're logged in and the database migration has been run:
```bash
supabase migration up
```

### What Gets Customized:

✅ **DOES Change**:
- Page backgrounds (main, cards, sections)
- Main text color (paragraphs, descriptions)
- Secondary text color (helper text, labels)
- Heading colors (h1, h2, h3, etc.)
- Custom logo in header

❌ **DOESN'T Change**:
- Button colors (by design - use specific color classes)
- Border colors (use theme defaults)
- Icon colors (inherit from text)
- Focus/hover states (use theme colors)
- Error/success/warning colors (semantic colors)

### Manual CSS Variable Check:

Open the browser console and run:
```javascript
// Check if variables are set
const styles = getComputedStyle(document.documentElement);
console.log('Primary Font:', styles.getPropertyValue('--custom-primary-font'));
console.log('Primary BG:', styles.getPropertyValue('--custom-primary-bg'));
console.log('Dark Primary Font:', styles.getPropertyValue('--custom-dark-primary-font'));
```

### Force Apply Custom Colors:

If colors still don't apply, try this in the browser console:
```javascript
// Force refresh appearance
window.location.reload(true);
```

### Database Check:

Verify your preferences are saved in the database:

1. Go to Supabase Dashboard
2. Navigate to Table Editor
3. Open `appearance_preferences` table
4. Find your row (filter by your `profile_id`)
5. Verify the color values are correct

### Still Not Working?

1. **Check the Network Tab**:
   - Open DevTools → Network
   - Reload the page
   - Look for any failed CSS file loads

2. **Verify CSS Import Order**:
   - Custom colors CSS must load AFTER Tailwind
   - Check `src/app/globals.css` - custom-colors.css import should be at the bottom

3. **Test in Incognito/Private Mode**:
   - This eliminates browser extension interference
   - Opens without cached data

4. **Check Console Errors**:
   - Any React errors?
   - Any network errors?
   - Any TypeScript errors?

### Developer Notes:

The appearance system works in three parts:

1. **AppearanceProvider** (wraps the app)
   - Fetches user preferences from database
   - Calls `applyCustomStyles()` to set CSS variables
   - Runs on every route change

2. **CSS Variables** (set dynamically)
   - Applied to `:root` element
   - Available throughout the app
   - Override Tailwind defaults with `!important`

3. **Custom CSS** (`custom-colors.css`)
   - Targets specific Tailwind classes
   - Uses `!important` to override
   - Provides opt-out with `.no-custom` class

### For Next.js/React Developers:

If custom colors aren't applying, check:
```typescript
// In AppearanceProvider.tsx
useEffect(() => {
  if (preferences) {
    applyCustomStyles(preferences); // ← This should run
    console.log('Applied styles:', preferences);
  }
}, [preferences]);
```

### Need More Help?

1. Check the test page: `/test-appearance`
2. Review documentation: `APPEARANCE_CUSTOMIZATION.md`
3. Check browser console for errors
4. Verify migration was applied
5. Try in a different browser

