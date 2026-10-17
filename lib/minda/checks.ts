import { getJson, rpc } from "./rpc";
import {
  KNOWN_POOL_OWNERS,
  SELL_TEST_USD,
  STABLECOIN_ALLOWLIST,
  TOKEN_2022_PROGRAM,
  USDC_MINT,
} from "./constants";
import { CHECK_TIMEOUT_MS } from "./constants";
import type { Check } from "./types";

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const t = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms);
  });
  return Promise.race([p, t]).finally(() => clearTimeout(timer));
}

interface ParsedMint {
  program: string;
  decimals: number;
  mintAuthority: string | null;
  freezeAuthority: string | null;
  supply: string;
}

interface DexPair {
  chainId: string;
  url: string;
  priceUsd?: string;
  liquidity?: { usd?: number };
  pairCreatedAt?: number;
  baseToken: { address: string; symbol: string };
  quoteToken: { address: string };
}

// Only pairs quoted in these count: spoofed pairs against junk quote tokens report fake liquidity.
const TRUSTED_QUOTES = new Set([
  "So11111111111111111111111111111111111111112",
  USDC_MINT,
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
]);

export interface Context {
  mint: string;
  signal?: AbortSignal;
  mintInfo: Promise<ParsedMint>;
  pairs: Promise<DexPair[]>;
}

const solscan = (mint: string) => `https://solscan.io/token/${mint}`;
