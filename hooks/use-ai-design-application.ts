"use client"

import { useEffect } from "react"
import { toast } from "sonner"

import { calculateVlsm, type VlsmAllocation } from "@/lib/vlsm"
import {
  getAiPlanBase,
  normalizeAiDesignedSubnets,
  unpackAiDesignPayload,
  type AiDesignedPlan,
  type StoredAiDesignPayload,
} from "@/lib/planner"
import type { ReplacePlanInput } from "@/lib/state/subnet-plan-types"

type UseAiDesignApplicationArgs = {
  shouldApplyAiDesign: boolean
  replaceToCurrentView: () => void
  replacePlan: (plan: ReplacePlanInput) => void
  setResults: (results: VlsmAllocation[]) => void
  setPlanName: (value: string) => void
  setActiveCloudPlanId: (value: string | null) => void
}

export function useAiDesignApplication({
  shouldApplyAiDesign,
  replaceToCurrentView,
  replacePlan,
  setResults,
  setPlanName,
  setActiveCloudPlanId,
}: UseAiDesignApplicationArgs) {
  useEffect(() => {
    if (!shouldApplyAiDesign || typeof window === "undefined") {
      return
    }

    const rawPlan = window.sessionStorage.getItem("subnify_ai_plan")
    window.sessionStorage.removeItem("subnify_ai_plan")

    if (!rawPlan) {
      toast.error("No AI design found. Generate one from the Designer tab.")
      replaceToCurrentView()
      return
    }

    try {
      const parsed = JSON.parse(rawPlan) as StoredAiDesignPayload | AiDesignedPlan
      const { parsedPlan, aiPrompt } = unpackAiDesignPayload(parsed)
      const designedSubnets = normalizeAiDesignedSubnets(parsedPlan.subnets)

      if (designedSubnets.length === 0) {
        toast.error("Generated design was empty. Please try a different prompt.")
        replaceToCurrentView()
        return
      }

      const { baseNetwork: nextBaseNetwork, baseCidr: nextBaseCidr } = getAiPlanBase(parsedPlan)

      replacePlan({
        baseNetwork: nextBaseNetwork,
        baseCidr: nextBaseCidr,
        subnets: designedSubnets,
        sourceType: "ai_design",
        aiPrompt,
        aiRationale:
          typeof parsedPlan.rationale === "string" && parsedPlan.rationale.trim().length > 0
            ? parsedPlan.rationale
            : null,
        suggestedTitle: typeof parsedPlan.title === "string" ? parsedPlan.title : null,
      })

      const calculated = calculateVlsm(nextBaseNetwork, designedSubnets)
      setResults(calculated)
      const aiGeneratedTitle = typeof parsedPlan.title === "string" ? parsedPlan.title : null
      setPlanName(aiGeneratedTitle?.trim() ?? "")
      setActiveCloudPlanId(null)
      toast.info("Applied AI-generated design.")
    } catch {
      toast.error("Could not parse AI design. Please generate again.")
    } finally {
      replaceToCurrentView()
    }
  }, [
    replacePlan,
    replaceToCurrentView,
    setActiveCloudPlanId,
    setPlanName,
    setResults,
    shouldApplyAiDesign,
  ])
}
