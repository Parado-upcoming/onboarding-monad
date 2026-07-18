"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCaseById } from "@/lib/investigation/cases";
import type { Conclusion } from "@/lib/investigation/types";
import { useQueryClient } from "@tanstack/react-query";

const CONCLUSIONS: { value: Conclusion; label: string }[] = [
  { value: "ACCUMULATING", label: "Accumulating" },
  { value: "SELLING", label: "Selling" },
  { value: "FARMING", label: "Farming" },
  { value: "UNCLEAR", label: "Unclear" },
];

export default function CaseDetailPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = use(params);
  const investigationCase = getCaseById(caseId);
  const queryClient = useQueryClient();
  const startedAt = useRef<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    correct: boolean;
    xpAwarded: number;
    correctConclusion: Conclusion;
    explanation: string;
    achievementId: string | null;
  } | null>(null);

  useEffect(() => {
    startedAt.current = Date.now();
  }, [caseId]);

  if (!investigationCase) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-muted-foreground">
          Case not found.
        </CardContent>
      </Card>
    );
  }

  async function submit(conclusion: Conclusion) {
    setSubmitting(true);
    try {
      const timeTakenSeconds = Math.round((Date.now() - startedAt.current) / 1000);
      const res = await fetch(`/api/investigation/${caseId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conclusion, timeTakenSeconds }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Couldn't submit your conclusion");
        return;
      }
      if (data.alreadyAttempted) {
        toast.info("You already investigated this case");
        return;
      }
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["investigation-progress"] });
      queryClient.invalidateQueries({ queryKey: ["session"] });
      if (data.correct) {
        toast.success(`+${data.xpAwarded} XP — correct!`);
        if (data.achievementId) toast.success("🏆 Achievement unlocked: On-chain Detective");
      } else {
        toast.error("Not quite — see the explanation below.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <div className="text-center">
          <p className="text-5xl">{result.correct ? "✅" : "❌"}</p>
          <h1 className="mt-2 text-2xl font-bold">
            {result.correct ? "Case solved" : "Not quite"}
          </h1>
          <p className="mt-1 text-violet-300">+{result.xpAwarded} XP</p>
          {result.achievementId && <Badge className="mt-2">🏆 On-chain Detective</Badge>}
        </div>
        <Card>
          <CardContent className="space-y-2 py-5">
            <p className="text-sm font-medium">
              Correct conclusion: {result.correctConclusion}
            </p>
            <p className="text-sm text-muted-foreground">{result.explanation}</p>
          </CardContent>
        </Card>
        <div className="flex justify-center">
          <Link href="/investigation" className={buttonVariants()}>
            Back to Investigation Room
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          {investigationCase.walletLabel}
        </p>
        <h1 className="text-2xl font-bold">{investigationCase.title}</h1>
        <p className="mt-1 text-muted-foreground">{investigationCase.briefing}</p>
      </div>

      <Card>
        <CardContent className="space-y-2 py-5">
          <p className="text-sm font-medium text-muted-foreground">Wallet activity</p>
          <ol className="space-y-1.5 text-sm">
            {investigationCase.events.map((event, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-muted-foreground">{i + 1}.</span>
                {event}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <div>
        <p className="mb-2 text-sm font-medium">What is this wallet doing?</p>
        <div className="grid grid-cols-2 gap-2">
          {CONCLUSIONS.map((c) => (
            <Button
              key={c.value}
              variant="outline"
              disabled={submitting}
              onClick={() => submit(c.value)}
            >
              {c.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
