import Link from "next/link"

const sections = [
  {
    id: "start",
    title: "Start",
    body: (
      <>
        Enter a parent IPv4 network and the host count for each requirement.
        Subnify validates the complete plan before it displays results or saves history.
      </>
    ),
  },
  {
    id: "cidr",
    title: "CIDR",
    body: (
      <>
        VLSM gives each requirement the smallest power-of-two block that fits
        its hosts plus reserved network and broadcast addresses. Larger host
        requirements allocate first; equal host counts keep input order. Parent
        prefixes may range from <code className="font-mono text-primary">/0</code>{" "}
        through <code className="font-mono text-primary">/30</code>. This planner
        excludes <code className="font-mono text-primary">/31</code> and{" "}
        <code className="font-mono text-primary">/32</code> allocations.
      </>
    ),
  },
  {
    id: "validation",
    title: "Validation",
    body: (
      <>
        Parent addresses must be canonical for their prefix. When an address is
        inside a network but not at its start, Subnify offers the canonical base.
        Parent capacity is its total address count; every child block must fit
        without overlap. Format, prefix, names, host counts, and capacity all
        validate before calculation.
      </>
    ),
  },
  {
    id: "templates",
    title: "Templates",
    body: (
      <>
        Home lab, small office, and segmented office templates provide editable
        starting values. Replacing changed inputs always requires confirmation.
      </>
    ),
  },
  {
    id: "ai-plans",
    title: "AI plans",
    body: (
      <>
        Signed-in users can draft requirements from a prompt. Every draft appears
        as a preview and passes through the same deterministic calculation engine
        as manual input. Nothing changes until you choose Apply.
      </>
    ),
  },
  {
    id: "results",
    title: "Results",
    body: (
      <>
        Allocated addresses include each child block&apos;s network and broadcast
        reservations. Usable hosts exclude those two addresses. Efficiency is
        requested hosts divided by allocated addresses. Table values are exact;
        the map and hierarchy show allocated and free parent space.
      </>
    ),
  },
  {
    id: "examples",
    title: "Examples",
    body: (
      <>
        <code className="font-mono text-primary">192.168.1.0/24</code> with a
        50-host LAN receives a <code className="font-mono text-primary">/26</code>:
        64 allocated addresses, 62 usable hosts, and 192 addresses free. A{" "}
        <code className="font-mono text-primary">/30</code> parent cannot fit 3
        usable hosts because that requirement needs an 8-address{" "}
        <code className="font-mono text-primary">/29</code> block.
      </>
    ),
  },
  {
    id: "history",
    title: "History",
    body: (
      <>
        Saved records retain title, source, parent network and prefix, requested
        subnets, calculated allocations, required and usable-host totals, and
        creation time. AI records also retain prompt and rationale. Confirmed
        deletion removes the cloud copy; copied results and exported PDFs remain.
      </>
    ),
  },
]

export default function HelpPage() {
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-8 lg:grid-cols-[14rem_1fr] lg:px-6">
      <aside className="lg:sticky lg:top-20 lg:self-start"><h1 className="text-2xl font-semibold">IPv4 reference</h1><nav className="mt-6 flex flex-col gap-2">{sections.map((section) => <Link key={section.id} href={`#${section.id}`} className="font-mono text-xs text-muted-foreground hover:text-primary">{section.title}</Link>)}</nav></aside>
      <article className="space-y-4">{sections.map((section) => <section key={section.id} id={section.id} className="scroll-mt-20 border-y border-border py-8"><h2 className="text-xl font-semibold">{section.title}</h2><p className="mt-3 max-w-3xl leading-7 text-muted-foreground">{section.body}</p></section>)}</article>
    </div>
  )
}
