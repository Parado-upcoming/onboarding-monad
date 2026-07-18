import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { MONAD_EXPLORER_CHALLENGE } from "@/lib/community/data";

export default function CommunityCreatorPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Creator Dashboard
        </p>
        <h1 className="text-2xl font-bold">How communities build challenges</h1>
        <p className="mt-2 text-muted-foreground">
          Any Web3 community, protocol, or DAO can define a challenge as a small set of
          requirements and rewards — the same structure quests use internally. Here&apos;s the
          config behind the live &quot;{MONAD_EXPLORER_CHALLENGE.title}&quot; challenge as an
          example of what a community submits.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{MONAD_EXPLORER_CHALLENGE.emoji} {MONAD_EXPLORER_CHALLENGE.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Created by</p>
            <p className="text-sm">{MONAD_EXPLORER_CHALLENGE.createdBy}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Requirements
            </p>
            <ol className="mt-2 space-y-2">
              {MONAD_EXPLORER_CHALLENGE.requirements.map((req, i) => (
                <li key={req.id} className="text-sm">
                  <span className="text-muted-foreground">{i + 1}.</span> {req.label}
                  <span className="text-muted-foreground"> — {req.detail}</span>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Rewards</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline">+{MONAD_EXPLORER_CHALLENGE.rewards.xp} XP</Badge>
              <Badge variant="outline">🏅 {MONAD_EXPLORER_CHALLENGE.rewards.badge}</Badge>
              <Badge variant="outline">
                {MONAD_EXPLORER_CHALLENGE.rewards.communityPoints} Community Points
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          The full creator dashboard (self-serve challenge builder, custom quizzes, NFT/token
          reward configuration, completion analytics) is on the roadmap post-hackathon. For now,
          every community challenge follows this same requirements + rewards shape, which is what
          makes it easy to add new ones without changing the app.
        </CardContent>
      </Card>

      <Link href="/community" className={buttonVariants({ variant: "outline" })}>
        Back to Community Challenges
      </Link>
    </div>
  );
}
