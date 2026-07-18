export type Conclusion = "ACCUMULATING" | "SELLING" | "FARMING" | "UNCLEAR";

export interface InvestigationCase {
  id: string;
  title: string;
  emoji: string;
  briefing: string;
  walletLabel: string;
  events: string[];
  correctConclusion: Conclusion;
  explanation: string;
  xpReward: number;
  difficulty: "beginner" | "intermediate" | "advanced";
}
