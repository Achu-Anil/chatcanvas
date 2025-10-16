# Feature Flags System

This project uses a simple environment-variable-based feature flags system to conditionally enable/disable features.

## Configuration

Feature flags are configured via the `FEATURE_FLAGS` environment variable in your `.env.local` file:

```bash
# Enable multiple features (comma-separated)
FEATURE_FLAGS=templates,darkMode,analytics
```

## Available Feature Flags

| Flag        | Description            | UI Impact                                |
| ----------- | ---------------------- | ---------------------------------------- |
| `templates` | Prompt template picker | Shows template dropdown in chat composer |
| `darkMode`  | Dark mode toggle       | Shows sun/moon icon in chat header       |
| `analytics` | Analytics tracking     | Enables PostHog tracking                 |
| `export`    | Export conversation    | Shows export button in chat (future)     |

## Usage

### In React Components (Client-Side)

```typescript
import { enabled, FeatureFlags } from "@/lib/featureFlags";

export default function MyComponent() {
  const showTemplates = enabled(FeatureFlags.TEMPLATES);

  return <div>{showTemplates && <TemplateDropdown />}</div>;
}
```

### Checking Multiple Flags

```typescript
import { enabled, FeatureFlags } from "@/lib/featureFlags";

const hasAnalytics = enabled(FeatureFlags.ANALYTICS);
const hasDarkMode = enabled(FeatureFlags.DARK_MODE);
const hasExport = enabled(FeatureFlags.EXPORT);
```

## Implementation Details

The feature flags system (`src/lib/featureFlags.ts`) provides:

- **`flags: Set<string>`** - A Set of enabled feature flags parsed from `process.env.FEATURE_FLAGS`
- **`enabled(flag: string): boolean`** - Helper function to check if a flag is enabled
- **`FeatureFlags`** - Constant object with predefined flag names for type safety

## Adding New Feature Flags

1. Add the flag name to `FeatureFlags` constant in `src/lib/featureFlags.ts`:

```typescript
export const FeatureFlags = {
  // ... existing flags
  MY_NEW_FEATURE: "myNewFeature",
} as const;
```

2. Use the flag in your component:

```typescript
const showMyFeature = enabled(FeatureFlags.MY_NEW_FEATURE);
```

3. Document it in `.env.example`:

```bash
# Available flags: templates, darkMode, analytics, export, myNewFeature
FEATURE_FLAGS=templates,darkMode,myNewFeature
```

## Examples

### Default Configuration (Development)

```bash
# .env.local
FEATURE_FLAGS=templates,darkMode
```

This enables:

- ✅ Template picker in chat composer
- ✅ Dark mode toggle in header
- ❌ Analytics (not enabled)
- ❌ Export (not enabled)

### Production Configuration

```bash
# Production environment variables
FEATURE_FLAGS=templates,darkMode,analytics
```

This enables all production-ready features including analytics.

### Minimal Configuration

```bash
# Empty or not set
FEATURE_FLAGS=
```

This disables all optional features for a minimal UI.

## Best Practices

1. **Always use `FeatureFlags` constants** instead of raw strings for type safety
2. **Document new flags** in `.env.example` and this README
3. **Test with flags both enabled and disabled** to ensure graceful degradation
4. **Remove obsolete flags** when features are permanently enabled
5. **Use feature flags for**:
   - Beta features
   - Gradual rollouts
   - A/B testing
   - Environment-specific features
   - Features with external dependencies

## Notes

- Feature flags are read at build time from `process.env.FEATURE_FLAGS`
- Changes to `.env.local` require a server restart
- Feature flags work in both development and production builds
- Empty or whitespace-only flags are automatically filtered out
