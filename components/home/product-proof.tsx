import { calculateVlsm } from "@/lib/vlsm"

function calculateProof() {
  const result = calculateVlsm({
    baseNetwork: "10.30.0.0",
    baseCidr: 23,
    subnets: [
      { id: 1, name: "Staff", hosts: 120 },
      { id: 2, name: "Guest", hosts: 60 },
      { id: 3, name: "Voice", hosts: 40 },
      { id: 4, name: "IoT", hosts: 30 },
    ],
  })

  if (!result.ok) throw new Error("Landing proof VLSM calculation failed.")
  return result
}

const proof = calculateProof()
const steps = [
  ["01", "Input", "Parent range and required hosts."],
  ["02", "Allocate", "Smallest fitting blocks, largest first."],
  ["03", "Use", "Copy, export, or save."],
] as const

export function ProductProof() {
  const free = proof.remainingAddresses
  return (
    <section id="how-it-works" className="border-y border-border bg-card/55">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[.75fr_1.25fr]">
          <div>
            <h2 className="max-w-md text-3xl font-semibold tracking-tight">
              Host counts in. CIDR blocks out.
            </h2>
            <ol className="mt-8 space-y-6">
              {steps.map(([number, title, text]) => (
                <li key={number} className="grid grid-cols-[2.5rem_1fr] gap-3">
                  <span className="font-mono text-xs text-primary">{number}</span>
                  <span>
                    <strong className="block text-sm">{title}</strong>
                    <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-md border border-border bg-background/80 p-5"><div className="flex items-center justify-between border-b border-border pb-4"><span className="font-mono text-sm">10.30.0.0/23</span><span className="font-mono text-xs text-muted-foreground">{proof.parent.totalAddresses} addresses</span></div><div className="mt-5 flex h-20 overflow-hidden rounded-sm border border-border">{proof.allocations.map((allocation, index) => <div key={allocation.name} className={index % 2 ? "flex items-center justify-center bg-primary/35 px-2 font-mono text-[10px]" : "flex items-center justify-center bg-primary/20 px-2 font-mono text-[10px]"} style={{ flexGrow: allocation.blockSize }}>{allocation.name}<br />/{allocation.cidr}</div>)}<div className="flex items-center justify-center bg-muted px-2 font-mono text-[10px] text-muted-foreground" style={{ flexGrow: free }}>{free} free</div></div><div className="mt-5 divide-y divide-border border-y border-border">{proof.allocations.map((allocation) => <div key={allocation.name} className="grid grid-cols-[1fr_auto_auto] gap-4 py-3 text-sm"><span>{allocation.name}</span><span className="font-mono text-xs text-muted-foreground">{allocation.networkAddress}/{allocation.cidr}</span><span className="font-mono text-xs">{allocation.usableHosts} usable</span></div>)}</div></div>
        </div>
      </div>
    </section>
  )
}
