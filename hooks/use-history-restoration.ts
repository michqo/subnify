"use client"

import { useEffect } from "react"
import type { Dispatch, SetStateAction } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import { toast } from "sonner"

import { parseSubnetInputArray, parseVlsmAllocations } from "@/lib/history"
import type { ReplacePlanInput } from "@/lib/state/subnet-plan-types"
import type {
  VlsmAllocation,
  VlsmCalculationResult,
  VlsmPlanInput,
} from "@/lib/vlsm"

type UseHistoryRestorationArgs = {
  historyId: string | null
  isAuthenticated: boolean
  supabase: SupabaseClient
  replacePlan: (plan: ReplacePlanInput) => void
  replaceToCurrentView: () => void
  calculateVlsmFallback: (input: VlsmPlanInput) => VlsmCalculationResult
  setResults: Dispatch<SetStateAction<VlsmAllocation[]>>
  setPlanName: Dispatch<SetStateAction<string>>
  setActiveCloudPlanId: Dispatch<SetStateAction<string | null>>
}

export function useHistoryRestoration({
  historyId,
  isAuthenticated,
  supabase,
  replacePlan,
  replaceToCurrentView,
  calculateVlsmFallback,
  setResults,
  setPlanName,
  setActiveCloudPlanId,
}: UseHistoryRestorationArgs) {
  useEffect(() => {
    if (!historyId || !isAuthenticated) {
      return
    }

    let ignore = false

    const restoreFromHistory = async () => {
      const { data, error } = await supabase
        .from("calculations")
        .select("id,title,source_type,ai_prompt,ai_rationale,base_network,base_cidr,input_subnets,result_subnets")
        .eq("id", historyId)
        .single()

      if (ignore) {
        return
      }

      if (error || !data) {
        toast.error("Could not restore that history item.")
        return
      }

      const inputSubnets = parseSubnetInputArray(data.input_subnets)
      const restoredSubnets = inputSubnets.map((subnet, index) => ({
        id: index + 1,
        name: subnet.name ?? `LAN ${String.fromCharCode(65 + (index % 26))}`,
        hosts: subnet.hosts,
      }))

      const restoredBaseNetwork = String(data.base_network ?? "192.168.1.0")
      const restoredBaseCidr = String(data.base_cidr ?? "24")

      replacePlan({
        baseNetwork: restoredBaseNetwork,
        baseCidr: restoredBaseCidr,
        subnets: restoredSubnets,
        sourceType: data.source_type === "ai_design" ? "ai_design" : "history",
        aiPrompt: data.source_type === "ai_design" ? data.ai_prompt : null,
        aiRationale: data.source_type === "ai_design" ? data.ai_rationale : null,
        suggestedTitle: typeof data.title === "string" ? data.title : null,
      })

      const restoredResults = parseVlsmAllocations(data.result_subnets)
      if (restoredResults.length > 0) {
        setResults(restoredResults)
      } else {
        const fallback = calculateVlsmFallback({
          baseNetwork: restoredBaseNetwork,
          baseCidr:
            restoredBaseCidr.trim() === ""
              ? Number.NaN
              : Number(restoredBaseCidr),
          subnets: restoredSubnets,
        })
        setResults(fallback.ok ? fallback.allocations : [])
      }

      setPlanName(typeof data.title === "string" ? data.title : "")
      setActiveCloudPlanId(data.id)
      toast.info(data.source_type === "ai_design" ? "Editing AI design plan from history." : "Editing saved plan from history.")
      replaceToCurrentView()
    }

    void restoreFromHistory()

    return () => {
      ignore = true
    }
  }, [
    calculateVlsmFallback,
    historyId,
    isAuthenticated,
    replacePlan,
    replaceToCurrentView,
    setActiveCloudPlanId,
    setPlanName,
    setResults,
    supabase,
  ])
}
