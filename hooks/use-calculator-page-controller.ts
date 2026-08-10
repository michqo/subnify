"use client"

import { useCallback, useEffect, useMemo, useState, type SetStateAction } from "react"
import { toast } from "sonner"

import { exportVlsmPdf } from "@/lib/calculator/export-pdf"
import { totalAddressesFromCidr, type VlsmAllocation } from "@/lib/vlsm"
import { useCopyResults } from "@/hooks/use-copy-results"
import type { SubnetInput } from "@/lib/state/subnet-plan-types"
import { diagnosePlan } from "@/lib/planner/diagnostics"
import type { PlanView } from "@/lib/plan-view"

type SaveCalculationInput = {
  sourceType?: "manual" | "ai_design" | "history"
  aiPrompt?: string | null
  aiRationale?: string | null
  title?: string | null
  calculationId?: string | null
  successMessage?: string
}

type UseCalculatorPageControllerArgs = {
  formValues: {
    baseNetwork: string
    baseCidr: string
    subnets: SubnetInput[]
    sourceType: "manual" | "ai_design" | "history"
    aiPrompt: string | null
    aiRationale: string | null
  }
  isAiPlan: boolean
  isCloudLinkedPlan: boolean
  shouldSaveToCloud: boolean
  isAuthenticated: boolean
  signInToSaveMessage: string
  planName: string
  activeCloudPlanId: string | null
  updateSuccessMessage: string
  saveSuccessMessage: string
  saveCalculation: (
    calculatedResults: VlsmAllocation[],
    snapshot: { baseNetwork: string; baseCidr: string; subnets: SubnetInput[] },
    options?: SaveCalculationInput
  ) => Promise<void>
  calculateVlsm: (baseNetwork: string, subnets: SubnetInput[]) => VlsmAllocation[]
  resetPlanForm: () => void
  setPlanName: (value: string) => void
  setShouldSaveToCloud: (value: boolean) => void
  setActiveCloudPlanId: (value: string | null) => void
  emailConfirmedFromQuery: boolean
  buildAppUrl: (view?: PlanView) => string
  resolveViewFromQuery: () => PlanView
  replaceToCurrentView: () => void
}

export function useCalculatorPageController({
  formValues,
  isAiPlan,
  isCloudLinkedPlan,
  shouldSaveToCloud,
  isAuthenticated,
  signInToSaveMessage,
  planName,
  activeCloudPlanId,
  updateSuccessMessage,
  saveSuccessMessage,
  saveCalculation,
  calculateVlsm,
  resetPlanForm,
  setPlanName,
  setShouldSaveToCloud,
  setActiveCloudPlanId,
  emailConfirmedFromQuery,
  buildAppUrl,
  resolveViewFromQuery,
  replaceToCurrentView,
}: UseCalculatorPageControllerArgs) {
  const [results, setResults] = useState<VlsmAllocation[]>([])
  const [committedPlanFingerprint, setCommittedPlanFingerprint] = useState<string | null>(null)
  const { copied, copyResults } = useCopyResults()
  const [exporting, setExporting] = useState(false)
  const [selectedSubnet, setSelectedSubnet] = useState<number | null>(null)
  const currentPlanFingerprint = useMemo(
    () => JSON.stringify([formValues.baseNetwork, formValues.baseCidr, formValues.subnets]),
    [formValues.baseNetwork, formValues.baseCidr, formValues.subnets]
  )
  const diagnostics = useMemo(
    () => diagnosePlan({
      baseNetwork: formValues.baseNetwork,
      baseCidr: formValues.baseCidr,
      subnets: formValues.subnets,
    }),
    [formValues.baseNetwork, formValues.baseCidr, formValues.subnets]
  )

  const replaceResults = useCallback((nextResults: SetStateAction<VlsmAllocation[]>) => {
    setCommittedPlanFingerprint(null)
    setResults(nextResults)
  }, [])

  useEffect(() => {
    if (results.length > 0 && committedPlanFingerprint === null) {
      setCommittedPlanFingerprint(currentPlanFingerprint)
    }
  }, [committedPlanFingerprint, currentPlanFingerprint, results.length])

  useEffect(() => {
    let emailConfirmedFromHash = false
    if (typeof window !== "undefined" && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""))
      const callbackType = hashParams.get("type")
      emailConfirmedFromHash = callbackType === "signup"
    }

    if (!emailConfirmedFromQuery && !emailConfirmedFromHash) {
      return
    }

    toast.success("Email confirmed. Your account is ready.")

    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", buildAppUrl(resolveViewFromQuery()))
    } else {
      replaceToCurrentView()
    }
  }, [emailConfirmedFromQuery, buildAppUrl, resolveViewFromQuery, replaceToCurrentView])

  const calculateVLSM = useCallback(() => {
    if (!diagnostics.isValid) {
      toast.error("Fix the highlighted network inputs before calculating.")
      return
    }
    const calculatedResults = calculateVlsm(formValues.baseNetwork, formValues.subnets)
    setResults(calculatedResults)
    setCommittedPlanFingerprint(currentPlanFingerprint)

    const shouldPersist = isCloudLinkedPlan || shouldSaveToCloud
    if (!shouldPersist) {
      return
    }

    if (!isAuthenticated) {
      toast.info(signInToSaveMessage)
      return
    }

    void saveCalculation(
      calculatedResults,
      {
        baseNetwork: formValues.baseNetwork,
        baseCidr: formValues.baseCidr,
        subnets: formValues.subnets,
      },
      {
        sourceType: isAiPlan ? "ai_design" : formValues.sourceType,
        aiPrompt: formValues.aiPrompt,
        aiRationale: formValues.aiRationale,
        title: planName,
        calculationId: activeCloudPlanId,
        successMessage: isCloudLinkedPlan ? updateSuccessMessage : saveSuccessMessage,
      }
    )
  }, [
    activeCloudPlanId,
    calculateVlsm,
    currentPlanFingerprint,
    diagnostics.isValid,
    formValues,
    isAiPlan,
    isAuthenticated,
    isCloudLinkedPlan,
    planName,
    saveCalculation,
    saveSuccessMessage,
    shouldSaveToCloud,
    signInToSaveMessage,
    updateSuccessMessage,
  ])

  const exportPdf = useCallback(async () => {
    if (results.length === 0 || exporting) {
      return
    }

    setExporting(true)
    try {
      await exportVlsmPdf({
        results,
        baseNetwork: formValues.baseNetwork,
        baseCidr: formValues.baseCidr,
      })
    } finally {
      setExporting(false)
    }
  }, [exporting, formValues.baseCidr, formValues.baseNetwork, results])

  const onCopyResults = useCallback(() => {
    copyResults(results)
  }, [copyResults, results])

  const resetForm = useCallback(() => {
    resetPlanForm()
    setPlanName("")
    setShouldSaveToCloud(false)
    setActiveCloudPlanId(null)
    setResults([])
    setCommittedPlanFingerprint(null)
  }, [resetPlanForm, setActiveCloudPlanId, setPlanName, setShouldSaveToCloud])

  const totalUsable = results.reduce((acc, result) => acc + result.usableHosts, 0)
  const totalRequired = results.reduce((acc, result) => acc + result.requiredHosts, 0)
  const totalAddresses = totalAddressesFromCidr(formValues.baseCidr)
  const allocatedAddresses = results.reduce((acc, result) => acc + result.blockSize, 0)

  const handleToggleSubnet = useCallback((subnetId: number) => {
    setSelectedSubnet((current) => (current === subnetId ? null : subnetId))
  }, [])

  return {
    results,
    setResults: replaceResults,
    diagnostics,
    resultsAreStale: results.length > 0 && committedPlanFingerprint !== null && committedPlanFingerprint !== currentPlanFingerprint,
    copied,
    onCopyResults,
    exporting,
    exportPdf,
    selectedSubnet,
    handleToggleSubnet,
    totalUsable,
    totalRequired,
    totalAddresses,
    allocatedAddresses,
    calculateVLSM,
    resetForm,
  }
}
