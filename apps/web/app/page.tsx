import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
        The Onboarding
      </p>
      <h1 className="max-w-2xl text-4xl font-bold sm:text-5xl">
        Welcome to Web3. Try not to get rekt.
      </h1>
      <p className="max-w-xl text-muted-foreground">
        Scaffold checkpoint — wallet connection wired to Monad Testnet.
      </p>
      <ConnectButton />
    </div>
  );
}
