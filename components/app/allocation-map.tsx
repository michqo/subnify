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
            <button
              key={result.requirementId}
              type="button"
              aria-label={`${result.name} /${result.cidr}, ${result.blockSize} addresses`}
              aria-pressed={selected}
              onClick={() => onToggleSubnet(subnetId)}
              className={cn(
                "absolute inset-y-0 min-h-11 overflow-hidden border-r border-background/60 bg-primary/25 px-1 font-mono text-[10px] transition-[box-shadow,background-color] duration-150 hover:bg-primary/35 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:min-h-0",
                index % 2 === 1 && "bg-primary/40",
                selected &&
                  "z-10 border-2 border-primary bg-primary/55 shadow-[inset_0_0_0_2px_var(--primary)]"
              )}
              style={{ left: `${left}%`, width: `${Math.max(width, 0.5)}%` }}
            >
              {width >= 10 ? (
                <span>
                  {result.name}
                  <br />/{result.cidr}
                </span>
              ) : null}
            </button>
          )
        })}
        {calculation.remainingAddresses > 0 ? (
          <div
            className="absolute inset-y-0 right-0 flex items-center justify-center bg-muted px-2 font-mono text-[10px] text-muted-foreground"
            style={{
              width: `${(calculation.remainingAddresses / totalAddresses) * 100}%`,
            }}
          >
            {calculation.remainingAddresses} addresses free
          </div>
        ) : null}
      </div>
      <p className="font-mono text-xs text-muted-foreground">
        {calculation.allocatedAddresses.toLocaleString()} allocated ·{" "}
        {calculation.remainingAddresses.toLocaleString()} addresses free
      </p>
    </div>
  )
}
