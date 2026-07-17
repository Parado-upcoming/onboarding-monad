import { defineChain } from "viem";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testnet-rpc.monad.xyz"] },
  },
  blockExplorers: {
    default: { name: "MonadVision", url: "https://testnet.monadvision.com" },
  },
  testnet: true,
});

export const wagmiConfig = getDefaultConfig({
  appName: "The Onboarding",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "",
  chains: [monadTestnet],
  ssr: true,
});
