import type { SessionOptions } from "iron-session";

export interface SessionData {
  nonce?: string;
  userId?: string;
  walletAddress?: string;
}

export const sessionOptions: SessionOptions = {
  cookieName: "onboarding_session",
  password: process.env.SESSION_SECRET as string,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },
};
