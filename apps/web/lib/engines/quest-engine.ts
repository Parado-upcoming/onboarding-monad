import { QUESTS, getQuestById } from "@/lib/quests/data";
import type { Quest } from "@/lib/quests/types";

export interface QuestAnswers {
  [stepId: string]: string;
}

export interface QuestScoreResult {
  correctCount: number;
  scoredSteps: number;
  allCorrect: boolean;
}

export function scoreQuestAnswers(quest: Quest, answers: QuestAnswers): QuestScoreResult {
  const scorableSteps = quest.steps.filter((s) => s.correctOptionId);
  let correctCount = 0;
  for (const step of scorableSteps) {
    if (answers[step.id] === step.correctOptionId) correctCount++;
  }
  return {
    correctCount,
    scoredSteps: scorableSteps.length,
    allCorrect: correctCount === scorableSteps.length,
  };
}

/** The single highlighted "next mission" — first quest not yet completed, in defined order. */
export function nextMissionFor(completedQuestIds: string[]): Quest | undefined {
  const completed = new Set(completedQuestIds);
  return QUESTS.find((q) => !completed.has(q.id));
}

export { QUESTS, getQuestById };
