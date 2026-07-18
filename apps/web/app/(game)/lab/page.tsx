"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ASSETS } from "@/lib/engines/trading-engine";
import type { LpSimulationResult } from "@/lib/engines/lab-engine";
import type { AssetSymbol } from "@/lib/engines/trading-engine";

const HORIZONS = [
  { label: "1 day", days: 1 },
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
];

function formatUsd(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

function formatPct(n: number) {
  return `${n >= 0 ? "+" : ""}${(n * 100).toFixed(2)}%`;
}

export default function LabPage() {
  const { user, isLoading } = useCurrentUser();
  const [asset, setAsset] = useState<AssetSymbol>("MON");
  const [depositValueUsd, setDepositValueUsd] = useState("1000");
  const [horizonDays, setHorizonDays] = useState(7);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<LpSimulationResult | null>(null);

  if (isLoading) return null;

  if (!user) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-muted-foreground">
            Connect your wallet to experiment in The Lab.
          </p>
          <ConnectButton />
        </CardContent>
      </Card>
    );
  }

  async function runSimulation() {
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/lab/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset,
          depositValueUsd: Number(depositValueUsd),
          horizonDays,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Couldn't run simulation");
        return;
      }
      setResult(data.result);
      toast.success(`+${data.xpAwarded} XP`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">The Lab</p>
        <h1 className="text-2xl font-bold">
          You deposited into a liquidity pool. The price moved. What happened?
        </h1>
      </div>

      <Card>
        <CardContent className="space-y-4 py-6">
          <Tabs value={asset} onValueChange={(v) => v && setAsset(v as AssetSymbol)}>
            <TabsList>
              {ASSETS.map((a) => (
                <TabsTrigger key={a.symbol} value={a.symbol}>
                  {a.symbol}/USD pool
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="space-y-1.5">
            <Label>Deposit amount (USD, split 50/50)</Label>
            <Input
              type="number"
              min={1}
              value={depositValueUsd}
              onChange={(e) => setDepositValueUsd(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Fast-forward</Label>
            <div className="flex gap-2">
              {HORIZONS.map((h) => (
                <Button
                  key={h.days}
                  size="sm"
                  variant={horizonDays === h.days ? "default" : "outline"}
                  onClick={() => setHorizonDays(h.days)}
                >
                  {h.label}
                </Button>
              ))}
            </div>
          </div>

          <Button className="w-full" disabled={submitting} onClick={runSimulation}>
            {submitting ? "Simulating..." : "Run simulation"}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-violet-500/50">
          <CardContent className="space-y-4 py-6">
            <div className="flex items-center justify-between">
              <p className="font-medium">Result after {horizonDays} days</p>
              <Badge variant={result.netResultUsd >= 0 ? "secondary" : "destructive"}>
                {formatPct(result.netResultPct)} net
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <div>
                <p className="text-muted-foreground">Entry price</p>
                <p className="font-medium">{formatUsd(result.entryPrice)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Exit price</p>
                <p className="font-medium">{formatUsd(result.exitPrice)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Price change</p>
                <p className="font-medium">{formatPct(result.priceChangePct)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Impermanent loss</p>
                <p className="font-medium text-rose-400">
                  {formatPct(result.impermanentLossPct)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Fees earned</p>
                <p className="font-medium text-emerald-400">{formatUsd(result.feesEarnedUsd)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Net result</p>
                <p className={result.netResultUsd >= 0 ? "font-medium text-emerald-400" : "font-medium text-rose-400"}>
                  {formatUsd(result.netResultUsd)}
                </p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              If you had just held both assets instead of providing liquidity, you&apos;d have{" "}
              {formatUsd(result.holdValueUsd)}. The gap between that and your LP value is
              impermanent loss — fees earned may or may not make up for it.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
