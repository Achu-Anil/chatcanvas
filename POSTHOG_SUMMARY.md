# PostHog Integration Summary

## ✅ What Was Implemented

A complete, production-ready PostHog analytics integration for both client-side and server-side tracking with graceful fallback when API keys are not configured.

## 📁 Files Created

### Core Implementation

1. **`src/lib/posthog.client.ts`** - Client-side PostHog utilities and hooks
2. **`src/lib/posthog.server.ts`** - Server-side PostHog utilities and feature flags
3. **`src/components/posthog-provider.tsx`** - React provider component with Suspense boundary

### Documentation

4. **`docs/posthog-setup.md`** - Comprehensive guide with examples

### Integration

5. **`src/app/layout.tsx`** - Updated to include PostHogProvider

## 🎯 Key Features

### Client-Side Analytics

✅ **Automatic Pageview Tracking**

- Tracks route changes automatically
- Captures full URL with query params
- Wrapped in Suspense boundary for static generation

✅ **Custom Event Tracking**

```typescript
trackEvent("button_clicked", { button_name: "Sign Up" });
```

✅ **User Identification**

```typescript
identifyUser("user-123", { email: "user@example.com", plan: "pro" });
resetUser(); // On logout
```

✅ **Optional Initialization**

- Only activates if `NEXT_PUBLIC_POSTHOG_KEY` is set
- Graceful console warning if disabled
- No errors when keys are missing

### Server-Side Analytics

✅ **Event Capture**

```typescript
await captureServerEvent(userId, "api_request", { endpoint: "/api/chat" });
```

✅ **User Identification**

```typescript
await identifyServerUser(userId, { subscription: "pro" });
```

✅ **Feature Flags**

```typescript
const enabled = await isFeatureFlagEnabled(userId, "new-ui");
const value = await getFeatureFlag(userId, "theme", "light");
```

✅ **User Aliasing**

```typescript
await aliasUser(userId, anonymousId); // Link sessions
```

✅ **Graceful Shutdown**

- Automatically flushes events on SIGTERM/SIGINT
- Clean shutdown on server restart

## 🔧 Configuration

### Environment Variables

Add to `.env.local`:

```env
# Client-side (optional)
NEXT_PUBLIC_POSTHOG_KEY=phc_your_project_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Server-side (optional)
POSTHOG_API_KEY=phx_your_personal_api_key
```

### Already Configured

The `PostHogProvider` is integrated in `src/app/layout.tsx`:

```tsx
<PostHogProvider>
  <ThemeProvider>{children}</ThemeProvider>
</PostHogProvider>
```

## 📊 Client Functions

### Available Functions

```typescript
// Initialization
initPostHog(): posthog | null
usePostHogPageViews(): void  // Hook for pageviews

// Event tracking
trackEvent(name: string, props?: Record<string, unknown>): void

// User management
identifyUser(userId: string, props?: Record<string, unknown>): void
resetUser(): void

// Utilities
getPostHogClient(): posthog | null
isPostHogEnabled(): boolean
```

### Usage Examples

```typescript
import { trackEvent, identifyUser } from "@/lib/posthog.client";

// Track custom events
trackEvent("chat_message_sent", {
  message_length: 150,
  model: "gpt-4",
});

// Identify users on login
identifyUser("user-123", {
  email: "user@example.com",
  subscription: "pro",
  signup_date: "2025-01-15",
});

// Check if enabled
if (isPostHogEnabled()) {
  console.log("Analytics active");
}
```

## 🖥️ Server Functions

### Available Functions

```typescript
// Initialization
initPostHogServer(): PostHog | null
getPostHogServer(): PostHog | null

// Event tracking
captureServerEvent(userId: string, event: string, props?: object): Promise<void>

// User management
identifyServerUser(userId: string, props?: object): Promise<void>
aliasUser(userId: string, anonymousId: string): Promise<void>

// Feature flags
isFeatureFlagEnabled(userId: string, flag: string): Promise<boolean>
getFeatureFlag(userId: string, flag: string, default?: any): Promise<any>
captureFeatureFlag(userId: string, flag: string, value: any): Promise<void>

// Lifecycle
flushPostHog(): Promise<void>
shutdownPostHog(): Promise<void>
isPostHogServerEnabled(): boolean
```

### Usage Examples

```typescript
import {
  captureServerEvent,
  identifyServerUser,
  isFeatureFlagEnabled,
} from "@/lib/posthog.server";

// Track API requests
export async function POST(request: Request) {
  const userId = getUserId(request);

  await captureServerEvent(userId, "api_call", {
    endpoint: "/api/chat",
    method: "POST",
  });

  return Response.json({ success: true });
}

// Feature flags
export async function ChatPage({ userId }: Props) {
  const useNewUI = await isFeatureFlagEnabled(userId, "new-chat-ui");

  return useNewUI ? <NewUI /> : <OldUI />;
}

// Identify users
export async function onSignup(userId: string, data: UserData) {
  await identifyServerUser(userId, {
    email: data.email,
    plan: data.plan,
    signup_method: "email",
  });
}
```

## ✨ Special Features

### 1. Optional Initialization

- Works without API keys (gracefully disabled)
- Console warnings when disabled
- No runtime errors
- Easy to enable/disable per environment

### 2. Automatic Pageview Tracking

- Tracks route changes in Next.js App Router
- Includes query parameters
- Wrapped in Suspense for SSG compatibility
- No manual tracking needed

### 3. Graceful Shutdown

```typescript
// Automatically handled on:
process.on("SIGTERM", async () => {
  await shutdownPostHog();
});

process.on("SIGINT", async () => {
  await shutdownPostHog();
});
```

### 4. Session Recording

- Disabled in development
- Enabled in production
- Privacy-friendly defaults

### 5. Person Profiles

- Only creates profiles for identified users
- Reduces costs
- GDPR-friendly

## 🎓 Common Use Cases

### 1. Track Chat Interactions

```typescript
// Client-side
trackEvent("chat_message_sent", {
  message_length: message.length,
  chat_id: chatId,
});

// Server-side
await captureServerEvent(userId, "ai_response_generated", {
  tokens: response.usage.total_tokens,
  model: "gpt-4",
  duration_ms: duration,
});
```

### 2. Monitor User Journey

```typescript
// Landing page
trackEvent("landing_page_viewed", {
  source: utm_source,
  campaign: utm_campaign,
});

// Sign up
identifyUser(userId, {
  email: email,
  signup_date: new Date().toISOString(),
});

trackEvent("user_signed_up", {
  method: "email",
});
```

### 3. Feature Flag Rollout

```typescript
// Server component
const useNewEditor = await isFeatureFlagEnabled(userId, "new-editor-v2");

return <div>{useNewEditor ? <NewEditor /> : <OldEditor />}</div>;
```

### 4. API Performance Monitoring

```typescript
export async function POST(request: Request) {
  const start = Date.now();
  const userId = getUserId(request);

  try {
    const result = await processRequest(request);

    await captureServerEvent(userId, "api_success", {
      duration_ms: Date.now() - start,
      endpoint: "/api/chat",
    });

    return Response.json(result);
  } catch (error) {
    await captureServerEvent(userId, "api_error", {
      duration_ms: Date.now() - start,
      error: error.message,
    });

    throw error;
  }
}
```

## 🔒 Privacy & Security

- ✅ GDPR-compliant (with proper usage)
- ✅ No PII in event properties by default
- ✅ Session recording disabled in dev
- ✅ Person profiles only for identified users
- ✅ Easy opt-out implementation

## ✅ Testing

### Check if Working

```typescript
// Browser console (client)
import { isPostHogEnabled } from "@/lib/posthog.client";
console.log("Client:", isPostHogEnabled());

// Server logs
import { isPostHogServerEnabled } from "@/lib/posthog.server";
console.log("Server:", isPostHogServerEnabled());
```

### Send Test Event

```typescript
// Client
trackEvent("test_event", { test: true });

// Server
await captureServerEvent("test-user", "test_event", { test: true });
```

### View in PostHog

1. Go to PostHog dashboard
2. Click "Events" → "Live Events"
3. Look for your test events

## 📖 Documentation

Complete documentation available in:

- **`docs/posthog-setup.md`** - Full API reference
- Examples for every use case
- Configuration options
- Best practices
- Troubleshooting guide

## 🚀 Status

- ✅ **Client-side tracking** - Implemented with pageviews
- ✅ **Server-side tracking** - Implemented with feature flags
- ✅ **Optional initialization** - Works without keys
- ✅ **Automatic setup** - Integrated in layout
- ✅ **Graceful shutdown** - Flushes on termination
- ✅ **Suspense boundary** - SSG compatible
- ✅ **Build passing** - No errors
- ✅ **Documentation** - Complete guide

## 🎯 Next Steps

To enable analytics:

1. Get PostHog API keys from [posthog.com](https://posthog.com)
2. Add keys to `.env.local`
3. Restart dev server: `npm run dev`
4. Analytics will automatically activate!

Without keys, the app works normally with PostHog gracefully disabled.

---

**Ready to track!** 📊
