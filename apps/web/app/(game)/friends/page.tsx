"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useFriends, useInvalidateFriends } from "@/hooks/use-friends";
import type { PlayerProfile } from "@/lib/types";

function shortWallet(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function FriendRow({ user }: { user: PlayerProfile }) {
  return (
    <Link
      href={`/profile/${user.walletAddress}`}
      className="flex items-center justify-between rounded-lg border border-white/10 px-4 py-3 hover:border-violet-500/50"
    >
      <div>
        <p className="font-medium">{user.displayName ?? shortWallet(user.walletAddress)}</p>
        <p className="text-xs text-muted-foreground">Lv.{user.level} · {user.title}</p>
      </div>
      <div className="text-right text-sm">
        <p className="text-violet-300">{user.xp} XP</p>
        <p className="text-xs text-muted-foreground">{user.questsCompleted ?? 0} quests</p>
      </div>
    </Link>
  );
}

export default function FriendsPage() {
  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const { accepted, incomingPending, outgoingPending } = useFriends(isAuthenticated);
  const invalidate = useInvalidateFriends();
  const [wallet, setWallet] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) return null;

  if (!user) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-muted-foreground">
            Connect your wallet to add friends and compare progress.
          </p>
          <ConnectButton />
        </CardContent>
      </Card>
    );
  }

  async function sendRequest() {
    if (!wallet.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: wallet.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.replaceAll("_", " ") ?? "Couldn't send request");
        return;
      }
      toast.success(data.status === "accepted" ? "You're now friends!" : "Friend request sent");
      setWallet("");
      invalidate();
    } catch {
      toast.error("Couldn't send request");
    } finally {
      setSubmitting(false);
    }
  }

  async function acceptRequest(friendshipId: string) {
    const res = await fetch(`/api/friends/${friendshipId}/accept`, { method: "POST" });
    if (res.ok) {
      toast.success("Friend request accepted");
      invalidate();
    } else {
      toast.error("Couldn't accept request");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Friends</p>
        <h1 className="text-2xl font-bold">Learn Web3 with people, not alone.</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Add a friend by wallet address</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            placeholder="0x..."
          />
          <Button disabled={submitting} onClick={sendRequest}>
            Send request
          </Button>
        </CardContent>
      </Card>

      {incomingPending.length > 0 && (
        <div>
          <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">
            Pending requests
          </p>
          <div className="space-y-2">
            {incomingPending.map((p) => (
              <div
                key={p.friendshipId}
                className="flex items-center justify-between rounded-lg border border-white/10 px-4 py-3"
              >
                <span>{p.user.displayName ?? shortWallet(p.user.walletAddress)}</span>
                <Button size="sm" onClick={() => acceptRequest(p.friendshipId)}>
                  Accept
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">
          Your friends ({accepted.length})
        </p>
        {accepted.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No friends yet — invite someone by wallet address above.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {accepted.map((f) => (
              <FriendRow key={f.walletAddress} user={f} />
            ))}
          </div>
        )}
      </div>

      {outgoingPending.length > 0 && (
        <div>
          <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">
            Sent requests
          </p>
          <div className="flex flex-wrap gap-2">
            {outgoingPending.map((p) => (
              <Badge key={p.friendshipId} variant="outline">
                {p.user.displayName ?? shortWallet(p.user.walletAddress)} · pending
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
