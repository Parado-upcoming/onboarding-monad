"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useDebates, useInvalidateDebates } from "@/hooks/use-debates";
import { ASSETS } from "@/lib/engines/trading-engine";
import type { DebateSummary } from "@/hooks/use-debates";

function shortWallet(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const POSITION_LABEL: Record<string, string> = {
  BULLISH: "📈 Bullish",
  BEARISH: "📉 Bearish",
  NEUTRAL: "➖ Neutral",
};

function outcomeBadge(d: DebateSummary, myWallet?: string) {
  if (d.outcome === "PENDING") return <Badge variant="outline">Pending</Badge>;
  if (d.outcome === "DRAW") return <Badge variant="secondary">Draw</Badge>;
  const won =
    (d.outcome === "CREATOR_WON" && d.creator.walletAddress === myWallet) ||
    (d.outcome === "CHALLENGER_WON" && d.challenger?.walletAddress === myWallet);
  return <Badge variant={won ? "secondary" : "destructive"}>{won ? "Won" : "Lost"}</Badge>;
}

export default function DebatesPage() {
  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const { open, mine } = useDebates(isAuthenticated);
  const invalidate = useInvalidateDebates();

  const [createOpen, setCreateOpen] = useState(false);
  const [asset, setAsset] = useState("MON");
  const [timeframeHours, setTimeframeHours] = useState("24");
  const [position, setPosition] = useState("BULLISH");
  const [thesis, setThesis] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) return null;

  if (!user) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-muted-foreground">
            Connect your wallet to create or accept a Trade Debate.
          </p>
          <ConnectButton />
        </CardContent>
      </Card>
    );
  }

  async function createDebate() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/debates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset,
          timeframeHours: Number(timeframeHours),
          position,
          thesis,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.replaceAll("_", " ") ?? "Couldn't create debate");
        return;
      }
      toast.success("Trade debate created — waiting for a challenger");
      setThesis("");
      setCreateOpen(false);
      invalidate();
    } catch {
      toast.error("Couldn't create debate");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Trade Debates</p>
          <h1 className="text-2xl font-bold">Put your thesis on the record.</h1>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button />}>Create debate</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a trade debate</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Asset</Label>
                  <Select value={asset} onValueChange={(v) => v && setAsset(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ASSETS.map((a) => (
                        <SelectItem key={a.symbol} value={a.symbol}>{a.symbol}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Timeframe (hours)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={168}
                    value={timeframeHours}
                    onChange={(e) => setTimeframeHours(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Your position</Label>
                <Select value={position} onValueChange={(v) => v && setPosition(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BULLISH">📈 Bullish</SelectItem>
                    <SelectItem value="BEARISH">📉 Bearish</SelectItem>
                    <SelectItem value="NEUTRAL">➖ Neutral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Thesis</Label>
                <Textarea
                  value={thesis}
                  onChange={(e) => setThesis(e.target.value)}
                  placeholder="I believe the asset will outperform because..."
                  maxLength={500}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={createDebate} disabled={submitting || thesis.trim().length < 10}>
                {submitting ? "Creating..." : "Create debate"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div>
        <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">
          Open debates — take the other side
        </p>
        {open.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No open debates right now. Start one above.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {open.map((d) => (
              <Link key={d.id} href={`/debates/${d.id}`}>
                <Card className="h-full transition-colors hover:border-violet-500/50">
                  <CardContent className="space-y-2 py-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{d.asset}</Badge>
                      <span className="text-xs text-muted-foreground">{d.timeframeHours}h</span>
                    </div>
                    <p className="text-sm">{POSITION_LABEL[d.creatorPosition]}</p>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{d.thesis}</p>
                    <p className="text-xs text-muted-foreground">
                      by {d.creator.displayName ?? shortWallet(d.creator.walletAddress)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">
          Your debates
        </p>
        {mine.length === 0 ? (
          <p className="text-sm text-muted-foreground">You haven&apos;t joined a debate yet.</p>
        ) : (
          <div className="space-y-2">
            {mine.map((d) => (
              <Link
                key={d.id}
                href={`/debates/${d.id}`}
                className="flex items-center justify-between rounded-lg border border-white/10 px-4 py-3 hover:border-violet-500/50"
              >
                <div>
                  <p className="text-sm font-medium">
                    {d.asset} · {POSITION_LABEL[d.creatorPosition]}
                    {d.challengerPosition && ` vs ${POSITION_LABEL[d.challengerPosition]}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {d.creator.displayName ?? shortWallet(d.creator.walletAddress)}
                    {d.challenger &&
                      ` vs ${d.challenger.displayName ?? shortWallet(d.challenger.walletAddress)}`}
                  </p>
                </div>
                {outcomeBadge(d, user.walletAddress)}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
