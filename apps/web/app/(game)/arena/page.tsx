"use client";

import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkline } from "@/components/sparkline";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useArenaState, useInvalidateArenaState } from "@/hooks/use-arena-state";
import type { AssetSymbol } from "@/lib/engines/trading-engine";
import { ASSETS } from "@/lib/engines/trading-engine";

function formatUsd(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

function formatPct(n: number) {
  return `${n >= 0 ? "+" : ""}${(n * 100).toFixed(1)}%`;
}

export default function ArenaPage() {
  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const [asset, setAsset] = useState<AssetSymbol>("MON");
  const { data, isLoading: stateLoading } = useArenaState(asset, isAuthenticated);
  const invalidate = useInvalidateArenaState();

  const [amountUsd, setAmountUsd] = useState("100");
  const [sellQty, setSellQty] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) return null;

  if (!user) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-muted-foreground">
            Connect your wallet to enter The Arena with $10,000 virtual capital.
          </p>
          <ConnectButton />
        </CardContent>
      </Card>
    );
  }

  async function trade(side: "BUY" | "SELL", opts: { sellAll?: boolean } = {}) {
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = { asset, side };
      if (side === "BUY") body.amountUsd = Number(amountUsd);
      else if (opts.sellAll) body.sellAll = true;
      else body.quantity = Number(sellQty);

      const res = await fetch("/api/arena/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error?.replaceAll("_", " ") ?? "Trade failed");
        return;
      }
      toast.success(
        `${side === "BUY" ? "Bought" : "Sold"} ${json.trade.quantity.toFixed(4)} ${asset}`,
      );
      if (json.firstTradeAchievement) {
        toast.success("🏆 Achievement unlocked: First Swap (+50 XP)");
      }
      invalidate();
    } catch {
      toast.error("Trade failed");
    } finally {
      setSubmitting(false);
    }
  }

  const stats = data?.stats;
  const holding = stats?.holdings.find((h) => h.asset === asset);
  const price = data?.prices[asset] ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">The Arena</p>
        <h1 className="text-2xl font-bold">$10,000 virtual capital. Real consequences.</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="sm:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Portfolio Value</CardTitle>
          </CardHeader>
          <CardContent className="flex items-baseline gap-3">
            <p className="text-3xl font-bold">
              {stats ? formatUsd(stats.portfolioValue) : "..."}
            </p>
            {stats && (
              <Badge variant={stats.roi >= 0 ? "secondary" : "destructive"}>
                {formatPct(stats.roi)}
              </Badge>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {stats?.winRate != null ? `${(stats.winRate * 100).toFixed(0)}%` : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Max Drawdown</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {stats ? `${(stats.maxDrawdownPct * 100).toFixed(1)}%` : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-4 py-6">
          <Tabs value={asset} onValueChange={(v) => setAsset(v as AssetSymbol)}>
            <TabsList>
              {ASSETS.map((a) => (
                <TabsTrigger key={a.symbol} value={a.symbol}>
                  {a.symbol}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-2xl font-bold">{formatUsd(price)}</p>
              <p className="text-sm text-muted-foreground">
                {ASSETS.find((a) => a.symbol === asset)?.name}
              </p>
            </div>
            {holding && holding.quantity > 0 && (
              <div className="text-right text-sm">
                <p>
                  {holding.quantity.toFixed(4)} {asset}
                </p>
                <p className="text-muted-foreground">avg cost {formatUsd(holding.avgCost)}</p>
              </div>
            )}
          </div>

          {data && !stateLoading ? (
            <Sparkline points={data.chart.series.map((p) => p.price)} />
          ) : (
            <div className="h-40" />
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 rounded-lg border border-white/10 p-4">
              <p className="text-sm font-medium text-emerald-400">Buy</p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  value={amountUsd}
                  onChange={(e) => setAmountUsd(e.target.value)}
                  placeholder="USD amount"
                />
                <Button
                  disabled={submitting || !Number(amountUsd)}
                  onClick={() => trade("BUY")}
                >
                  Buy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Cash available: {data ? formatUsd(data.cashBalance) : "..."}
              </p>
            </div>

            <div className="space-y-2 rounded-lg border border-white/10 p-4">
              <p className="text-sm font-medium text-rose-400">Sell</p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={0}
                  step="any"
                  value={sellQty}
                  onChange={(e) => setSellQty(e.target.value)}
                  placeholder={`${asset} quantity`}
                />
                <Button
                  variant="outline"
                  disabled={submitting || !Number(sellQty)}
                  onClick={() => trade("SELL")}
                >
                  Sell
                </Button>
              </div>
              <button
                className="text-xs text-muted-foreground underline disabled:opacity-40"
                disabled={submitting || !holding?.quantity}
                onClick={() => trade("SELL", { sellAll: true })}
              >
                Sell all {holding ? holding.quantity.toFixed(4) : 0} {asset}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Holdings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!stats?.holdings.length ? (
              <p className="text-sm text-muted-foreground">No open positions yet.</p>
            ) : (
              stats.holdings.map((h) => (
                <div key={h.asset} className="flex justify-between text-sm">
                  <span>{h.asset}</span>
                  <span>
                    {h.quantity.toFixed(4)} · {formatUsd(h.value)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Trades</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!data?.trades.length ? (
              <p className="text-sm text-muted-foreground">No trades yet.</p>
            ) : (
              data.trades.map((t) => (
                <div key={t.id} className="flex justify-between text-sm">
                  <span className={t.side === "BUY" ? "text-emerald-400" : "text-rose-400"}>
                    {t.side} {t.asset}
                  </span>
                  <span className="text-muted-foreground">
                    {t.quantity.toFixed(4)} @ {formatUsd(t.price)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
