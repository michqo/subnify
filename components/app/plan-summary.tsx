import type { PlanDiagnostics } from "@/lib/planner/diagnostics"

export function PlanSummary({ diagnostics, resultsAreStale }: { diagnostics: PlanDiagnostics; resultsAreStale: boolean }) {
  return (
    <section aria-label="Plan summary" className="border-y border-border py-4">
      {resultsAreStale ? (
        <p className="mb-3 font-mono text-xs text-amber-700 dark:text-amber-300">
          Results outdated · recalculate
        </p>
      ) : null}
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          ["Subnets", diagnostics.allocations.length.toLocaleString()],
          ["Allocated", diagnostics.allocatedAddresses.toLocaleString()],
          ["Free", diagnostics.remainingAddresses.toLocaleString()],
          ["Used", `${diagnostics.utilizationPercent}%`],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-1 font-mono text-lg font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
