"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PLANNER_TEMPLATES, templateToPlan, type PlannerTemplate } from "@/lib/planner/templates"
import type { ReplacePlanInput } from "@/lib/state/subnet-plan-types"

type TemplateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  hasMeaningfulEdits: boolean
  onApply: (plan: ReplacePlanInput) => void
}

export function TemplateDialog({ open, onOpenChange, hasMeaningfulEdits, onApply }: TemplateDialogProps) {
  const [pendingTemplate, setPendingTemplate] = useState<PlannerTemplate | null>(null)

  const applyTemplate = (template: PlannerTemplate) => {
    onApply(templateToPlan(template))
    setPendingTemplate(null)
    onOpenChange(false)
  }

  const chooseTemplate = (template: PlannerTemplate) => {
    if (hasMeaningfulEdits) {
      setPendingTemplate(template)
      return
    }
    applyTemplate(template)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setPendingTemplate(null)
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="max-w-xl rounded-md">
        <DialogHeader>
          <DialogTitle className="font-mono">Start from a template</DialogTitle>
          <DialogDescription>
            Use a realistic network shape, then adjust every value in the planner.
          </DialogDescription>
        </DialogHeader>

        {pendingTemplate ? (
          <div className="space-y-4">
            <div className="border-l-2 border-primary bg-accent/40 p-4">
              <p className="font-medium">Replace your current inputs?</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Applying {pendingTemplate.title} replaces the current base network and subnet requirements.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPendingTemplate(null)}>Back</Button>
              <Button onClick={() => applyTemplate(pendingTemplate)}>Replace current plan</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="divide-y divide-border border-y border-border">
            {PLANNER_TEMPLATES.map((template) => (
              <button
                key={template.slug}
                type="button"
                onClick={() => chooseTemplate(template)}
                className="flex w-full items-start justify-between gap-4 px-1 py-4 text-left transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span>
                  <span className="block font-medium text-foreground">{template.title}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{template.description}</span>
                </span>
                <span className="shrink-0 font-mono text-xs text-muted-foreground">
                  {template.baseNetwork}/{template.baseCidr}
                </span>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
