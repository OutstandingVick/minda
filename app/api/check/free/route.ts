// TODO: remove this free route before submission (replaced by the paid x402 endpoint).
import { NextResponse } from "next/server";
import { isPubkey } from "@/lib/minda/base58";
import { checkToken } from "@/lib/minda/report";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

const TIMEOUT_MS = 10_000;

export async function GET(req: Request) {
  const mint = new URL(req.url).searchParams.get("mint")?.trim() ?? "";
  if (!isPubkey(mint)) {
    return NextResponse.json({ error: "mint must be a base58-encoded 32-byte public key" }, { status: 400 });
  }
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
