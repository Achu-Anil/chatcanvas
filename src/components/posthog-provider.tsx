"use client";

import { Suspense, useEffect } from "react";
import { initPostHog, usePostHogPageViews } from "@/lib/posthog.client";

/**
 * Inner component that uses useSearchParams
 */
function PostHogPageView() {
  usePostHogPageViews();
  return null;
}

/**
 * PostHog Provider Component
 * Initializes PostHog and tracks pageviews automatically
 * Add this to your root layout to enable analytics
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog();
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </>
  );
}
