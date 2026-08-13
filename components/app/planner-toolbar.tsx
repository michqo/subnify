"use client"

import { LayoutTemplate, Pencil, Sparkles } from "lucide-react"
import { type KeyboardEvent, useEffect, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { GenerateRequirementsDialog } from "@/components/app/generate-requirements-dialog"
import { TemplateDialog } from "@/components/app/template-dialog"
import { useAuth } from "@/components/core/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ReplacePlanInput } from "@/lib/state/subnet-plan-types"

type PlannerToolbarProps = {
  planName: string
  onPlanNameChange: (name: string) => void
  hasMeaningfulEdits: boolean
  onApplyTemplate: (plan: ReplacePlanInput) => void
  onApplyRequirements: (plan: ReplacePlanInput) => void
}

export function PlannerToolbar({
  planName,
  onPlanNameChange,
  hasMeaningfulEdits,
  onApplyTemplate,
  onApplyRequirements,
}: PlannerToolbarProps) {
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [draftName, setDraftName] = useState(planName)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const editSessionActiveRef = useRef(false)
  const originalNameRef = useRef(planName)
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [generatorOpen, setGeneratorOpen] = useState(() => searchParams.get("generate") === "1")
  const { isAuthenticated, isAuthLoading, openAuthDialog } = useAuth()
  const displayName = planName.trim() || "Untitled plan"

  const startNameEdit = () => {
    originalNameRef.current = planName
    setDraftName(planName)
    editSessionActiveRef.current = true
    setIsEditingName(true)
  }

  const commitNameEdit = () => {
    if (!editSessionActiveRef.current) return
    editSessionActiveRef.current = false
    onPlanNameChange(draftName.trim().length === 0 ? "" : draftName)
    setIsEditingName(false)
  }

  const cancelNameEdit = () => {
    if (!editSessionActiveRef.current) return
    editSessionActiveRef.current = false
    setDraftName(originalNameRef.current)
    setIsEditingName(false)
  }

  const handleNameKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault()
      event.currentTarget.blur()
    } else if (event.key === "Escape") {
      event.preventDefault()
      cancelNameEdit()
    }
  }

  useEffect(() => {
    if (!isEditingName) return
    nameInputRef.current?.focus()
    nameInputRef.current?.select()
  }, [isEditingName])

  useEffect(() => {
    if (searchParams.get("generate") !== "1" || isAuthLoading) return

    if (!isAuthenticated) {
      openAuthDialog("/app?generate=1")
    }

    const next = new URLSearchParams(searchParams.toString())
    next.delete("generate")
    const query = next.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [isAuthenticated, isAuthLoading, openAuthDialog, pathname, router, searchParams])

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-primary">IPv4 plan</p>
          <h1 className="mt-1 min-w-0 text-xl font-semibold tracking-tight">
            {isEditingName ? (
              <Input
                ref={nameInputRef}
                aria-label="Plan name"
                value={draftName}
                maxLength={80}
                onChange={(event) => setDraftName(event.target.value)}
                onBlur={commitNameEdit}
                onKeyDown={handleNameKeyDown}
                className="min-h-11 max-w-sm text-xl font-semibold md:min-h-11 md:text-xl"
              />
            ) : (
              <button
                type="button"
                aria-label={`Rename plan: ${displayName}`}
                onClick={startNameEdit}
                className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-md text-left outline-none transition-colors hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span className="truncate">{displayName}</span>
                <Pencil aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
              </button>
            )}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setTemplatesOpen(true)}>
            <LayoutTemplate className="size-4" /> Templates
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (!isAuthenticated) {
                openAuthDialog("/app?generate=1")
                return
              }
              setGeneratorOpen(true)
            }}
          >
            <Sparkles className="size-4" /> Generate requirements
          </Button>
        </div>
      </div>
      <TemplateDialog
        open={templatesOpen}
        onOpenChange={setTemplatesOpen}
        hasMeaningfulEdits={hasMeaningfulEdits}
        onApply={onApplyTemplate}
      />
      {generatorOpen && isAuthenticated ? (
        <GenerateRequirementsDialog open onOpenChange={setGeneratorOpen} onApply={onApplyRequirements} />
      ) : null}
    </>
  )
}
