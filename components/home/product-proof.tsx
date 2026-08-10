import { diagnosePlan } from "@/lib/planner/diagnostics"

const proof = diagnosePlan({
  baseNetwork: "10.30.0.0",
  baseCidr: "23",
  subnets: [
    { id: 1, name: "Staff", hosts: 120 },
    { id: 2, name: "Guest", hosts: 60 },
    { id: 3, name: "Voice", hosts: 40 },
    { id: 4, name: "IoT", hosts: 30 },
  ],
})

export function ProductProof() {
  const free = proof.remainingAddresses
  return (
    <section id="how-it-works" className="border-y border-border bg-card/55">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[.75fr_1.25fr]">
          <div><p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-primary">One continuous workflow</p><h2 className="mt-4 text-3xl font-semibold tracking-tight">Define. Inspect. Continue.</h2><ol className="mt-8 space-y-6">{[
            ["01", "Define requirements", "Enter a parent network and the hosts each segment must support."],
            ["02", "Inspect decisions", "Live checks expose capacity, reserved addresses, and the CIDR selected for every subnet."],
            ["03", "Save or hand off", "Keep plans in cloud history, copy network data, or export a readable PDF."],
          ].map(([number, title, text]) => <li key={number} className="grid grid-cols-[2.5rem_1fr] gap-3"><span className="font-mono text-xs text-primary">{number}</span><span><strong className="block text-sm">{title}</strong><span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{text}</span></span></li>)}</ol></div>
          <div className="rounded-md border border-border bg-background/80 p-5"><div className="flex items-center justify-between border-b border-border pb-4"><span className="font-mono text-sm">10.30.0.0/23</span><span className="font-mono text-xs text-muted-foreground">{proof.utilizationPercent}% used</span></div><div className="mt-5 flex h-20 overflow-hidden rounded-sm border border-border">{proof.allocations.map((allocation, index) => <div key={allocation.name} className={index % 2 ? "flex items-center justify-center bg-primary/35 px-2 font-mono text-[10px]" : "flex items-center justify-center bg-primary/20 px-2 font-mono text-[10px]"} style={{ width: `${(allocation.blockSize / proof.totalAddresses) * 100}%` }}>{allocation.name}<br />/{allocation.cidr}</div>)}<div className="flex items-center justify-center bg-muted px-2 font-mono text-[10px] text-muted-foreground" style={{ width: `${(free / proof.totalAddresses) * 100}%` }}>{free} free</div></div><div className="mt-5 divide-y divide-border border-y border-border">{proof.allocations.map((allocation) => <div key={allocation.name} className="grid grid-cols-[1fr_auto_auto] gap-4 py-3 text-sm"><span>{allocation.name}</span><span className="font-mono text-xs text-muted-foreground">{allocation.networkAddress}/{allocation.cidr}</span><span className="font-mono text-xs">{allocation.usableHosts} usable</span></div>)}</div></div>
        </div>
      </div>
    </section>
  )
}
