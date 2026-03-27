"use client"

import { useEffect, useState } from "react"
import { Loader2, Sparkles, Wand2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/components/core/auth-provider"
import type { DesignerPlan } from "@/lib/ai-designer-types"
import { formatWaitTime } from "@/lib/ai-designer-types"
import { AiDesignerApiError, useAiDesignerQuotaQuery, useGenerateAiDesignMutation } from "@/lib/queries/ai-designer"
import { useSaveAiGeneratedCalculationMutation } from "@/lib/queries/calculations"

export function DesignerPageClient() {
  const router = useRouter()
  const { user } = useAuth()
  const userId = user?.id ?? null
  const { data: quota, isLoading: isQuotaLoading } = useAiDesignerQuotaQuery(userId)
  const generateDesignMutation = useGenerateAiDesignMutation(userId)
  const savePlanMutation = useSaveAiGeneratedCalculationMutation(userId)
  const [prompt, setPrompt] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [plan, setPlan] = useState<DesignerPlan | null>(null)
  const [savedPlanId, setSavedPlanId] = useState<string | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [generationTimeSeconds, setGenerationTimeSeconds] = useState(0)
  const isGenerating = generateDesignMutation.isPending || savePlanMutation.isPending
  const isLimitReached = (quota?.remaining ?? 1) <= 0

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

    setElapsedSeconds(0)
    setError(null)
    setSavedPlanId(null)

    try {
      const payload = await generateDesignMutation.mutateAsync({ prompt: normalizedPrompt })
      setPlan(payload.plan)

      const nextSavedPlanId = await savePlanMutation.mutateAsync({
        generatedPlan: payload.plan,
        sourcePrompt: normalizedPrompt,
      })

      setSavedPlanId(nextSavedPlanId)
      if (nextSavedPlanId) {
        toast.success("AI design saved to subnet history.")
      }

      setGenerationTimeSeconds(
        Number.isFinite(payload.timing?.latencyMs) && (payload.timing?.latencyMs ?? 0) > 0
          ? Math.round((payload.timing?.latencyMs ?? 0) / 1000)
          : elapsedSeconds
      )
    } catch (generationError) {
      if (generationError instanceof AiDesignerApiError) {
        setError(generationError.message)
      } else if (generationError instanceof Error) {
        setError(generationError.message)
      } else {
        setError("Failed to generate a design.")
      }
    }
  }

  const applyToCalculator = () => {
    if (!plan) {
      return
    }

    if (savedPlanId) {
      router.push(`/app?history=${savedPlanId}`)
      return
    }

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(
        "subnify_ai_plan",
        JSON.stringify({
          prompt,
          plan,
        })
      )
    }

    router.push("/app?aiDesign=1")
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
            <div className="min-h-13">
              {quota ? (
                <div className="rounded-lg border border-border bg-secondary/30 p-3 text-sm text-muted-foreground">
                  Remaining designs: <span className="font-medium text-foreground">{quota.remaining}</span> / {quota.limit} in {quota.windowHours}h
                </div>
              ) : isQuotaLoading ? (
                <div className="rounded-lg border border-border bg-secondary/30 p-3">
                  <Skeleton className="h-5 w-56" />
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-secondary/30 p-3 text-sm text-muted-foreground">
                  Unable to load quota. Try refreshing.
                </div>
              )}
            </div>
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
                disabled={isGenerating || isLimitReached}
              >
                <Wand2 className="h-4 w-4" />
                {isGenerating ? "Generating..." : isLimitReached ? "Limit reached" : "Generate design"}
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
                This typically takes 30-300 seconds depending on prompt length. Elapsed: {formatWaitTime(elapsedSeconds)}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating your network design...
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
                  Show plan
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
