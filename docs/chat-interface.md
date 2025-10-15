# Chat Interface Documentation

## Overview

The chat interface provides a production-ready, streaming chat UI with message bubbles, a sticky composer, keyboard shortcuts, and optional prompt templates.

---

## Files Created

### 1. **ChatClient Component**

**Location:** `src/app/chat/ChatClient.tsx`

A client-side React component that provides the complete chat interface with:

- Real-time streaming message display
- Message bubbles (user/assistant)
- Sticky composer at the bottom
- Auto-scrolling to latest messages
- Keyboard shortcuts
- Optional prompt template dropdown

### 2. **Chat Page**

**Location:** `src/app/chat/page.tsx`

Server component that renders the ChatClient with proper metadata.

### 3. **Feature Flags Utility**

**Location:** `src/lib/features.ts`

Simple feature flag system for enabling/disabling features like template dropdown.

---

## Features

### ✅ Message Bubbles

- **User messages**: Right-aligned with primary color
- **Assistant messages**: Left-aligned with muted background
- **Avatars**: Simple letter avatars (U for user, AI for assistant)
- **Max width**: 80% of container for readability
- **Word wrapping**: Prevents overflow

### ✅ Sticky Composer

- **Fixed at bottom**: Always visible while scrolling
- **Textarea**: Auto-resizing (60px - 200px)
- **Send button**: Icon button with Send icon
- **Disabled state**: During streaming

### ✅ Streaming Display

- **Incremental tokens**: Text appears character by character
- **Streaming indicator**: Blinking cursor during response
- **Smooth updates**: No flicker or re-renders
- **Real-time**: Uses Fetch API with ReadableStream

### ✅ Auto-scroll

- **Automatic**: Scrolls to bottom on new messages
- **Smooth**: Uses smooth scrolling behavior
- **During streaming**: Updates continuously
- **On mount**: Focuses textarea automatically

### ✅ Keyboard Shortcuts

- **Cmd+Enter** (Mac) or **Ctrl+Enter** (Windows): Send message
- **Works from textarea**: No need to click send button
- **Visual hint**: Shown below composer

### ✅ Prompt Template Dropdown

- **Feature flag**: `enabled('templates')`
- **5 built-in templates**:
  - Explain this concept
  - Summarize
  - Improve writing
  - Debug code
  - Translate
- **Easy to extend**: Add more templates to array
- **Pre-fills textarea**: Cursor positioned at end

---

## Usage

### Basic Usage

```typescript
import ChatClient from "@/app/chat/ChatClient";

// Simple usage
<ChatClient />

// With initial chat ID
<ChatClient chatId="chat-123" />

// With initial messages
<ChatClient
  chatId="chat-123"
  initialMessages={[
    { id: "1", role: "user", content: "Hello!" },
    { id: "2", role: "assistant", content: "Hi! How can I help?" },
  ]}
/>
```

### Accessing the Page

Navigate to: `http://localhost:3000/chat`

---

## Component Props

### ChatClient Props

```typescript
interface ChatClientProps {
  chatId?: string; // Optional chat ID (auto-generated if not provided)
  initialMessages?: Message[]; // Optional initial messages to display
}

interface Message {
  id: string; // Unique message ID
  role: "user" | "assistant"; // Message sender
  content: string; // Message text
}
```

---

## API Integration

The component sends messages to `/api/chat` endpoint:

### Request Format

```typescript
POST / api / chat;

{
  chatId: string;
  messages: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}
```

### Response Format

```
Content-Type: text/event-stream

ReadableStream<string>
```

The component reads the stream chunk by chunk and displays incrementally.

---

## Prompt Templates

### Current Templates

```typescript
const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: "explain",
    label: "Explain this concept",
    prompt: "Explain the following concept in simple terms: ",
  },
  {
    id: "summarize",
    label: "Summarize",
    prompt: "Summarize the following text: ",
  },
  {
    id: "improve",
    label: "Improve writing",
    prompt:
      "Improve the following text to make it more clear and professional: ",
  },
  {
    id: "debug",
    label: "Debug code",
    prompt: "Help me debug this code and explain what's wrong: ",
  },
  {
    id: "translate",
    label: "Translate",
    prompt: "Translate the following text to Spanish: ",
  },
];
```

### Adding Custom Templates

Edit `ChatClient.tsx`:

```typescript
const PROMPT_TEMPLATES: PromptTemplate[] = [
  // ... existing templates
  {
    id: "custom",
    label: "Custom Template",
    prompt: "Your custom prompt here: ",
  },
];
```

### Disabling Templates

Set the feature flag to `false` in `src/lib/features.ts`:

```typescript
const defaultFlags: FeatureFlags = {
  templates: false, // Hide template dropdown
};
```

---

## Keyboard Shortcuts

| Shortcut                                    | Action                 |
| ------------------------------------------- | ---------------------- |
| `Cmd+Enter` (Mac) or `Ctrl+Enter` (Windows) | Send message           |
| `Tab`                                       | Focus next element     |
| `Shift+Tab`                                 | Focus previous element |

**Note:** Textarea automatically resizes as you type (max 200px height).

---

## Styling

### Layout

- **Full screen**: `h-screen` with flexbox column
- **Messages area**: Scrollable with padding
- **Max width**: 3xl (768px) centered
- **Responsive**: Works on mobile and desktop

### Theme Support

- Uses Tailwind CSS variables
- Supports light/dark mode
- Consistent with app theme

### Color Scheme

- **User bubbles**: Primary color
- **Assistant bubbles**: Muted background
- **Avatars**: Contrasting backgrounds
- **Borders**: Subtle border-t on composer

---

## State Management

The component manages the following state:

```typescript
const [messages, setMessages] = useState<Message[]>([]); // Chat history
const [input, setInput] = useState(""); // Current input
const [isStreaming, setIsStreaming] = useState(false); // Streaming status
const [streamingContent, setStreamingContent] = useState(""); // Current stream
const [chatId] = useState(string); // Chat identifier
```

### Message Flow

1. User types in textarea
2. Presses Send or Cmd+Enter
3. User message added to state
4. API request sent to `/api/chat`
5. Stream response read chunk by chunk
6. Each chunk updates `streamingContent`
7. On completion, full message added to state

---

## Error Handling

### Network Errors

```typescript
catch (error: unknown) {
  if (error instanceof Error) {
    if (error.name === "AbortError") {
      // Request was cancelled
      return;
    }
    // Show error in chat
    const errorMessage: Message = {
      id: `msg-${Date.now()}-error`,
      role: "assistant",
      content: `Error: ${error.message}. Please try again.`,
    };
    setMessages((prev) => [...prev, errorMessage]);
  }
}
```

### HTTP Errors

- **400**: Validation error
- **503**: Provider not configured
- **500**: Server error

All errors display as assistant messages in the chat.

---

## Performance

### Optimizations

- **Auto-resize**: Textarea height adjusts without re-render
- **Smooth scroll**: Only scrolls when needed
- **Stream processing**: Uses TextDecoder for efficient parsing
- **Abort controller**: Cancels in-flight requests on unmount

### Bundle Size

- **Chat page**: 37.3 kB
- **First Load JS**: 125 kB (including shared chunks)

---

## Accessibility

### ARIA Labels

```typescript
<Button aria-label="Send message">
<Button aria-label="Select prompt template">
```

### Keyboard Navigation

- All interactive elements are keyboard accessible
- Tab order is logical
- Focus indicators visible

### Screen Readers

- Proper semantic HTML
- ARIA labels on icon buttons
- Status updates announced

---

## Extending the Component

### Add Custom Actions

Add buttons to the composer:

```typescript
<div className="flex gap-2 items-end">
  {showTemplates && <TemplateDropdown />}
  <Textarea />

  {/* Add your custom button */}
  <Button onClick={handleCustomAction}>
    <CustomIcon />
  </Button>

  <Button onClick={handleSendMessage}>
    <Send />
  </Button>
</div>
```

### Add Message Formatting

Enhance MessageBubble component:

```typescript
function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <div className="...">
      {/* Add markdown rendering */}
      <ReactMarkdown>{message.content}</ReactMarkdown>

      {/* Add code highlighting */}
      {/* Add LaTeX rendering */}
    </div>
  );
}
```

### Add Message Actions

Add copy, edit, delete buttons:

```typescript
<div className="flex gap-2 opacity-0 group-hover:opacity-100">
  <Button size="sm" variant="ghost" onClick={handleCopy}>
    Copy
  </Button>
  <Button size="sm" variant="ghost" onClick={handleEdit}>
    Edit
  </Button>
</div>
```

---

## Testing

### Manual Testing

1. **Start dev server**:

   ```bash
   npm run dev
   ```

2. **Navigate to chat page**:

   ```
   http://localhost:3000/chat
   ```

3. **Test features**:
   - Type a message and click Send
   - Try Cmd+Enter keyboard shortcut
   - Select a prompt template (if enabled)
   - Observe streaming response
   - Check auto-scroll behavior
   - Test textarea auto-resize

### Environment Setup

Ensure you have set up LLM provider:

```bash
# .env.local
OPENAI_API_KEY=your-key-here
# or
ANTHROPIC_API_KEY=your-key-here
```

---

## Common Issues

### Templates Not Showing

**Cause:** Feature flag is disabled

**Solution:** Check `src/lib/features.ts`:

```typescript
const defaultFlags: FeatureFlags = {
  templates: true, // Must be true
};
```

### Stream Not Working

**Cause:** API endpoint not running or Edge runtime issue

**Solution:**

1. Verify API route exists: `src/app/api/chat/route.ts`
2. Check build output for Edge runtime warning
3. Test API endpoint directly with curl

### Textarea Not Auto-resizing

**Cause:** Event handler not triggering

**Solution:** Ensure `handleInputChange` is called:

```typescript
<Textarea
  value={input}
  onChange={handleInputChange} // Must be present
/>
```

### Auto-scroll Not Working

**Cause:** Ref not attached or messages not triggering effect

**Solution:** Verify useEffect dependency array:

```typescript
useEffect(() => {
  scrollToBottom();
}, [messages, streamingContent]); // Both dependencies needed
```

---

## Future Enhancements

Potential improvements:

- [ ] Add markdown rendering for messages
- [ ] Add code syntax highlighting
- [ ] Add LaTeX math rendering
- [ ] Add message editing/regeneration
- [ ] Add message deletion
- [ ] Add conversation history sidebar
- [ ] Add file upload support
- [ ] Add voice input
- [ ] Add typing indicators
- [ ] Add read receipts
- [ ] Add message reactions
- [ ] Add search within conversation
- [ ] Add export conversation
- [ ] Add conversation branching

---

## Related Documentation

1. **API Route**: `docs/api-chat-route.md`
2. **API Examples**: `docs/api-chat-examples.md`
3. **LLM Integration**: `docs/llm-integration.md`

---

**Chat Interface Complete! 🎉**

A production-ready chat UI with streaming, keyboard shortcuts, and extensible architecture.
