import type { InvestigationCase } from "./types";

export const CASES: InvestigationCase[] = [
  {
    id: "case-001",
    title: "Case #001: The Quick Turnaround",
    emoji: "🕵️",
    briefing: "A wallet received 500 MON. What happened next tells you everything.",
    walletLabel: "0x7a3f...91c2",
    events: [
      "Received 500 MON from an exchange deposit address",
      "Deposited 480 MON into a lending protocol as collateral",
      "Borrowed a stablecoin against that collateral",
      "Swapped the stablecoin for a newly-launched token",
      "Staked the new token in that token's own liquidity pool",
      "Claimed reward tokens from the pool three times over the following week",
    ],
    correctConclusion: "FARMING",
    explanation:
      "Collateral → borrow → swap → stake → repeated reward claims is the fingerprint of yield farming: using capital efficiently to chase protocol rewards, not just holding or dumping.",
    xpReward: 180,
    difficulty: "intermediate",
  },
  {
    id: "case-002",
    title: "Case #002: The Slow Build",
    emoji: "📥",
    briefing: "This wallet has been quiet for months, except for one recurring pattern.",
    walletLabel: "0x4c1e...0a77",
    events: [
      "Bought 50 MON on day 1",
      "Bought 45 MON on day 8",
      "Bought 60 MON on day 15",
      "Bought 55 MON on day 23",
      "No sell transactions in 90 days of history",
      "No transfers out to other wallets",
    ],
    correctConclusion: "ACCUMULATING",
    explanation:
      "Regular, similarly-sized buys with zero sells and zero outbound transfers is textbook accumulation — someone dollar-cost-averaging into a position they intend to hold.",
    xpReward: 150,
    difficulty: "beginner",
  },
  {
    id: "case-003",
    title: "Case #003: The Fast Exit",
    emoji: "🚪",
    briefing: "A wallet received a large token allocation. It didn't stick around.",
    walletLabel: "0x9f22...b4d1",
    events: [
      "Received 2,000,000 tokens directly from the project's deployer address",
      "Sold 400,000 tokens on one DEX within 10 minutes",
      "Sold 600,000 more tokens on a second DEX 20 minutes later",
      "Bridged remaining proceeds to another chain within the hour",
      "No further activity on this wallet since",
    ],
    correctConclusion: "SELLING",
    explanation:
      "A deployer-sourced allocation liquidated across multiple venues within an hour, followed by silence, is the classic insider/team-dump pattern — the wallet was never planning to hold.",
    xpReward: 180,
    difficulty: "intermediate",
  },
  {
    id: "case-004",
    title: "Case #004: The Cold Trail",
    emoji: "❓",
    briefing: "Sometimes the data just isn't enough to draw a conclusion. Can you tell when to say so?",
    walletLabel: "0x1b88...ee40",
    events: [
      "Received 12 MON from a centralized exchange six months ago",
      "One single swap of 5 MON for a stablecoin the same day",
      "No activity since",
    ],
    correctConclusion: "UNCLEAR",
    explanation:
      "Three data points and no repeated pattern isn't enough to call accumulation, selling, or farming. Recognizing when there's genuinely not enough signal is itself a core on-chain analysis skill — guessing confidently on thin data is how bad conclusions happen.",
    xpReward: 150,
    difficulty: "beginner",
  },
  {
    id: "case-005",
    title: "Case #005: The Pool Hopper",
    emoji: "🌾",
    briefing: "This wallet touches a lot of protocols. Follow the money.",
    walletLabel: "0xd60a...7f19",
    events: [
      "Deposited equal value of two assets into a liquidity pool",
      "Withdrew from that pool nine days later",
      "Immediately deposited into a different, higher-yield pool",
      "Claimed and re-staked reward tokens twice in the following two weeks",
      "Repeated the pool-hop pattern into a third protocol",
    ],
    correctConclusion: "FARMING",
    explanation:
      "Constant pool-hopping chasing the highest yield, with rewards claimed and re-staked rather than sold, is a wallet actively yield farming across protocols rather than accumulating or distributing a position.",
    xpReward: 180,
    difficulty: "advanced",
  },
];

export function getCaseById(id: string): InvestigationCase | undefined {
  return CASES.find((c) => c.id === id);
}
