# Bird-PUC Design System
## Vintage IBM Document Style - Monochrome with Dark/Light Mode

---

## Overview

The Bird-PUC application has been completely restyled with a **vintage IBM document aesthetic**:

- ✅ **Monospace Typography** using Maison Mono Regular font
- ✅ **Monochrome Color Palette** (black, white, grays)
- ✅ **Strong Typography** with uppercase headers and bold borders
- ✅ **Dark/Light Mode** support with smooth transitions
- ✅ **Grid-based Layouts** inspired by punch cards and mainframe printouts
- ✅ **No Rounded Corners** - pure geometric rectangles
- ✅ **No Shadows** - clean, flat design with dividers instead of boxes
- ✅ **Divider-based Lists** - horizontal lines between items, not borders around

---

## New Files Created

### Design System
- **`src/design-system.css`** - Complete design system with CSS variables for theming

### Components
- **`src/components/ThemeToggle.tsx`** - Dark/light mode toggle button
- **`src/components/ThemeToggle.css`** - Styling for theme toggle

### Utilities
- All utility files from the previous refactoring maintain compatibility with the new design

---

## Color Palette

### Light Mode (Default)
```
Background:
  Primary:   #FFFFFF
  Secondary: #F5F5F5
  Tertiary:  #E8E8E8

Text:
  Primary:   #000000
  Secondary: #333333
  Tertiary:  #666666
  Muted:     #999999

Borders:
  Primary:   #000000 (thick borders)
  Secondary: #333333 (medium borders)
  Tertiary:  #CCCCCC (thin borders)
```

### Dark Mode
```
Background:
  Primary:   #000000
  Secondary: #0A0A0A
  Tertiary:  #151515

Text:
  Primary:   #FFFFFF
  Secondary: #CCCCCC
  Tertiary:  #999999
  Muted:     #666666

Borders:
  Primary:   #FFFFFF (thick borders)
  Secondary: #CCCCCC (medium borders)
  Tertiary:  #333333 (thin borders)
```

---

## Typography

### Font Stack
```css
font-family: 'Maison Mono', 'Courier New', monospace;
```

### Font Sizes (IBM Document Scale)
```
xs:   10px  - Fine print, metadata
sm:   11px  - Small labels, badges
base: 13px  - Body text (default)
md:   14px  - Subheadings
lg:   16px  - Important text
xl:   20px  - Section headers
2xl:  24px  - Page titles
3xl:  32px  - Main titles
```

### Text Styling
- **Headers**: UPPERCASE with thick bottom borders
- **Labels**: UPPERCASE with letter-spacing
- **Body**: Monospace with consistent line-height
- **Emphasis**: Bold weight, not italics (IBM style)

---

## Layout System

### Spacing (8px Grid)
```
space-1:  4px
space-2:  8px
space-3:  12px
space-4:  16px
space-5:  20px
space-6:  24px
space-8:  32px
space-10: 40px
space-12: 48px
space-16: 64px
```

### Borders
```
Thin:   1px - Dividers, subtle borders
Medium: 2px - Standard borders
Thick:  3px - Emphasis borders, headers
```

### Border Radius
```
0px - NO ROUNDED CORNERS (IBM style is purely geometric)
```

---

## Components

### Buttons
```css
/* Standard Button */
border: 2px solid var(--color-border-primary);
background: var(--color-bg-primary);
text-transform: uppercase;
letter-spacing: 0.08em;

/* Hover Effect - Simple background change */
background-color: var(--color-bg-hover);

/* Primary Button */
background: var(--color-text-primary);
color: var(--color-bg-primary);
```

### List Items (Detection Cards)
```css
/* Divider-based design - no borders on sides */
border-bottom: 1px solid var(--color-border-tertiary);
background: var(--color-bg-primary);
padding: 20px 0;

/* Hover Effect */
background-color: var(--color-bg-hover);
```

### Inputs
```css
border: 1px solid var(--color-border-primary);
background: var(--color-bg-primary);
font-family: var(--font-family-mono);
text-transform: uppercase;
```

---

## Theme Toggle

### Usage
The theme toggle button appears in the top-right corner of the screen.

- **[LIGHT] ◐** - Light mode active
- **[DARK] ◑** - Dark mode active

### Persistence
Theme preference is saved to `localStorage` and persists across sessions.

### Default Behavior
If no preference is saved, the app respects the system's `prefers-color-scheme` setting.

---

## Design Principles

### 1. **Punch Card Aesthetic**
- Grid-based layouts with precise alignment
- Structured, tabular data presentation
- Heavy use of horizontal lines and boxes

### 2. **Mainframe Printout Style**
- Fixed-width fonts throughout
- Clear hierarchies with borders
- Monochrome color scheme
- NO gradients or soft shadows

### 3. **IBM Corporate Identity**
- Strong contrast for readability
- Geometric shapes (no curves)
- Technical, professional appearance
- Utilitarian design language

### 4. **Document Hierarchy**
```
┏━━━━━━━━━━━━━━━━━━━━━━┓
┃ MAIN TITLE            ┃  <-- Thick border top/bottom
┣━━━━━━━━━━━━━━━━━━━━━━┫
┃                        ┃
┃ Section Header        ┃
┃ ━━━━━━━━━━━━━━━━━━━━ ┃  <-- Divider
┃ Item 1                ┃
┃ ────────────────────  ┃  <-- Thin divider
┃ Item 2                ┃
┃ ────────────────────  ┃
┃ Item 3                ┃
┃                        ┃
┗━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## CSS Variables

All design tokens are defined in `src/design-system.css` using CSS custom properties:

### Accessing Variables
```css
.my-component {
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  border: var(--border-width-medium) solid var(--color-border-primary);
  padding: var(--space-4);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-base);
  transition: all var(--transition-fast);
}
```

### Theme-aware Styling
Variables automatically update when theme changes via `data-theme` attribute on root:

```css
:root[data-theme="dark"] {
  --color-bg-primary: #000000;
  --color-text-primary: #FFFFFF;
  /* ... */
}
```

---

## Utility Classes

### IBM-Specific Classes
```css
.ibm-card        /* Card with border and padding */
.ibm-box         /* Simple bordered container */
.ibm-divider     /* Thin horizontal divider */
.ibm-divider-thick /* Thick horizontal divider */
```

### Text Classes
```css
.text-uppercase  /* UPPERCASE text */
.text-bold       /* Bold text */
.text-mono       /* Monospace font */
```

---

## Animations

### Hover Effects
Simple background color changes - no shadows or transforms:
```css
background-color: var(--color-bg-hover);
```

### Loading States
```css
.ibm-blink  /* Blinking cursor effect */
.spinner    /* Rotating border spinner */
```

---

## Browser Support

- ✅ Modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ CSS Custom Properties required
- ✅ Respects system color scheme preferences
- ✅ Fully responsive design

---

## Accessibility

- ✅ High contrast in both modes
- ✅ ARIA labels on interactive elements
- ✅ Keyboard navigation supported
- ✅ Focus indicators visible
- ✅ Monospace fonts improve readability for technical content

---

## Migration Notes

### From Previous Design
All existing functionality preserved:
- ✅ No breaking changes
- ✅ All components work identically
- ✅ Same data flow and API calls
- ✅ Only visual changes

### Updated Files
- All CSS files completely rewritten
- Theme toggle added to `App.tsx`
- Design system imported in `index.css`
- Audio preload changed from 'metadata' to 'none' in AudioPlayer

---

## Future Enhancements

Potential additions to consider:
- [ ] Print stylesheet optimized for actual paper
- [ ] Additional theme variants (green terminal, amber CRT)
- [ ] Punch card pattern backgrounds
- [ ] Typewriter text animation effects
- [ ] ASCII art decorative elements
- [ ] Dot matrix printer effect for titles

---

## References

Design inspired by:
- IBM 5081 Mainframe documentation
- Punch card aesthetics (1960s-1970s)
- Technical manuals and spec sheets
- Monospace terminal interfaces
- Corporate modernism movement

---

**Built with precision. Styled with purpose. Documented like IBM.**

```
┌─────────────────────────────────────┐
│ END OF DOCUMENT                     │
│ SYSTEM: BIRD-PUC v2.0               │
│ STYLE: IBM MONOCHROME               │
│ STATUS: ████████████████ 100%       │
└─────────────────────────────────────┘
```

