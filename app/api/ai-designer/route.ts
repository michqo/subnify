import { NextResponse } from "next/server"
import OpenAI from "openai"

import {
  MAX_AI_PROMPT_LENGTH,
  type DesignerPlan,
  type QuotaSnapshot,
} from "@/lib/ai-designer-types"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { calculateVlsm } from "@/lib/vlsm"

type QuotaReservation = {
  request_id: string | null
  used: number
  remaining: number
}

type CompletionStatus = "success" | "failed"

const WINDOW_HOURS = 24
const PENDING_TTL_MINUTES = 5
const PROVIDER_TIMEOUT_MS = 120_000

function getDailyLimit() {
  const configured = Number(process.env.AI_DESIGN_DAILY_LIMIT)
  if (Number.isFinite(configured) && configured > 0) {
    return Math.floor(configured)
  }
  return 3
}

function sanitizePlan(input: unknown): DesignerPlan {
  const source =
    typeof input === "object" && input
      ? (input as Record<string, unknown>)
      : {}
  const rawSubnets = Array.isArray(source.subnets) ? source.subnets : []

  const subnets = rawSubnets
    .map((item, index) => {
      const row =
        typeof item === "object" && item
          ? (item as Record<string, unknown>)
          : {}
      const defaultName =
        index < 26
          ? `LAN ${String.fromCharCode(65 + index)}`
          : `LAN ${index + 1}`
      const hosts = Number(row.hosts)

      return {
        name:
          typeof row.name === "string" && row.name.trim().length > 0
            ? row.name.trim()
            : defaultName,
        hosts: Number.isFinite(hosts) ? hosts : Number.NaN,
        purpose:
          typeof row.purpose === "string" && row.purpose.trim().length > 0
            ? row.purpose.trim()
            : undefined,
      }
    })
    .slice(0, 20)

  const baseCidr =
    source.baseCidr === null ? null : Number(source.baseCidr)

  return {
    baseNetwork:
      typeof source.baseNetwork === "string" &&
      source.baseNetwork.trim().length > 0
        ? source.baseNetwork.trim()
        : null,
    baseCidr:
      typeof baseCidr === "number" && Number.isFinite(baseCidr)
        ? baseCidr
        : null,
    title:
      typeof source.title === "string" && source.title.trim().length > 0
        ? source.title.trim().slice(0, 80)
        : "Network Design",
    rationale:
      typeof source.rationale === "string" &&
      source.rationale.trim().length > 0
        ? source.rationale.trim()
        : "Generated based on prompt requirements.",
    subnets,
  }
}

function quotaFromReservation(
  reservation: QuotaReservation,
  limit: number
): QuotaSnapshot {
  return {
    limit,
    used: reservation.used,
    remaining: reservation.remaining,
    windowHours: WINDOW_HOURS,
  }
}

function releasedQuota(quota: QuotaSnapshot): QuotaSnapshot {
  return {
    ...quota,
    used: Math.max(0, quota.used - 1),
    remaining: Math.min(quota.limit, quota.remaining + 1),
  }
}

function errorResponse(
  status: number,
  error: string,
  correlationId: string,
  retryable: boolean,
  quota?: QuotaSnapshot
) {
  return NextResponse.json(
    { error, retryable, correlationId, ...(quota ? { quota } : {}) },
    { status }
  )
}

function providerFailureMetadata(error: unknown) {
  const source =
    typeof error === "object" && error
      ? (error as { name?: unknown; status?: unknown })
      : null

  return {
    errorName:
      typeof source?.name === "string" ? source.name : "UnknownProviderError",
    providerStatus:
      typeof source?.status === "number" ? source.status : null,
  }
}

async function getQuotaSnapshot(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string
) {
  const limit = getDailyLimit()
  const windowStart = new Date(
    Date.now() - WINDOW_HOURS * 60 * 60 * 1000
  ).toISOString()
  const pendingCutoff = new Date(
    Date.now() - PENDING_TTL_MINUTES * 60 * 1000
  ).toISOString()

  const { count, error } = await supabase
    .from("ai_design_requests")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", windowStart)
    .or(
      `status.eq.success,and(status.eq.pending,created_at.gte.${pendingCutoff})`
    )

  if (error) {
    throw new Error("quota snapshot unavailable")
  }

  const used = count ?? 0

  return {
    limit,
    used,
    remaining: Math.max(0, limit - used),
    windowHours: WINDOW_HOURS,
  } satisfies QuotaSnapshot
}

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const quota = await getQuotaSnapshot(supabase, user.id)
    return NextResponse.json({ quota })
  } catch {
    return NextResponse.json(
      { error: "Quota is temporarily unavailable." },
      { status: 503 }
    )
  }
}

export async function POST(request: Request) {
  const correlationId = crypto.randomUUID()
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return errorResponse(401, "Unauthorized", correlationId, false)
  }

  const body = (await request.json().catch(() => ({}))) as {
    prompt?: unknown
  }
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : ""

  if (!prompt) {
    return errorResponse(
      400,
      "Prompt is required.",
      correlationId,
      false
    )
  }

  if (prompt.length > MAX_AI_PROMPT_LENGTH) {
    return errorResponse(
      400,
      `Prompt must be ${MAX_AI_PROMPT_LENGTH} characters or fewer.`,
      correlationId,
      false
    )
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  const configuredModel =
    process.env.OPENROUTER_MODEL?.trim() ||
    "nvidia/nemotron-3-super-120b-a12b:free"

  if (!apiKey) {
    return errorResponse(
      500,
      "AI generation is not configured.",
      correlationId,
      false
    )
  }

  const limit = getDailyLimit()
  let reservation: QuotaReservation | undefined

  try {
    const { data, error } = await supabase.rpc("reserve_ai_design_request", {
      p_limit: limit,
      p_window_hours: WINDOW_HOURS,
      p_model: configuredModel,
    })
    reservation = Array.isArray(data)
      ? (data[0] as QuotaReservation | undefined)
      : undefined

    if (error || !reservation) {
      return errorResponse(
        503,
        "AI generation is temporarily unavailable. Try again.",
        correlationId,
        true
      )
    }
  } catch {
    return errorResponse(
      503,
      "AI generation is temporarily unavailable. Try again.",
      correlationId,
      true
    )
  }

  const quota = quotaFromReservation(reservation, limit)

  if (!reservation.request_id) {
    return errorResponse(
      429,
      `Daily limit reached. You can generate up to ${quota.limit} designs per ${quota.windowHours} hours.`,
      correlationId,
      false,
      quota
    )
  }

  const requestId = reservation.request_id
  const startedAt = Date.now()
  const completeReservation = async (status: CompletionStatus) => {
    try {
      const { error } = await supabase.rpc("complete_ai_design_request", {
        p_request_id: requestId,
        p_status: status,
        p_latency_ms: Math.max(0, Date.now() - startedAt),
      })
      return !error
    } catch {
      return false
    }
  }

  const instruction = `You are a senior network architect.
Given a user prompt, produce only valid JSON with this exact shape:
{
  "title": string,
  "baseNetwork": string | null,
  "baseCidr": number | null,
  "rationale": string,
  "subnets": [
    {
      "name": string,
      "hosts": number,
      "purpose": string
    }
  ]
}
Rules:
- Title: a short meaningful title (2-5 words) summarizing the network design.
- Hosts are required hosts per subnet (usable host count target).
- Keep subnet count between 1 and 20.
- Prefer realistic LAN names.
- If base network isn't specified, set baseNetwork to "192.168.0.0" and baseCidr to 24.
- Return JSON only.`

  let completion: Awaited<
    ReturnType<OpenAI["chat"]["completions"]["create"]>
  >

  try {
    const client = new OpenAI({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://subnify.miqal.xyz",
        "X-Title": "Subnify",
      },
      maxRetries: 0,
      timeout: PROVIDER_TIMEOUT_MS,
    })

    completion = await client.chat.completions.create({
      model: configuredModel,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: instruction },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
    })
  } catch (error) {
    const completed = await completeReservation("failed")
    console.error({
      correlationId,
      event: "ai_provider_failure",
      ...providerFailureMetadata(error),
    })

    return errorResponse(
      502,
      "AI provider request failed. Try again.",
      correlationId,
      true,
      completed ? releasedQuota(quota) : quota
    )
  }

  const content = completion.choices?.[0]?.message?.content

  if (!content) {
    const completed = await completeReservation("failed")
    return errorResponse(
      422,
      "Generated requirements could not be validated. Try again.",
      correlationId,
      true,
      completed ? releasedQuota(quota) : quota
    )
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(content) as unknown
  } catch {
    const completed = await completeReservation("failed")
    return errorResponse(
      422,
      "Generated requirements could not be validated. Try again.",
      correlationId,
      true,
      completed ? releasedQuota(quota) : quota
    )
  }

  const plan = sanitizePlan(parsed)
  const calculation = calculateVlsm({
    baseNetwork: plan.baseNetwork ?? "192.168.0.0",
    baseCidr: plan.baseCidr ?? 24,
    subnets: plan.subnets.map((subnet, index) => ({
      id: index + 1,
      name: subnet.name,
      hosts: subnet.hosts,
    })),
  })

  if (!calculation.ok) {
    const completed = await completeReservation("failed")
    return errorResponse(
      422,
      "Generated requirements did not fit a valid IPv4 plan. Try again.",
      correlationId,
      true,
      completed ? releasedQuota(quota) : quota
    )
  }

  const completed = await completeReservation("success")
  if (!completed) {
    return errorResponse(
      503,
      "AI generation is temporarily unavailable. Try again.",
      correlationId,
      true,
      quota
    )
  }

  return NextResponse.json({
    plan,
    quota,
    timing: { latencyMs: Math.max(0, Date.now() - startedAt) },
  })
}
