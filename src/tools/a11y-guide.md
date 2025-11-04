# Accessibility Testing Guide

## Automated Tools

### 1. Axe DevTools (Browser Extension)

Install: [Chrome/Firefox Extension](https://www.deque.com/axe/devtools/)

**Usage:**
1. Open DevTools (F12)
2. Go to "Axe DevTools" tab
3. Click "Scan ALL of my page"
4. Review violations and fix

**Priority:**
- Critical: Fix immediately
- Serious: Fix before deployment
- Moderate: Fix in next iteration

### 2. Lighthouse (Built into Chrome)

**Usage:**
```bash
# Open Chrome DevTools > Lighthouse tab
# Select "Accessibility" category
# Run audit
```

**Target Scores:**
- Accessibility: 95+
- Performance: 90+
- Best Practices: 95+
- SEO: 90+

### 3. pa11y CLI

**Install:**
```bash
npm install -g pa11y
```

**Usage:**
```bash
# Test a single page
pa11y http://localhost:3000

# Test specific page
pa11y http://localhost:3000/dashboard

# Test with custom viewport
pa11y --viewport-width 375 --viewport-height 667 http://localhost:3000

# Generate HTML report
pa11y --reporter html http://localhost:3000 > accessibility-report.html
```

### 4. jest-axe (Automated Tests)

Already integrated in `tests/fixturesViewer.accessibility.test.tsx`

**Run:**
```bash
npm run test
```

## Manual Testing Checklist

### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Shift+Tab to navigate backwards
- [ ] Enter/Space to activate buttons
- [ ] Arrow keys to navigate menus/lists
- [ ] Escape to close modals/menus
- [ ] Focus visible on all elements

### Screen Reader Testing

**MacOS:**
```bash
# Enable VoiceOver
Cmd + F5
```

**Windows:**
```bash
# Enable Narrator
Win + Ctrl + Enter
```

**Test:**
- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Buttons have clear names
- [ ] Status messages announced
- [ ] Loading states announced

### Color Contrast

Use browser DevTools or online tools:
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

**WCAG AA Requirements:**
- Normal text: 4.5:1
- Large text (18pt+): 3:1
- UI components: 3:1

### Focus Management

- [ ] Modal traps focus
- [ ] Focus returns after modal close
- [ ] Skip to main content link (optional)
- [ ] No keyboard traps

## Common Fixes

### Missing Alt Text
```tsx
// Bad
<img src="/tournament.jpg" />

// Good
<img src="/tournament.jpg" alt="Summer Championship tournament banner" />
```

### Missing Labels
```tsx
// Bad
<input type="text" placeholder="Name" />

// Good
<Input label="Full Name" placeholder="Enter your full name" required />
```

### Poor Color Contrast
```tsx
// Bad
<span className="text-gray-400">Important text</span>

// Good
<span className="text-gray-700">Important text</span>
```

### Non-Semantic HTML
```tsx
// Bad
<div onClick={handleClick}>Click me</div>

// Good
<button onClick={handleClick}>Click me</button>
```

### Missing ARIA
```tsx
// Bad
<div onClick={toggleMenu}>⋮</div>

// Good
<button 
  onClick={toggleMenu}
  aria-label="Open menu"
  aria-expanded={isOpen}
>
  ⋮
</button>
```

## Testing Schedule

- **During development**: Use browser extensions
- **Before PR**: Run pa11y + Lighthouse
- **Before deployment**: Full manual keyboard + screen reader test
- **Post-deployment**: Monitor real user feedback

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
- [WebAIM Articles](https://webaim.org/articles/)

