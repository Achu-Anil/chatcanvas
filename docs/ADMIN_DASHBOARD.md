# Admin Dashboard

The admin dashboard provides an overview of recent conversations and system metrics.

## Access

Visit `/admin` to access the dashboard:

```
http://localhost:3000/admin
```

## Features

### Overview Statistics

The dashboard displays three key metrics:

- **Total Chats**: Total number of conversations in the system
- **Total Messages**: Total messages across all chats
- **Total Tokens**: Sum of all completion tokens used

### Recent Conversations

Shows the 20 most recent chats with:

- **Chat Title**: Auto-generated from first message or custom title
- **Message Count**: Total number of messages in the conversation
- **Time Ago**: Human-readable timestamp (e.g., "2 hours ago")
- **First 3 Messages**: Preview of conversation start with:
  - User/Assistant avatars
  - Message content (truncated)
  - Token count per message
  - Relative timestamps

### Badges

Each chat displays informative badges:

- **Message Count Badge**: Shows total messages in the chat
- **Token Badge**: Total completion tokens for displayed messages
- **Latency Badge**: Estimated response time (calculated from message timestamps)
- **Provider Badge**: LLM provider used (from `LLM_PROVIDER` env var)

## Technical Details

### Server Component

The admin page is a **Next.js Server Component** that:

- Queries data directly from the database
- Uses `force-dynamic` rendering (no static generation)
- Always shows fresh data on each page load

### Database Query

```typescript
const recentChats = await prisma.chat.findMany({
  take: 20,
  orderBy: { updatedAt: "desc" },
  include: {
    messages: {
      take: 3,
      orderBy: { createdAt: "asc" },
    },
    _count: { select: { messages: true } },
  },
});
```

### Accessibility

The admin page follows accessibility best practices:

- Semantic HTML (`<ol>`, `<li>`, `role="list"`)
- ARIA labels for screen readers
- Proper heading hierarchy
- Time elements with `dateTime` attributes
- Keyboard navigable

## Latency Calculation

Since latency isn't stored in the database, it's estimated by:

1. Finding the first user message
2. Finding the first assistant message
3. Calculating the time difference between their `createdAt` timestamps

```typescript
const latencyMs = assistantMsg.createdAt - userMsg.createdAt;
```

**Note**: This is an approximation and includes network overhead, database write time, etc.

## Future Enhancements

### Add Database Fields

To track accurate metrics, consider adding to the schema:

```prisma
model Message {
  // ... existing fields
  provider   String?  // e.g., "openai", "anthropic"
  latencyMs  Int?     // Response time in milliseconds
  model      String?  // e.g., "gpt-4o-mini"
}
```

### Filtering and Search

Add query parameters for filtering:

```
/admin?provider=openai
/admin?days=7
/admin?search=user123
```

### Export Functionality

Add CSV/JSON export of conversations:

```typescript
<Button onClick={exportChats}>Export Recent Chats</Button>
```

### Real-time Updates

Use polling or WebSockets for live dashboard updates:

```typescript
// Refresh every 30 seconds
export const revalidate = 30;
```

### Analytics Charts

Add visualizations:

- Messages per day/hour
- Average latency over time
- Token usage trends
- Provider distribution

## Security Considerations

⚠️ **Important**: The admin page has no authentication!

In production, you should:

1. **Add authentication middleware**:

   ```typescript
   // middleware.ts
   export function middleware(request: NextRequest) {
     if (request.nextUrl.pathname.startsWith("/admin")) {
       // Check auth token/session
       // Redirect to login if not authenticated
     }
   }
   ```

2. **Use environment-based access control**:

   ```typescript
   if (process.env.NODE_ENV === "production" && !isAdmin(user)) {
     return redirect("/");
   }
   ```

3. **Add role-based access control (RBAC)**:

   ```prisma
   model User {
     id    String @id
     role  String // "admin", "user"
   }
   ```

4. **Use API routes with authentication**:
   Instead of direct database queries in the page, use protected API routes.

## Example Usage

### Development

```bash
# Set up database
DATABASE_URL="postgresql://..." npm run db:push

# Start dev server
npm run dev

# Visit admin dashboard
open http://localhost:3000/admin
```

### Production

```bash
# Ensure DATABASE_URL is set
export DATABASE_URL="postgresql://..."

# Build
npm run build

# Start
npm start

# Admin page will be available at /admin
```

## Troubleshooting

### "Environment variable not found: DATABASE_URL"

Make sure `DATABASE_URL` is set in your `.env.local`:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/chatcanvas"
```

### No chats displayed

1. Check that the database has data:

   ```bash
   npx prisma studio
   ```

2. Create a test chat:
   - Visit `/chat`
   - Send a message
   - Return to `/admin`

### Slow page load

The page queries all statistics on every load. To improve performance:

1. Add caching:

   ```typescript
   export const revalidate = 60; // Revalidate every 60 seconds
   ```

2. Use database indexes (already included in schema):

   ```prisma
   @@index([createdAt])
   @@index([chatId])
   ```

3. Limit data fetching:
   ```typescript
   take: 10, // Fetch fewer chats
   ```
