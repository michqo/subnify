import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { diagnosePlan, explainAllocation } from "@/lib/planner/diagnostics"

const preview = diagnosePlan({
  baseNetwork: "192.168.10.0",
  baseCidr: "24",
  subnets: [
    { id: 1, name: "Engineering", hosts: 62 },
    { id: 2, name: "Guest Wi-Fi", hosts: 40 },
  ],
})

export function HeroSection() {
  return (
    <section className="mx-auto grid min-h-[calc(100svh-3.5rem)] max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[.9fr_1.1fr] lg:px-8">
      <div>
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-primary">IPv4 planning workspace</p>
        <h1 className="mt-5 max-w-xl text-5xl font-bold tracking-[-0.04em] text-balance sm:text-6xl">Address space, made legible.</h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
          Build VLSM plans, see allocation pressure, and understand every CIDR decision without leaving the workflow.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg"><Link href="/app">Open planner <ArrowRight className="size-4" /></Link></Button>
          <Button asChild size="lg" variant="outline"><Link href="#how-it-works">How it works</Link></Button>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card/90 shadow-2xl shadow-primary/5">
        <div className="flex items-center justify-between border-b border-border px-4 py-3 font-mono text-xs">
          <span>branch-office.plan</span><span className="text-emerald-600 dark:text-emerald-400">valid</span>
        </div>
        <div className="space-y-4 p-4 sm:p-5">
          <div className="grid grid-cols-[1fr_4rem] gap-2 font-mono text-sm"><span className="sr-only">192.168.10.0/24</span><div className="rounded-sm border border-input bg-background px-3 py-2">192.168.10.0</div><div className="rounded-sm border border-input bg-background px-3 py-2">/24</div></div>
          {preview.allocations.map((allocation) => (
            <div key={allocation.name} className="grid grid-cols-[1fr_auto] gap-3 border-b border-border pb-3"><span className="text-sm font-medium">{allocation.name}</span><span className="font-mono text-xs text-muted-foreground">{allocation.requiredHosts} hosts · /{allocation.cidr}</span></div>
          ))}
          <div className="border-l-2 border-primary bg-accent/50 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
            {explainAllocation(preview.allocations[0])}
          </div>
          <div className="grid grid-cols-3 gap-3 border-t border-border pt-4 font-mono text-xs"><div><span className="block text-lg font-semibold text-foreground">2</span>subnets</div><div><span className="block text-lg font-semibold text-foreground">50%</span>allocated</div><div><span className="block text-lg font-semibold text-foreground">128</span>free</div></div>
        </div>
      </div>
    </section>
  )
}
