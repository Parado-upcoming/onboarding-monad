"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser } from "@/hooks/use-current-user";
import { CASES } from "@/lib/investigation/cases";

interface Attempt {
  caseId: string;
  correct: boolean;
  xpAwarded: number;
}

async function fetchProgress(): Promise<Attempt[]> {
  const res = await fetch("/api/investigation/progress");
  if (!res.ok) return [];
  const data = await res.json();
  return data.attempts;
}

export default function InvestigationRoomPage() {
  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const { data: attempts } = useQuery({
    queryKey: ["investigation-progress"],
    queryFn: fetchProgress,
    enabled: isAuthenticated,
  });

  if (isLoading) return null;

  if (!user) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-muted-foreground">
            Connect your wallet to investigate your first on-chain case.
          </p>
          <ConnectButton />
        </CardContent>
      </Card>
    );
  }

  const attemptFor = (id: string) => attempts?.find((a) => a.caseId === id);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Investigation Room
        </p>
        <h1 className="text-2xl font-bold">Follow the wallet. Find the truth.</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {CASES.map((c) => {
          const attempt = attemptFor(c.id);
          return (
            <Link key={c.id} href={`/investigation/${c.id}`}>
              <Card className="h-full transition-colors hover:border-violet-500/50">
                <CardContent className="flex flex-col gap-3 py-5">
                  <div className="flex items-start justify-between">
                    <span className="text-2xl">{c.emoji}</span>
                    {attempt && (
                      <Badge variant={attempt.correct ? "secondary" : "destructive"}>
                        {attempt.correct ? "✓ Solved" : "Attempted"}
                      </Badge>
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold">{c.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{c.briefing}</p>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-2 text-xs">
                    <span className="text-muted-foreground">{c.difficulty}</span>
                    <span className="font-medium text-violet-300">+{c.xpReward} XP</span>
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
