"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Card, CardContent } from "@/components/ui/card";
import { useCurrentUser } from "@/hooks/use-current-user";

export default function MyProfileRedirect() {
  const router = useRouter();
  const { user, isLoading } = useCurrentUser();

  useEffect(() => {
    if (user) router.replace(`/profile/${user.walletAddress}`);
  }, [user, router]);

  if (isLoading) return null;

  if (!user) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-muted-foreground">
            Connect and sign in with your wallet to see your profile.
          </p>
          <ConnectButton />
        </CardContent>
      </Card>
    );
  }

  return null;
}
