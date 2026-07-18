# The Onboarding

> Welcome to Web3. Try not to get rekt.

A social, gamified Web3 learning RPG on [Monad](https://monad.xyz). Learn crypto, trading, and DeFi by doing — with friends, not alone. Built for the [Spark hackathon](https://buildanything.so/hackathons/spark).

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
