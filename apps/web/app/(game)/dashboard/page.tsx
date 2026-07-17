"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Card, CardContent } from "@/components/ui/card";
import { useCurrentUser } from "@/hooks/use-current-user";

export default function DashboardPage() {
  const { user, isLoading } = useCurrentUser();

  if (isLoading) return null;

  if (!user) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-muted-foreground">
            Connect and sign in with your wallet to start your first mission.
          </p>
          <ConnectButton />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Welcome back, {user.displayName ?? "player"}.
      </p>
      <h1 className="text-2xl font-bold">🔥 {user.streakCount} day streak</h1>
      <p className="text-muted-foreground">
        The Academy, Arena, and the rest of your journey land here next.
      </p>
    </div>
  );
}
