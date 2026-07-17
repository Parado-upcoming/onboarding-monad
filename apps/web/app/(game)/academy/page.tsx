"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useQuestProgress } from "@/hooks/use-quest-progress";
import { QUESTS } from "@/lib/quests/data";
import { cn } from "@/lib/utils";

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner: "text-emerald-400",
  intermediate: "text-amber-400",
  advanced: "text-rose-400",
};

export default function AcademyPage() {
  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const { progress, nextMissionId } = useQuestProgress(isAuthenticated);

  if (isLoading) return null;

  if (!user) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-muted-foreground">
            Connect your wallet to start earning XP in the Academy.
          </p>
          <ConnectButton />
        </CardContent>
      </Card>
    );
  }

  const statusFor = (id: string) =>
    progress.find((p) => p.questId === id)?.status;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">The Academy</p>
        <h1 className="text-2xl font-bold">Short missions. Real Web3 knowledge.</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {QUESTS.map((quest) => {
          const status = statusFor(quest.id);
          const completed = status === "COMPLETED";
          const isNext = quest.id === nextMissionId;

          return (
            <Link key={quest.id} href={`/academy/${quest.id}`}>
              <Card
                className={cn(
                  "h-full transition-colors hover:border-violet-500/50",
                  isNext && "border-violet-500 bg-violet-950/20",
                )}
              >
                <CardContent className="flex flex-col gap-3 py-5">
                  <div className="flex items-start justify-between">
                    <span className="text-2xl">{quest.emoji}</span>
                    {completed ? (
                      <Badge variant="secondary">✓ Completed</Badge>
                    ) : isNext ? (
                      <Badge>Next Mission</Badge>
                    ) : null}
                  </div>
                  <div>
                    <h2 className="font-semibold">{quest.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {quest.description}
                    </p>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-2 text-xs">
                    <span className={DIFFICULTY_COLOR[quest.difficulty]}>
                      {quest.difficulty}
                    </span>
                    <span className="font-medium text-violet-300">
                      +{quest.xpReward} XP
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
