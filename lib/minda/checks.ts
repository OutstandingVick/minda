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

export async function fetchMint(mint: string, signal?: AbortSignal): Promise<ParsedMint> {
  const res = await rpc<{ value: any }>("getAccountInfo", [mint, { encoding: "jsonParsed" }], signal);
  const acct = res.value;
  if (!acct) throw new Error("mint account not found");
  const parsed = acct.data?.parsed;
  if (parsed?.type !== "mint") throw new Error("account is not a token mint");
  const info = parsed.info;
  return {
    program: acct.owner,
    decimals: info.decimals,
    mintAuthority: info.mintAuthority ?? null,
    freezeAuthority: info.freezeAuthority ?? null,
    supply: info.supply,
  };
}

export async function fetchPairs(mint: string, signal?: AbortSignal): Promise<DexPair[]> {
  const data = await getJson<{ pairs: DexPair[] | null }>(
    `https://api.dexscreener.com/latest/dex/tokens/${mint}`,
    signal,
  );
  return (data.pairs ?? []).filter(
    (p) =>
      p.chainId === "solana" &&
      (TRUSTED_QUOTES.has(p.quoteToken?.address) || TRUSTED_QUOTES.has(p.baseToken.address)),
  );
}

export async function mintAuthority(ctx: Context): Promise<Check> {
  const m = await ctx.mintInfo;
  const std = m.program === TOKEN_2022_PROGRAM ? "Token-2022" : "SPL Token";
  const allow = STABLECOIN_ALLOWLIST[ctx.mint];
  if (!m.mintAuthority) {
    return { rule: "mint_authority", result: "PASS", value: null, detail: `Mint authority revoked (${std}).`, evidence: solscan(ctx.mint) };
  }
  if (allow) {
    return { rule: "mint_authority", result: "PASS", value: m.mintAuthority, detail: `Mint authority active, but ${allow} is an allowlisted regulated stablecoin (${std}).`, evidence: solscan(ctx.mint) };
  }
  return { rule: "mint_authority", result: "BLOCK", value: m.mintAuthority, detail: `Mint authority active: supply can be inflated (${std}).`, evidence: solscan(ctx.mint) };
}

export async function freezeAuthority(ctx: Context): Promise<Check> {
  const m = await ctx.mintInfo;
  const allow = STABLECOIN_ALLOWLIST[ctx.mint];
  if (!m.freezeAuthority) {
    return { rule: "freeze_authority", result: "PASS", value: null, detail: "Freeze authority revoked.", evidence: solscan(ctx.mint) };
  }
  if (allow) {
    return { rule: "freeze_authority", result: "PASS", value: m.freezeAuthority, detail: `Freeze authority active, but ${allow} is an allowlisted regulated stablecoin (exception).`, evidence: solscan(ctx.mint) };
  }
  return { rule: "freeze_authority", result: "BLOCK", value: m.freezeAuthority, detail: "Freeze authority active: your tokens can be frozen.", evidence: solscan(ctx.mint) };
}

export async function holderConcentration(ctx: Context): Promise<Check> {
  const [largest, supply] = await Promise.all([
    rpc<{ value: { address: string; amount: string }[] }>("getTokenLargestAccounts", [ctx.mint], ctx.signal),
    rpc<{ value: { amount: string } }>("getTokenSupply", [ctx.mint], ctx.signal),
  ]);
  const total = BigInt(supply.value.amount);
  const evidence = `${solscan(ctx.mint)}#holders`;
  if (total === 0n) {
    return { rule: "holder_concentration", result: "UNKNOWN", value: null, detail: "Supply is zero.", evidence };
  }
  const accounts = largest.value;
  const owners = await rpc<{ value: any[] }>(
    "getMultipleAccounts",
    [accounts.map((a) => a.address), { encoding: "jsonParsed" }],
    ctx.signal,
  );
  const excluded: string[] = [];
  const holders = accounts.filter((a, i) => {
    const owner = owners.value[i]?.data?.parsed?.info?.owner;
    const pool = owner && KNOWN_POOL_OWNERS[owner];
    if (pool) excluded.push(pool);
    return !pool;
  });
  const top10 = holders.slice(0, 10).reduce((s, a) => s + BigInt(a.amount), 0n);
  const pct = Number((top10 * 10000n) / total) / 100;
  const result = pct > 60 ? "BLOCK" : pct > 35 ? "CAUTION" : "PASS";
  const note = excluded.length
    ? ` Excluded pool vaults: ${excluded.join(", ")}.`
    : " No known AMM vaults detected; unrecognized pools/bonding curves may be counted.";
  return { rule: "holder_concentration", result, value: pct, detail: `Top-10 holders own ${pct}% of supply.${note}`, evidence };
}

export async function liquidity(ctx: Context): Promise<Check> {
  const pairs = await ctx.pairs;
  if (!pairs.length) {
    return { rule: "liquidity", result: "BLOCK", value: { usd: 0, age_hours: null }, detail: "No Solana DEX pairs against SOL/USDC/USDT found.", evidence: `https://dexscreener.com/solana/${ctx.mint}` };
