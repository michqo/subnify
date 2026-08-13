import type { VlsmIssueCode } from "@/lib/vlsm"

const MAX_BODY_BYTES = 2048
const MAX_ISSUE_CODES = 9

const issueCodes = new Set<VlsmIssueCode>([
  "INVALID_BASE_NETWORK",
  "INVALID_BASE_CIDR",
  "NON_CANONICAL_BASE_NETWORK",
  "INVALID_SUBNET_COUNT",
  "INVALID_SUBNET_NAME",
  "DUPLICATE_SUBNET_NAME",
  "INVALID_HOST_COUNT",
  "INSUFFICIENT_ADDRESS_SPACE",
  "IPV4_OVERFLOW",
])

type CalculationEventPayload = {
  event: "success" | "validation_failure"
  issueCodes: VlsmIssueCode[]
}

function isCalculationEventPayload(value: unknown): value is CalculationEventPayload {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false
  }

  const payload = value as Record<string, unknown>
  const keys = Object.keys(payload)
  if (
    keys.length !== 2 ||
    !keys.includes("event") ||
    !keys.includes("issueCodes") ||
    (payload.event !== "success" && payload.event !== "validation_failure") ||
    !Array.isArray(payload.issueCodes) ||
    payload.issueCodes.length > MAX_ISSUE_CODES
  ) {
    return false
  }

  const uniqueCodes = new Set(payload.issueCodes)
  return (
    uniqueCodes.size === payload.issueCodes.length &&
    payload.issueCodes.every(
      (code): code is VlsmIssueCode =>
        typeof code === "string" && issueCodes.has(code as VlsmIssueCode)
    )
  )
}

export async function POST(request: Request) {
  const contentLength = request.headers.get("content-length")
  if (
    contentLength !== null &&
    (!/^\d+$/.test(contentLength) || Number(contentLength) > MAX_BODY_BYTES)
  ) {
    return new Response(null, { status: 400 })
  }

  let body: string
  try {
    body = await request.text()
  } catch {
    return new Response(null, { status: 400 })
  }

  if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) {
    return new Response(null, { status: 400 })
  }

  let payload: unknown
  try {
    payload = JSON.parse(body)
  } catch {
    return new Response(null, { status: 400 })
  }

  if (!isCalculationEventPayload(payload)) {
    return new Response(null, { status: 400 })
  }

  console.info("subnify.calculation", payload)
  return new Response(null, { status: 204 })
}
