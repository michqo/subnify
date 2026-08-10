"use client"

import { LayoutTemplate, Sparkles } from "lucide-react"
import { useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { GenerateRequirementsDialog } from "@/components/app/generate-requirements-dialog"
import { TemplateDialog } from "@/components/app/template-dialog"
import { useAuth } from "@/components/core/auth-provider"
import { Button } from "@/components/ui/button"
import type { ReplacePlanInput } from "@/lib/state/subnet-plan-types"

type PlannerToolbarProps = {
  planName: string
  hasMeaningfulEdits: boolean
  onApplyTemplate: (plan: ReplacePlanInput) => void
  onApplyRequirements: (plan: ReplacePlanInput) => void
}

export function PlannerToolbar({ planName, hasMeaningfulEdits, onApplyTemplate, onApplyRequirements }: PlannerToolbarProps) {
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [generatorOpen, setGeneratorOpen] = useState(() => searchParams.get("generate") === "1")
  const { isAuthenticated, openAuthDialog } = useAuth()

  useEffect(() => {
    if (searchParams.get("generate") !== "1") return
    const next = new URLSearchParams(searchParams.toString())
    next.delete("generate")
    const query = next.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [pathname, router, searchParams])

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-primary">IPv4 plan</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">{planName.trim() || "Untitled plan"}</h1>
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
      {generatorOpen ? (
        <GenerateRequirementsDialog open onOpenChange={setGeneratorOpen} onApply={onApplyRequirements} />
      ) : null}
    </>
  )
}
