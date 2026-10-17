export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

// Regulated stablecoins whose issuers keep freeze authority by design.
export const STABLECOIN_ALLOWLIST: Record<string, string> = {
  [USDC_MINT]: "USDC (Circle)",
  Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: "USDT (Tether)",
  "2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo": "PYUSD (Paxos)",
};
