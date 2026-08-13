import type { VlsmIssueCode } from "@/lib/vlsm"

export type CalculationEventPayload = {
  event: "success" | "validation_failure"
  issueCodes: VlsmIssueCode[]
}

export function recordCalculationEvent(payload: CalculationEventPayload) {
  void fetch("/api/calculation-events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => undefined)
}
