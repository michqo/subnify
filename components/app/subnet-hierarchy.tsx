"use client"

import type { VlsmCalculationSuccess } from "@/lib/vlsm"
import { cn } from "@/lib/utils"

type SubnetHierarchyProps = {
  calculation: VlsmCalculationSuccess
  selectedSubnet: number | null
  onToggleSubnet: (subnetId: number) => void
}

export function SubnetHierarchy({
  calculation,
  selectedSubnet,
  onToggleSubnet,
}: SubnetHierarchyProps) {
  return (
    <div className="rounded-sm border border-border p-4">
      <div className="border-l-2 border-primary pl-3">
        <p className="font-mono text-sm font-semibold">
          {calculation.parent.networkAddress}/{calculation.parent.cidr}
        </p>
        <p className="text-xs text-muted-foreground">
          Parent · {calculation.parent.totalAddresses.toLocaleString()}{" "}
          addresses
        </p>
      </div>
      <div className="mt-4 ml-3 space-y-2 border-l border-border pl-5">
        {calculation.allocations.map((result) => {
          const subnetId = result.requirementId
          const selected = selectedSubnet === subnetId
          return (
            <button
              key={result.requirementId}
              type="button"
              aria-label={`${result.name} ${result.networkAddress}/${result.cidr}${selected ? " selected" : ""}`}
              aria-pressed={selected}
              onClick={() => onToggleSubnet(subnetId)}
              className={cn(
                "flex min-h-11 w-full items-center justify-between gap-4 rounded-sm border border-border bg-card px-3 py-2 text-left transition-colors duration-150 hover:border-primary/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:min-h-0",
                selected && "border-primary bg-accent"
              )}
            >
              <span>
                <span className="block text-sm font-medium">{result.name}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {result.networkAddress}/{result.cidr}
                </span>
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                {result.blockSize} addresses
              </span>
            </button>
          )
        })}
        {calculation.remainingAddresses > 0 ? (
          <div className="rounded-sm border border-dashed border-border px-3 py-2 font-mono text-xs text-muted-foreground">
            Unallocated · {calculation.remainingAddresses.toLocaleString()}{" "}
            addresses
          </div>
        ) : null}
      </div>
    </div>
  )
}
