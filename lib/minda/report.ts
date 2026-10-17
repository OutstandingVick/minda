import { createHash } from "crypto";
import { runChecks } from "./checks";
import { computeVerdict } from "./verdict";
import type { Check, Verdict } from "./types";

export interface Report {
  verdict: Verdict;
  score: number;
  mint: string;
  symbol: string | null;
  checks: Check[];
  checked_at: string;
  report_hash: string;
}

export function canonicalJson(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v) ?? "null";
  if (Array.isArray(v)) return `[${v.map(canonicalJson).join(",")}]`;
  const obj = v as Record<string, unknown>;
  const keys = Object.keys(obj).filter((k) => obj[k] !== undefined).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`).join(",")}}`;
}
