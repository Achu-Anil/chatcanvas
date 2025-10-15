import { PostHog } from "posthog-node";

/**
 * Server-side PostHog instance (optional)
 * Only initialized if POSTHOG_API_KEY is set
 */
let posthogServer: PostHog | null = null;

/**
 * Initialize PostHog server-side analytics
 * Only initializes if POSTHOG_API_KEY is set
 * 
 * @returns PostHog instance or null if not configured
 */
export function initPostHogServer(): PostHog | null {
  const apiKey = process.env.POSTHOG_API_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";

  if (!apiKey) {
    console.warn("PostHog Server: POSTHOG_API_KEY not found. Server-side analytics disabled.");
    return null;
  }

  if (!posthogServer) {
    posthogServer = new PostHog(apiKey, {
      host,
      // Flush events every 30 seconds or when 20 events are queued
      flushAt: 20,
      flushInterval: 30000,
    });
  }

  return posthogServer;
}

/**
 * Get the server-side PostHog instance
 * Initializes on first call if not already initialized
 * 
 * @returns PostHog instance or null if not configured
 */
export function getPostHogServer(): PostHog | null {
  if (!posthogServer && process.env.POSTHOG_API_KEY) {
    return initPostHogServer();
  }
  return posthogServer;
}

/**
 * Capture a server-side event
 * 
 * @param distinctId - Unique identifier for the user/session
 * @param event - Event name
 * @param properties - Event properties
 */
export async function captureServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>
): Promise<void> {
  const client = getPostHogServer();
  if (client) {
    client.capture({
      distinctId,
      event,
      properties,
    });
  }
}

/**
 * Identify a user on the server
 * 
 * @param distinctId - Unique identifier for the user
 * @param properties - User properties
 */
export async function identifyServerUser(
  distinctId: string,
  properties?: Record<string, unknown>
): Promise<void> {
  const client = getPostHogServer();
  if (client) {
    client.identify({
      distinctId,
      properties,
    });
  }
}

/**
 * Capture a feature flag evaluation
 * 
 * @param distinctId - Unique identifier for the user
 * @param featureFlag - Feature flag key
 * @param value - Feature flag value
 */
export async function captureFeatureFlag(
  distinctId: string,
  featureFlag: string,
  value: boolean | string
): Promise<void> {
  const client = getPostHogServer();
  if (client) {
    client.capture({
      distinctId,
      event: "$feature_flag_called",
      properties: {
        $feature_flag: featureFlag,
        $feature_flag_response: value,
      },
    });
  }
}

/**
 * Get feature flag value for a user
 * 
 * @param distinctId - Unique identifier for the user
 * @param featureFlag - Feature flag key
 * @param defaultValue - Default value if flag is not found
 * @returns Feature flag value
 */
export async function getFeatureFlag(
  distinctId: string,
  featureFlag: string,
  defaultValue?: boolean | string
): Promise<boolean | string | undefined> {
  const client = getPostHogServer();
  if (!client) {
    return defaultValue;
  }

  try {
    const flagValue = await client.getFeatureFlag(featureFlag, distinctId);
    return flagValue ?? defaultValue;
  } catch (error) {
    console.error("PostHog: Error getting feature flag", error);
    return defaultValue;
  }
}

/**
 * Check if a feature flag is enabled
 * 
 * @param distinctId - Unique identifier for the user
 * @param featureFlag - Feature flag key
 * @returns true if enabled, false otherwise
 */
export async function isFeatureFlagEnabled(
  distinctId: string,
  featureFlag: string
): Promise<boolean> {
  const client = getPostHogServer();
  if (!client) {
    return false;
  }

  try {
    const enabled = await client.isFeatureEnabled(featureFlag, distinctId);
    return enabled ?? false;
  } catch (error) {
    console.error("PostHog: Error checking feature flag", error);
    return false;
  }
}

/**
 * Flush all pending events
 * Call this before shutting down the server
 */
export async function flushPostHog(): Promise<void> {
  const client = getPostHogServer();
  if (client) {
    await client.flush();
  }
}

/**
 * Shutdown PostHog client
 * Call this when the server is shutting down
 */
export async function shutdownPostHog(): Promise<void> {
  const client = getPostHogServer();
  if (client) {
    await client.shutdown();
    posthogServer = null;
  }
}

/**
 * Check if PostHog server is enabled
 */
export function isPostHogServerEnabled(): boolean {
  return !!process.env.POSTHOG_API_KEY;
}

/**
 * Alias a user (link anonymous ID to identified ID)
 * 
 * @param distinctId - The new identified user ID
 * @param alias - The previous anonymous ID
 */
export async function aliasUser(distinctId: string, alias: string): Promise<void> {
  const client = getPostHogServer();
  if (client) {
    client.alias({
      distinctId,
      alias,
    });
  }
}

// Graceful shutdown on process termination
if (typeof process !== "undefined") {
  process.on("SIGTERM", async () => {
    await shutdownPostHog();
  });

  process.on("SIGINT", async () => {
    await shutdownPostHog();
  });
}
