/**
 * Feature Flags Debug Panel
 *
 * Add this to your app during development to see which flags are enabled
 * Usage: Import and render <FeatureFlagsDebug /> in your layout or page
 */

import { flags, enabled, FeatureFlags } from "@/lib/featureFlags";

export function FeatureFlagsDebug() {
  if (process.env.NODE_ENV === "production") return null;

  const allFlags = Object.entries(FeatureFlags);

  return (
    <div className="fixed bottom-4 right-4 bg-background border rounded-lg p-4 shadow-lg max-w-xs z-50">
      <h3 className="font-semibold text-sm mb-2">Feature Flags</h3>
      <div className="space-y-1 text-xs">
        {allFlags.map(([key, value]) => (
          <div key={key} className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">{value}</span>
            <span
              className={enabled(value) ? "text-green-600" : "text-red-600"}
            >
              {enabled(value) ? "✓ ON" : "✗ OFF"}
            </span>
          </div>
        ))}
      </div>
      {flags.size === 0 && (
        <p className="text-xs text-muted-foreground mt-2">
          No flags enabled. Set FEATURE_FLAGS in .env.local
        </p>
      )}
    </div>
  );
}
