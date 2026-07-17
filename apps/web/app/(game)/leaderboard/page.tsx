"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { PlayerProfile } from "@/lib/types";
import type { ArenaCategoryWinner, ArenaLeaderboardEntry } from "@/lib/engines/leaderboard";

function shortWallet(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

interface LeaderboardResponse {
  xp: PlayerProfile[];
  arena: { entries: ArenaLeaderboardEntry[]; categories: ArenaCategoryWinner[] };
}

async function fetchLeaderboard(): Promise<LeaderboardResponse> {
  const res = await fetch("/api/leaderboard");
  return res.json();
}

export default function LeaderboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: fetchLeaderboard,
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Leaderboard</p>
        <h1 className="text-2xl font-bold">Who&apos;s actually learning Web3?</h1>
      </div>

      <Tabs defaultValue="xp">
        <TabsList>
          <TabsTrigger value="xp">XP</TabsTrigger>
          <TabsTrigger value="arena">Arena</TabsTrigger>
        </TabsList>

        <TabsContent value="xp" className="mt-4 space-y-2">
          {isLoading || !data ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : data.xp.length === 0 ? (
            <p className="text-sm text-muted-foreground">No players yet — be the first.</p>
          ) : (
            data.xp.map((u, i) => (
              <Link
                key={u.walletAddress}
                href={`/profile/${u.walletAddress}`}
                className="flex items-center justify-between rounded-lg border border-white/10 px-4 py-3 hover:border-violet-500/50"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center text-sm text-muted-foreground">{i + 1}</span>
                  <div>
                    <p className="font-medium">{u.displayName ?? shortWallet(u.walletAddress)}</p>
                    <p className="text-xs text-muted-foreground">
                      Lv.{u.level} · {u.questsCompleted ?? 0} quests
                    </p>
                  </div>
                </div>
                <span className="font-medium text-violet-300">{u.xp} XP</span>
              </Link>
            ))
          )}
        </TabsContent>

        <TabsContent value="arena" className="mt-4 space-y-6">
          {isLoading || !data ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <>
              {data.arena.categories.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {data.arena.categories.map((c) => (
                    <Card key={c.key}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{c.emoji}</span> {c.label}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Link
                          href={`/profile/${c.walletAddress}`}
                          className="font-medium hover:text-violet-300"
                        >
                          {c.displayName ?? shortWallet(c.walletAddress)}
                        </Link>
                        <p className="text-sm text-muted-foreground">{c.value}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                {data.arena.entries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No trades yet — head to The Arena.</p>
                ) : (
                  data.arena.entries.map((e, i) => (
                    <Link
                      key={e.walletAddress}
                      href={`/profile/${e.walletAddress}`}
                      className="flex items-center justify-between rounded-lg border border-white/10 px-4 py-3 hover:border-violet-500/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 text-center text-sm text-muted-foreground">{i + 1}</span>
                        <span>{e.displayName ?? shortWallet(e.walletAddress)}</span>
                      </div>
                      <span className={e.roi >= 0 ? "text-emerald-400" : "text-rose-400"}>
                        {e.roi >= 0 ? "+" : ""}
                        {(e.roi * 100).toFixed(1)}%
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
