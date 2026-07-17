"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useQuestProgress } from "@/hooks/use-quest-progress";
import { getQuestById } from "@/lib/quests/data";

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const { nextMissionId, isLoading: progressLoading } = useQuestProgress(isAuthenticated);

  if (isLoading) return null;

  if (!user) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-muted-foreground">
            Connect and sign in with your wallet to start your first mission.
          </p>
          <ConnectButton />
        </CardContent>
      </Card>
    );
  }

  const nextQuest = nextMissionId ? getQuestById(nextMissionId) : undefined;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">
          Welcome back, {user.displayName ?? "player"}.
        </p>
        <h1 className="text-2xl font-bold">🔥 {user.streakCount} day streak</h1>
      </div>

      <div>
        <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">
          Your Next Mission
        </p>

        {progressLoading ? null : nextQuest ? (
          <Card className="border-violet-500/50 bg-gradient-to-br from-violet-950/40 to-background">
            <CardContent className="space-y-4 py-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{nextQuest.emoji}</span>
                <div>
                  <h2 className="text-lg font-bold">{nextQuest.title}</h2>
                  <p className="text-sm text-muted-foreground">{nextQuest.description}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">+{nextQuest.xpReward} XP</Badge>
                {nextQuest.achievementId && <Badge variant="outline">🏆 New Achievement</Badge>}
              </div>
              <Link
                href={`/academy/${nextQuest.id}`}
                className={buttonVariants({ size: "lg", className: "w-full" })}
              >
                Start Mission
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              You&apos;ve completed every Academy mission. More are coming soon —
              head to the Arena or Investigation Room in the meantime.
            </CardContent>
          </Card>
        )}
      </div>

      <div>
        <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">
          Your Journey
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { href: "/academy", label: "Academy", emoji: "📚" },
            { href: "/arena", label: "Arena", emoji: "📈" },
            { href: "/investigation", label: "Investigation", emoji: "🕵️" },
            { href: "/lab", label: "Lab", emoji: "🧪" },
            { href: "/leaderboard", label: "Leaderboard", emoji: "🏆" },
            { href: "/community", label: "Community", emoji: "🎁" },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="transition-colors hover:border-violet-500/50">
                <CardContent className="flex flex-col items-center gap-2 py-6 text-center">
                  <span className="text-2xl">{item.emoji}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
