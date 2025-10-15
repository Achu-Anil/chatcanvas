# PostHog Analytics Setup

## Overview

PostHog is integrated for both client-side and server-side analytics with automatic pageview tracking, feature flags, and custom event capture. The implementation is **optional** - analytics only activate when API keys are configured.

## Features

- ✅ **Client-side tracking** - Pageviews, custom events, user identification
- ✅ **Server-side tracking** - API events, feature flags, server actions
- ✅ **Optional initialization** - Only activates when keys are present
- ✅ **Automatic pageview tracking** - Tracks route changes automatically
- ✅ **Feature flags** - Server-side and client-side flag evaluation
- ✅ **Session recording** - Disabled in development, enabled in production
- ✅ **Graceful shutdown** - Flushes events before server shutdown

## Environment Variables

Add to your `.env.local`:

```env
# Client-side PostHog (required for client analytics)
NEXT_PUBLIC_POSTHOG_KEY=phc_your_project_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Server-side PostHog (required for server analytics)
POSTHOG_API_KEY=phx_your_personal_api_key_here
```

**Note:** If these variables are not set, PostHog will be disabled gracefully with console warnings.

## File Structure

```
src/
├── lib/
│   ├── posthog.client.ts    # Client-side PostHog utilities
│   └── posthog.server.ts    # Server-side PostHog utilities
└── components/
    └── posthog-provider.tsx # React provider component
```

## Client-Side Usage

### Automatic Setup (Already Configured)

The `PostHogProvider` is already integrated in `src/app/layout.tsx`:

```tsx
import { PostHogProvider } from "@/components/posthog-provider";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
```

This automatically:

- Initializes PostHog on page load
- Tracks pageviews on route changes
- Sets up autocapture for clicks

### Custom Event Tracking

```tsx
import { trackEvent, identifyUser } from "@/lib/posthog.client";

// Track custom events
trackEvent("button_clicked", {
  button_name: "Sign Up",
  page: "/landing",
});

// Track with more context
trackEvent("chat_message_sent", {
  message_length: message.length,
  chat_id: chatId,
  model: "gpt-4",
});
```

### User Identification

```tsx
import { identifyUser, resetUser } from "@/lib/posthog.client";

// When user logs in
identifyUser("user-123", {
  email: "user@example.com",
  name: "John Doe",
  plan: "pro",
});

// When user logs out
resetUser();
```

### Check if PostHog is Enabled

```tsx
import { isPostHogEnabled } from "@/lib/posthog.client";

if (isPostHogEnabled()) {
  console.log("Analytics are active");
}
```

### Available Client Functions

```typescript
// Initialize PostHog (called automatically by provider)
initPostHog(): posthog | null

// Hook for automatic pageview tracking (used by provider)
usePostHogPageViews(): void

// Get PostHog client instance
getPostHogClient(): posthog | null

// Track custom event
trackEvent(eventName: string, properties?: Record<string, unknown>): void

// Identify user
identifyUser(userId: string, properties?: Record<string, unknown>): void

// Reset user session (logout)
resetUser(): void

// Check if enabled
isPostHogEnabled(): boolean
```

## Server-Side Usage

### Basic Event Tracking

```typescript
import { captureServerEvent } from "@/lib/posthog.server";

// In API routes or server actions
export async function POST(request: Request) {
  const userId = getUserIdFromSession(request);

  await captureServerEvent(userId, "api_request", {
    endpoint: "/api/chat",
    method: "POST",
    status: 200,
  });

  return Response.json({ success: true });
}
```

### User Identification

```typescript
import { identifyServerUser } from "@/lib/posthog.server";

// In server actions
export async function updateUserProfile(userId: string, data: UserData) {
  await identifyServerUser(userId, {
    email: data.email,
    name: data.name,
    subscription: data.plan,
    last_login: new Date().toISOString(),
  });

  // ... update database
}
```

### Feature Flags

```typescript
import {
  getFeatureFlag,
  isFeatureFlagEnabled,
  captureFeatureFlag,
} from "@/lib/posthog.server";

// Check if feature is enabled
export async function handler(userId: string) {
  const isEnabled = await isFeatureFlagEnabled(userId, "new-chat-ui");

  if (isEnabled) {
    // Show new UI
    await captureFeatureFlag(userId, "new-chat-ui", true);
    return newChatUI();
  }

  return oldChatUI();
}

// Get feature flag value (boolean or string)
const flagValue = await getFeatureFlag(userId, "theme-mode", "light");
```

### Alias Users

```typescript
import { aliasUser } from "@/lib/posthog.server";

// Link anonymous session to identified user
export async function onUserSignup(anonymousId: string, userId: string) {
  await aliasUser(userId, anonymousId);

  // Now all anonymous events are linked to the user
}
```

### Graceful Shutdown

```typescript
import { flushPostHog, shutdownPostHog } from "@/lib/posthog.server";

// Flush pending events (automatic on SIGTERM/SIGINT)
await flushPostHog();

// Shutdown client completely
await shutdownPostHog();
```

### Available Server Functions

```typescript
// Initialize PostHog server (called automatically on first use)
initPostHogServer(): PostHog | null

// Get server instance
getPostHogServer(): PostHog | null

// Capture event
captureServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>
): Promise<void>

// Identify user
identifyServerUser(
  distinctId: string,
  properties?: Record<string, unknown>
): Promise<void>

// Feature flags
getFeatureFlag(
  distinctId: string,
  featureFlag: string,
  defaultValue?: boolean | string
): Promise<boolean | string | undefined>

isFeatureFlagEnabled(
  distinctId: string,
  featureFlag: string
): Promise<boolean>

captureFeatureFlag(
  distinctId: string,
  featureFlag: string,
  value: boolean | string
): Promise<void>

// User management
aliasUser(distinctId: string, alias: string): Promise<void>

// Lifecycle
flushPostHog(): Promise<void>
shutdownPostHog(): Promise<void>
isPostHogServerEnabled(): boolean
```

## Common Use Cases

### Track Chat Messages

```typescript
// Client-side
import { trackEvent } from "@/lib/posthog.client";

function ChatInput() {
  const sendMessage = async (message: string) => {
    trackEvent("chat_message_sent", {
      message_length: message.length,
      chat_id: currentChatId,
      timestamp: Date.now(),
    });

    await submitMessage(message);
  };
}

// Server-side
import { captureServerEvent } from "@/lib/posthog.server";

export async function POST(request: Request) {
  const { message, userId } = await request.json();

  const response = await generateAIResponse(message);

  await captureServerEvent(userId, "ai_response_generated", {
    input_tokens: response.usage.input_tokens,
    output_tokens: response.usage.output_tokens,
    model: response.model,
    response_time_ms: response.duration,
  });

  return Response.json(response);
}
```

### Track User Journey

```typescript
import { trackEvent, identifyUser } from "@/lib/posthog.client";

// Landing page visit
trackEvent("landing_page_viewed", {
  source: searchParams.get("utm_source"),
  campaign: searchParams.get("utm_campaign"),
});

// Sign up
identifyUser(newUserId, {
  email: userData.email,
  signup_date: new Date().toISOString(),
  plan: "free",
});

trackEvent("user_signed_up", {
  method: "email",
  source: signupSource,
});

// First chat created
trackEvent("first_chat_created", {
  time_to_first_chat: Date.now() - signupTimestamp,
});
```

### Monitor API Performance

```typescript
import { captureServerEvent } from "@/lib/posthog.server";

export async function POST(request: Request) {
  const startTime = Date.now();
  const userId = getUserId(request);

  try {
    const result = await processRequest(request);

    await captureServerEvent(userId, "api_success", {
      endpoint: "/api/chat",
      duration_ms: Date.now() - startTime,
      status: 200,
    });

    return Response.json(result);
  } catch (error) {
    await captureServerEvent(userId, "api_error", {
      endpoint: "/api/chat",
      duration_ms: Date.now() - startTime,
      error: error.message,
      status: 500,
    });

    throw error;
  }
}
```

### Feature Flag Rollout

```typescript
import { isFeatureFlagEnabled } from "@/lib/posthog.server";

export async function ChatPage({ userId }: Props) {
  // Server-side feature flag check
  const useNewEditor = await isFeatureFlagEnabled(userId, "new-editor-v2");

  return <div>{useNewEditor ? <NewEditor /> : <OldEditor />}</div>;
}
```

## Configuration Options

### Client Configuration

Edit `src/lib/posthog.client.ts`:

```typescript
posthog.init(key, {
  api_host: host,
  person_profiles: "identified_only", // Only create profiles for identified users
  capture_pageview: false, // We handle pageviews manually
  capture_pageleave: true, // Track when users leave
  autocapture: true, // Auto-capture clicks
  disable_session_recording: process.env.NODE_ENV !== "production",
});
```

### Server Configuration

Edit `src/lib/posthog.server.ts`:

```typescript
new PostHog(apiKey, {
  host,
  flushAt: 20, // Flush after 20 events
  flushInterval: 30000, // Or every 30 seconds
});
```

## Privacy Considerations

1. **GDPR Compliance**: Use `identifyUser()` only after user consent
2. **Data Minimization**: Don't send PII in event properties
3. **Session Recording**: Disabled in development by default
4. **User Control**: Provide opt-out mechanism if required

## Debugging

### Check if PostHog is Active

```typescript
// Client
import { isPostHogEnabled } from "@/lib/posthog.client";
console.log("Client PostHog:", isPostHogEnabled());

// Server
import { isPostHogServerEnabled } from "@/lib/posthog.server";
console.log("Server PostHog:", isPostHogServerEnabled());
```

### View Events in Browser

Open browser console and run:

```javascript
posthog.debug();
```

### Test Events

```typescript
import { trackEvent } from "@/lib/posthog.client";

trackEvent("test_event", {
  test: true,
  timestamp: new Date().toISOString(),
});
```

Then check PostHog dashboard > Events > Live Events

## Best Practices

1. **Event Naming**: Use snake_case: `chat_message_sent`, not `chatMessageSent`
2. **Property Consistency**: Keep property names consistent across events
3. **Avoid PII**: Don't send email, phone, or personal data in properties
4. **Use Identify Sparingly**: Only identify users when they sign up/login
5. **Feature Flags**: Always provide default values
6. **Server Events**: Use for sensitive operations, not for UI interactions
7. **Flush on Shutdown**: Handled automatically via SIGTERM/SIGINT handlers

## Troubleshooting

### Events Not Appearing

1. Check environment variables are set
2. Verify console for warnings
3. Check network tab for API calls to PostHog
4. Ensure project key is correct

### Session Recording Not Working

Session recording is disabled in development. Deploy to production or set:

```typescript
disable_session_recording: false;
```

### Feature Flags Not Working

1. Verify POSTHOG_API_KEY is set for server-side flags
2. Check flag is created in PostHog dashboard
3. Ensure user ID is correct
4. Check flag rollout percentage

## Additional Resources

- [PostHog Documentation](https://posthog.com/docs)
- [Next.js Integration Guide](https://posthog.com/docs/libraries/next-js)
- [Feature Flags Guide](https://posthog.com/docs/feature-flags)
- [Privacy Controls](https://posthog.com/docs/privacy)

## License

MIT
