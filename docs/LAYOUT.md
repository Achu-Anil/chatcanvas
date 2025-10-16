# Layout Implementation

This document describes the root layout implementation with navigation, theming, and font configuration.

## Overview

The root layout (`src/app/layout.tsx`) provides the application shell with:

- **Inter Font**: Modern, legible sans-serif from Google Fonts
- **ThemeProvider**: Dark mode support with system detection
- **Sticky Header**: Navigation with Home, Chat, Admin links
- **Theme Toggle**: Sun/moon icon to switch between light/dark modes

## Files

### 1. `src/app/layout.tsx`

Root layout component that wraps the entire application.

**Key Features:**

```typescript
// Inter font from Google Fonts
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// HTML structure
<html lang="en" suppressHydrationWarning>
  <body className={`${inter.variable} font-sans antialiased`}>
    <PostHogProvider>
      <ThemeProvider attribute="class" defaultTheme="system">
        <div className="relative flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
        </div>
      </ThemeProvider>
    </PostHogProvider>
  </body>
</html>;
```

**Important Attributes:**

- `suppressHydrationWarning`: Prevents hydration warnings from theme provider
- `attribute="class"`: Tells ThemeProvider to use `.dark` class for dark mode
- `defaultTheme="system"`: Respects user's OS preference
- `enableSystem`: Allows automatic theme detection

### 2. `src/components/header.tsx`

Sticky navigation header with responsive design.

**Features:**

- **Logo**: ChatCanvas branding with MessageSquare icon
- **Navigation Links**: Home, Chat, Admin
- **Active State**: Highlights current page
- **Theme Toggle**: Dark mode switcher
- **Sticky Position**: Stays at top when scrolling
- **Backdrop Blur**: Frosted glass effect

**Styling:**

```typescript
className="sticky top-0 z-50 w-full border-b
  bg-background/95 backdrop-blur
  supports-[backdrop-filter]:bg-background/60"
```

**Active Link Detection:**

```typescript
const isActive =
  pathname === link.href ||
  (link.href !== "/" && pathname.startsWith(link.href));
```

## Font Configuration

### Inter Font Setup

**In `layout.tsx`:**

```typescript
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
```

**In `tailwind.config.ts`:**

```typescript
fontFamily: {
  sans: ["var(--font-inter)", "system-ui", "sans-serif"],
}
```

**In `globals.css`:**

```css
body {
  font-family: var(--font-inter), system-ui, -apple-system, sans-serif;
}
```

This creates a font stack with:

1. Inter (if loaded)
2. System UI fonts (fallback)
3. Generic sans-serif (ultimate fallback)

## Dark Mode Implementation

### Tailwind Configuration

**In `tailwind.config.ts`:**

```typescript
darkMode: ["class"], // Use .dark class strategy
```

### CSS Variables

**In `globals.css`:**

```css
:root {
  --background: 0 0% 100%; /* Light mode */
  --foreground: 222.2 84% 4.9%;
  /* ... other colors */
}

.dark {
  --background: 222.2 84% 4.9%; /* Dark mode */
  --foreground: 210 40% 98%;
  /* ... other colors */
}
```

### Theme Provider

**From `next-themes`:**

```typescript
<ThemeProvider
  attribute="class"       // Adds/removes .dark class
  defaultTheme="system"   // Use OS preference
  enableSystem            // Detect system theme
  disableTransitionOnChange // Prevent flash
>
```

### Theme Toggle

**Button in Header:**

- Sun icon in light mode
- Moon icon in dark mode
- Smooth rotation animation
- Accessible with ARIA labels

## Navigation Structure

### Links Configuration

```typescript
const navLinks = [
  { href: "/", label: "Home" },
  { href: "/chat", label: "Chat" },
  { href: "/admin", label: "Admin" },
] as const;
```

### Active State Styling

```typescript
className={cn(
  "text-sm font-medium transition-colors hover:text-primary",
  isActive
    ? "text-foreground"      // Active: full opacity
    : "text-muted-foreground" // Inactive: muted
)}
```

### Accessibility

- `aria-current="page"` for active links
- `aria-label` for logo link
- `aria-label="Main navigation"` for nav element
- Semantic HTML (`<header>`, `<nav>`, `<main>`)

## Responsive Design

### Header Layout

- **Mobile**: Compact spacing, smaller font sizes
- **Desktop**: Full spacing, readable font sizes

### Container

```typescript
className = "container mx-auto flex h-14 max-w-screen-2xl items-center px-4";
```

- Centered content
- Max width: 2xl (1400px)
- Consistent padding
- Height: 56px (14 \* 4px)

## Layout Structure

```
RootLayout
├── PostHogProvider (Analytics)
└── ThemeProvider (Dark mode)
    └── <div> (Flex container)
        ├── Header (Sticky navigation)
        └── <main> (Page content)
```

**Flex Layout:**

```typescript
className = "relative flex min-h-screen flex-col";
```

- `min-h-screen`: At least full viewport height
- `flex-col`: Vertical stacking
- Header stays at top
- Main content grows to fill space

## Usage

### Accessing Current Theme

```typescript
import { useTheme } from "next-themes";

function MyComponent() {
  const { theme, setTheme } = useTheme();

  return (
    <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
      Toggle Theme
    </button>
  );
}
```

### Checking Active Route

```typescript
import { usePathname } from "next/navigation";

function MyNav() {
  const pathname = usePathname();
  const isChat = pathname.startsWith("/chat");

  return <div>{isChat ? "Chat Active" : "Other Page"}</div>;
}
```

### Custom Font in Components

```typescript
// Inter is automatically applied via font-sans
<div className="font-sans">Uses Inter</div>

// Or explicitly
<div className="font-[family-name:var(--font-inter)]">
  Explicitly uses Inter
</div>
```

## Testing Dark Mode

### Manual Toggle

1. Visit any page
2. Click sun/moon icon in header
3. Theme should switch instantly
4. Refresh page - theme persists

### System Preference

1. Set OS to dark mode
2. Visit app (first time)
3. Should load in dark mode automatically

### Keyboard Navigation

1. Tab to theme toggle button
2. Press Enter/Space to toggle
3. Theme should change

## Customization

### Change Default Theme

```typescript
// In layout.tsx
<ThemeProvider
  defaultTheme="dark"  // Always start in dark mode
  // or
  defaultTheme="light" // Always start in light mode
>
```

### Add More Nav Links

```typescript
// In header.tsx
const navLinks = [
  { href: "/", label: "Home" },
  { href: "/chat", label: "Chat" },
  { href: "/admin", label: "Admin" },
  { href: "/docs", label: "Docs" }, // Add new link
  { href: "/settings", label: "Settings" },
] as const;
```

### Change Header Height

```typescript
// In header.tsx
className = "... h-14 ..."; // Current: 56px
// Change to:
className = "... h-16 ..."; // 64px
className = "... h-20 ..."; // 80px
```

### Modify Font

```typescript
// In layout.tsx
import { Roboto } from "next/font/google";

const roboto = Roboto({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
});

// Then update tailwind.config.ts
fontFamily: {
  sans: ["var(--font-roboto)", "system-ui", "sans-serif"],
}
```

## Troubleshooting

### Theme Not Persisting

**Issue**: Theme resets on page refresh

**Solution**: Check that `next-themes` is properly installed:

```bash
npm install next-themes
```

### Font Not Loading

**Issue**: Inter font not appearing

**Solution**:

1. Check network tab for font download
2. Verify `font-sans` class is applied
3. Clear `.next` cache: `rm -rf .next`

### Hydration Errors

**Issue**: Console warnings about hydration

**Solution**: Ensure `suppressHydrationWarning` on `<html>`:

```typescript
<html lang="en" suppressHydrationWarning>
```

### Header Not Sticky

**Issue**: Header scrolls with content

**Solution**: Check for conflicting `position` styles:

```typescript
// Should be:
className = "sticky top-0 z-50";

// Not:
className = "relative"; // Wrong!
```

## Performance

### Font Optimization

- **Variable Font**: Single file for all weights
- **Display Swap**: Shows fallback while loading
- **Preloading**: Next.js automatically preloads fonts
- **Subsetting**: Only includes Latin characters

### Bundle Size

- Header: ~1KB gzipped
- Inter font: ~15KB per weight
- Theme provider: ~2KB gzipped

### Rendering

- Header: Client component (needs `usePathname`)
- Layout: Server component (metadata, static structure)
- Theme toggle: Client component (interactive)

## Best Practices

1. **Keep Header Simple**: Minimal JavaScript, fast render
2. **Use CSS Variables**: Easy theme customization
3. **Semantic HTML**: Better accessibility and SEO
4. **Mobile First**: Design for small screens first
5. **Test Dark Mode**: Check all colors in both themes
6. **Keyboard Navigation**: Ensure all interactive elements are accessible
7. **Performance**: Monitor font loading, minimize shifts

## Related Files

- `src/app/layout.tsx` - Root layout
- `src/components/header.tsx` - Navigation header
- `src/components/theme-toggle.tsx` - Dark mode button
- `src/components/theme-provider.tsx` - Theme context
- `src/app/globals.css` - Global styles
- `tailwind.config.ts` - Tailwind configuration
