import { stringToHex } from "viem";

export const ACHIEVEMENT_REGISTRY_ADDRESS = process.env
  .NEXT_PUBLIC_ACHIEVEMENT_REGISTRY_ADDRESS as `0x${string}` | undefined;

export const ONBOARDING_BADGE_ADDRESS = process.env
  .NEXT_PUBLIC_ONBOARDING_BADGE_ADDRESS as `0x${string}` | undefined;

export const achievementRegistryAbi = [
  {
    type: "function",
    name: "unlock",
    stateMutability: "nonpayable",
    inputs: [{ name: "achievementId", type: "bytes32" }],
    outputs: [],
  },
  {
    type: "function",
    name: "hasUnlocked",
    stateMutability: "view",
    inputs: [
      { name: "wallet", type: "address" },
      { name: "achievementId", type: "bytes32" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const;

export const onboardingBadgeAbi = [
  {
    type: "function",
    name: "mint",
    stateMutability: "nonpayable",
    inputs: [{ name: "badgeType", type: "uint256" }],
    outputs: [{ name: "tokenId", type: "uint256" }],
  },
  {
    type: "function",
    name: "claimed",
    stateMutability: "view",
    inputs: [
      { name: "wallet", type: "address" },
      { name: "badgeType", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const;

/** Achievement ids are short kebab-case slugs, so they fit directly in bytes32 -- human-readable on the explorer, no hashing needed. */
export function achievementIdToBytes32(id: string): `0x${string}` {
  return stringToHex(id, { size: 32 });
}
