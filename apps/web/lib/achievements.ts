export interface AchievementDef {
  id: string;
  label: string;
  emoji: string;
  description: string;
  /** Flagship achievements get an on-chain badge NFT; the rest are recorded in the registry only. */
  isFlagship?: boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "wallet-apprentice",
    label: "Wallet Apprentice",
    emoji: "👛",
    description: "Completed your first Academy fundamentals mission.",
  },
  {
    id: "first-swap",
    label: "First Swap",
    emoji: "🔁",
    description: "Executed your first simulated trade in The Arena.",
    isFlagship: true,
  },
  {
    id: "defi-explorer",
    label: "DeFi Explorer",
    emoji: "🌊",
    description: "Learned how liquidity pools and impermanent loss work.",
  },
  {
    id: "risk-manager",
    label: "Risk Manager",
    emoji: "🛡️",
    description: "Survived a simulated market crash with a plan.",
  },
  {
    id: "rug-pull-survivor",
    label: "Rug Pull Survivor",
    emoji: "🚩",
    description: "Correctly identified a dangerous token unlock schedule.",
  },
  {
    id: "monad-pioneer",
    label: "Monad Pioneer",
    emoji: "⚡",
    description: "Learned what makes Monad different from other chains.",
    isFlagship: true,
  },
  {
    id: "on-chain-detective",
    label: "On-chain Detective",
    emoji: "🕵️",
    description: "Solved a wallet investigation case in the Investigation Room.",
  },
  {
    id: "monad-explorer",
    label: "Monad Explorer",
    emoji: "🧭",
    description: "Completed the Monad Ecosystem community challenge.",
  },
  {
    id: "debate-champion",
    label: "Debate Champion",
    emoji: "⚔️",
    description: "Won your first Trade Debate against another wallet.",
    isFlagship: true,
  },
];

export function getAchievement(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
