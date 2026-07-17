"use client";

import { createAuthenticationAdapter } from "@rainbow-me/rainbowkit";
import { SiweMessage } from "siwe";

export const siweAuthAdapter = createAuthenticationAdapter({
  getNonce: async () => {
    const res = await fetch("/api/auth/nonce");
    return res.text();
  },

  createMessage: ({ nonce, address, chainId }) =>
    new SiweMessage({
      domain: window.location.host,
      address,
      statement: "Sign in to The Onboarding to save your progress on-chain.",
      uri: window.location.origin,
      version: "1",
      chainId,
      nonce,
    }).prepareMessage(),

  verify: async ({ message, signature }) => {
    const res = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, signature }),
    });
    return res.ok;
  },

  signOut: async () => {
    await fetch("/api/auth/logout", { method: "POST" });
  },
});
