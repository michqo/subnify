"use client"

import { Loader2, Sparkles } from "lucide-react"
import { useRef, useState } from "react"

import { useAuth } from "@/components/core/auth-provider"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import {
  MAX_AI_PROMPT_LENGTH,
  type DesignerPlan,
} from "@/lib/ai-designer-types"
import { getAiPlanBase, normalizeAiDesignedSubnets } from "@/lib/planner"
import { AiDesignerApiError, useAiDesignerQuotaQuery, useGenerateAiDesignMutation } from "@/lib/queries/ai-designer"
import type { ReplacePlanInput } from "@/lib/state/subnet-plan-types"

type GenerateRequirementsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onApply: (plan: ReplacePlanInput) => void
}

type GeneratedRequirements = {
  plan: DesignerPlan
  prompt: string
}

export function GenerateRequirementsDialog({ open, onOpenChange, onApply }: GenerateRequirementsDialogProps) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const { data: quota, isLoading: quotaLoading } = useAiDesignerQuotaQuery(userId)
  const generation = useGenerateAiDesignMutation(userId)
  const [prompt, setPrompt] = useState("")
  const [generated, setGenerated] = useState<GeneratedRequirements | null>(null)
  const [error, setError] = useState<string | null>(null)
  const requestVersion = useRef(0)

  const updatePrompt = (value: string) => {
    requestVersion.current += 1
    setPrompt(value)
    setGenerated(null)
    setError(null)
  }

  const generate = async () => {
    const normalizedPrompt = prompt.trim()
    if (!normalizedPrompt) {
      setError("Describe the environment before generating requirements.")
      return
    }

    if (normalizedPrompt.length > MAX_AI_PROMPT_LENGTH) {
      setError(
        `Keep the environment description to ${MAX_AI_PROMPT_LENGTH} characters or fewer.`
      )
      return
    }

    const version = requestVersion.current + 1
    requestVersion.current = version
    setError(null)
    setGenerated(null)
    try {
      const payload = await generation.mutateAsync({ prompt: normalizedPrompt })
      if (requestVersion.current !== version) return
      setGenerated({ plan: payload.plan, prompt: normalizedPrompt })
    } catch (generationError) {
      if (requestVersion.current !== version) return
      setError(
        generationError instanceof AiDesignerApiError || generationError instanceof Error
          ? generationError.message
          : "Requirements could not be generated."
      )
    }
  }

  const apply = () => {
    if (!generated) return
    const base = getAiPlanBase(generated.plan)
    onApply({
      ...base,
      subnets: normalizeAiDesignedSubnets(generated.plan.subnets),
      sourceType: "ai_design",
      aiPrompt: generated.prompt,
      aiRationale: generated.plan.rationale,
      suggestedTitle: generated.plan.title,
    })
    onOpenChange(false)
  }

  const exhausted = (quota?.remaining ?? 1) <= 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-mono"><Sparkles className="size-4 text-primary" />Generate requirements</DialogTitle>
          <DialogDescription>
            Describe users and trust zones. Review every generated value before applying it to the planner.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between border-y border-border py-2 font-mono text-xs text-muted-foreground">
            <span>Daily generation quota</span>
            <span>{quotaLoading ? "Loading" : quota ? `${quota.remaining} / ${quota.limit} remaining` : "Unavailable"}</span>
          </div>
          <Field>
            <FieldLabel htmlFor="requirements-prompt">Environment requirements</FieldLabel>
            <textarea
              id="requirements-prompt"
              value={prompt}
              onChange={(event) => updatePrompt(event.target.value)}
              maxLength={MAX_AI_PROMPT_LENGTH}
              rows={5}
              placeholder="Three-floor office: 120 staff, guest Wi-Fi, VoIP, CCTV, isolated servers…"
              className="w-full rounded-sm border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <FieldDescription className="flex justify-between gap-4">
              <span>Include device counts, branches, security zones, and expected growth.</span>
              <span className="shrink-0 font-mono">
                {prompt.length} / {MAX_AI_PROMPT_LENGTH} characters
              </span>
            </FieldDescription>
          </Field>

          <Button onClick={() => void generate()} disabled={generation.isPending || exhausted}>
            {generation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {generation.isPending ? "Generating requirements" : exhausted ? "Quota reached" : "Generate requirements"}
          </Button>
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}

          {generated ? (
            <div className="space-y-3 border-t border-border pt-4">
              <div><p className="font-medium">{generated.plan.title}</p><p className="mt-1 text-sm text-muted-foreground">{generated.plan.rationale}</p></div>
              <p className="font-mono text-xs text-primary">{generated.plan.baseNetwork ?? "192.168.0.0"}/{generated.plan.baseCidr ?? 24}</p>
              <div className="divide-y divide-border border-y border-border">
                {generated.plan.subnets.map((subnet, index) => (
                  <div key={`${subnet.name}-${index}`} className="flex items-start justify-between gap-4 py-3">
                    <span><span className="block text-sm font-medium">{subnet.name}</span>{subnet.purpose ? <span className="block text-xs text-muted-foreground">{subnet.purpose}</span> : null}</span>
                    <span className="font-mono text-xs">{subnet.hosts} hosts</span>
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setGenerated(null)}>Discard preview</Button>
                <Button onClick={apply}>Apply to planner</Button>
              </DialogFooter>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
