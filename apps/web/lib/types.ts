import type { SkillMap } from "@/lib/engines/progression";

export interface PlayerProfile {
  id: string;
  walletAddress: string;
  displayName: string | null;
  avatarUrl: string | null;
  xp: number;
  streakCount: number;
  skills: SkillMap;
  level: number;
  title: string;
  xpProgress: {
    level: number;
    xpIntoLevel: number;
    xpForThisLevel: number;
    nextLevelXp: number;
    isMaxLevel: boolean;
    progressRatio: number;
  };
  archetype: { key: string; label: string };
  questsCompleted?: number;
  achievementsCount?: number;
  achievements?: { achievementId: string; txHash: string | null }[];
}

export interface SessionResponse {
  authenticated: boolean;
  user?: PlayerProfile;
}
