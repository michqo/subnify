import { NextResponse } from "next/server"
import OpenAI from "openai"
import { createSupabaseServerClient } from "@/lib/supabase/server"

type DesignerSubnet = {
  name: string
  hosts: number
  purpose?: string
}

type DesignerPlan = {
  baseNetwork: string | null
  baseCidr: number | null
  title: string
  rationale: string
  subnets: DesignerSubnet[]
}

type QuotaSnapshot = {
  limit: number
  used: number
  remaining: number
  windowHours: number
  approximateWaitSeconds: number
}

type LatencySample = {
  latencyMs: number
  promptLength: number
}

const WINDOW_HOURS = 24

function getDailyLimit() {
  const configured = Number(process.env.AI_DESIGN_DAILY_LIMIT)
  if (Number.isFinite(configured) && configured > 0) {
    return Math.floor(configured)
  }
  return 3
}

function getPercentile(values: number[], percentile: number) {
  if (values.length === 0) {
    return 0
  }

  const sorted = [...values].sort((a, b) => a - b)
  const rank = Math.min(sorted.length - 1, Math.max(0, Math.floor((percentile / 100) * (sorted.length - 1))))
  return sorted[rank]
}

function estimateWaitSeconds(samples: LatencySample[], promptLength?: number) {
  if (samples.length === 0) {
    return 180
  }

  const latencies = samples.map((sample) => sample.latencyMs)
  const p50 = getPercentile(latencies, 50)
  const p75 = getPercentile(latencies, 75)
  const p90 = getPercentile(latencies, 90)

  const promptLengths = samples.map((sample) => Math.max(1, sample.promptLength))
  const averagePromptLength = Math.max(1, Math.round(promptLengths.reduce((sum, size) => sum + size, 0) / promptLengths.length))
  const averageLatencyMs = Math.round(latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length)
  const msPerChar = averageLatencyMs / averagePromptLength

  const targetPromptLength = Number.isFinite(promptLength) && (promptLength ?? 0) > 0
    ? Math.max(1, Math.floor(promptLength ?? 1))
    : averagePromptLength

  const promptWeightedLatencyMs = Math.round(targetPromptLength * msPerChar)

  const conservativeLatencyMs = Math.max(
    p75,
    p50 + Math.round((p90 - p50) * 0.75),
    Math.round(promptWeightedLatencyMs * 1.1)
  )

  return Math.max(45, Math.min(900, Math.round(conservativeLatencyMs / 1000)))
}

function sanitizePlan(input: unknown): DesignerPlan {
  const source = typeof input === "object" && input ? (input as Record<string, unknown>) : {}
  const rawSubnets = Array.isArray(source.subnets) ? source.subnets : []

  const subnets = rawSubnets
    .map((item, index) => {
      const row = typeof item === "object" && item ? (item as Record<string, unknown>) : {}
      const hostsValue = Number(row.hosts)
      const hosts = Number.isFinite(hostsValue) ? Math.max(2, Math.min(65534, Math.floor(hostsValue))) : 2

      const defaultName = index < 26 ? `LAN ${String.fromCharCode(65 + index)}` : `LAN ${index + 1}`

      return {
        name: typeof row.name === "string" && row.name.trim().length > 0 ? row.name.trim() : defaultName,
        hosts,
        purpose: typeof row.purpose === "string" && row.purpose.trim().length > 0 ? row.purpose.trim() : undefined,
      }
    })
    .slice(0, 20)

  const baseCidrValue = Number(source.baseCidr)
  const baseCidr = Number.isFinite(baseCidrValue) ? Math.max(8, Math.min(30, Math.floor(baseCidrValue))) : null

  return {
    baseNetwork: typeof source.baseNetwork === "string" && source.baseNetwork.trim().length > 0 ? source.baseNetwork.trim() : null,
    baseCidr,
    title:
      typeof source.title === "string" && source.title.trim().length > 0
        ? source.title.trim().slice(0, 80)
        : "Network Design",
    rationale:
      typeof source.rationale === "string" && source.rationale.trim().length > 0
        ? source.rationale.trim()
        : "Generated based on prompt requirements.",
    subnets: subnets.length > 0 ? subnets : [{ name: "LAN A", hosts: 50, purpose: "General users" }],
  }
}

async function getQuotaSnapshot(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  promptLength?: number
) {
  const limit = getDailyLimit()
  const windowStart = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000).toISOString()

  const { count } = await supabase
    .from("ai_design_requests")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "success")
    .gte("created_at", windowStart)

  const used = count ?? 0
  const remaining = Math.max(0, limit - used)

  const { data: recentRows } = await supabase
    .from("ai_design_requests")
    .select("latency_ms,prompt")
    .eq("user_id", userId)
    .eq("status", "success")
    .not("latency_ms", "is", null)
    .order("created_at", { ascending: false })
    .limit(40)

  const samples: LatencySample[] = (recentRows ?? [])
    .map((row) => {
      const latencyMs = Number(row.latency_ms)
      const promptValue = typeof row.prompt === "string" ? row.prompt : ""
      return {
        latencyMs,
        promptLength: promptValue.length,
      }
    })
    .filter((sample) => Number.isFinite(sample.latencyMs) && sample.latencyMs > 0)

  const quota: QuotaSnapshot = {
    limit,
    used,
    remaining,
    windowHours: WINDOW_HOURS,
    approximateWaitSeconds: estimateWaitSeconds(samples, promptLength),
  }

  return quota
}

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const requestUrl = new URL(request.url)
  const rawPromptLength = Number(requestUrl.searchParams.get("promptLength"))
  const promptLength = Number.isFinite(rawPromptLength) && rawPromptLength > 0 ? Math.floor(rawPromptLength) : undefined

  const quota = await getQuotaSnapshot(supabase, user.id, promptLength)
  return NextResponse.json({ quota })
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as { prompt?: unknown }
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : ""

  const quota = await getQuotaSnapshot(supabase, user.id, prompt.length)

  if (quota.remaining <= 0) {
    await supabase.from("ai_design_requests").insert({
      user_id: user.id,
      prompt: "quota_blocked",
      model: "none",
      status: "quota_blocked",
      latency_ms: 0,
    })

    return NextResponse.json(
      {
        error: `Daily limit reached. You can generate up to ${quota.limit} designs per ${quota.windowHours} hours.`,
        quota,
      },
      { status: 429 }
    )
  }

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required." }, { status: 400 })
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  const configuredModel = process.env.OPENROUTER_MODEL?.trim() || "nvidia/nemotron-3-super-120b-a12b:free"

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "OPENROUTER_API_KEY is not configured.",
      },
      { status: 500 }
    )
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

  const client = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "https://subnify.miqal.xyz",
      "X-Title": "Subnify",
    },
  })

  const fallbackModels = [configuredModel]

  const modelsToTry = [...new Set(fallbackModels)]
  const startedAt = Date.now()

  try {
    let completion: Awaited<ReturnType<typeof client.chat.completions.create>> | null = null
    let lastError: unknown = null

    for (const model of modelsToTry) {
      try {
        completion = await client.chat.completions.create({
          model,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: instruction },
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
        })
        break
      } catch (error) {
        lastError = error
      }
    }

    if (!completion) {
      const message = lastError instanceof Error ? lastError.message : "Unknown model error"
      return NextResponse.json(
        { error: `Model request failed for all fallback models: ${message}` },
        { status: 502 }
      )
    }

    const content = completion.choices?.[0]?.message?.content

    if (!content) {
      return NextResponse.json({ error: "Model returned empty response." }, { status: 502 })
    }

    const parsed = JSON.parse(content) as unknown
    const plan = sanitizePlan(parsed)

    const latencyMs = Date.now() - startedAt
    await supabase.from("ai_design_requests").insert({
      user_id: user.id,
      prompt,
      model: configuredModel,
      status: "success",
      latency_ms: latencyMs,
    })

    const updatedQuota: QuotaSnapshot = {
      ...quota,
      used: quota.used + 1,
      remaining: Math.max(0, quota.remaining - 1),
      approximateWaitSeconds: estimateWaitSeconds(
        [
          {
            latencyMs,
            promptLength: prompt.length,
          },
        ],
        prompt.length
      ),
    }

    return NextResponse.json({ plan, quota: updatedQuota, timing: { latencyMs } })
  } catch (error) {
    const latencyMs = Date.now() - startedAt
    await supabase.from("ai_design_requests").insert({
      user_id: user.id,
      prompt,
      model: configuredModel,
      status: "failed",
      latency_ms: latencyMs,
    })

    const message = error instanceof Error ? error.message : "Unknown model error"
    return NextResponse.json({ error: `Model request failed: ${message}`, quota }, { status: 502 })
  }
}
