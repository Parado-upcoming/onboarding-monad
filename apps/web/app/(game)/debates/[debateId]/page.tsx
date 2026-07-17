"use client";

import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useInvalidateDebates } from "@/hooks/use-debates";
import type { DebateSummary } from "@/hooks/use-debates";

function shortWallet(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const POSITION_LABEL: Record<string, string> = {
  BULLISH: "📈 Bullish",
  BEARISH: "📉 Bearish",
  NEUTRAL: "➖ Neutral",
};

async function fetchDebate(id: string): Promise<DebateSummary | null> {
  const res = await fetch("/api/debates");
  if (!res.ok) return null;
  const data = await res.json();
  return [...data.open, ...data.mine].find((d: DebateSummary) => d.id === id) ?? null;
}

export default function DebateDetailPage({
  params,
}: {
  params: Promise<{ debateId: string }>;
}) {
  const { debateId } = use(params);
  const { user } = useCurrentUser();
  const invalidate = useInvalidateDebates();
  const { data: debate, refetch } = useQuery({
    queryKey: ["debate", debateId],
    queryFn: () => fetchDebate(debateId),
  });

  const [position, setPosition] = useState("BEARISH");
  const [thesis, setThesis] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!debate) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-muted-foreground">Loading...</CardContent>
      </Card>
    );
  }

  const isCreator = user?.walletAddress === debate.creator.walletAddress;
  const isChallenger = user?.walletAddress === debate.challenger?.walletAddress;
  const canChallenge = !debate.challenger && !isCreator && new Date(debate.expiresAt) > new Date();
  const isExpired = new Date(debate.expiresAt) <= new Date();

  async function submitChallenge() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/debates/${debateId}/challenge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position, thesis }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.replaceAll("_", " ") ?? "Couldn't join debate");
        return;
      }
      toast.success("You're in! Debate locked until it resolves.");
      invalidate();
      refetch();
    } catch {
      toast.error("Couldn't join debate");
    } finally {
      setSubmitting(false);
    }
  }

  async function checkResolution() {
    const res = await fetch(`/api/debates/${debateId}/resolve`, { method: "POST" });
    const data = await res.json();
    if (data.outcome && data.outcome !== "PENDING") {
      toast.success(`Debate resolved: ${data.outcome.replaceAll("_", " ")}`);
    } else {
      toast.info("Not resolved yet");
    }
    invalidate();
    refetch();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Badge variant="outline">{debate.asset}</Badge>
        <span className="text-sm text-muted-foreground">{debate.timeframeHours}h window</span>
        {debate.outcome !== "PENDING" && (
          <Badge variant="secondary">{debate.outcome.replaceAll("_", " ")}</Badge>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className={isCreator ? "border-violet-500/50" : undefined}>
          <CardContent className="space-y-2 py-4">
            <p className="text-sm font-medium">
              {debate.creator.displayName ?? shortWallet(debate.creator.walletAddress)}
            </p>
            <Badge>{POSITION_LABEL[debate.creatorPosition]}</Badge>
            <p className="text-sm text-muted-foreground">{debate.thesis}</p>
          </CardContent>
        </Card>

        {debate.challenger ? (
          <Card className={isChallenger ? "border-violet-500/50" : undefined}>
            <CardContent className="space-y-2 py-4">
              <p className="text-sm font-medium">
                {debate.challenger.displayName ?? shortWallet(debate.challenger.walletAddress)}
              </p>
              <Badge>{POSITION_LABEL[debate.challengerPosition!]}</Badge>
              <p className="text-sm text-muted-foreground">{debate.challengerThesis}</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex items-center justify-center py-4 text-sm text-muted-foreground">
              Waiting for a challenger
            </CardContent>
          </Card>
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        Start price: ${debate.startPrice.toFixed(4)}
        {debate.resolutionPrice != null && (
          <> · Resolution price: ${debate.resolutionPrice.toFixed(4)}</>
        )}
      </div>

      {canChallenge && (
        <Card>
          <CardContent className="space-y-3 py-6">
            <p className="font-medium">Take the other side</p>
            <Select value={position} onValueChange={(v) => v && setPosition(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["BULLISH", "BEARISH", "NEUTRAL"] as const)
                  .filter((p) => p !== debate.creatorPosition)
                  .map((p) => (
                    <SelectItem key={p} value={p}>{POSITION_LABEL[p]}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Textarea
              value={thesis}
              onChange={(e) => setThesis(e.target.value)}
              placeholder="I disagree because..."
              maxLength={500}
            />
            <Button
              className="w-full"
              disabled={submitting || thesis.trim().length < 10}
              onClick={submitChallenge}
            >
              Create Trade Debate
            </Button>
          </CardContent>
        </Card>
      )}

      {isExpired && debate.outcome === "PENDING" && debate.challenger && (
        <Button variant="outline" onClick={checkResolution}>
          Check result
        </Button>
      )}
    </div>
  );
}
