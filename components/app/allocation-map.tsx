"use client"

import type { VlsmCalculationSuccess } from "@/lib/vlsm"
import { cn } from "@/lib/utils"

type AllocationMapProps = {
  calculation: VlsmCalculationSuccess
  selectedSubnet: number | null
  onToggleSubnet: (subnetId: number) => void
}

export function AllocationMap({
  calculation,
  selectedSubnet,
  onToggleSubnet,
}: AllocationMapProps) {
  const results = calculation.allocations
  const totalAddresses = calculation.parent.totalAddresses

  return (
    <div className="space-y-4">
      <div
        className="relative h-24 overflow-hidden rounded-sm border border-border bg-muted/60"
        role="img"
        aria-label="Address allocation map"
      >
        {results.map((result, index) => {
          const subnetId = result.requirementId
          const selected = selectedSubnet === subnetId
          const left =
            totalAddresses > 0 ? (result.startOffset / totalAddresses) * 100 : 0
          const width =
            totalAddresses > 0 ? (result.blockSize / totalAddresses) * 100 : 0
          return (
            <div
              key={result.requirementId}
              data-slot="allocation-segment"
              aria-hidden="true"
              className={cn(
                "absolute inset-y-0 overflow-hidden border-r border-background/60 bg-primary/25 px-1 font-mono text-[10px] transition-[box-shadow,background-color] duration-150",
                index % 2 === 1 && "bg-primary/40",
                selected &&
                  "z-10 border-2 border-primary bg-primary/55 shadow-[inset_0_0_0_2px_var(--primary)]"
              )}
              style={{ left: `${left}%`, width: `${width}%` }}
            >
              {width >= 10 ? (
                <span>
                  {result.name}
                  <br />/{result.cidr}
                </span>
              ) : null}
            </div>
          )
        })}
        {calculation.remainingAddresses > 0 ? (
          <div
            aria-hidden="true"
            className="absolute inset-y-0 right-0 flex items-center justify-center bg-muted px-2 font-mono text-[10px] text-muted-foreground"
            style={{
              width: `${(calculation.remainingAddresses / totalAddresses) * 100}%`,
            }}
          >
            {calculation.remainingAddresses} addresses free
          </div>
        ) : null}
      </div>
      <div
        role="group"
        aria-label="Select a subnet from allocation map"
        className="flex gap-2 overflow-x-auto pb-1"
      >
        {results.map((result) => {
          const selected = selectedSubnet === result.requirementId
          return (
            <button
              key={result.requirementId}
              type="button"
              aria-label={`${result.name} /${result.cidr}, ${result.blockSize} addresses`}
              aria-pressed={selected}
              onClick={() => onToggleSubnet(result.requirementId)}
              className={cn(
                "flex min-h-11 min-w-11 shrink-0 items-center gap-2 rounded-sm border border-border bg-card px-3 py-2 text-left hover:border-primary/60 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                selected && "border-primary bg-accent"
              )}
            >
              <span className="text-sm font-medium">{result.name}</span>
              <span className="font-mono text-xs text-muted-foreground">
                /{result.cidr} · {result.blockSize}
              </span>
            </button>
          )
        })}
      </div>
      <p className="font-mono text-xs text-muted-foreground">
        {calculation.allocatedAddresses.toLocaleString()} allocated ·{" "}
        {calculation.remainingAddresses.toLocaleString()} addresses free
      </p>
    </div>
  )
}
