# Phase 2i: UI/UX Overhaul Documentation

## Overview

Phase 2i introduces a complete design system, accessibility improvements, and polished user experience across the entire Pickle Tourney application.

## What's New

### Design System
- ✅ **Design Tokens** (`src/styles/tokens.json`) - Centralized colors, spacing, typography
- ✅ **UI Primitives** - Reusable components (Button, Input, Select, Modal, Card, Skeleton)
- ✅ **Motion System** - Framer Motion animations with reduced-motion support
- ✅ **Component Playground** (`/design`) - Interactive preview of all components

### Visual Improvements
- ✅ **Gradient Backgrounds** - Modern aesthetic with subtle gradients
- ✅ **Micro-interactions** - Hover effects, transitions, loading states
- ✅ **Typography Scale** - Consistent font sizes and weights
- ✅ **Shadow System** - Depth and elevation through shadows
- ✅ **Icon System** - Lucide React icons throughout

### Responsive Design
- ✅ **Mobile-first** - Optimized for 320px+ screens
- ✅ **Breakpoint System** - sm, md, lg, xl responsive layouts
- ✅ **Touch Targets** - Minimum 44x44px for mobile
- ✅ **Readable Text** - 16px+ base font size

### Accessibility
- ✅ **Keyboard Navigation** - Full keyboard support
- ✅ **Screen Reader** - Proper ARIA labels and roles
- ✅ **Focus Management** - Visible focus indicators
- ✅ **Color Contrast** - WCAG AA compliant
- ✅ **Reduced Motion** - Respects user preferences

## Design Tokens

Located in `src/styles/tokens.json`. Reference these instead of hardcoding values.

### Colors
```typescript
primary.50 - primary.950 // Main brand colors
success.50 - success.700 // Green (confirmations)
warning.50 - warning.700 // Yellow/Orange (alerts)
error.50 - error.700     // Red (errors)
gray.50 - gray.950       // Neutral grays
```

### Usage
```tsx
// Bad - hardcoded
<div className="bg-blue-600 text-white">

// Good - using tokens
<div className="bg-primary-600 text-white">
```

## Component Library

### Button
```tsx
import { Button } from '@/components/ui';

<Button variant="primary" size="lg" leftIcon={<Icon />}>
  Click Me
</Button>
```

Variants: `primary | secondary | outline | ghost | danger`
Sizes: `sm | md | lg`

### Input
```tsx
import { Input } from '@/components/ui';

<Input
  label="Email"
  type="email"
  error={errors.email}
  leftIcon={<Mail />}
  required
/>
```

### Card
```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

<Card variant="elevated" hoverable>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

### Modal
```tsx
import { Modal } from '@/components/ui';

<Modal isOpen={isOpen} onClose={onClose} title="Modal Title">
  <p>Content</p>
</Modal>
```

## How to Use the Design System

### 1. View Component Playground

```bash
npm run dev
# Navigate to http://localhost:3000/design
```

The `/design` page shows:
- Color palette with all tokens
- All button variants
- Form inputs with states
- Card variants
- Loading skeletons
- Sample composed components

### 2. Add New Token

Edit `src/styles/tokens.json`:

```json
{
  "colors": {
    "brand": {
      "500": "#your-color",
      "600": "#darker-shade"
    }
  }
}
```

Update `tailwind.config.js`:

```javascript
colors: {
  brand: tokens.colors.brand,
}
```

Use in components:

```tsx
<div className="bg-brand-600 text-white">
```

### 3. Create New Component

Follow the pattern in `src/components/ui/`:

```tsx
// src/components/ui/Badge.tsx
import { forwardRef, HTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'error';
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'success', className, children, ...props }, ref) => {
    const variants = {
      success: 'bg-success-100 text-success-800',
      warning: 'bg-warning-100 text-warning-800',
      error: 'bg-error-100 text-error-800',
    };

    return (
      <span
        ref={ref}
        className={twMerge(
          clsx('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold', variants[variant], className)
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// Export from src/components/ui/index.ts
export { Badge } from './Badge';
```

## Animation Guidelines

### Use Framer Motion Variants

```tsx
import { motion } from 'framer-motion';
import { fadeIn, slideUp } from '@/lib/motion';

<motion.div variants={slideUp} initial="hidden" animate="visible">
  Content
</motion.div>
```

### Respect Reduced Motion

```tsx
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';

const prefersReducedMotion = usePrefersReducedMotion();

<motion.div
  animate={prefersReducedMotion ? {} : { y: [0, -10, 0] }}
>
  Content
</motion.div>
```

## Responsive Breakpoints

```typescript
sm:  640px  // Small phones in landscape, tablets in portrait
md:  768px  // Tablets
lg:  1024px // Laptops
xl:  1280px // Desktops
2xl: 1536px // Large desktops
```

### Mobile-first Approach

```tsx
// Starts at mobile (320px+), then adapts
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

## Testing UI Components

### Unit Tests

```bash
npm run test
```

Test files in `tests/ui/`:
- `button.test.tsx` - Button component tests
- More tests can be added following the same pattern

### Accessibility Tests

```bash
npm run test -- fixturesViewer.accessibility
```

### Manual Testing

1. **Keyboard Navigation**: Tab through all interactive elements
2. **Screen Reader**: Test with VoiceOver (Mac) or Narrator (Windows)
3. **Responsive**: Test at 375px, 768px, 1024px widths
4. **Color Blindness**: Use browser DevTools color filters
5. **Reduced Motion**: Enable in OS settings and verify animations disabled

## Performance

### Bundle Size

```bash
npm run build

# Check .next/analyze/ for bundle breakdown
```

### Lazy Loading

Heavy components are lazy-loaded:

```tsx
import dynamic from 'next/dynamic';

const FixturesViewer = dynamic(() => import('@/components/FixturesViewer'), {
  loading: () => <Skeleton height={400} />,
});
```

### Image Optimization

See `src/tools/image-optimization.md` for guidelines.

## Usability Test Plan

### 5 Scripted Tasks

#### Task 1: Create Tournament
1. Sign in as organizer
2. Go to Dashboard
3. Click "Create Tournament"
4. Fill form with test data
5. Submit

**Success**: Tournament created, redirected to detail page

#### Task 2: Browse Fixtures (Mobile)
1. Open tournament on mobile device (or DevTools 375px)
2. Tap "Fixtures" tab
3. Scroll through rounds
4. Tap a match card
5. View match details in modal

**Success**: Modal opens, details visible, can close with X or ESC

#### Task 3: View Live Scoreboard
1. Navigate to Live Scoreboard
2. Identify live matches (red indicator)
3. Check score updates
4. Scroll to completed section

**Success**: Clear visual distinction between live/completed, scores readable

#### Task 4: Invite Participant
1. Go to Manage Participants
2. Click "Add Participant"
3. Enter email + name
4. Toggle "Send invitation email"
5. Submit

**Success**: Confirmation toast, participant appears in list

#### Task 5: Keyboard Navigation
1. Use only keyboard (no mouse)
2. Tab through Dashboard
3. Navigate to tournament
4. Use arrow keys in fixtures (if implemented)
5. Open and close modal with keyboard

**Success**: All interactive elements reachable, focus visible

## Common Patterns

### Loading States

```tsx
{isLoading ? (
  <Skeleton height={200} />
) : (
  <Content data={data} />
)}
```

### Error States

```tsx
{error && (
  <Card className="border-error-300 bg-error-50 p-6">
    <p className="text-error-700">{error.message}</p>
  </Card>
)}
```

### Empty States

```tsx
{items.length === 0 && (
  <Card className="p-12 text-center">
    <Icon className="mx-auto mb-4 h-16 w-16 text-gray-300" />
    <p className="text-gray-600">No items found</p>
    <Button onClick={onCreate}>Create First Item</Button>
  </Card>
)}
```

## Troubleshooting

### Tailwind classes not applying

- Check `tailwind.config.js` includes correct content paths
- Verify tokens.json syntax is valid
- Restart dev server after changing config

### Animations not working

- Check `framer-motion` is installed
- Verify `usePrefersReducedMotion` hook is working
- Check browser console for errors

### Modal focus trap issues

- Ensure modal ref is properly set
- Check escape key listener is attached
- Verify previous focus is restored on close

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing New Components

1. Create component in `src/components/ui/`
2. Use design tokens
3. Add TypeScript types
4. Include ARIA attributes
5. Add to `src/components/ui/index.ts`
6. Preview in `/design` page
7. Write tests in `tests/ui/`
8. Document in this file

## Resources

- [Tailwind Docs](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion/)
- [Lucide Icons](https://lucide.dev)
- [WAI-ARIA Practices](https://www.w3.org/WAI/ARIA/apg/)

