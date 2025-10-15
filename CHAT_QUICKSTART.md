# Chat Interface Quick Start

Get up and running with the ChatCanvas chat interface in 5 minutes.

---

## 🚀 Quick Start

### 1. Start the Development Server

```bash
npm run dev
```

### 2. Navigate to Chat

Open your browser to: **http://localhost:3000/chat**

### 3. Send Your First Message

1. Type a message in the textarea at the bottom
2. Click the **Send** button or press **Cmd+Enter** (Mac) / **Ctrl+Enter** (Windows)
3. Watch the response stream in real-time!

---

## ✨ Features Overview

### Message Bubbles

- **User messages**: Right side with blue background
- **AI responses**: Left side with gray background
- **Avatars**: Simple letter indicators

### Streaming Responses

- See tokens appear in real-time
- Blinking cursor shows streaming is active
- Auto-scrolls to keep latest content visible

### Keyboard Shortcuts

- **Cmd+Enter** or **Ctrl+Enter**: Send message
- Works anywhere in the textarea

### Prompt Templates

- Click the **dropdown button** (chevron icon)
- Select from 5 built-in templates:
  - Explain this concept
  - Summarize
  - Improve writing
  - Debug code
  - Translate

---

## 🎯 Try These Examples

### Example 1: Simple Question

```
Type: "What is React?"
Press: Cmd+Enter
```

### Example 2: Using Templates

```
1. Click the dropdown (chevron icon)
2. Select "Explain this concept"
3. Type: "quantum computing"
4. Send
```

### Example 3: Multi-turn Conversation

```
Message 1: "What are the benefits of TypeScript?"
Message 2: "Can you give me code examples?"
Message 3: "How do I set up a new TypeScript project?"
```

---

## ⚙️ Configuration

### Enable/Disable Templates

Edit `src/lib/features.ts`:

```typescript
const defaultFlags: FeatureFlags = {
  templates: true, // Set to false to hide dropdown
};
```

### Customize Templates

Edit `src/app/chat/ChatClient.tsx`:

```typescript
const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: "your-template",
    label: "Your Template Name",
    prompt: "Your prompt text here: ",
  },
  // ... add more
];
```

---

## 🔧 Environment Setup

### Required: LLM Provider API Key

Create `.env.local` in the root directory:

```bash
# Choose one provider

# Option 1: OpenAI
OPENAI_API_KEY=sk-...

# Option 2: Anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

### Verify Setup

```bash
# Build the project
npm run build

# Should see:
# ✓ Compiled successfully
# ✓ Route: ƒ /api/chat
# ✓ Route: ○ /chat
```

---

## 📱 Responsive Design

The chat interface works on all screen sizes:

- **Desktop**: Full width with max-width 768px
- **Tablet**: Adapts to available space
- **Mobile**: Optimized for touch
  - Large send button
  - Auto-resizing textarea
  - Smooth scrolling

---

## 🎨 Theming

The interface automatically adapts to your theme:

### Light Mode

- Clean white background
- Blue user bubbles
- Gray assistant bubbles

### Dark Mode

- Dark background
- Contrasting colors
- Easy on the eyes

**Switch themes**: Use your app's theme toggle (if configured)

---

## 🐛 Troubleshooting

### No Response from Chat

**Check:**

1. Is the API key set in `.env.local`?
2. Is the dev server running?
3. Check the browser console for errors

### Templates Not Showing

**Solution:**

```typescript
// In src/lib/features.ts
const defaultFlags: FeatureFlags = {
  templates: true, // Must be true
};
```

### Textarea Not Resizing

**Solution:**

- Refresh the page
- Check if CSS is loaded
- Try clicking in the textarea

### Can't Send Message

**Check:**

1. Is there text in the textarea?
2. Is a response currently streaming?
3. Look for errors in console

---

## 📚 Next Steps

### Enhance Your Chat

1. **Add Markdown Rendering**

   - Install: `npm install react-markdown`
   - Use in MessageBubble component

2. **Add Code Highlighting**

   - Install: `npm install react-syntax-highlighter`
   - Detect code blocks in messages

3. **Add Conversation History**

   - Create sidebar component
   - List previous chats
   - Load conversation on click

4. **Add Authentication**
   - Integrate with your auth provider
   - Pass userId to ChatClient
   - Save conversations per user

### Learn More

- **Full Documentation**: `docs/chat-interface.md`
- **API Reference**: `docs/api-chat-route.md`
- **Client Examples**: `docs/api-chat-examples.md`

---

## 💡 Tips & Tricks

### Power User Tips

1. **Multi-line messages**: Just press Enter for new lines, Cmd+Enter to send
2. **Quick edits**: Templates pre-fill the textarea - just add your content
3. **Long responses**: Interface auto-scrolls, but you can scroll up to read earlier content
4. **Copy text**: Select and copy from any message bubble

### Performance

- Messages are saved to database automatically
- Streaming is efficient (no full response buffering)
- Page loads fast (37.3 kB bundle size)

### Customization

The component is built with Tailwind CSS, so you can easily:

- Change colors in `globals.css`
- Adjust spacing/sizing in component
- Add custom styles with `className`

---

## 🎉 You're Ready!

You now have a fully functional chat interface. Start chatting and explore the features!

**Happy Chatting!** 💬
