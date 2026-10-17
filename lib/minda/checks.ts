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
