"use client"

import { Suspense, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useSearchParams } from "next/navigation"

import { calculateVlsm } from "@/lib/vlsm"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/core/auth-provider"
import { usePlanViewState } from "@/hooks/use-plan-view-state"
import { usePlanPersistence } from "@/hooks/use-plan-persistence"
import { useHistoryRestoration } from "@/hooks/use-history-restoration"
import { CalculatorResultsSection } from "@/components/app/calculator-results-section"
import { CalculatorInputSection } from "@/components/app/calculator-input-section"
import { useCalculatorPlanForm } from "@/hooks/use-calculator-plan-form"
import { useCalculatorPageController } from "@/hooks/use-calculator-page-controller"
import { PlannerWorkspace } from "@/components/app/planner-workspace"

function CalculatorPageContent() {
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const { isAuthenticated, isAuthLoading, user } = useAuth()
  const {
    formValues,
    isAiPlan,
    setBaseNetwork,
    setBaseCidr,
    addSubnet,
    removeSubnet,
    updateSubnet,
    replacePlan,
    resetPlanForm,
  } = useCalculatorPlanForm()

  const { activeView, buildAppUrl, resolveViewFromQuery, handleViewChange, replaceToCurrentView } =
    usePlanViewState(searchParams)
  const saveSuccessMessage = "Calculation saved to history."
  const {
    planName,
    setPlanName,
    shouldSaveToCloud,
    setShouldSaveToCloud,
    activeCloudPlanId,
    setActiveCloudPlanId,
    isCloudLinkedPlan,
    saveCalculation,
  } = usePlanPersistence({
    user,
    isAuthenticated,
    isAuthLoading,
    saveSuccessMessage,
  })
  const isEditingAiCloudPlan = isAiPlan && isCloudLinkedPlan
  const historyIdFromQuery = searchParams.get("history")
  const emailConfirmedFromQuery = searchParams.get("emailConfirmed") === "1"
  const updateSuccessMessage = "Plan updated in cloud history."
  const signInToSaveMessage = "Sign in to save calculations to cloud history."

  useEffect(() => {
    if (planName.trim().length === 0 && typeof formValues.suggestedTitle === "string" && formValues.suggestedTitle.trim().length > 0) {
      setPlanName(formValues.suggestedTitle.trim())
    }
  }, [formValues.suggestedTitle, planName, setPlanName])

  const {
    calculation,
    submittedIssues,
    setCalculation,
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
  } = useCalculatorPageController({
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
    saveCalculation: (calculation, snapshot, options) =>
      saveCalculation(calculation.allocations, snapshot, options),
    calculateVlsm,
    resetPlanForm,
    setPlanName,
    setShouldSaveToCloud,
    setActiveCloudPlanId,
    emailConfirmedFromQuery,
    buildAppUrl,
    resolveViewFromQuery,
    replaceToCurrentView,
  })

  useHistoryRestoration({
    historyId: historyIdFromQuery,
    isAuthenticated,
    supabase,
    replacePlan,
    replaceToCurrentView,
    calculateVlsmFallback: calculateVlsm,
    setCalculation,
    setPlanName,
    setActiveCloudPlanId,
  })

  return (
    <div className="flex-1 overflow-auto">
      <PlannerWorkspace
        diagnostics={diagnostics}
        resultsAreStale={resultsAreStale}
        planName={planName}
        onPlanNameChange={setPlanName}
        hasMeaningfulEdits={
          formValues.baseNetwork !== "192.168.1.0" ||
          formValues.baseCidr !== "24" ||
          JSON.stringify(formValues.subnets) !== JSON.stringify([
            { id: 1, name: "LAN A", hosts: 50 },
            { id: 2, name: "LAN B", hosts: 25 },
            { id: 3, name: "LAN C", hosts: 10 },
          ])
        }
        onApplyTemplate={(plan) => {
          replacePlan(plan)
          setPlanName(plan.suggestedTitle ?? "")
          setCalculation(null)
        }}
        onApplyRequirements={(plan) => {
          replacePlan(plan)
          setPlanName(plan.suggestedTitle ?? "")
          setActiveCloudPlanId(null)
          setCalculation(null)
        }}
        editor={
          <CalculatorInputSection
              baseNetwork={formValues.baseNetwork}
              baseCidr={formValues.baseCidr}
              onBaseNetworkChange={setBaseNetwork}
              onBaseCidrChange={setBaseCidr}
              isAuthenticated={isAuthenticated}
              planName={planName}
              onPlanNameChange={setPlanName}
              isAiPlan={isAiPlan}
              isCloudLinkedPlan={isCloudLinkedPlan}
              isEditingAiCloudPlan={isEditingAiCloudPlan}
              shouldSaveToCloud={shouldSaveToCloud}
              onShouldSaveToCloudChange={setShouldSaveToCloud}
              subnets={formValues.subnets}
              onAddSubnet={addSubnet}
              onUpdateSubnet={updateSubnet}
              onRemoveSubnet={removeSubnet}
              onSubmit={calculateVLSM}
              onReset={resetForm}
              submittedIssues={submittedIssues}
            />
        }
        resultsContent={
          <CalculatorResultsSection
              calculation={calculation}
              resultsAreStale={resultsAreStale}
              activeView={activeView}
              onViewChange={handleViewChange}
              copied={copied}
              exporting={exporting}
              onCopyResults={onCopyResults}
              onExportPdf={exportPdf}
              selectedSubnet={selectedSubnet}
              onToggleSubnet={handleToggleSubnet}
            />
        }
      />
    </div>
  )
}

export default function CalculatorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 overflow-auto p-4 lg:p-6">
          <div className="mx-auto max-w-7xl space-y-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>
                  <Skeleton className="h-5 w-44" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Skeleton className="h-10 sm:col-span-2 lg:col-span-1" />
                  <Skeleton className="h-10 w-24" />
                </div>
                <Skeleton className="h-28 w-full" />
                <div className="flex justify-end gap-2">
                  <Skeleton className="h-11 w-24" />
                  <Skeleton className="h-11 w-36" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      }
    >
      <CalculatorPageContent />
    </Suspense>
  )
}
