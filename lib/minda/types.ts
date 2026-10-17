export type CheckResult = "PASS" | "CAUTION" | "BLOCK" | "UNKNOWN";

export interface Check {
  rule: string;
  result: CheckResult;
  value: unknown;
  detail: string;
  evidence: string;
}
