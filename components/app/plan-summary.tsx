import type { PlanDiagnostics } from "@/lib/planner/diagnostics"

export function PlanSummary({ diagnostics, resultsAreStale }: { diagnostics: PlanDiagnostics; resultsAreStale: boolean }) {
  return (
    <div className="border-y border-border py-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.12em]">Address summary</h2>
        {resultsAreStale ? <span className="font-mono text-xs text-amber-700 dark:text-amber-300">Results outdated · recalculate</span> : null}
      </div>
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          ["Subnets", diagnostics.allocations.length.toLocaleString()],
          ["Allocated", diagnostics.allocatedAddresses.toLocaleString()],
          ["Free", diagnostics.remainingAddresses.toLocaleString()],
          ["Utilization", `${diagnostics.utilizationPercent}%`],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-1 font-mono text-lg font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
