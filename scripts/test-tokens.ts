import { checkToken } from "../lib/minda/report";

const TOKENS: [string, string, string][] = [
  ["JUP", "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN", "PASS"],
  ["USDC", "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", "PASS"],
  ["BONK", "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", "-"],
  // Fresh pump.fun launches picked 2026-10-17; override with CLI args.
  ["PUMP1", process.argv[2] ?? "AN1BH5QYxLj1MDzpbXkmHwvbHn6T1Xy9Gc2PAtwzpump", "CAUTION/BLOCK"],
  ["PUMP2", process.argv[3] ?? "7Qsbm71fSh9SCtZhh7SYQ2gVEBHwJ2CRKToa1Dkmpump", "CAUTION/BLOCK"],
];

async function main() {
  const rows = await Promise.all(
    TOKENS.map(async ([name, mint, expect]) => {
      const t0 = Date.now();
      const r = await checkToken(mint, AbortSignal.timeout(10_000));
      const ms = Date.now() - t0;
