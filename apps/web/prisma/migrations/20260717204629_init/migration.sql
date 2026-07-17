-- CreateEnum
CREATE TYPE "QuestStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "FriendshipStatus" AS ENUM ('PENDING', 'ACCEPTED');

-- CreateEnum
CREATE TYPE "DebatePosition" AS ENUM ('BULLISH', 'BEARISH', 'NEUTRAL');

-- CreateEnum
CREATE TYPE "DebateOutcome" AS ENUM ('PENDING', 'CREATOR_WON', 'CHALLENGER_WON', 'DRAW');

-- CreateEnum
CREATE TYPE "TradeSide" AS ENUM ('BUY', 'SELL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "skillResearch" INTEGER NOT NULL DEFAULT 0,
    "skillTrading" INTEGER NOT NULL DEFAULT 0,
    "skillOnchain" INTEGER NOT NULL DEFAULT 0,
    "skillDefi" INTEGER NOT NULL DEFAULT 0,
    "skillRiskManagement" INTEGER NOT NULL DEFAULT 0,
    "skillSecurity" INTEGER NOT NULL DEFAULT 0,
    "streakCount" INTEGER NOT NULL DEFAULT 0,
    "lastActiveAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "status" "QuestStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "answerData" JSONB,
    "xpAwarded" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "txHash" TEXT,
    "tokenId" TEXT,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Friendship" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "addresseeId" TEXT NOT NULL,
    "status" "FriendshipStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Friendship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeDebate" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "timeframeHours" INTEGER NOT NULL,
    "creatorPosition" "DebatePosition" NOT NULL,
    "thesis" TEXT NOT NULL,
    "challengerId" TEXT,
    "challengerPosition" "DebatePosition",
    "challengerThesis" TEXT,
    "startPrice" DOUBLE PRECISION NOT NULL,
    "resolutionPrice" DOUBLE PRECISION,
    "outcome" "DebateOutcome" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "TradeDebate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Portfolio" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cashBalance" DOUBLE PRECISION NOT NULL DEFAULT 10000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Portfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "side" "TradeSide" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "portfolioValueAfter" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestigationAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "conclusion" TEXT NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "xpAwarded" INTEGER NOT NULL,
    "timeTakenSeconds" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvestigationAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "poolPair" TEXT NOT NULL,
    "depositValueUsd" DOUBLE PRECISION NOT NULL,
    "feesEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "impermanentLoss" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netResult" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "LabSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityChallenge" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "requirements" JSONB NOT NULL,
    "rewards" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChallengeCompletion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "xpAwarded" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChallengeCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE INDEX "User_xp_idx" ON "User"("xp");

-- CreateIndex
CREATE UNIQUE INDEX "QuestProgress_userId_questId_key" ON "QuestProgress"("userId", "questId");

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_userId_achievementId_key" ON "Achievement"("userId", "achievementId");

-- CreateIndex
CREATE UNIQUE INDEX "Friendship_requesterId_addresseeId_key" ON "Friendship"("requesterId", "addresseeId");

-- CreateIndex
CREATE INDEX "TradeDebate_outcome_expiresAt_idx" ON "TradeDebate"("outcome", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Portfolio_userId_key" ON "Portfolio"("userId");

-- CreateIndex
CREATE INDEX "Trade_userId_createdAt_idx" ON "Trade"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "InvestigationAttempt_userId_caseId_key" ON "InvestigationAttempt"("userId", "caseId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityChallenge_slug_key" ON "CommunityChallenge"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeCompletion_userId_challengeId_key" ON "ChallengeCompletion"("userId", "challengeId");

-- AddForeignKey
ALTER TABLE "QuestProgress" ADD CONSTRAINT "QuestProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_addresseeId_fkey" FOREIGN KEY ("addresseeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeDebate" ADD CONSTRAINT "TradeDebate_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeDebate" ADD CONSTRAINT "TradeDebate_challengerId_fkey" FOREIGN KEY ("challengerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Portfolio" ADD CONSTRAINT "Portfolio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestigationAttempt" ADD CONSTRAINT "InvestigationAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabSession" ADD CONSTRAINT "LabSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeCompletion" ADD CONSTRAINT "ChallengeCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeCompletion" ADD CONSTRAINT "ChallengeCompletion_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "CommunityChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
