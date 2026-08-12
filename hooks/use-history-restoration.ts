"use client"

import { useEffect } from "react"
import type { Dispatch, SetStateAction } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import { toast } from "sonner"

import {
  parseSubnetInputArray,
  recalculateHistoryRecord,
  type CalculationRecord,
} from "@/lib/history"
import type { ReplacePlanInput } from "@/lib/state/subnet-plan-types"
import type { VlsmCalculationSuccess, VlsmIssue } from "@/lib/vlsm"

type UseHistoryRestorationArgs = {
  historyId: string | null
  isAuthenticated: boolean
  supabase: SupabaseClient
  replacePlan: (plan: ReplacePlanInput) => void
  replaceToCurrentView: () => void
  setCalculation: (
    calculation: VlsmCalculationSuccess | null,
    issues?: VlsmIssue[]
  ) => void
  setPlanName: Dispatch<SetStateAction<string>>
  setActiveCloudPlanId: Dispatch<SetStateAction<string | null>>
}

export function useHistoryRestoration({
  historyId,
  isAuthenticated,
  supabase,
  replacePlan,
  replaceToCurrentView,
  setCalculation,
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
        .select(
          "id,title,source_type,ai_prompt,ai_rationale,base_network,base_cidr,input_subnets,total_required_hosts,total_usable_hosts,created_at"
        )
        .eq("id", historyId)
        .single()

      if (ignore) {
        return
      }

      if (error || !data) {
        toast.error("Could not restore that history item.")
        return
      }

      const record: CalculationRecord = {
        id: String(data.id ?? ""),
        title: typeof data.title === "string" ? data.title : null,
        source_type: data.source_type === "ai_design" ? "ai_design" : "manual",
        ai_prompt: typeof data.ai_prompt === "string" ? data.ai_prompt : null,
        ai_rationale:
          typeof data.ai_rationale === "string" ? data.ai_rationale : null,
        base_network: String(data.base_network ?? ""),
        base_cidr: Number(data.base_cidr),
        input_subnets: parseSubnetInputArray(data.input_subnets),
        result_subnets: [],
        total_required_hosts: Number(data.total_required_hosts ?? 0),
        total_usable_hosts: Number(data.total_usable_hosts ?? 0),
        created_at: typeof data.created_at === "string" ? data.created_at : "",
      }
      const restored = recalculateHistoryRecord(record)

      replacePlan(restored.inputs)
      if (restored.calculation) {
        setCalculation(restored.calculation)
      } else {
        setCalculation(null, restored.issues)
      }

      setPlanName(typeof data.title === "string" ? data.title : "")
      setActiveCloudPlanId(record.id)
      toast.info(
        data.source_type === "ai_design"
          ? "Editing AI design plan from history."
          : "Editing saved plan from history."
      )
      replaceToCurrentView()
    }

    void restoreFromHistory()

    return () => {
      ignore = true
    }
  }, [
    historyId,
    isAuthenticated,
    replacePlan,
    replaceToCurrentView,
    setCalculation,
    setActiveCloudPlanId,
    setPlanName,
    supabase,
  ])
}
