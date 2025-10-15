# shadcn/ui Components Setup

This project includes a fully configured shadcn/ui component library with Tailwind CSS integration.

## Installed Components

- **Button** - Versatile button component with multiple variants
- **Input** - Text input field with consistent styling
- **Textarea** - Multi-line text input area
- **Card** - Container component with header, content, and footer sections
- **Dropdown Menu** - Accessible dropdown menu with keyboard navigation
- **Sheet** - Slide-over panel (drawer) from any side
- **Badge** - Small status indicators and labels
- **Switch** - Toggle switch component (checkbox alternative)

## Theme Provider

The app includes dark mode support via `next-themes`:

```tsx
import { ThemeProvider } from "@/components/theme-provider";

// Already configured in src/app/layout.tsx
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  disableTransitionOnChange
>
  {children}
</ThemeProvider>;
```

## Usage Examples

### Button

```tsx
import { Button } from "@/components/ui/button";

<Button variant="default">Click me</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Ghost</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
```

### Input & Textarea

```tsx
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

<Input type="email" placeholder="Email" />
<Textarea placeholder="Type your message here." />
```

### Card

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>;
```

### Dropdown Menu

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Open Menu</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>My Account</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Profile</DropdownMenuItem>
    <DropdownMenuItem>Settings</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>;
```

### Sheet (Drawer)

```tsx
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline">Open Sheet</Button>
  </SheetTrigger>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Sheet Title</SheetTitle>
      <SheetDescription>Sheet description</SheetDescription>
    </SheetHeader>
    <div className="py-4">Sheet content</div>
  </SheetContent>
</Sheet>;
```

### Badge

```tsx
import { Badge } from "@/components/ui/badge";

<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>
```

### Switch

```tsx
import { Switch } from "@/components/ui/switch";

<Switch id="airplane-mode" />
<label htmlFor="airplane-mode">Airplane Mode</label>
```

## Utility Function

The `cn()` utility function (in `src/lib/utils.ts`) combines Tailwind classes efficiently:

```tsx
import { cn } from "@/lib/utils";

<div className={cn("base-class", isActive && "active-class", className)} />;
```

## Tailwind Configuration

The project is configured with:

- CSS variables for theme colors
- Dark mode support via class strategy
- Custom animations
- shadcn/ui color palette
- tailwindcss-animate plugin

## Adding More Components

To add more shadcn/ui components:

```bash
npx shadcn@latest add [component-name]
```

Examples:

```bash
npx shadcn@latest add dialog
npx shadcn@latest add select
npx shadcn@latest add tabs
npx shadcn@latest add tooltip
```

## Dependencies

- `tailwindcss` - Utility-first CSS framework
- `tailwindcss-animate` - Animation utilities
- `class-variance-authority` - Component variant management
- `clsx` - Conditional class names
- `tailwind-merge` - Merge Tailwind classes without conflicts
- `@radix-ui/*` - Unstyled, accessible UI primitives
- `lucide-react` - Icon library
- `next-themes` - Dark mode support

## Color Customization

Edit CSS variables in `src/app/globals.css` to customize the color scheme:

```css
:root {
  --primary: 222.2 47.4% 11.2%;
  --secondary: 210 40% 96.1%;
  /* ... more variables */
}

.dark {
  --primary: 210 40% 98%;
  --secondary: 217.2 32.6% 17.5%;
  /* ... dark mode colors */
}
```

## Best Practices

1. **Always use the cn() utility** when combining classes
2. **Prefer component variants** over custom styling
3. **Use CSS variables** for consistent theming
4. **Test in both light and dark modes**
5. **Import components from @/components/ui** for consistency
