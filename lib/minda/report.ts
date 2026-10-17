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
