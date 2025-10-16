/**
 * Feature flags system
 * Configure via FEATURE_FLAGS environment variable (comma-separated)
 * Example: FEATURE_FLAGS=templates,darkMode,analytics
 */

// Parse feature flags from environment variable
const featureFlagsEnv = process.env.FEATURE_FLAGS || "";
export const flags = new Set(
  featureFlagsEnv
    .split(",")
    .map((flag) => flag.trim())
    .filter(Boolean)
);

/**
 * Check if a feature flag is enabled
 * @param flag - The feature flag to check
 * @returns true if the flag is enabled
 */
export function enabled(flag: string): boolean {
  return flags.has(flag);
}

/**
 * Available feature flags
 */
export const FeatureFlags = {
  TEMPLATES: "templates",
  DARK_MODE: "darkMode",
  ANALYTICS: "analytics",
  EXPORT: "export",
} as const;
