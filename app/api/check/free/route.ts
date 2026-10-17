// TODO: remove this free route before submission (replaced by the paid x402 endpoint).
import { NextResponse } from "next/server";
import { isPubkey } from "@/lib/minda/base58";
import { checkWithTimeout } from "@/lib/minda/run";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function GET(req: Request) {
  const devKey = process.env.MINDA_DEV_KEY;
  if (!devKey || req.headers.get("x-minda-dev") !== devKey) {
    return new NextResponse("Not Found", { status: 404 });
  }
  const mint = new URL(req.url).searchParams.get("mint")?.trim() ?? "";
  if (!isPubkey(mint)) {
    return NextResponse.json({ error: "mint must be a base58-encoded 32-byte public key" }, { status: 400 });
  }
  try {
    return NextResponse.json(await checkWithTimeout(mint));
  } catch {
    return NextResponse.json({ error: "check timed out" }, { status: 504 });
  }
}
