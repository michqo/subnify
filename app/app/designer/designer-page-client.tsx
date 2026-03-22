"use client"

import { useEffect, useState } from "react"
import { Sparkles, Wand2 } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Skeleton } from "@/components/ui/skeleton"

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

type StoredAiDesignPayload = {
  prompt: string
  plan: DesignerPlan
}

type QuotaSnapshot = {
  limit: number
  used: number
  remaining: number
  windowHours: number
  approximateWaitSeconds: number
}

function formatWaitTime(seconds: number): string {
  if (seconds < 120) {
    return `${seconds}s`
  }
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
}

export function DesignerPageClient() {
  const router = useRouter()
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [plan, setPlan] = useState<DesignerPlan | null>(null)
  const [quota, setQuota] = useState<QuotaSnapshot | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [generationTimeSeconds, setGenerationTimeSeconds] = useState(0)

  useEffect(() => {
    const loadQuota = async () => {
      const response = await fetch("/api/ai-designer", { method: "GET" })
      const payload = (await response.json().catch(() => ({}))) as { quota?: QuotaSnapshot }
      if (response.ok && payload.quota) {
        setQuota(payload.quota)
      }
    }

    void loadQuota()
  }, [])

  useEffect(() => {
    if (!isGenerating) {
      return
    }

    const interval = setInterval(() => {
      setElapsedSeconds((current) => current + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isGenerating])

  const generatePlan = async () => {
    const normalizedPrompt = prompt.trim()

    if (!normalizedPrompt) {
      setError("Please enter a prompt first.")
      return
    }

    const promptLength = normalizedPrompt.length

    try {
      const quotaResponse = await fetch(`/api/ai-designer?promptLength=${promptLength}`, { method: "GET" })
      const quotaPayload = (await quotaResponse.json().catch(() => ({}))) as { quota?: QuotaSnapshot }
      if (quotaResponse.ok && quotaPayload.quota) {
        setQuota(quotaPayload.quota)
      }
    } catch {
      // Keep previous quota snapshot if preflight estimate fails.
    }

    setIsGenerating(true)
    setElapsedSeconds(0)
    setError(null)

    const response = await fetch("/api/ai-designer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: normalizedPrompt }),
    })

    const payload = (await response.json().catch(() => ({}))) as {
      plan?: DesignerPlan
      error?: string
      quota?: QuotaSnapshot
      timing?: { latencyMs?: number }
    }

    if (payload.quota) {
      setQuota(payload.quota)
    }

    if (!response.ok || !payload.plan) {
      setError(payload.error ?? "Failed to generate a design.")
      setIsGenerating(false)
      return
    }

    setPlan(payload.plan)
    setGenerationTimeSeconds(
      Number.isFinite(payload.timing?.latencyMs) && (payload.timing?.latencyMs ?? 0) > 0
        ? Math.round((payload.timing?.latencyMs ?? 0) / 1000)
        : elapsedSeconds
    )
    setIsGenerating(false)
  }

  const applyToCalculator = () => {
    if (!plan || typeof window === "undefined") {
      return
    }

    const payload: StoredAiDesignPayload = {
      prompt,
      plan,
    }

    window.sessionStorage.setItem("subnify_ai_plan", JSON.stringify(payload))
    router.push("/app?aiDesign=1")
  }

  const applyToVisualizer = () => {
    if (!plan || typeof window === "undefined") {
      return
    }

    const payload: StoredAiDesignPayload = {
      prompt,
      plan,
    }

    window.sessionStorage.setItem("subnify_ai_plan", JSON.stringify(payload))
    router.push("/app/visualizer?aiDesign=1")
  }

  return (
    <div className="flex-1 overflow-auto p-4 lg:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" />
              AI Network Designer
            </CardTitle>
            <CardDescription>
              Describe your environment in natural language and generate subnet requirements automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {quota ? (
              <div className="rounded-lg border border-border bg-secondary/30 p-3 text-sm text-muted-foreground">
                Remaining designs: <span className="font-medium text-foreground">{quota.remaining}</span> / {quota.limit} in {quota.windowHours}h
              </div>
            ) : null}
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="designer-prompt">Prompt</FieldLabel>
                <textarea
                  id="designer-prompt"
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Example: Design a network for a 3-floor office with 120 users, guest Wi-Fi, VoIP phones, CCTV cameras, and isolated server subnet."
                  className="min-h-28 w-full rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
                <FieldDescription>
                  Include user counts, branches, special zones (servers/guest/IoT), and security constraints.
                </FieldDescription>
              </Field>
              <Button
                type="button"
                className="gap-2"
                onClick={generatePlan}
                disabled={isGenerating || (!!quota && quota.remaining <= 0)}
              >
                <Wand2 className="h-4 w-4" />
                {isGenerating ? "Generating..." : "Generate design"}
              </Button>
            </FieldGroup>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </CardContent>
        </Card>

        {isGenerating ? (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Generated Plan</CardTitle>
              <CardDescription>
                This can take around {formatWaitTime(quota?.approximateWaitSeconds ?? 90)} on free models. Elapsed: {formatWaitTime(elapsedSeconds)}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round((elapsedSeconds / Math.max(1, quota?.approximateWaitSeconds ?? 90)) * 100)
                    )}%`,
                  }}
                />
              </div>
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <div className="space-y-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            </CardContent>
          </Card>
        ) : null}

        {plan ? (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Generated Plan</CardTitle>
              <CardDescription>{plan.rationale} — Generated in {formatWaitTime(generationTimeSeconds)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border bg-secondary/30 p-3 text-sm text-muted-foreground">
                Base network: {plan.baseNetwork ?? "192.168.0.0"}/{plan.baseCidr ?? 24}
              </div>

              <div className="space-y-2">
                {plan.subnets.map((subnet, index) => (
                  <div key={`${subnet.name}-${index}`} className="rounded-lg border border-border bg-secondary/30 p-3">
                    <p className="font-medium">{subnet.name}</p>
                    <p className="text-sm text-muted-foreground">{subnet.hosts} hosts{typeof subnet.purpose === "string" ? ` • ${subnet.purpose}` : ""}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button type="button" onClick={applyToCalculator}>
                  Apply to calculator
                </Button>
                <Button type="button" variant="outline" onClick={applyToVisualizer}>
                  Visualize
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
