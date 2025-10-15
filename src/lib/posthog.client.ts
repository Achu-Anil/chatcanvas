"use client";

import posthog from "posthog-js";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Initialize PostHog client-side analytics
 * Only initializes if NEXT_PUBLIC_POSTHOG_KEY is set
 */
export function initPostHog() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";

  if (!key) {
    console.warn("PostHog: NEXT_PUBLIC_POSTHOG_KEY not found. Analytics disabled.");
    return null;
  }

  if (typeof window !== "undefined") {
    posthog.init(key, {
      api_host: host,
      person_profiles: "identified_only",
      capture_pageview: false, // We'll capture manually for better control
      capture_pageleave: true,
      autocapture: true,
      disable_session_recording: process.env.NODE_ENV !== "production",
    });
  }

  return posthog;
}

/**
 * Hook to track pageviews with PostHog
 * Call this in your root layout or app component
 */
export function usePostHogPageViews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      return;
    }

    // Track pageview when route changes
    if (pathname) {
      let url = window.origin + pathname;
      if (searchParams && searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }

      posthog.capture("$pageview", {
        $current_url: url,
      });
    }
  }, [pathname, searchParams]);
}

/**
 * Get the PostHog client instance
 * Returns null if PostHog is not initialized
 */
export function getPostHogClient() {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return null;
  }

  return posthog;
}

/**
 * Identify a user with PostHog
 */
export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  const client = getPostHogClient();
  if (client) {
    client.identify(userId, properties);
  }
}

/**
 * Track a custom event with PostHog
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>
) {
  const client = getPostHogClient();
  if (client) {
    client.capture(eventName, properties);
  }
}

/**
 * Reset user identification (e.g., on logout)
 */
export function resetUser() {
  const client = getPostHogClient();
  if (client) {
    client.reset();
  }
}

/**
 * Check if PostHog is enabled
 */
export function isPostHogEnabled(): boolean {
  return !!process.env.NEXT_PUBLIC_POSTHOG_KEY;
}
