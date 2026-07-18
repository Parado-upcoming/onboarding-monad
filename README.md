# The Onboarding

> Welcome to Web3. Try not to get rekt.

A social, gamified Web3 learning RPG on [Monad](https://monad.xyz). Learn crypto, trading, and DeFi by doing — with friends, not alone. Built for the [Spark hackathon](https://buildanything.so/hackathons/spark).

**Live app:** https://web-production-fb7f8.up.railway.app

## Repo layout

```
apps/web/       Next.js app (frontend + API routes)
contracts/      Foundry project (Solidity contracts, Monad Testnet)
```

## Stack

- Next.js (App Router) + TypeScript + Tailwind + shadcn/ui
- wagmi + viem + RainbowKit, wired to Monad Testnet (chain ID `10143`)
- Prisma + Postgres (hosted on Railway)
- Foundry for Solidity contracts, deployed to Monad Testnet

## Local setup

```bash
cd apps/web
pnpm install
cp .env.example .env.local   # fill in DATABASE_URL, WalletConnect project ID, etc.
npx prisma migrate dev
pnpm dev
```

Requires a Postgres `DATABASE_URL` and a [WalletConnect Cloud](https://cloud.reown.com) `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`. Get testnet MON from the [faucet](https://faucet.monad.xyz).

## Contracts

```bash
cd contracts
forge test
forge script script/Deploy.s.sol:Deploy --account <keystore> --sender <address> --broadcast --rpc-url https://testnet-rpc.monad.xyz
```

Deployed on Monad Testnet (chain `10143`):

| Contract | Address |
|---|---|
| `AchievementRegistry` | [`0xe89864B3326eF5D137F0707EE949879371851755`](https://testnet.monadvision.com/address/0xe89864B3326eF5D137F0707EE949879371851755) |
| `OnboardingBadge` (ERC-721) | [`0x18E95e3660e5262cF38E2cE885dB69Ae2EeD9832`](https://testnet.monadvision.com/address/0x18E95e3660e5262cF38E2cE885dB69Ae2EeD9832) |

`AchievementRegistry` records every achievement unlock per wallet (cheap mapping + event). `OnboardingBadge` mints a soulbound-ish ERC-721 for flagship achievements only (First Swap, Monad Pioneer, Debate Champion). Both are written to directly by the user's own connected wallet from the profile page's "Proof of Learning" section — never by a server hot wallet.

## The core loop

```
Learn -> Decide -> Act -> See the result -> Reflect -> Earn -> Unlock
```

1. **Connect & sign in** — wallet connect (RainbowKit) + Sign-In with Ethereum. The wallet is the identity; no username/password.
2. **Academy** — a "Next Mission" card on the dashboard always tells you exactly what to do next. Short lesson, then a quiz or decision, then an explanation and XP.
3. **The Arena** — $10,000 virtual capital against a live-feeling but fully deterministic price feed. Buy/sell, track ROI/win-rate/drawdown.
4. **Trade Debates** — the social centerpiece: put a bullish/bearish thesis on the record, someone else takes the other side, the market decides who was right.
5. **The Investigation Room** / **The Lab** — an on-chain detective mini-game and a liquidity-pool simulator you can instantly fast-forward.
6. **Proof of Learning** — from your profile, sign a real transaction on Monad Testnet to record an achievement (and mint a badge NFT for flagship ones). That transaction is the receipt: not "I claim I learned this," but a wallet-signed, explorer-visible record.

## Why this matters (positioning)

Web3 education is usually solitary and abstract. The wedge here is specifically the opposite: friends, wallet-to-wallet trade debates, and shared leaderboards, so learning Web3 doesn't mean learning it alone.
