# Chat Interface Visual Guide

A visual walkthrough of the ChatCanvas chat interface features.

---

## 🎨 Interface Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Chat Interface                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Messages Area                          │  │
│  │                  (Scrollable Content)                     │  │
│  │                                                           │  │
│  │   ┌────────────────────────────────────┐                 │  │
│  │   │ [U]  User Message                  │                 │  │
│  │   │      What is TypeScript?           │                 │  │
│  │   └────────────────────────────────────┘                 │  │
│  │                                                           │  │
│  │                 ┌────────────────────────────────────┐   │  │
│  │                 │ TypeScript is a...           [AI] │   │  │
│  │                 │ (streaming content appears)        │   │  │
│  │                 └────────────────────────────────────┘   │  │
│  │                                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                    Sticky Composer (Fixed)                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  [▼]  ┌─────────────────────────────────────┐  [Send →] │  │
│  │       │ Type your message...                │            │  │
│  │       │ (Cmd+Enter to send)                 │            │  │
│  │       └─────────────────────────────────────┘            │  │
│  │       Press ⌘ + Enter to send                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎭 Message Bubbles

### User Message (Right-Aligned)

```
                                        ┌────────────────────┐
                                        │ [U]                │
                                        │  What is React?    │
                                        │                    │
                                        └────────────────────┘
                                        Blue Background
                                        White Text
```

### Assistant Message (Left-Aligned)

```
┌────────────────────┐
│ [AI]               │
│  React is a        │
│  JavaScript...     │
│                    │
└────────────────────┘
Gray Background
Dark Text
```

### Streaming Message (With Cursor)

```
┌────────────────────┐
│ [AI]               │
│  TypeScript is▊    │
│                    │
└────────────────────┘
Blinking cursor shows
streaming in progress
```

---

## 📝 Composer Components

### Full Composer Layout

```
┌─────────────────────────────────────────────────────┐
│ [▼] ┌──────────────────────────┐ [Send Button →]   │
│     │ Textarea (Auto-resize)   │                    │
│     │ 60px - 200px height      │                    │
│     └──────────────────────────┘                    │
│     Press ⌘ + Enter to send                        │
└─────────────────────────────────────────────────────┘
```

### Template Dropdown (When Enabled)

```
┌──────────────────────────┐
│ [▼] Select Template      │
├──────────────────────────┤
│ ✓ Explain this concept   │
│   Summarize              │
│   Improve writing        │
│   Debug code             │
│   Translate              │
└──────────────────────────┘
```

### Textarea States

**Empty State:**

```
┌─────────────────────────────────┐
│ Type your message...            │
│ (Cmd+Enter to send)             │
└─────────────────────────────────┘
```

**With Content:**

```
┌─────────────────────────────────┐
│ What is the difference between  │
│ TypeScript and JavaScript?      │
│ [Cursor]                        │
└─────────────────────────────────┘
Height: 80px (auto-adjusted)
```

**Multi-line:**

```
┌─────────────────────────────────┐
│ I have a question about React:  │
│                                 │
│ 1. How do hooks work?           │
│ 2. When should I use context?   │
│ 3. What's the best state...     │
└─────────────────────────────────┘
Height: 140px (auto-adjusted)
```

---

## 🎬 Streaming Animation

### Frame 1 (Start)

```
┌────────────────────┐
│ [AI]               │
│  ▊                 │
└────────────────────┘
```

### Frame 2 (Characters appear)

```
┌────────────────────┐
│ [AI]               │
│  Type▊             │
└────────────────────┘
```

### Frame 3 (More content)

```
┌────────────────────┐
│ [AI]               │
│  TypeScript is a▊  │
└────────────────────┘
```

### Frame 4 (Complete)

```
┌────────────────────┐
│ [AI]               │
│  TypeScript is a   │
│  superset of JS... │
└────────────────────┘
No cursor - complete
```

---

## ⌨️ Keyboard Shortcuts

### Send Message

```
┌──────────────────────┐
│  Cmd + Enter (Mac)   │
│  Ctrl + Enter (Win)  │
└──────────────────────┘
         ↓
    Sends message
    from textarea
```

### Navigation

```
Tab         →  Next element
Shift+Tab   →  Previous element
Enter       →  New line in textarea
Cmd+Enter   →  Send message
```

---

## 🔄 Auto-scroll Behavior

### On New Message

```
Before:                     After:
┌─────────────┐            ┌─────────────┐
│ Old msg 1   │            │ Old msg 2   │
│ Old msg 2   │   -->      │ Old msg 3   │
│ Old msg 3   │            │ NEW MESSAGE │
│ [Scrollbar] │            │ [Scrollbar] │
└─────────────┘            └─────────────┘
Auto-scrolls to bottom
```

### During Streaming

```
Tick 1:                     Tick 2:
┌─────────────┐            ┌─────────────┐
│ Previous    │            │ Previous    │
│ AI: Text is │   -->      │ AI: Text is │
│ appearing▊  │            │ appearing   │
│ [Scrollbar] │            │ more text▊  │
└─────────────┘            └─────────────┘
Scrolls as content grows
```

---

## 🎨 Theme Support

### Light Mode

```
Background:  White
User Bubble: Blue (#2563eb)
AI Bubble:   Gray (#f1f5f9)
Text:        Dark (#0f172a)
Border:      Light Gray
```

### Dark Mode

```
Background:  Dark (#0f172a)
User Bubble: Blue (#3b82f6)
AI Bubble:   Dark Gray (#1e293b)
Text:        Light (#f1f5f9)
Border:      Dark Gray
```

---

## 📱 Responsive Layout

### Desktop (> 768px)

```
┌──────────────────────────────────────┐
│          Max Width: 768px             │
│  ┌────────────────────────────────┐  │
│  │    Messages (Centered)         │  │
│  │                                │  │
│  │  User messages on right        │  │
│  │  AI messages on left           │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │  [▼] [Textarea......] [Send →] │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

### Mobile (< 768px)

```
┌─────────────────────┐
│ Messages (Full)     │
│                     │
│  User msgs right    │
│  AI msgs left       │
│                     │
│ ─────────────────── │
│ [▼] [Text] [Send]   │
│  Hint: Cmd+Enter    │
└─────────────────────┘
```

---

## 🎯 Interactive States

### Button States

**Normal:**

```
┌─────────┐
│ Send →  │
└─────────┘
Blue, clickable
```

**Disabled:**

```
┌─────────┐
│ Send →  │
└─────────┘
Gray, not clickable
(during streaming or empty input)
```

**Hover:**

```
┌─────────┐
│ Send →  │
└─────────┘
Darker blue, cursor: pointer
```

### Dropdown States

**Closed:**

```
┌───┐
│ ▼ │
└───┘
```

**Open:**

```
┌───┐  ┌────────────────────┐
│ ▲ │  │ Explain concept    │
└───┘  │ Summarize          │
       │ Improve writing    │
       └────────────────────┘
```

---

## ⚠️ Error States

### Network Error

```
┌────────────────────────────────────┐
│ [AI]                               │
│  Error: Failed to fetch.           │
│  Please try again.                 │
└────────────────────────────────────┘
Red/warning styling
```

### Validation Error

```
┌────────────────────────────────────┐
│ [AI]                               │
│  Error: Message cannot be empty.   │
└────────────────────────────────────┘
```

---

## 🎭 Empty State

### No Messages Yet

```
┌─────────────────────────────────────┐
│                                     │
│       Start a conversation          │
│                                     │
│   Type a message below or select    │
│   a template to get started.        │
│                                     │
└─────────────────────────────────────┘
Centered, muted text
```

---

## 🔧 Feature Flag Control

### Templates Enabled (default)

```
┌──────────────────────────────────┐
│ [▼] [Textarea............] [→]   │
└──────────────────────────────────┘
Dropdown visible
```

### Templates Disabled

```
┌──────────────────────────────────┐
│     [Textarea............] [→]   │
└──────────────────────────────────┘
No dropdown button
```

**Control:** `src/lib/features.ts`

```typescript
const defaultFlags = {
  templates: true, // or false
};
```

---

## 📊 Size Reference

### Component Dimensions

**Message Bubble:**

- Width: Up to 80% of container
- Padding: 16px (px-4 py-3)
- Border radius: 8px (rounded-lg)

**Avatar:**

- Size: 32x32px (h-8 w-8)
- Border radius: 50% (rounded-full)

**Textarea:**

- Min height: 60px
- Max height: 200px
- Width: 100% of container
- Padding: 12px

**Send Button:**

- Size: 60x60px
- Icon: 20x20px (h-5 w-5)

**Container:**

- Max width: 768px (max-w-3xl)
- Padding: 16px (px-4)

---

## 🎨 Color Palette

### Primary Colors

```
Blue (Primary):     #2563eb  (user bubbles)
Gray (Muted):       #f1f5f9  (AI bubbles, light)
Dark (Foreground):  #0f172a  (text, dark mode bg)
White (Background): #ffffff  (light mode bg)
```

### Semantic Colors

```
Success:  #22c55e  (future use)
Warning:  #f59e0b  (future use)
Error:    #ef4444  (error messages)
Info:     #3b82f6  (info messages)
```

---

## 📐 Spacing System

```
Gap between messages:     24px (space-y-6)
Gap in composer:          8px (gap-2)
Container padding:        16px (px-4 py-4)
Message bubble padding:   16px/12px (px-4 py-3)
Avatar size:             32px (h-8 w-8)
Icon size:               16-20px (h-4/h-5 w-4/w-5)
```

---

## 🎬 Animation Timeline

### Message Send Flow

```
0ms:    User clicks send
        ↓
10ms:   Message added to state
        ↓
50ms:   UI re-renders with new message
        ↓
100ms:  Auto-scroll starts
        ↓
400ms:  API response starts
        ↓
600ms:  First token appears
        ↓
700-3000ms: Streaming content
        ↓
3000ms: Stream complete
        ↓
3100ms: Final message added to state
```

---

## 🎯 Hit Targets

### Minimum Touch Targets (Mobile)

```
Send Button:    60x60px  ✓ (exceeds 44px minimum)
Dropdown:       40x40px  ✓ (meets minimum)
Textarea:       Full width, 60px+ height  ✓
```

All interactive elements meet WCAG 2.1 touch target requirements.

---

## 📱 Breakpoints

```
Mobile:   < 640px   (sm)
Tablet:   640-768px (md)
Desktop:  > 768px   (lg)

Max container width: 768px (all screens)
```

---

This visual guide complements the technical documentation and provides a clear picture of the chat interface design and interactions.
