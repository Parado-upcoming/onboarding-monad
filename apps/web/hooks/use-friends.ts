"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { PlayerProfile } from "@/lib/types";

interface FriendsResponse {
  accepted: PlayerProfile[];
  incomingPending: { friendshipId: string; user: PlayerProfile }[];
  outgoingPending: { friendshipId: string; user: PlayerProfile }[];
}

async function fetchFriends(): Promise<FriendsResponse> {
  const res = await fetch("/api/friends");
  if (!res.ok) return { accepted: [], incomingPending: [], outgoingPending: [] };
  return res.json();
}

export function useFriends(enabled: boolean) {
  const query = useQuery({ queryKey: ["friends"], queryFn: fetchFriends, enabled });
  return {
    accepted: query.data?.accepted ?? [],
    incomingPending: query.data?.incomingPending ?? [],
    outgoingPending: query.data?.outgoingPending ?? [],
    isLoading: query.isLoading,
  };
}

export function useInvalidateFriends() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["friends"] });
}
