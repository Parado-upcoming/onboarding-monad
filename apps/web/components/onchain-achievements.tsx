"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAchievement } from "@/lib/achievements";
import { badgeTypeFor } from "@/lib/chain/badges";
import {
  ACHIEVEMENT_REGISTRY_ADDRESS,
  ONBOARDING_BADGE_ADDRESS,
  achievementRegistryAbi,
  onboardingBadgeAbi,
  achievementIdToBytes32,
} from "@/lib/chain/contracts";

interface AchievementRecord {
  achievementId: string;
  unlockedAt: string;
  txHash: string | null;
  tokenId: string | null;
}

async function fetchMyAchievements(): Promise<AchievementRecord[]> {
  const res = await fetch("/api/achievements/mine");
  if (!res.ok) return [];
  const data = await res.json();
  return data.achievements;
}

function RecordRow({ achievement }: { achievement: AchievementRecord }) {
  const def = getAchievement(achievement.achievementId);
  const badgeType = badgeTypeFor(achievement.achievementId);
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();

  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess && hash) {
      fetch(`/api/achievements/${achievement.achievementId}/record`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash: hash }),
      }).then(() => {
        toast.success("Recorded on-chain");
        queryClient.invalidateQueries({ queryKey: ["my-achievements"] });
        reset();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, hash]);

  if (!ACHIEVEMENT_REGISTRY_ADDRESS) return null;

  function record() {
    if (badgeType !== undefined && ONBOARDING_BADGE_ADDRESS) {
      writeContract({
        address: ONBOARDING_BADGE_ADDRESS,
        abi: onboardingBadgeAbi,
        functionName: "mint",
        args: [BigInt(badgeType)],
      });
    } else {
      writeContract({
        address: ACHIEVEMENT_REGISTRY_ADDRESS!,
        abi: achievementRegistryAbi,
        functionName: "unlock",
        args: [achievementIdToBytes32(achievement.achievementId)],
      });
    }
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 px-4 py-3">
      <div className="flex items-center gap-2">
        <span>{def?.emoji ?? "🏆"}</span>
        <div>
          <p className="text-sm font-medium">{def?.label ?? achievement.achievementId}</p>
          {badgeType !== undefined && (
            <p className="text-xs text-violet-300">Mints a badge NFT</p>
          )}
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        disabled={!isConnected || address === undefined || isPending || isConfirming}
        onClick={record}
      >
        {isPending || isConfirming ? "Confirm in wallet..." : "Record on-chain"}
      </Button>
    </div>
  );
}

export function OnchainAchievements() {
  const { data } = useQuery({ queryKey: ["my-achievements"], queryFn: fetchMyAchievements });

  const pending = (data ?? []).filter((a) => !a.txHash);
  if (!ACHIEVEMENT_REGISTRY_ADDRESS || pending.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Proof of Learning</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Record these achievements on Monad Testnet — a permanent, wallet-signed history you can
          point to.
        </p>
        {pending.map((a) => (
          <RecordRow key={a.achievementId} achievement={a} />
        ))}
      </CardContent>
    </Card>
  );
}
