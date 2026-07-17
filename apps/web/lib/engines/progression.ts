export const LEVEL_TITLES: { level: number; title: string }[] = [
  { level: 1, title: "Web3 Newbie" },
  { level: 5, title: "Crypto Explorer" },
  { level: 10, title: "DeFi Apprentice" },
  { level: 20, title: "On-chain Detective" },
  { level: 30, title: "Market Analyst" },
  { level: 50, title: "Web3 Veteran" },
];

const MAX_LEVEL = 50;

// XP required to advance from `level` to `level + 1`.
function xpRequiredForLevel(level: number): number {
  return 100 + (level - 1) * 40;
}

export function cumulativeXpForLevel(level: number): number {
  let total = 0;
  for (let l = 1; l < level; l++) total += xpRequiredForLevel(l);
  return total;
}

export function levelForXp(xp: number): number {
  let level = 1;
  while (level < MAX_LEVEL && xp >= cumulativeXpForLevel(level + 1)) {
    level++;
  }
  return level;
}

export function xpProgress(xp: number) {
  const level = levelForXp(xp);
  const currentLevelXp = cumulativeXpForLevel(level);
  const nextLevelXp =
    level >= MAX_LEVEL ? currentLevelXp : cumulativeXpForLevel(level + 1);
  const xpIntoLevel = xp - currentLevelXp;
  const xpForThisLevel = nextLevelXp - currentLevelXp;
  return {
    level,
    xpIntoLevel,
    xpForThisLevel,
    nextLevelXp,
    isMaxLevel: level >= MAX_LEVEL,
    progressRatio: xpForThisLevel > 0 ? xpIntoLevel / xpForThisLevel : 1,
  };
}

export function titleForLevel(level: number): string {
  let title = LEVEL_TITLES[0].title;
  for (const entry of LEVEL_TITLES) {
    if (level >= entry.level) title = entry.title;
  }
  return title;
}

export const SKILL_KEYS = [
  "research",
  "trading",
  "onchain",
  "defi",
  "riskManagement",
  "security",
] as const;
export type SkillKey = (typeof SKILL_KEYS)[number];
export type SkillMap = Record<SkillKey, number>;

const ARCHETYPES: Record<SkillKey, { key: string; label: string }> = {
  research: { key: "researcher", label: "The Researcher" },
  trading: { key: "trader", label: "The Trader" },
  onchain: { key: "detective", label: "The Detective" },
  defi: { key: "yield-farmer", label: "The Yield Farmer" },
  riskManagement: { key: "risk-manager", label: "The Risk Manager" },
  security: { key: "builder", label: "The Builder" },
};

export function dominantArchetype(skills: SkillMap): { key: string; label: string } {
  let best: SkillKey = "research";
  for (const k of SKILL_KEYS) {
    if (skills[k] > skills[best]) best = k;
  }
  const total = SKILL_KEYS.reduce((sum, k) => sum + skills[k], 0);
  if (total === 0) return { key: "newbie", label: "Web3 Newbie" };
  return ARCHETYPES[best];
}

export interface UserRecordLike {
  id: string;
  walletAddress: string;
  displayName: string | null;
  avatarUrl: string | null;
  xp: number;
  streakCount: number;
  skillResearch: number;
  skillTrading: number;
  skillOnchain: number;
  skillDefi: number;
  skillRiskManagement: number;
  skillSecurity: number;
}

export function toPlayerProfile(user: UserRecordLike) {
  const skills: SkillMap = {
    research: user.skillResearch,
    trading: user.skillTrading,
    onchain: user.skillOnchain,
    defi: user.skillDefi,
    riskManagement: user.skillRiskManagement,
    security: user.skillSecurity,
  };
  const progress = xpProgress(user.xp);
  return {
    id: user.id,
    walletAddress: user.walletAddress,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    xp: user.xp,
    streakCount: user.streakCount,
    skills,
    level: progress.level,
    title: titleForLevel(progress.level),
    xpProgress: progress,
    archetype: dominantArchetype(skills),
  };
}

/** Streak count as of `now`, given the previous streak and last-active date. */
export function computeStreak(
  currentStreak: number,
  lastActiveAt: Date | null,
  now: Date = new Date(),
): number {
  if (!lastActiveAt) return 1;
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const daysDiff = Math.round(
    (startOfDay(now) - startOfDay(lastActiveAt)) / 86_400_000,
  );
  if (daysDiff <= 0) return currentStreak || 1;
  if (daysDiff === 1) return (currentStreak || 0) + 1;
  return 1;
}
