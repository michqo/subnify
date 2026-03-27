"use client"

import { useCallback, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { toast } from "sonner"

import { useSaveCalculationMutation } from "@/lib/queries/calculations"
import type { PlanSource, SubnetInput } from "@/lib/state/subnet-plan-types"
import type { VlsmAllocation } from "@/lib/vlsm"

type SaveCalculationOptions = {
  sourceType?: PlanSource
  aiPrompt?: string | null
  aiRationale?: string | null
  title?: string | null
  calculationId?: string | null
  successMessage?: string
}

type SaveCalculationSnapshot = {
  baseNetwork: string
  baseCidr: string
  subnets: SubnetInput[]
}

type UsePlanPersistenceArgs = {
  user: User | null
  isAuthenticated: boolean
  isAuthLoading: boolean
  saveSuccessMessage: string
}

export function usePlanPersistence({
  user,
  isAuthenticated,
  isAuthLoading,
  saveSuccessMessage,
}: UsePlanPersistenceArgs) {
  const saveCalculationMutation = useSaveCalculationMutation()
  const [planName, setPlanName] = useState("")
  const [shouldSaveToCloud, setShouldSaveToCloud] = useState(false)
  const [activeCloudPlanId, setActiveCloudPlanId] = useState<string | null>(null)

  const saveCalculation = useCallback(
    async (
      calculatedResults: VlsmAllocation[],
      snapshot: SaveCalculationSnapshot,
      options?: SaveCalculationOptions
    ) => {
      if (isAuthLoading) {
        return
      }

      if (!isAuthenticated || !user) {
        return
      }

      try {
        const savedCalculationId = await saveCalculationMutation.mutateAsync({
          userId: user.id,
          calculatedResults,
          snapshot,
          options,
        })

        setActiveCloudPlanId(savedCalculationId)
        toast.success(options?.successMessage ?? saveSuccessMessage)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not save calculation."
        toast.error(message)
      }
    },
    [isAuthLoading, isAuthenticated, saveCalculationMutation, saveSuccessMessage, user]
  )

  return {
    planName,
    setPlanName,
    shouldSaveToCloud,
    setShouldSaveToCloud,
    activeCloudPlanId,
    setActiveCloudPlanId,
    isCloudLinkedPlan: activeCloudPlanId !== null,
    saveCalculation,
  }
}
