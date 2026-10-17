import { NextRequest, NextResponse } from "next/server";
import { withX402, type Network } from "x402-next";
import { isPubkey } from "@/lib/minda/base58";
import { checkWithTimeout } from "@/lib/minda/run";
import { reportUrl, saveReport } from "@/lib/minda/store";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const DESCRIPTION =
  "Minda: pre-trade safety check for a Solana token. Returns PASS/CAUTION/BLOCK with on-chain evidence.";

async function handler(req: NextRequest): Promise<NextResponse<unknown>> {
  const body = await req.json().catch(() => null);
  const mint = typeof body?.mint === "string" ? body.mint.trim() : "";
  if (!isPubkey(mint)) {
    return NextResponse.json({ error: "mint must be a base58-encoded 32-byte public key" }, { status: 400 });
  }
  let report;
  try {
    report = await checkWithTimeout(mint);
  } catch {
    return NextResponse.json({ error: "check timed out" }, { status: 504 });
  }
  await saveReport(report);
  return NextResponse.json({ ...report, report_url: reportUrl(report) });
}

// withX402 wraps only this route (not /api/check/free or /r/*) and settles payment
// only after a successful (<400) response, so bad input and timeouts are never charged.
export const POST = withX402(
  handler,
  process.env.MINDA_PAY_TO as `0x${string}`,
  {
    price: "$0.25",
    network: (process.env.X402_NETWORK || "base") as Network,
    config: {
      description: DESCRIPTION,
      mimeType: "application/json",
      inputSchema: { bodyType: "json", bodyFields: { mint: { type: "string", description: "Solana token mint address", required: true } } },
    },
  },
  process.env.X402_FACILITATOR_URL ? { url: process.env.X402_FACILITATOR_URL as `${string}://${string}` } : undefined,
);
