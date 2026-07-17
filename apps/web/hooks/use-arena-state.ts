"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { AssetSymbol } from "@/lib/engines/trading-engine";

export interface ArenaState {
  cashBalance: number;
  prices: Record<AssetSymbol, number>;
  stats: {
    portfolioValue: number;
    roi: number;
    totalTrades: number;
    winRate: number | null;
    avgHoldingHours: number | null;
    maxDrawdownPct: number;
    holdings: { asset: string; quantity: number; value: number; avgCost: number }[];
  };
  trades: {
    id: string;
    asset: string;
    side: "BUY" | "SELL";
    quantity: number;
    price: number;
    createdAt: string;
  }[];
  chart: { asset: AssetSymbol; series: { time: number; price: number }[] };
  assets: { symbol: AssetSymbol; name: string; basePrice: number; volatility: number }[];
}

async function fetchArenaState(asset: AssetSymbol): Promise<ArenaState> {
  const res = await fetch(`/api/arena/state?asset=${asset}`);
  if (!res.ok) throw new Error("failed to load arena state");
  return res.json();
}

export function useArenaState(asset: AssetSymbol, enabled: boolean) {
  const query = useQuery({
    queryKey: ["arena-state", asset],
    queryFn: () => fetchArenaState(asset),
    enabled,
    refetchInterval: 15_000,
  });
  return query;
}

export function useInvalidateArenaState() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["arena-state"] });
    queryClient.invalidateQueries({ queryKey: ["session"] });
  };
}
