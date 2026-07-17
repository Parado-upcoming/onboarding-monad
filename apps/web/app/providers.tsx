"use client";

import { useEffect, useState, type ReactNode } from "react";
import { WagmiProvider, useAccount } from "wagmi";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import {
  RainbowKitProvider,
  RainbowKitAuthenticationProvider,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import type { AuthenticationStatus } from "@rainbow-me/rainbowkit";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { wagmiConfig, monadTestnet } from "@/lib/chain/config";
import { siweAuthAdapter } from "@/lib/siwe-adapter";
import type { SessionResponse } from "@/lib/types";

async function fetchSession(): Promise<SessionResponse> {
  const res = await fetch("/api/auth/session");
  return res.json();
}

function AuthStatusBridge({ children }: { children: ReactNode }) {
  const { isDisconnected } = useAccount();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["session"],
    queryFn: fetchSession,
    staleTime: 30_000,
  });

  const status: AuthenticationStatus = isLoading
    ? "loading"
    : data?.authenticated
      ? "authenticated"
      : "unauthenticated";

  // If the wallet disconnects, the session cookie is stale from the app's
  // point of view even though the API hasn't been told — force a re-check.
  useEffect(() => {
    if (isDisconnected) refetch();
  }, [isDisconnected, refetch]);

  return (
    <RainbowKitAuthenticationProvider adapter={siweAuthAdapter} status={status}>
      <RainbowKitProvider
        initialChain={monadTestnet}
        theme={darkTheme({ accentColor: "#7C3AED", borderRadius: "medium" })}
      >
        {children}
      </RainbowKitProvider>
    </RainbowKitAuthenticationProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AuthStatusBridge>
          <TooltipProvider>
            {children}
            <Toaster richColors position="top-right" />
          </TooltipProvider>
        </AuthStatusBridge>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
