import { notFound } from "next/navigation";
import { loadReport } from "@/lib/minda/store";

export const dynamic = "force-dynamic";

export default async function ReportPage({ params }: { params: Promise<{ hash: string }> }) {
  const { hash } = await params;
  if (!/^[0-9a-f]{64}$/.test(hash)) notFound();
  const report = await loadReport(hash);
  if (!report) notFound();
  return <pre style={{ whiteSpace: "pre-wrap", padding: 16 }}>{JSON.stringify(report, null, 2)}</pre>;
}
