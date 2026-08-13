import type { VlsmIssueCode } from "@/lib/vlsm"

export type CalculationEventPayload = {
  event: "success" | "validation_failure"
  issueCodes: VlsmIssueCode[]
}

export function recordCalculationEvent(payload: CalculationEventPayload) {
  const normalizedPayload = {
    ...payload,
    issueCodes: [...new Set(payload.issueCodes)],
  }

  void fetch("/api/calculation-events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(normalizedPayload),
    keepalive: true,
  }).catch(() => undefined)
}
