"use client";

import { useQuery } from "@tanstack/react-query";
import type { SessionResponse } from "@/lib/types";

async function fetchSession(): Promise<SessionResponse> {
  const res = await fetch("/api/auth/session");
  return res.json();
}

export function useCurrentUser() {
  const query = useQuery({
    queryKey: ["session"],
    queryFn: fetchSession,
    staleTime: 30_000,
  });

  return {
    user: query.data?.authenticated ? query.data.user : undefined,
    isAuthenticated: !!query.data?.authenticated,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
