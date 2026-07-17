"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

export interface DebateSummary {
  id: string;
  asset: string;
  timeframeHours: number;
  creator: { walletAddress: string; displayName: string | null };
  creatorPosition: "BULLISH" | "BEARISH" | "NEUTRAL";
  thesis: string;
  challenger: { walletAddress: string; displayName: string | null } | null;
  challengerPosition: "BULLISH" | "BEARISH" | "NEUTRAL" | null;
  challengerThesis: string | null;
  startPrice: number;
  resolutionPrice: number | null;
  outcome: "PENDING" | "CREATOR_WON" | "CHALLENGER_WON" | "DRAW";
  createdAt: string;
  expiresAt: string;
  resolvedAt: string | null;
}

interface DebatesResponse {
  open: DebateSummary[];
  mine: DebateSummary[];
}

async function fetchDebates(): Promise<DebatesResponse> {
  const res = await fetch("/api/debates");
  if (!res.ok) return { open: [], mine: [] };
  return res.json();
}

export function useDebates(enabled: boolean) {
  const query = useQuery({ queryKey: ["debates"], queryFn: fetchDebates, enabled });
  return {
    open: query.data?.open ?? [],
    mine: query.data?.mine ?? [],
    isLoading: query.isLoading,
  };
}

export function useInvalidateDebates() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["debates"] });
}
