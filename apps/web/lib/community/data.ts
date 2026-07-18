export const MONAD_EXPLORER_CHALLENGE = {
  slug: "become-a-monad-explorer",
  title: "Become a Monad Explorer",
  emoji: "🧭",
  createdBy: "Monad Ecosystem Community",
  description:
    "Learn the fundamentals of Monad, prove you've engaged with the Academy, put a real transaction on Monad Testnet, and pass the final check.",
  requirements: [
    { id: "learn-monad", label: "Learn about Monad", detail: 'Complete the "Meet Monad" Academy mission' },
    { id: "five-quests", label: "Complete 5 questions", detail: "Finish 5 Academy missions total" },
    { id: "testnet-interaction", label: "Complete a testnet interaction", detail: "Record any achievement on-chain from your profile" },
    { id: "final-challenge", label: "Complete the final challenge", detail: "Answer the Monad Explorer question below" },
  ],
  rewards: { xp: 500, badge: "Monad Explorer Badge", communityPoints: 100 },
} as const;

export const FINAL_QUESTION = {
  prompt: "What makes Monad able to process transactions faster than a typical EVM chain?",
  options: [
    { id: "a", label: "It executes transactions in parallel instead of one at a time" },
    { id: "b", label: "It isn't EVM-compatible, so it skips normal validation" },
    { id: "c", label: "It has no gas fees at all" },
  ],
  correctOptionId: "a",
};
