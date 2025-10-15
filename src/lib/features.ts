/**
 * Feature flag utilities
 *
 * Simple feature flag system for enabling/disabling features.
 * Can be extended to integrate with PostHog or other feature flag services.
 */

type FeatureFlags = {
  templates: boolean;
  // Add more feature flags here as needed
};

// Default feature flag values
const defaultFlags: FeatureFlags = {
  templates: true, // Enable template dropdown by default
};

/**
 * Check if a feature is enabled
 *
 * @param feature - Feature flag name
 * @returns true if enabled, false otherwise
 */
export function enabled(feature: keyof FeatureFlags): boolean {
  // For now, use default flags
  // In production, this could fetch from PostHog or environment variables
  return defaultFlags[feature] ?? false;
}

/**
 * Get all feature flags
 */
export function getFeatureFlags(): FeatureFlags {
  return { ...defaultFlags };
}
