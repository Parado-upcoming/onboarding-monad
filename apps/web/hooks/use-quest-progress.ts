"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

export interface QuestProgressEntry {
  questId: string;
  status: "IN_PROGRESS" | "COMPLETED";
  xpAwarded: number;
  completedAt: string | null;
}

interface QuestProgressResponse {
  progress: QuestProgressEntry[];
  nextMissionId: string | null;
}

async function fetchQuestProgress(): Promise<QuestProgressResponse> {
  const res = await fetch("/api/quests/progress");
  if (!res.ok) return { progress: [], nextMissionId: null };
  return res.json();
}

export function useQuestProgress(enabled: boolean) {
  const query = useQuery({
    queryKey: ["quest-progress"],
    queryFn: fetchQuestProgress,
    enabled,
  });

  return {
    progress: query.data?.progress ?? [],
    nextMissionId: query.data?.nextMissionId ?? null,
    isLoading: query.isLoading,
  };
}

export function useInvalidateQuestProgress() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["quest-progress"] });
    queryClient.invalidateQueries({ queryKey: ["session"] });
  };
}
