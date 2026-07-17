"use client";

import { use, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/use-current-user";
import { SKILL_KEYS, type SkillKey } from "@/lib/engines/progression";
import { getAchievement } from "@/lib/achievements";
import type { PlayerProfile } from "@/lib/types";

const SKILL_LABELS: Record<SkillKey, string> = {
  research: "Research",
  trading: "Trading",
  onchain: "On-chain",
  defi: "DeFi",
  riskManagement: "Risk Management",
  security: "Security",
};

function shortWallet(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

async function fetchProfile(wallet: string): Promise<PlayerProfile> {
  const res = await fetch(`/api/profile/${wallet}`);
  if (!res.ok) throw new Error("not_found");
  const data = await res.json();
  return data.user;
}

export default function ProfilePage({
  params,
}: {
  params: Promise<{ wallet: string }>;
}) {
  const { wallet } = use(params);
  const walletLower = wallet.toLowerCase();
  const { user: currentUser } = useCurrentUser();
  const queryClient = useQueryClient();
  const isOwnProfile = currentUser?.walletAddress === walletLower;

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ["profile", walletLower],
    queryFn: () => fetchProfile(walletLower),
  });

  const [editOpen, setEditOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  async function saveDisplayName() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      });
      if (!res.ok) throw new Error();
      toast.success("Profile updated");
      setEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ["profile", walletLower] });
      queryClient.invalidateQueries({ queryKey: ["session"] });
    } catch {
      toast.error("Couldn't update profile");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          This wallet hasn&apos;t connected to The Onboarding yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-white/10 bg-gradient-to-br from-violet-950/40 to-background">
        <CardContent className="flex flex-col gap-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Player Profile
            </p>
            <h1 className="mt-1 text-2xl font-bold">
              {profile.displayName ?? shortWallet(profile.walletAddress)}
            </h1>
            <p className="font-mono text-sm text-muted-foreground">
              {shortWallet(profile.walletAddress)}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary">Lv.{profile.level} · {profile.title}</Badge>
              <Badge variant="outline">{profile.archetype.label}</Badge>
              <Badge variant="outline">🔥 {profile.streakCount} day streak</Badge>
            </div>
          </div>

          {isOwnProfile && (
            <Button
              variant="outline"
              onClick={() => {
                setDisplayName(profile.displayName ?? "");
                setEditOpen(true);
              }}
            >
              Edit profile
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">XP</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{profile.xp}</p>
            <Progress
              value={profile.xpProgress.progressRatio * 100}
              className="mt-3"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {profile.xpProgress.isMaxLevel
                ? "Max level reached"
                : `${profile.xpProgress.xpIntoLevel} / ${profile.xpProgress.xpForThisLevel} XP to Lv.${profile.level + 1}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Quests Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{profile.questsCompleted ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{profile.achievementsCount ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {SKILL_KEYS.map((key) => (
            <div key={key}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{SKILL_LABELS[key]}</span>
                <span className="text-muted-foreground">{profile.skills[key]}</span>
              </div>
              <Progress value={Math.min(profile.skills[key], 100)} />
            </div>
          ))}
        </CardContent>
      </Card>

      {!!profile.achievements?.length && (
        <Card>
          <CardHeader>
            <CardTitle>Achievements</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {profile.achievements.map((id) => {
              const def = getAchievement(id);
              return (
                <Badge key={id} variant="outline" className="gap-1.5">
                  <span>{def?.emoji ?? "🏆"}</span>
                  {def?.label ?? id}
                </Badge>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={24}
              placeholder={shortWallet(profile.walletAddress)}
            />
          </div>
          <DialogFooter>
            <Button onClick={saveDisplayName} disabled={saving || !displayName.trim()}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
