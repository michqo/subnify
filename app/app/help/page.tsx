import Link from "next/link"

const sections = [
  { id: "quick-start", title: "Quick start", body: <>Choose a parent IPv4 network, add each required subnet with its host count, then calculate. Subnify allocates largest requirements first to keep the plan compact.</> },
  { id: "cidr", title: "CIDR and VLSM", body: <>CIDR describes block size. VLSM assigns a different block size to each requirement. A <code className="font-mono text-primary">/26</code> contains 64 addresses; 62 remain usable after network and broadcast addresses are reserved.</> },
  { id: "guidance", title: "Live checks", body: <>The planner validates the base address, CIDR alignment, host counts, and total capacity before calculation. Short explanations show why each subnet receives its CIDR. Hide them when you no longer need the context.</> },
  { id: "templates", title: "Templates", body: <>Home lab, small office, and segmented office templates provide editable starting points. Applying one replaces current inputs only after confirmation.</> },
  { id: "ai", title: "Generated requirements", body: <>Signed-in users can describe an environment in plain language. Generated requirements always appear as a preview. Nothing changes until you choose Apply to planner.</> },
  { id: "results", title: "Reading results", body: <>Table provides exact copyable values. Allocation map shows pressure and free space. Hierarchy shows every child block beneath the parent network. Selecting a subnet stays synchronized across views.</> },
  { id: "history", title: "History and export", body: <>Cloud history supports search, rename, duplicate, reopen, and delete. PDF creates a handoff-ready address plan; Copy places the full result set on the clipboard.</> },
]

export default function HelpPage() {
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-8 lg:grid-cols-[14rem_1fr] lg:px-6">
      <aside className="lg:sticky lg:top-20 lg:self-start"><p className="font-mono text-[11px] uppercase tracking-[0.14em] text-primary">Reference</p><h1 className="mt-2 text-2xl font-semibold">Using Subnify</h1><nav className="mt-6 flex flex-col gap-2">{sections.map((section) => <Link key={section.id} href={`#${section.id}`} className="font-mono text-xs text-muted-foreground hover:text-primary">{section.title}</Link>)}</nav></aside>
      <article className="divide-y divide-border border-y border-border">{sections.map((section) => <section key={section.id} id={section.id} className="scroll-mt-20 py-8"><h2 className="text-xl font-semibold">{section.title}</h2><p className="mt-3 max-w-3xl leading-7 text-muted-foreground">{section.body}</p></section>)}</article>
    </div>
  )
}
