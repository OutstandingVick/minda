import { Redis } from "@upstash/redis";
import type { Report } from "./report";

let redis: Redis | null = null;
const client = () => (redis ??= Redis.fromEnv());

const key = (hash: string) => `sha256:${hash.replace(/^sha256:/, "")}`;

export async function saveReport(report: Report): Promise<void> {
  await client().set(key(report.report_hash), report);
}

export async function loadReport(hash: string): Promise<Report | null> {
  return client().get<Report>(key(hash));
}

export function reportUrl(report: Report): string {
  const base = (process.env.NEXT_PUBLIC_BASE_URL ?? "").replace(/\/$/, "");
  return `${base}/r/${report.report_hash.replace(/^sha256:/, "")}`;
}
