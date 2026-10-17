import { checkToken, type Report } from "./report";

const TIMEOUT_MS = 10_000;

// Runs the check engine with a 10s overall budget; rejects with "timeout" past it.
export async function checkWithTimeout(mint: string): Promise<Report> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error("timeout"));
    }, TIMEOUT_MS);
  });
  try {
    return await Promise.race([checkToken(mint, controller.signal), timeout]);
  } finally {
    clearTimeout(timer);
  }
}
