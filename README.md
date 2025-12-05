# ChatCanvas

Production-grade conversational AI interface demonstrating advanced LLM integration patterns.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript) ![Vercel AI SDK](https://img.shields.io/badge/Vercel_AI_SDK-5.0-000000) ![Prisma](https://img.shields.io/badge/Prisma-5.0-2D3748?logo=prisma)

## Stack

**Frontend:** Next.js 14 (App Router), React Server Components, Tailwind CSS, shadcn/ui  
**AI:** Vercel AI SDK v5 (streaming with `streamText`)  
**Data:** Prisma ORM (SQLite dev, Postgres prod)  
**Analytics:** PostHog (events + feature flags)

## Key Features

- **Token-by-token streaming** with Vercel AI SDK `streamText`
- **Optimistic UI updates** using React 19 `useOptimistic` hook
- **Server Actions** for type-safe mutations (`'use server'`)
- **Zod validation** for request/response contracts
- **Multi-provider LLM** (OpenAI, Anthropic) with unified interface
- **Suspense boundaries** for loading states
- **PostHog analytics** for user tracking and feature flags

## Quick Start

```bash
npm install
npm run db:push
npm run dev
```

Requires `.env.local`:

```bash
OPENAI_API_KEY=sk-...
DATABASE_URL=file:./dev.db
NEXT_PUBLIC_POSTHOG_KEY=phc_...
```

## Technical Highlights

- Modern Next.js patterns (RSC, Server Actions, streaming)
- End-to-end TypeScript with strict mode
- React 19 features (`useOptimistic` for instant UI updates)
- Modular architecture (features collocated)
- **90 comprehensive tests** with Vitest
- **100% coverage** on critical paths (API routes, Server Actions, utilities)

Built following YAGNI principles.
