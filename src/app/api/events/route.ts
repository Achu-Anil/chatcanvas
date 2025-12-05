import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/events
 *
 * Server-side event tracking endpoint
 * Acts as a pass-through to PostHog if server-side tracking is needed
 *
 * This is optional - client-side tracking via posthog-js is usually sufficient
 * Use this endpoint when:
 * - Tracking sensitive events that shouldn't be exposed client-side
 * - Tracking server-side operations (API calls, background jobs)
 * - Bypassing ad blockers (though this may raise privacy concerns)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, properties } = body;

    if (!event) {
      return NextResponse.json(
        { error: "Event name is required" },
        { status: 400 }
      );
    }

    // If PostHog API key is configured, send to PostHog
    const posthogApiKey = process.env.POSTHOG_API_KEY;
    const posthogHost =
      process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";

    if (posthogApiKey) {
      // Send event to PostHog server-side API
      const posthogResponse = await fetch(`${posthogHost}/capture/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: posthogApiKey,
          event,
          properties: {
            ...properties,
            // Add server-side context
            timestamp: new Date().toISOString(),
            $lib: "server",
          },
          timestamp: new Date().toISOString(),
        }),
      });

      if (!posthogResponse.ok) {
        console.error(
          "Failed to send event to PostHog:",
          await posthogResponse.text()
        );
        return NextResponse.json(
          { error: "Failed to track event" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    // If no API key, just log it (useful for development)
    console.log("Event tracked (no PostHog API key):", event, properties);

    return NextResponse.json({
      success: true,
      note: "Event logged locally (no PostHog API key configured)",
    });
  } catch (error) {
    console.error("Error tracking event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/events
 *
 * Returns event tracking status
 */
export async function GET() {
  return NextResponse.json({
    enabled: !!process.env.POSTHOG_API_KEY,
    clientEnabled: !!process.env.NEXT_PUBLIC_POSTHOG_KEY,
  });
}
