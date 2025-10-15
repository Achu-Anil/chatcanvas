# ChatCanvas

**A production-ready fullstack Next.js template for building AI-powered chat applications.**

ChatCanvas combines modern web development with enterprise-grade AI infrastructure. Ship faster with pre-configured LLM adapters, real-time streaming, analytics, database management, and deployment pipelines—all in one place.

## ✨ Features

- 🤖 **Universal LLM Adapters** - Swap between OpenAI, Anthropic, and other providers with a unified interface
- ⚡ **Streaming Responses** - Real-time AI responses with React Server Components and streaming APIs
- 📊 **PostHog Analytics** - Built-in user analytics and feature flags for data-driven decisions
- 🗄️ **Prisma ORM** - Type-safe database access with migrations and seeding
- 🚀 **CI/CD Ready** - Pre-configured GitHub Actions for testing and deployment
- 🐳 **Docker Support** - Containerized development and production environments
- 🎨 **Marketing Site** - Landing pages and marketing components ready to customize
- 🎯 **TypeScript First** - End-to-end type safety across frontend and backend
- 💅 **Tailwind CSS** - Modern styling with utility-first CSS
- 🔒 **Production Hardened** - Security best practices and error handling out of the box

## 🚀 Quickstart

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL (or your preferred database)
- Docker (optional)

### Local Development

```bash
# Clone the repository
git clone https://github.com/yourusername/chatcanvas.git
cd chatcanvas

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys and database URL

# Run database migrations
npx prisma migrate dev

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app.

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or build the production image
docker build -t chatcanvas .
docker run -p 3000:3000 chatcanvas
```

## 🛠️ Tech Stack

### Frontend

- **Next.js 15** - React framework with App Router and Server Components
- **React 19** - Latest React with concurrent features
- **Tailwind CSS** - Utility-first CSS framework
- **TypeScript** - Static type checking

### Backend & AI

- **Next.js API Routes** - Serverless API endpoints
- **LLM Adapters** - OpenAI, Anthropic, and custom model support
- **Streaming APIs** - Real-time response streaming
- **Prisma** - Type-safe ORM for database management

### Database & Storage

- **PostgreSQL** - Primary relational database
- **Prisma Client** - Auto-generated database client
- **Migration System** - Version-controlled schema changes

### Analytics & Monitoring

- **PostHog** - Product analytics and feature flags
- **Vercel Analytics** - Web vitals and performance monitoring

### DevOps & Infrastructure

- **Docker** - Containerization for consistent environments
- **GitHub Actions** - CI/CD pipelines for automated testing and deployment
- **Vercel** - Optimized hosting and edge functions
- **ESLint & Prettier** - Code quality and formatting

### Testing

- **Jest** - Unit and integration testing
- **React Testing Library** - Component testing
- **Playwright** (optional) - End-to-end testing

## 📁 Project Structure

```
chatcanvas/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   ├── lib/              # Utility functions and LLM adapters
│   ├── prisma/           # Database schema and migrations
│   └── styles/           # Global styles
├── public/               # Static assets
├── docker/               # Docker configuration
├── .github/              # CI/CD workflows
└── docs/                 # Documentation
```

## 🎯 Use Cases

- **AI Chat Applications** - Customer support, virtual assistants
- **Content Generation** - Blog posts, marketing copy, code generation
- **Data Analysis Tools** - Natural language queries to databases
- **Education Platforms** - AI tutors and learning assistants
- **Internal Tools** - Streamline workflows with conversational AI

## 📚 Documentation

- [Configuration Guide](./docs/configuration.md)
- [LLM Adapter API](./docs/llm-adapters.md)
- [Deployment Guide](./docs/deployment.md)
- [Contributing](./CONTRIBUTING.md)

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🙏 Acknowledgments

Built with modern tools and best practices from the Next.js, React, and AI communities.

---

**Ready to build your AI application?** Star this repo and start shipping! ⭐
