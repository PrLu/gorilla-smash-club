# Gorilla Smash Club - Brand Guidelines

## Brand Assets

### Logo Files

Located in `public/brand/`:

- **`logo.svg`** - Full horizontal logo with text (600×200px)
- **`logo-mark.svg`** - Icon only, no text (200×200px)

### Usage Rules

#### Full Logo (`logo.svg`)
- **Use for**: Headers, landing pages, marketing materials
- **Minimum width**: 180px (maintains readability)
- **Clear space**: Maintain 20px padding around logo
- **Backgrounds**: Works on dark navy (#03045e) or white backgrounds

#### Logo Mark (`logo-mark.svg`)  
- **Use for**: Favicons, app icons, social media avatars, mobile headers
- **Minimum size**: 32×32px
- **Clear space**: 10px minimum around icon
- **Backgrounds**: Navy circle provides built-in background

### Incorrect Usage

❌ Don't stretch or distort the logo
❌ Don't change colors (except white on dark/dark on white)
❌ Don't add effects (drop shadows, outlines, gradients)
❌ Don't use logo smaller than minimum sizes
❌ Don't place on busy backgrounds without adequate contrast

---

## Color Palette

### Primary Colors (From Logo)

**Navy Blue (Primary)**
```
Light mode:
- primary-700: #03045e  (Main brand color - logo background)
- primary-600: #023e8a  (Darker interactive elements)
- primary-500: #0077b6  (Hover states)

Dark mode:
- primary-500: #00b4d8  (Inverted for dark backgrounds)
- primary-600: #48cae4  (Lighter for dark mode)
```

**Usage**: Primary buttons, headers, key UI elements, links

**Contrast Ratios**:
- White text on #03045e: 14.8:1 ✅ (AAA)
- #03045e text on white: 14.8:1 ✅ (AAA)

---

**Lime Green (Accent)**
```
Light mode:
- accent-500: #84cc16  (Pickleball paddle color)
- accent-600: #65a30d  (Darker shade)

Dark mode:
- accent-500: #a3e635  (Brighter for visibility)
```

**Usage**: Highlights, success states, CTAs, active indicators

**Contrast Ratios**:
- Black text on #84cc16: 7.2:1 ✅ (AAA)
- White text on #65a30d: 5.1:1 ✅ (AA Large)

---

**Cyan Blue (Secondary)**
```
Light mode:
- secondary-500: #06b6d4  (Logo border accent)
- secondary-600: #0891b2

Dark mode:
- secondary-500: #22d3ee
```

**Usage**: Badges, secondary buttons, decorative elements

---

**Orange (Highlight)**
```
Light mode:
- highlight-500: #f97316  (Flame color)
- highlight-600: #ea580c

Dark mode:
- highlight-500: #fb923c
```

**Usage**: "Live" indicators, urgent notifications, special highlights

---

### Functional Colors

**Success**: Green (#22c55e)
**Warning**: Yellow/Orange (#f59e0b)
**Error**: Red (#ef4444)
**Gray**: Full scale from #f9fafb to #030712

---

## Typography

### Headings
**Font**: Poppins
**Weights**: 600 (Semibold), 700 (Bold), 800 (Extrabold), 900 (Black)
**Usage**: Page titles, card headers, CTAs

```tsx
<h1 className="font-display text-4xl font-bold">
  Gorilla Smash Club
</h1>
```

### Body Text
**Font**: Inter
**Weights**: 400 (Regular), 500 (Medium), 600 (Semibold)
**Usage**: Paragraphs, descriptions, UI text

```tsx
<p className="font-sans text-base text-gray-700">
  Body content here
</p>
```

### Font Loading

Fonts are loaded via Next.js `next/font/google`:

```typescript
import { Inter, Poppins } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const poppins = Poppins({ 
  subsets: ['latin'], 
  weight: ['600', '700', '800', '900'],
  variable: '--font-poppins' 
});
```

In Tailwind config:
```javascript
fontFamily: {
  display: ['var(--font-poppins)', 'Poppins', 'system-ui', 'sans-serif'],
  sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
}
```

---

## Dark Mode Support

### Implementation

Dark mode uses Tailwind's `class` strategy:

```tsx
// Toggle dark mode
document.documentElement.classList.toggle('dark');

// Use dark: prefix for dark mode styles
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
```

### Color Adaptations

All brand colors have dark mode variants that maintain:
- ✅ Proper contrast ratios (WCAG AA minimum)
- ✅ Brand recognition (similar hues, adjusted brightness)
- ✅ Readability on dark backgrounds

### Testing

```bash
# Enable dark mode in browser
# Chrome DevTools > Rendering > Emulate prefers-color-scheme: dark
```

---

## Icon & Favicon Sizes

### Favicons (Generated from `logo-mark.svg`)

- **favicon-16.png**: 16×16px (browser tabs)
- **favicon-32.png**: 32×32px (browser tabs, retina)
- **apple-touch-icon.png**: 180×180px (iOS home screen)
- **android-chrome-192x192.png**: 192×192px (Android)
- **android-chrome-512x512.png**: 512×512px (Android splash)

### Regenerating Assets

```bash
# Using ImageMagick
bash scripts/generate_favicons.sh

# Using Node.js + Sharp
npm install sharp
node scripts/generate_favicons.js
```

---

## Alt Text Guidelines

**Logo Mark**: "Gorilla Smash Club"
**Full Logo**: "Gorilla Smash Club - The Beast Mode of Pickleball"
**Favicons**: Not needed (decorative only)

Example:
```tsx
<Image 
  src="/brand/logo-mark.svg" 
  alt="Gorilla Smash Club"
  width={40}
  height={40}
/>
```

---

## Component Usage

### Header with Logo

```tsx
import { Header } from '@/components/Header';

// Header includes logo automatically
<Header />
```

### Standalone Logo

```tsx
import Image from 'next/image';

<Image
  src="/brand/logo.svg"
  alt="Gorilla Smash Club - The Beast Mode of Pickleball"
  width={300}
  height={100}
  priority
/>
```

### Logo Mark Only

```tsx
<Image
  src="/brand/logo-mark.svg"
  alt="Gorilla Smash Club"
  width={48}
  height={48}
/>
```

---

## Design Tokens Access

Tokens are centralized in `src/styles/tokens.json` and imported via Tailwind:

```tsx
// Use semantic color names
<Button className="bg-primary-700 hover:bg-primary-600">

// Access tokens in JS/TS
import tokens from '@/styles/tokens.json';
const primaryColor = tokens.colors.light.primary[700];
```

---

## Brand Voice & Messaging

**Tagline**: "The Beast Mode of Pickleball"

**Tone**: 
- Energetic and competitive
- Professional but fun
- Sports-focused
- Community-driven

**Sample Copy**:
- "Unleash your game"
- "Dominate the court"
- "Beast mode activated"
- "Smash your competition"

---

## Questions?

For brand asset updates or questions, see:
- `README_BRAND_ASSETS.md` - Asset regeneration guide
- `ACCESSIBILITY_BRAND_NOTES.md` - Contrast and a11y notes

