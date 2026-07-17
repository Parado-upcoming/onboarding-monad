"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "@/lib/nav-links";
import { useCurrentUser } from "@/hooks/use-current-user";

export function AppNav() {
  const pathname = usePathname();
  const { user } = useCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <Link href="/dashboard" className="shrink-0 text-sm font-bold tracking-[0.2em] uppercase">
          The Onboarding
        </Link>

        <nav className="hidden flex-1 items-center gap-1 overflow-x-auto lg:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                  active
                    ? "bg-violet-600/20 text-violet-300"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                )}
              >
                <span aria-hidden>{link.emoji}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-3">
          {user && (
            <Link
              href={`/profile/${user.walletAddress}`}
              className="hidden items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium sm:flex"
            >
              <span className="text-amber-400">🔥 {user.streakCount}</span>
              <span className="text-muted-foreground">Lv.{user.level}</span>
              <span className="text-violet-300">{user.xp} XP</span>
            </Link>
          )}
          <ConnectButton showBalance={false} chainStatus="icon" />
        </div>
      </div>
    </header>
  );
}
