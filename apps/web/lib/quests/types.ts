import type { SkillMap } from "@/lib/engines/progression";

export type QuestCategory = "academy" | "arena" | "investigation" | "lab" | "social";
export type QuestDifficulty = "beginner" | "intermediate" | "advanced";

export interface QuestOption {
  id: string;
  label: string;
  /** Shown after selecting, for "decision" steps where every choice has a distinct consequence. */
  outcome?: string;
}

export interface QuestStep {
  id: string;
  type: "lesson" | "quiz" | "decision";
  prompt: string;
  /** Short lesson copy shown above the prompt. Keep it brief — no walls of text. */
  body?: string;
  options?: QuestOption[];
  /** For "quiz" steps: the option id that's correct. */
  correctOptionId?: string;
  /** For "quiz" steps: shown after answering, regardless of which option was picked. */
  explanation?: string;
}

export interface Quest {
  id: string;
  title: string;
  emoji: string;
  description: string;
  category: QuestCategory;
  difficulty: QuestDifficulty;
  steps: QuestStep[];
  xpReward: number;
  skillReward: Partial<SkillMap>;
  achievementId?: string;
}
