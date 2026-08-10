"use client"

import type { ReactNode } from "react"

import { LiveIntelligence } from "@/components/app/live-intelligence"
import { PlannerToolbar } from "@/components/app/planner-toolbar"
import { PlanSummary } from "@/components/app/plan-summary"
import type { PlanDiagnostics } from "@/lib/planner/diagnostics"
import type { ReplacePlanInput } from "@/lib/state/subnet-plan-types"

type PlannerWorkspaceProps = {
  diagnostics: PlanDiagnostics
  resultsAreStale: boolean
  planName: string
  onPlanNameChange: (name: string) => void
  hasMeaningfulEdits: boolean
  onApplyTemplate: (plan: ReplacePlanInput) => void
  onApplyRequirements?: (plan: ReplacePlanInput) => void
  editor: ReactNode
  resultsContent: ReactNode
}

export function PlannerWorkspace({
  diagnostics,
  resultsAreStale,
  planName,
  hasMeaningfulEdits,
  onApplyTemplate,
  onApplyRequirements = onApplyTemplate,
  editor,
  resultsContent,
}: PlannerWorkspaceProps) {
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 px-4 py-5 lg:px-6 lg:py-6">
      <PlannerToolbar planName={planName} hasMeaningfulEdits={hasMeaningfulEdits} onApplyTemplate={onApplyTemplate} onApplyRequirements={onApplyRequirements} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,.65fr)]">
        <section aria-label="Plan editor" className="min-w-0 rounded-md border border-border bg-card/80 p-4 sm:p-5">{editor}</section>
        <LiveIntelligence diagnostics={diagnostics} />
      </div>
      <PlanSummary diagnostics={diagnostics} resultsAreStale={resultsAreStale} />
      <section aria-label="Plan results">{resultsContent}</section>
    </div>
  )
}
