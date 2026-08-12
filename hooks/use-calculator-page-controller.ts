"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { exportVlsmPdf } from "@/lib/calculator/export-pdf"
import type {
  VlsmCalculationResult,
  VlsmCalculationSuccess,
  VlsmIssue,
  VlsmPlanInput,
} from "@/lib/vlsm"
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

export type UseCalculatorPageControllerArgs = {
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
    calculation: VlsmCalculationSuccess,
    snapshot: { baseNetwork: string; baseCidr: string; subnets: SubnetInput[] },
    options?: SaveCalculationInput
  ) => Promise<void>
  calculateVlsm: (input: VlsmPlanInput) => VlsmCalculationResult
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
  const [calculation, setCalculation] = useState<VlsmCalculationSuccess | null>(
    null
  )
  const [submittedIssues, setSubmittedIssues] = useState<VlsmIssue[]>([])
  const [committedPlanFingerprint, setCommittedPlanFingerprint] = useState<
    string | null
  >(null)
  const { copied, copyResults } = useCopyResults()
  const [exporting, setExporting] = useState(false)
  const [selectedSubnet, setSelectedSubnet] = useState<number | null>(null)
  const currentPlanFingerprint = useMemo(
    () =>
      JSON.stringify([
        formValues.baseNetwork,
        formValues.baseCidr,
        formValues.subnets,
      ]),
    [formValues.baseNetwork, formValues.baseCidr, formValues.subnets]
  )
  const diagnostics = useMemo(
    () =>
      diagnosePlan({
        baseNetwork: formValues.baseNetwork,
        baseCidr: formValues.baseCidr,
        subnets: formValues.subnets,
      }),
    [formValues.baseNetwork, formValues.baseCidr, formValues.subnets]
  )

  const replaceCalculation = useCallback(
    (
      nextCalculation: VlsmCalculationSuccess | null,
      issues: VlsmIssue[] = []
    ) => {
      setCommittedPlanFingerprint(null)
      setSubmittedIssues(issues)
      setCalculation(nextCalculation)
    },
    []
  )

  useEffect(() => {
    if (calculation !== null && committedPlanFingerprint === null) {
      setCommittedPlanFingerprint(currentPlanFingerprint)
    }
  }, [calculation, committedPlanFingerprint, currentPlanFingerprint])

  const resultsAreStale =
    calculation !== null &&
    committedPlanFingerprint !== null &&
    committedPlanFingerprint !== currentPlanFingerprint

  useEffect(() => {
    let emailConfirmedFromHash = false
    if (typeof window !== "undefined" && window.location.hash) {
      const hashParams = new URLSearchParams(
        window.location.hash.replace(/^#/, "")
      )
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
  }, [
    emailConfirmedFromQuery,
    buildAppUrl,
    resolveViewFromQuery,
    replaceToCurrentView,
  ])

  const calculateVLSM = useCallback(() => {
    const baseCidr =
      formValues.baseCidr.trim() === ""
        ? Number.NaN
        : Number(formValues.baseCidr)
    const result = calculateVlsm({
      baseNetwork: formValues.baseNetwork,
      baseCidr,
      subnets: formValues.subnets,
    })
    if (!result.ok) {
      setCalculation(null)
      setCommittedPlanFingerprint(null)
      setSubmittedIssues(result.issues)
      return
    }
    setSubmittedIssues([])
    setCalculation(result)
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
      result,
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
        successMessage: isCloudLinkedPlan
          ? updateSuccessMessage
          : saveSuccessMessage,
      }
    )
  }, [
    activeCloudPlanId,
    calculateVlsm,
    currentPlanFingerprint,
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
    if (calculation === null || resultsAreStale || exporting) {
      return
    }

    setExporting(true)
    try {
      await exportVlsmPdf({
        calculation,
        planName,
      })
    } catch {
      toast.error("PDF export failed. Your plan is unchanged.")
    } finally {
      setExporting(false)
    }
  }, [calculation, exporting, planName, resultsAreStale])

  const onCopyResults = useCallback(() => {
    if (calculation === null || resultsAreStale) return
    void copyResults(calculation)
  }, [calculation, copyResults, resultsAreStale])

  const resetForm = useCallback(() => {
    resetPlanForm()
    setPlanName("")
    setShouldSaveToCloud(false)
    setActiveCloudPlanId(null)
    setCalculation(null)
    setSubmittedIssues([])
    setCommittedPlanFingerprint(null)
  }, [resetPlanForm, setActiveCloudPlanId, setPlanName, setShouldSaveToCloud])

  const handleToggleSubnet = useCallback((subnetId: number) => {
    setSelectedSubnet((current) => (current === subnetId ? null : subnetId))
  }, [])

  return {
    calculation,
    setCalculation: replaceCalculation,
    submittedIssues,
    diagnostics,
    resultsAreStale,
    copied,
    onCopyResults,
    exporting,
    exportPdf,
    selectedSubnet,
    handleToggleSubnet,
    calculateVLSM,
    resetForm,
  }
}
