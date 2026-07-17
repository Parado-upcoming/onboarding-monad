"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getQuestById } from "@/lib/quests/data";
import { useInvalidateQuestProgress } from "@/hooks/use-quest-progress";
import { cn } from "@/lib/utils";

export default function QuestPlayerPage({
  params,
}: {
  params: Promise<{ questId: string }>;
}) {
  const { questId } = use(params);
  const quest = useMemo(() => getQuestById(questId), [questId]);
  const router = useRouter();
  const invalidateProgress = useInvalidateQuestProgress();

  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    xpAwarded: number;
    correctCount: number;
    scoredSteps: number;
    achievementId: string | null;
  } | null>(null);

  if (!quest) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-muted-foreground">
          Mission not found.
        </CardContent>
      </Card>
    );
  }

  const step = quest.steps[stepIndex];
  const isLastStep = stepIndex === quest.steps.length - 1;
  const selectedOptionId = answers[step.id];

  async function handleComplete() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/quests/${quest!.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      invalidateProgress();
      if (data.alreadyCompleted) {
        setResult({ xpAwarded: 0, correctCount: 0, scoredSteps: 0, achievementId: null });
      } else {
        setResult({
          xpAwarded: data.xpAwarded,
          correctCount: data.score.correctCount,
          scoredSteps: data.score.scoredSteps,
          achievementId: data.achievementId,
        });
        toast.success(`+${data.xpAwarded} XP earned`);
        if (data.achievementId) {
          toast.success(`🏆 Achievement unlocked: ${data.achievementId}`);
        }
      }
    } catch {
      toast.error("Couldn't save your progress. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function selectOption(optionId: string) {
    setAnswers((prev) => ({ ...prev, [step.id]: optionId }));
    setRevealed(true);
  }

  function advance() {
    setRevealed(false);
    if (isLastStep) {
      handleComplete();
    } else {
      setStepIndex((i) => i + 1);
    }
  }

  if (result) {
    return (
      <div className="mx-auto max-w-lg space-y-6 text-center">
        <p className="text-5xl">{quest.emoji}</p>
        <h1 className="text-2xl font-bold">Mission complete</h1>
        {result.xpAwarded > 0 ? (
          <>
            <p className="text-violet-300 text-lg font-semibold">+{result.xpAwarded} XP</p>
            {result.scoredSteps > 0 && (
              <p className="text-sm text-muted-foreground">
                {result.correctCount} / {result.scoredSteps} correct
              </p>
            )}
            {result.achievementId && (
              <Badge className="mx-auto">🏆 Achievement unlocked</Badge>
            )}
          </>
        ) : (
          <p className="text-muted-foreground">You&apos;ve already completed this mission.</p>
        )}
        <div className="flex justify-center gap-3 pt-4">
          <Link href="/academy" className={buttonVariants({ variant: "outline" })}>
            Back to Academy
          </Link>
          <Button onClick={() => router.push("/dashboard")}>Next mission</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{quest.title}</span>
          <span>
            Step {stepIndex + 1} / {quest.steps.length}
          </span>
        </div>
        <Progress value={((stepIndex + (revealed ? 1 : 0)) / quest.steps.length) * 100} />
      </div>

      <Card>
        <CardContent className="space-y-4 py-6">
          {step.body && (
            <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
          )}
          <h2 className="text-lg font-semibold">{step.prompt}</h2>

          {step.type === "lesson" ? (
            <Button className="w-full" onClick={advance}>
              Continue
            </Button>
          ) : (
            <div className="space-y-2">
              {step.options?.map((option) => {
                const isSelected = selectedOptionId === option.id;
                const isCorrect = step.correctOptionId === option.id;
                return (
                  <button
                    key={option.id}
                    disabled={revealed}
                    onClick={() => selectOption(option.id)}
                    className={cn(
                      "w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                      !revealed && "border-white/10 hover:border-violet-500/50 hover:bg-violet-950/20",
                      revealed && isSelected && step.type === "quiz" && isCorrect &&
                        "border-emerald-500 bg-emerald-950/30",
                      revealed && isSelected && step.type === "quiz" && !isCorrect &&
                        "border-rose-500 bg-rose-950/30",
                      revealed && isSelected && step.type === "decision" &&
                        "border-violet-500 bg-violet-950/30",
                      revealed && !isSelected && "border-white/5 opacity-50",
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}

              {revealed && (
                <div className="space-y-3 pt-2">
                  <p className="text-sm text-muted-foreground">
                    {step.type === "decision"
                      ? step.options?.find((o) => o.id === selectedOptionId)?.outcome
                      : step.explanation}
                  </p>
                  <Button className="w-full" onClick={advance} disabled={submitting}>
                    {submitting ? "Saving..." : isLastStep ? "Claim reward" : "Continue"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
