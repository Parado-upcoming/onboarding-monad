import { generateNonce } from "siwe";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  const nonce = generateNonce();
  session.nonce = nonce;
  await session.save();
  return new Response(nonce);
}
