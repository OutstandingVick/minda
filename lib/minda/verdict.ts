import type { Check, Verdict } from "./types";

export function computeVerdict(checks: Check[]): { verdict: Verdict; score: number } {
  const blocks = checks.filter((c) => c.result === "BLOCK").length;
  // UNKNOWN counts as CAUTION so an API failure can never produce a PASS.
  const cautions = checks.filter((c) => c.result === "CAUTION" || c.result === "UNKNOWN").length;
  const verdict: Verdict = blocks > 0 ? "BLOCK" : cautions >= 2 ? "CAUTION" : "PASS";
  const score = Math.max(0, 100 - 40 * blocks - 15 * cautions);
  return { verdict, score };
}
