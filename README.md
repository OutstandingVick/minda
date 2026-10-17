# Minda

Pre-trade Solana token safety check. Runs five on-chain/market checks in parallel and returns a deterministic, hashed verdict.

| Check | BLOCK | CAUTION |
| --- | --- | --- |
| mint_authority | active (stablecoin allowlist excepted) | — |
| freeze_authority | active (stablecoin allowlist excepted) | — |
| holder_concentration | top-10 > 60% | top-10 > 35% |
| liquidity | < $10k | < $50k, or token < 24h old |
| sellability | no Jupiter route for a $100 sell | price impact > 10% |

Verdict: any BLOCK → BLOCK; ≥2 CAUTION (UNKNOWN counts as CAUTION) → CAUTION; else PASS.
Score = 100 − 40·BLOCK − 15·CAUTION, floored at 0.

## Run

```bash
cp .env.example .env.local   # set HELIUS_RPC_URL
npm install
npm run dev                  # GET /api/check/free?mint=<mint>
npm run test:tokens          # verdict table for JUP, USDC, BONK + 2 pump.fun tokens
```
