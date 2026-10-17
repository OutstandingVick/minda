let nextId = 1;

export async function rpc<T>(method: string, params: unknown[], signal?: AbortSignal): Promise<T> {
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
