import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "ChatCanvas - Build AI Chat Apps in Minutes",
  description:
    "Production-ready Next.js template for AI-powered chat applications. Built with TypeScript, Tailwind CSS, and support for OpenAI & Anthropic. Stream responses, persist conversations, and ship faster.",
  keywords: [
    "AI chat",
    "Next.js template",
    "OpenAI",
    "Anthropic",
    "TypeScript",
    "Tailwind CSS",
    "chat application",
    "LLM integration",
    "streaming",
  ],
  authors: [{ name: "ChatCanvas" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "ChatCanvas",
    title: "ChatCanvas - Build AI Chat Apps in Minutes",
    description:
      "Production-ready Next.js template for AI-powered chat applications. Built with TypeScript, Tailwind CSS, and support for OpenAI & Anthropic.",
    images: [
      {
        url: `${baseUrl}/api/og`,
        width: 1200,
        height: 630,
        alt: "ChatCanvas - AI Chat Template",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ChatCanvas - Build AI Chat Apps in Minutes",
    description:
      "Production-ready Next.js template for AI-powered chat applications.",
    images: [`${baseUrl}/api/og`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
