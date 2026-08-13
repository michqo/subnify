import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { calculateVlsm } from "@/lib/vlsm"

function calculatePreview() {
  const result = calculateVlsm({
    baseNetwork: "192.168.10.0",
    baseCidr: 24,
    subnets: [
      { id: 1, name: "Engineering", hosts: 62 },
      { id: 2, name: "Guest Wi-Fi", hosts: 40 },
    ],
  })

  if (!result.ok) throw new Error("Landing preview VLSM calculation failed.")
  return result
}

const preview = calculatePreview()

export function HeroSection() {
  return (
    <section className="mx-auto grid min-h-[calc(100svh-3.5rem)] max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[.9fr_1.1fr] lg:px-8">
      <div>
        <h1 className="max-w-2xl text-5xl font-semibold tracking-[-0.045em] text-balance sm:text-6xl">
          Every address accounted for.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
          Enter a network and host counts. Get valid CIDR blocks, free space, and exports.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/app">
              Plan a network <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="#how-it-works">See an example</Link>
          </Button>
        </div>
      </div>

      <div
        role="region"
        aria-label="192.168.10.0/24 preview"
        className="border-y border-border bg-background/50"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3 font-mono text-xs">
          <span>192.168.10.0/24</span>
          <span className="text-emerald-600 dark:text-emerald-400">valid</span>
        </div>
        <div className="space-y-4 p-4 sm:p-5">
          <div
            role="img"
            aria-label="Preview allocation for 192.168.10.0/24"
            className="mt-5 flex h-2 overflow-hidden bg-muted"
          >
            {preview.allocations.map((allocation) => (
              <span
                key={allocation.requirementId}
                className="basis-0 bg-primary/70"
                style={{ flexGrow: allocation.blockSize }}
              />
            ))}
            <span
              className="basis-0 bg-muted"
              style={{ flexGrow: preview.remainingAddresses }}
            />
          </div>
          {preview.allocations.map((allocation) => (
            <div key={allocation.name} className="grid grid-cols-[1fr_auto] gap-3 border-b border-border pb-3">
              <span className="text-sm font-medium">{allocation.name}</span>
              <span className="font-mono text-xs text-muted-foreground">
                {allocation.requiredHosts} hosts · /{allocation.cidr}
              </span>
            </div>
          ))}
          <div className="grid grid-cols-3 gap-3 border-t border-border pt-4 font-mono text-xs">
            <div>
              <span className="block text-lg font-semibold text-foreground">{preview.allocations.length}</span>
              subnets
            </div>
            <div>
              <span className="block text-lg font-semibold text-foreground">{preview.allocatedAddresses}</span>
              allocated
            </div>
            <div>
              <span className="block text-lg font-semibold text-foreground">{preview.remainingAddresses}</span>
              free
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
