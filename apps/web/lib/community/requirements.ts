import { prisma } from "@/lib/db";

export interface RequirementStatus {
  learnMonad: boolean;
  fiveQuests: boolean;
  testnetInteraction: boolean;
}

export async function checkRequirements(userId: string): Promise<RequirementStatus> {
  const [learnMonad, completedQuestCount, onChainAchievementCount] = await Promise.all([
    prisma.questProgress.findUnique({
      where: { userId_questId: { userId, questId: "meet-monad" } },
    }),
    prisma.questProgress.count({ where: { userId, status: "COMPLETED" } }),
    prisma.achievement.count({ where: { userId, NOT: { txHash: null } } }),
  ]);

  return {
    learnMonad: learnMonad?.status === "COMPLETED",
    fiveQuests: completedQuestCount >= 5,
    testnetInteraction: onChainAchievementCount >= 1,
  };
}
