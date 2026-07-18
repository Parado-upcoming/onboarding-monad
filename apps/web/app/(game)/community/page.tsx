"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { FINAL_QUESTION } from "@/lib/community/data";

interface CommunityResponse {
  challenge: {
    slug: string;
    title: string;
    emoji: string;
    createdBy: string;
    description: string;
    requirements: { id: string; label: string; detail: string }[];
    rewards: { xp: number; badge: string; communityPoints: number };
  };
  requirements: { learnMonad: boolean; fiveQuests: boolean; testnetInteraction: boolean };
  allRequirementsMetExceptFinal: boolean;
  completed: boolean;
}

async function fetchCommunity(): Promise<CommunityResponse | null> {
  const res = await fetch("/api/community");
  if (!res.ok) return null;
  return res.json();
}

export default function CommunityPage() {
  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["community"],
    queryFn: fetchCommunity,
    enabled: isAuthenticated,
  });
  const [answer, setAnswer] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) return null;

  if (!user) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-muted-foreground">
            Connect your wallet to take on community challenges.
          </p>
          <ConnectButton />
        </CardContent>
      </Card>
    );
  }

  const reqMet = data?.requirements;
  const reqChecks = reqMet
    ? [reqMet.learnMonad, reqMet.fiveQuests, reqMet.testnetInteraction]
    : [];

  async function submitFinal() {
    if (!answer) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/community/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ finalAnswer: answer }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error === "incorrect_answer" ? "Not quite — try again" : "Couldn't submit");
        return;
      }
      if (result.alreadyCompleted) {
        toast.info("Already completed");
      } else {
        toast.success(`Challenge complete! +${result.xpAwarded} XP, Monad Explorer Badge`);
      }
      queryClient.invalidateQueries({ queryKey: ["community"] });
      queryClient.invalidateQueries({ queryKey: ["session"] });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Community Challenges
          </p>
          <h1 className="text-2xl font-bold">Onboard into ecosystems, not just quests.</h1>
        </div>
        <Link href="/community/create" className={buttonVariants({ variant: "outline", size: "sm" })}>
          How challenges are built
        </Link>
      </div>

      {data && (
        <Card className={data.completed ? "border-emerald-500/50" : "border-violet-500/50"}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <span>{data.challenge.emoji}</span> {data.challenge.title}
              </CardTitle>
              {data.completed && <Badge variant="secondary">✓ Completed</Badge>}
            </div>
            <p className="text-xs text-muted-foreground">by {data.challenge.createdBy}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{data.challenge.description}</p>

            <div className="space-y-2">
              {data.challenge.requirements.map((req, i) => (
                <div key={req.id} className="flex items-center gap-2 text-sm">
                  <span>{i < 3 ? (reqChecks[i] ? "✅" : "⬜") : data.completed ? "✅" : "⬜"}</span>
                  <div>
                    <p>{req.label}</p>
                    <p className="text-xs text-muted-foreground">{req.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">+{data.challenge.rewards.xp} XP</Badge>
              <Badge variant="outline">🏅 {data.challenge.rewards.badge}</Badge>
              <Badge variant="outline">{data.challenge.rewards.communityPoints} Community Points</Badge>
            </div>

            {!data.completed && data.allRequirementsMetExceptFinal && (
              <div className="space-y-3 rounded-lg border border-violet-500/30 p-4">
                <p className="text-sm font-medium">Final challenge</p>
                <p className="text-sm text-muted-foreground">{FINAL_QUESTION.prompt}</p>
                <div className="space-y-2">
                  {FINAL_QUESTION.options.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setAnswer(opt.id)}
                      className={`w-full rounded-lg border px-4 py-2 text-left text-sm ${
                        answer === opt.id
                          ? "border-violet-500 bg-violet-950/30"
                          : "border-white/10 hover:border-violet-500/50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <Button className="w-full" disabled={!answer || submitting} onClick={submitFinal}>
                  {submitting ? "Submitting..." : "Submit"}
                </Button>
              </div>
            )}

            {!data.completed && !data.allRequirementsMetExceptFinal && (
              <p className="text-xs text-muted-foreground">
                Complete the requirements above to unlock the final challenge.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
