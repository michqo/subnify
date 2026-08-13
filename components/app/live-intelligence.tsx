"use client"

import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { explainAllocation, type PlanDiagnostics } from "@/lib/planner/diagnostics"

export function LiveIntelligence({ diagnostics }: { diagnostics: PlanDiagnostics }) {
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setExpanded(localStorage.getItem("subnify-guidance") !== "collapsed")
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  const setGuidance = (nextExpanded: boolean) => {
    setExpanded(nextExpanded)
    localStorage.setItem("subnify-guidance", nextExpanded ? "expanded" : "collapsed")
  }

  return (
    <aside aria-label="Capacity" className="rounded-md border border-border bg-card/80 p-4 lg:sticky lg:top-20 lg:self-start">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {diagnostics.isValid ? (
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertTriangle className="size-4 text-destructive" />
          )}
          <h2 className="font-mono text-sm font-semibold">Capacity</h2>
        </div>
        <span className="font-mono text-xs text-muted-foreground">{diagnostics.utilizationPercent}% used</span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 border-y border-border py-3 text-sm">
        <div><dt className="text-xs text-muted-foreground">Available</dt><dd className="mt-1 font-mono">{diagnostics.totalAddresses.toLocaleString()}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Remaining</dt><dd className="mt-1 font-mono">{diagnostics.remainingAddresses.toLocaleString()}</dd></div>
      </dl>

      {diagnostics.issues.length > 0 ? (
        <div className="mt-4 space-y-2">
          {diagnostics.issues.map((issue, index) => (
            <p key={`${issue.code}-${issue.field}-${index}`} className="text-sm text-destructive">
              {issue.message}
            </p>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          Fits · {diagnostics.remainingAddresses.toLocaleString()} addresses free
        </p>
      )}

      {diagnostics.allocations.length > 0 ? (
        <div className="mt-4 border-t border-border pt-3">
          <Button
            variant="ghost"
            size="sm"
            className="min-h-11 w-full justify-between px-0 md:min-h-9"
            aria-expanded={expanded}
            aria-controls="allocation-explanations"
            onClick={() => setGuidance(!expanded)}
          >
            {expanded ? "Hide allocation notes" : "Allocation notes"}
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </Button>
          {expanded ? (
            <div id="allocation-explanations" className="mt-2 space-y-3">
              {diagnostics.allocations.map((allocation) => (
                <div key={`${allocation.name}-${allocation.startOffset}`} className="border-l-2 border-primary pl-3">
                  <p className="font-mono text-xs font-medium">{allocation.name} · /{allocation.cidr}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{explainAllocation(allocation)}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </aside>
  )
}
