import Link from "next/link"

const sections = [
  {
    id: "quick-start",
    title: "Quick start",
    body: (
      <>
        Choose a parent IPv4 network, add each required subnet with its host
        count, then calculate. Subnify validates the complete plan before it
        displays results or saves history.
      </>
    ),
  },
  {
    id: "cidr",
    title: "CIDR and VLSM",
    body: (
      <>
        CIDR describes block size. VLSM assigns each requirement the smallest
        power-of-two block that can hold its requested hosts plus reserved
        network and broadcast addresses. Subnify allocates the largest requested
        host count first; equal requested-host counts retain input order.{" "}
        <code className="font-mono text-primary">/31</code> and{" "}
        <code className="font-mono text-primary">/32</code> allocations are
        excluded because this planner uses the traditional network/broadcast
        reservation model.
      </>
    ),
  },
  {
    id: "guidance",
    title: "Live checks",
    body: (
      <>
        The base must be the canonical network address for its CIDR. When the
        address belongs to a network but is not its start, the planner suggests
        the canonical base instead. Parent capacity is the parent block&apos;s total
        addresses; every allocated child block must fit within it. The planner
        validates base format, CIDR, names, host counts, and capacity before
        calculation.
      </>
    ),
  },
  { id: "templates", title: "Templates", body: <>Home lab, small office, and segmented office templates provide editable starting points. Applying one replaces current inputs only after confirmation.</> },
  {
    id: "ai",
    title: "Generated requirements",
    body: (
      <>
        Signed-in users can describe an environment in plain language. Generated
        requirements always appear as a preview, then pass through the same
        deterministic calculation engine as manual plans. Nothing changes until
        you choose Apply to planner.
      </>
    ),
  },
  {
    id: "results",
    title: "Reading results",
    body: (
      <>
        Allocated addresses are the sum of every assigned child block, including
        its reserved network and broadcast addresses. Usable hosts are the
        addresses available inside each child block after those two reservations.
        Efficiency compares requested hosts with allocated addresses: total
        requested hosts divided by total allocated addresses. The table provides
        exact copyable values; the allocation map and hierarchy show assigned
        and free parent space.
      </>
    ),
  },
  {
    id: "examples",
    title: "Worked examples",
    body: (
      <>
        Valid: <code className="font-mono text-primary">192.168.1.0/24</code>{" "}
        with a 50-host LAN receives a <code className="font-mono text-primary">/26</code>{" "}
        block: 64 allocated addresses, 62 usable hosts, and 192 addresses left
        in the parent. Failing: a <code className="font-mono text-primary">/30</code>{" "}
        parent cannot fit a requirement for 3 usable hosts, because that
        requirement needs an 8-address <code className="font-mono text-primary">/29</code>{" "}
        block.
      </>
    ),
  },
  {
    id: "history",
    title: "History and export",
    body: (
      <>
        Stored history includes the title, source, base network and CIDR,
        subnet names and requested hosts, calculated allocations, aggregate
        required and usable-host totals, and creation time. AI-generated entries
        also retain their prompt and rationale. Delete opens a confirmation;
        confirmed deletion removes the cloud copy after the service confirms it.
        Exported PDF files and copied results remain unchanged.
      </>
    ),
  },
]

export default function HelpPage() {
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-8 lg:grid-cols-[14rem_1fr] lg:px-6">
      <aside className="lg:sticky lg:top-20 lg:self-start"><p className="font-mono text-[11px] uppercase tracking-[0.14em] text-primary">Reference</p><h1 className="mt-2 text-2xl font-semibold">Using Subnify</h1><nav className="mt-6 flex flex-col gap-2">{sections.map((section) => <Link key={section.id} href={`#${section.id}`} className="font-mono text-xs text-muted-foreground hover:text-primary">{section.title}</Link>)}</nav></aside>
      <article className="divide-y divide-border border-y border-border">{sections.map((section) => <section key={section.id} id={section.id} className="scroll-mt-20 py-8"><h2 className="text-xl font-semibold">{section.title}</h2><p className="mt-3 max-w-3xl leading-7 text-muted-foreground">{section.body}</p></section>)}</article>
    </div>
  )
}
