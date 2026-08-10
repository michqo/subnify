"use client"

import { LayoutTemplate } from "lucide-react"
import { useState } from "react"

import { TemplateDialog } from "@/components/app/template-dialog"
import { Button } from "@/components/ui/button"
import type { ReplacePlanInput } from "@/lib/state/subnet-plan-types"

type PlannerToolbarProps = {
  planName: string
  hasMeaningfulEdits: boolean
  onApplyTemplate: (plan: ReplacePlanInput) => void
}

export function PlannerToolbar({ planName, hasMeaningfulEdits, onApplyTemplate }: PlannerToolbarProps) {
  const [templatesOpen, setTemplatesOpen] = useState(false)

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-primary">IPv4 plan</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">{planName.trim() || "Untitled plan"}</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => setTemplatesOpen(true)}>
          <LayoutTemplate className="size-4" /> Templates
        </Button>
      </div>
      <TemplateDialog
        open={templatesOpen}
        onOpenChange={setTemplatesOpen}
        hasMeaningfulEdits={hasMeaningfulEdits}
        onApply={onApplyTemplate}
      />
    </>
  )
}
