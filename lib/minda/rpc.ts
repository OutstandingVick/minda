let nextId = 1;

const TRANSIENT = /overloaded|try again|HTTP (429|5\d\d)/i;

// Retries once after a short pause when the RPC reports a transient failure.
export async function rpc<T>(method: string, params: unknown[], signal?: AbortSignal): Promise<T> {
  try {
    return await rpcOnce<T>(method, params, signal);
  } catch (e) {
    if (signal?.aborted || !(e instanceof Error) || !TRANSIENT.test(e.message)) throw e;
    await new Promise((r) => setTimeout(r, 400));
    return rpcOnce<T>(method, params, signal);
  }
}

async function rpcOnce<T>(method: string, params: unknown[], signal?: AbortSignal): Promise<T> {
  const url = process.env.HELIUS_RPC_URL;
  if (!url) throw new Error("HELIUS_RPC_URL not set");
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method, params }),
    signal,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`RPC ${method} HTTP ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(`RPC ${method}: ${json.error.message}`);
  return json.result as T;
}

export async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal, cache: "no-store" });
  if (!res.ok) throw new Error(`GET ${new URL(url).host} HTTP ${res.status}`);
  return (await res.json()) as T;
}
