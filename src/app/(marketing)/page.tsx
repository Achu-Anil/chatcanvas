import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Code2,
  Database,
  Sparkles,
  MessageSquare,
  Palette,
  Shield,
  Rocket,
  Github,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative flex-1 flex items-center justify-center px-4 py-20 md:py-32 bg-gradient-to-b from-background via-background to-muted/20">
        <div className="absolute inset-0 bg-grid-white/10 bg-[size:60px_60px] [mask-image:radial-gradient(white,transparent_85%)] pointer-events-none" />

        <div className="container max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col items-center text-center space-y-8">
            {/* Badge */}
            <Badge variant="secondary" className="px-4 py-1.5 text-sm">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Production-Ready AI Chat Template
            </Badge>

            {/* Heading */}
            <div className="space-y-4 max-w-4xl">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                Build AI Chat Apps{" "}
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  in Minutes
                </span>
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
                Production-ready Next.js template with streaming AI responses,
                conversation persistence, and support for OpenAI & Anthropic.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-4">
              <Button size="lg" asChild className="text-base px-8 h-12">
                <Link href="/chat">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Try Demo
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="text-base px-8 h-12"
              >
                <Link
                  href="https://github.com/Achu-Anil/chatcanvas"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="w-5 h-5 mr-2" />
                  View Code
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center justify-center gap-8 pt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4" />
                <span>TypeScript</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>Streaming</span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                <span>Prisma ORM</span>
              </div>
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                <span>Tailwind CSS</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32 px-4 bg-muted/30">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <Badge variant="outline" className="mb-2">
              Features
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              Everything you need to ship fast
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built with modern best practices and production-ready features out
              of the box.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <Card className="border-2">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Streaming Responses</CardTitle>
                <CardDescription>
                  Real-time AI responses with token-by-token streaming for the
                  best user experience.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Edge Runtime support</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>ReadableStream API</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Optimized for performance</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="border-2">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Database className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Database Integration</CardTitle>
                <CardDescription>
                  Persistent conversations with Prisma ORM and PostgreSQL
                  support.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Auto-save messages</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Transaction support</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Metadata tracking</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="border-2">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Code2 className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>TypeScript First</CardTitle>
                <CardDescription>
                  Fully typed with TypeScript for better DX and fewer bugs.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Strict mode enabled</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Zod validation</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Type-safe APIs</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="border-2">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Multi-Provider Support</CardTitle>
                <CardDescription>
                  Works with OpenAI, Anthropic, and easy to add more providers.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>OpenAI GPT-4</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Anthropic Claude</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Extensible architecture</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="border-2">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Palette className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Beautiful UI</CardTitle>
                <CardDescription>
                  Modern interface with Tailwind CSS and Radix UI components.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Dark mode support</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Responsive design</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Accessible components</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card className="border-2">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Production Ready</CardTitle>
                <CardDescription>
                  Comprehensive error handling, testing, and documentation
                  included.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Error boundaries</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Vitest setup</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Full documentation</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 px-4">
        <div className="container max-w-4xl mx-auto">
          <Card className="border-2 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader className="text-center space-y-4 pb-8">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Rocket className="w-8 h-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-3xl sm:text-4xl">
                Ready to start building?
              </CardTitle>
              <CardDescription className="text-lg">
                Get started with ChatCanvas today and ship your AI chat
                application in minutes.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="text-base px-8">
                <Link href="/chat">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Try Demo
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="text-base px-8"
              >
                <Link
                  href="https://github.com/Achu-Anil/chatcanvas"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="w-5 h-5 mr-2" />
                  Get Started
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4 bg-muted/20">
        <div className="container max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              <span className="font-semibold">ChatCanvas</span>
            </div>

            <p className="text-sm text-muted-foreground">
              Built with Next.js, TypeScript, and Tailwind CSS
            </p>

            <div className="flex items-center gap-6">
              <Link
                href="https://github.com/Achu-Anil/chatcanvas"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="w-5 h-5" />
                <span className="sr-only">GitHub</span>
              </Link>
              <Link
                href="/chat"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Demo
              </Link>
              <Link
                href="https://github.com/Achu-Anil/chatcanvas/blob/master/README.md"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Docs
              </Link>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t text-center">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} ChatCanvas. Open source template for
              AI chat applications.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
