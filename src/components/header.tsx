"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

/**
 * Navigation links configuration
 */
const navLinks = [
  { href: "/", label: "Home" },
  { href: "/chat", label: "Chat" },
  { href: "/admin", label: "Admin" },
] as const;

/**
 * Header Component
 *
 * Sticky navigation header with:
 * - Logo and branding
 * - Navigation links (Home, Chat, Admin)
 * - Theme toggle
 * - Active link highlighting
 * - Responsive design
 */
export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 max-w-screen-2xl items-center px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-lg hover:opacity-80 transition-opacity"
          aria-label="ChatCanvas Home"
        >
          <MessageSquare className="h-5 w-5" aria-hidden="true" />
          <span>ChatCanvas</span>
        </Link>

        {/* Navigation */}
        <nav
          className="flex items-center gap-6 ml-8"
          aria-label="Main navigation"
        >
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Theme Toggle */}
        <ThemeToggle />
      </div>
    </header>
  );
}
