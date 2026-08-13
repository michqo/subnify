# Technical Editorial Product Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace generic product copy and repeated SaaS-card hierarchy across Subnify with a concise technical-editorial system built around real IPv4 data.

**Architecture:** Each product surface owns its copy and layout changes; shared UI primitives and application behavior remain unchanged. Landing, planner, history/help, and account/utility surfaces ship as independently tested tasks. Final Playwright coverage verifies whole-product language, desktop/mobile layout, dark mode, and accessibility contracts.

**Tech Stack:** Next.js 16.3 App Router, React 19, TypeScript, Tailwind CSS v4, `@miqal/theme`, Vitest/Testing Library, Playwright.

## Global Constraints

- Read relevant installed Next.js guides under `node_modules/next/dist/docs/` before editing Next components, metadata, CSS, or fonts.
- Use sans-serif for page titles, section titles, body copy, and actions; monospace only for IP addresses, CIDR prefixes, counts, short status, and compact metadata.
- Titles remain one to four words. Descriptions appear only for constraints, consequences, or unfamiliar actions.
- Do not use `made legible`, `one continuous workflow`, `ready when the network is`, `define, inspect, continue`, `committed results`, `current network map`, or generic `to continue` descriptions in visible product copy.
- Preserve VLSM validation errors, canonical suggestions, AI privacy/quota/validation facts, history boundaries, deletion/replacement consequences, password constraints, and authentication errors.
- Prefer border-separated sections over new cards. Keep cards only for dialogs, saved-plan records, and grouped actions requiring containment.
- Keep current Miqal blue palette, compact radius scale, focus rings, selected states, error/success colors, and shared header identity.
- Do not add gradients, glass effects, floating decoration, ornamental shadows, new illustration systems, or animation frameworks.
- No calculation, persistence, AI, history, authentication, API, route, database, quota, or migration behavior changes.
- Preserve one level-one heading per page/primary surface, logical heading order, visible form labels, live regions, validation focus, keyboard operation, reduced motion, and at least `44px` mobile targets.
- Page-level content must not overflow at `320px`, `390x844`, or desktop. Technical data may scroll only inside its owning container.
- Preserve unrelated untracked `AGENTS.md`, `CLAUDE.md`, and `docs/superpowers/plans/2026-08-12-subnify-miqal-theme-0.2.md`.

---

## File Structure

- Modify `app/globals.css`: reduce existing ambient background intensity only.
- Modify `app/page.tsx`: landing metadata and sans-serif page root.
- Modify `components/home/hero-section.tsx`: direct hero copy and technical specimen.
- Modify `components/home/product-proof.tsx`: concise three-step example section.
- Modify `components/home/cta-section.tsx`: single-line final action.
- Modify `app/app/page.tsx`: pass explicit current-plan metadata into planner workspace.
- Modify `components/app/planner-workspace.tsx`: carry explicit presentation props.
- Modify `components/app/planner-toolbar.tsx`: plan-title-first hierarchy and input metadata.
- Modify `components/app/calculator-input-section.tsx`: concise planner labels/state copy.
- Modify `components/app/live-intelligence.tsx`: capacity language and allocation-note controls.
- Modify `components/app/plan-summary.tsx`: heading-free metric strip.
- Modify `components/app/calculator-results-section.tsx`: direct result/action language.
- Modify `components/app/history-list.tsx`: saved-plan language and compact rename dialog.
- Modify `app/app/help/page.tsx`: concise reference structure preserving reliability facts.
- Modify `app/app/settings/page.tsx`: flat editorial sections and reduced helper copy.
- Modify `components/core/auth-dialog.tsx`: direct authentication titles.
- Modify `components/app/template-dialog.tsx`: concise template dialog.
- Modify `components/app/generate-requirements-dialog.tsx`: AI drafting language and rolling-window quota metadata.
- Modify `app/not-found.tsx`: minimal utility page.
- Create `tests/components/settings-page.test.tsx`: authenticated settings hierarchy contract.
- Create `tests/e2e/product-language.spec.ts`: whole-product copy/layout acceptance.
- Modify existing component and E2E tests beside every changed surface.

### Task 1: Landing Foundation and Technical Specimen

**Files:**
- Modify: `app/globals.css`
- Modify: `app/page.tsx`
- Modify: `components/home/hero-section.tsx`
- Modify: `components/home/product-proof.tsx`
- Modify: `components/home/cta-section.tsx`
- Test: `tests/components/home-page.test.tsx`

**Interfaces:**
- Consumes: unchanged `calculateVlsm()` result contracts for `192.168.10.0/24` and `10.30.0.0/23` specimens.
- Produces: landing anchors `/app` and `#how-it-works`; metadata description `Plan IPv4 subnets with VLSM, live capacity checks, saved history, and export.`

- [ ] **Step 1: Read installed Next metadata, CSS, and font guides**

Run:

```bash
sed -n '1,240p' node_modules/next/dist/docs/01-app/01-getting-started/14-metadata-and-og-images.md
sed -n '1,220p' node_modules/next/dist/docs/01-app/01-getting-started/11-css.md
sed -n '1,200p' node_modules/next/dist/docs/01-app/01-getting-started/13-fonts.md
```

Expected: page metadata remains a static `Metadata` export; global CSS stays imported only from root layout; existing Geist variables remain source of sans/mono fonts.

- [ ] **Step 2: Write failing landing copy tests**

Replace the landing test in `tests/components/home-page.test.tsx` with:

```tsx
import HomePage, { metadata as homeMetadata } from "@/app/page"

describe("Subnify landing", () => {
  it("leads with direct network language and real allocation data", () => {
    render(<HomePage />)

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Every address accounted for.",
      })
    ).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Plan a network" })).toHaveAttribute(
      "href",
      "/app"
    )
    expect(screen.getByRole("link", { name: "See an example" })).toHaveAttribute(
      "href",
      "#how-it-works"
    )
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Host counts in. CIDR blocks out.",
      })
    ).toBeInTheDocument()
    expect(screen.getByText("192.168.10.0/24")).toBeInTheDocument()
    expect(screen.getByText("Parent range and required hosts.")).toBeInTheDocument()
    expect(screen.getByText("Smallest fitting blocks, largest first.")).toBeInTheDocument()
    expect(screen.getByText("Copy, export, or save.")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Start with 192.168.1.0/24." })).toBeInTheDocument()
    expect(screen.queryByText("IPv4 planning workspace")).not.toBeInTheDocument()
    expect(screen.queryByText("Address space, made legible.")).not.toBeInTheDocument()
    expect(screen.queryByText("One continuous workflow")).not.toBeInTheDocument()
  })

  it("uses concrete landing metadata", () => {
    expect(homeMetadata.description).toBe(
      "Plan IPv4 subnets with VLSM, live capacity checks, saved history, and export."
    )
  })
})
```

Keep the help-page describe block below this test unchanged for Task 4.

- [ ] **Step 3: Run landing test and verify RED**

Run:

```bash
pnpm test tests/components/home-page.test.tsx
```

Expected: landing test FAILS on missing `Every address accounted for.`; existing help test still passes.

- [ ] **Step 4: Implement landing copy and hierarchy**

In `app/page.tsx`:

```tsx
export const metadata: Metadata = {
  title: "miqal / subnify",
  description:
    "Plan IPv4 subnets with VLSM, live capacity checks, saved history, and export.",
}

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <main>
        <HeroSection />
        <ProductProof />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
```

In `components/home/hero-section.tsx`, remove `explainAllocation` import and use this content contract:

```tsx
<div>
  <h1 className="max-w-2xl text-5xl font-semibold tracking-[-0.045em] text-balance sm:text-6xl">
    Every address accounted for.
  </h1>
  <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
    Enter a network and host counts. Get valid CIDR blocks, free space, and exports.
  </p>
  <div className="mt-8 flex flex-wrap gap-3">
    <Button asChild size="lg">
      <Link href="/app">Plan a network <ArrowRight className="size-4" /></Link>
    </Button>
    <Button asChild size="lg" variant="outline">
      <Link href="#how-it-works">See an example</Link>
    </Button>
  </div>
</div>
```

Render preview as `role="region" aria-label="192.168.10.0/24 preview"` in `border-y border-border bg-background/50`, without `rounded-md`, `shadow-*`, or marketing eyebrow. Header must show `192.168.10.0/24` and mono `valid`. Add a proportional strip:

```tsx
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
```

Keep allocation rows and totals. Remove allocation-explanation paragraph.

In `components/home/product-proof.tsx`, use:

```tsx
<h2 className="max-w-md text-3xl font-semibold tracking-tight">
  Host counts in. CIDR blocks out.
</h2>
```

Use exact steps:

```tsx
const steps = [
  ["01", "Input", "Parent range and required hosts."],
  ["02", "Allocate", "Smallest fitting blocks, largest first."],
  ["03", "Use", "Copy, export, or save."],
] as const
```

Remove `One continuous workflow` and `Define. Inspect. Continue.` Keep proof calculation, proportional bar, and allocation rows.

Replace `components/home/cta-section.tsx` with:

```tsx
import Link from "next/link"

import { Button } from "@/components/ui/button"

export function CTASection() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
      <h2 className="text-3xl font-semibold tracking-tight">
        Start with 192.168.1.0/24.
      </h2>
      <Button asChild size="lg" className="mt-8">
        <Link href="/app">Open planner</Link>
      </Button>
    </section>
  )
}
```

- [ ] **Step 5: Reduce existing background intensity**

In `app/globals.css`, keep three existing radial layers but use:

```css
body {
  background-image:
    radial-gradient(ellipse 80% 60% at 80% 0%, rgb(37 99 235 / 8%) 0%, transparent 65%),
    radial-gradient(ellipse 55% 45% at 10% 100%, rgb(37 99 235 / 4%) 0%, transparent 60%),
    radial-gradient(color-mix(in srgb, var(--dot-color) 45%, transparent) 1px, transparent 1px);

  &:is(.dark *) {
    background-image:
      radial-gradient(ellipse 80% 60% at 80% 0%, rgb(96 165 250 / 12%) 0%, transparent 65%),
      radial-gradient(ellipse 55% 45% at 10% 100%, rgb(96 165 250 / 7%) 0%, transparent 60%),
      radial-gradient(color-mix(in srgb, var(--dot-color) 55%, transparent) 1px, transparent 1px);
  }
}
```

Do not change theme tokens or reduced-motion rule.

- [ ] **Step 6: Verify landing GREEN**

Run:

```bash
pnpm test tests/components/home-page.test.tsx
pnpm lint app/page.tsx components/home/hero-section.tsx components/home/product-proof.tsx components/home/cta-section.tsx
pnpm typecheck
git diff --check
```

Expected: all commands exit `0`; landing and help tests pass.

- [ ] **Step 7: Commit landing refinement**

Run:

```bash
git add app/globals.css app/page.tsx components/home/hero-section.tsx components/home/product-proof.tsx components/home/cta-section.tsx tests/components/home-page.test.tsx
git commit -m "refactor: sharpen landing presentation"
```

### Task 2: Planner Title and Input Language

**Files:**
- Modify: `app/app/page.tsx`
- Modify: `components/app/planner-workspace.tsx`
- Modify: `components/app/planner-toolbar.tsx`
- Modify: `components/app/calculator-input-section.tsx`
- Modify: `tests/components/planner-workspace.test.tsx`
- Modify: `tests/components/calculator-input-section.test.tsx`
- Modify: `tests/e2e/planner.spec.ts`

**Interfaces:**
- Consumes: current `formValues.baseNetwork`, `formValues.baseCidr`, and `formValues.subnets.length` from calculator page.
- Produces: `PlannerWorkspaceProps.planBaseNetwork: string`, `planBaseCidr: string`, `requirementCount: number`; same three props forwarded to `PlannerToolbar`.

- [ ] **Step 1: Read installed client-component guide**

Run:

```bash
sed -n '1,240p' node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md
```

Expected: interactive state stays inside existing client boundaries; new metadata flows through serializable primitive props.

- [ ] **Step 2: Write failing planner hierarchy tests**

Update every `PlannerWorkspace` render in `tests/components/planner-workspace.test.tsx` with:

```tsx
planBaseNetwork="192.168.10.0"
planBaseCidr="24"
requirementCount={1}
```

Add:

```tsx
it("leads with plan name and current network metadata", () => {
  render(
    <PlannerWorkspace
      diagnostics={validDiagnostics}
      resultsAreStale={false}
      planName="Branch office"
      onPlanNameChange={vi.fn()}
      planBaseNetwork="192.168.10.0"
      planBaseCidr="24"
      requirementCount={1}
      hasMeaningfulEdits={false}
      onApplyTemplate={vi.fn()}
      editor={<div>Editor</div>}
      resultsContent={<div>Results</div>}
    />
  )

  expect(
    screen.getByRole("heading", { level: 1, name: "Branch office" })
  ).toBeInTheDocument()
  expect(screen.getByText("192.168.10.0/24 · 1 requirements")).toBeInTheDocument()
  expect(screen.queryByText("IPv4 plan")).not.toBeInTheDocument()
  expect(screen.getByRole("button", { name: "Draft requirements" })).toBeInTheDocument()
})
```

Add to `tests/components/calculator-input-section.test.tsx`:

```tsx
it("uses concise planner labels and state copy", () => {
  render(
    <CalculatorInputSection
      {...buildProps({
        isAuthenticated: true,
        shouldSaveToCloud: false,
      })}
    />
  )

  expect(screen.getByRole("heading", { name: "Plan" })).toBeInTheDocument()
  expect(screen.getByLabelText("Parent network")).toBeInTheDocument()
  expect(screen.getByLabelText("Prefix")).toBeInTheDocument()
  expect(screen.getByText("Requirements")).toBeInTheDocument()
  expect(screen.getByLabelText("Save to history")).toBeInTheDocument()
  expect(screen.queryByText(/Each entry defines/i)).not.toBeInTheDocument()
})
```

- [ ] **Step 3: Run focused tests and verify RED**

Run:

```bash
pnpm test tests/components/planner-workspace.test.tsx tests/components/calculator-input-section.test.tsx
```

Expected: FAIL on missing workspace props and old visible labels.

- [ ] **Step 4: Add explicit planner metadata props**

In `components/app/planner-workspace.tsx`, extend props:

```tsx
type PlannerWorkspaceProps = {
  diagnostics: PlanDiagnostics
  resultsAreStale: boolean
  planName: string
  onPlanNameChange: (name: string) => void
  planBaseNetwork: string
  planBaseCidr: string
  requirementCount: number
  hasMeaningfulEdits: boolean
  onApplyTemplate: (plan: ReplacePlanInput) => void
  onApplyRequirements?: (plan: ReplacePlanInput) => void
  editor: ReactNode
  resultsContent: ReactNode
}
```

Destructure and forward all three values to `PlannerToolbar`. In `app/app/page.tsx`, pass:

```tsx
planBaseNetwork={formValues.baseNetwork}
planBaseCidr={formValues.baseCidr}
requirementCount={formValues.subnets.length}
```

In `components/app/planner-toolbar.tsx`, extend `PlannerToolbarProps` with same three primitive fields and compute:

```tsx
const parentNetwork = planBaseNetwork.trim() || "—"
const prefix = planBaseCidr.trim() || "—"
const planMetadata = `${parentNetwork}/${prefix} · ${requirementCount} requirements`
```

Remove `IPv4 plan` paragraph. Render metadata below editable title:

```tsx
<p className="mt-1 font-mono text-xs text-muted-foreground">
  {planMetadata}
</p>
```

Change toolbar action text to `Draft requirements`; keep authentication and dialog behavior unchanged.

- [ ] **Step 5: Apply exact input copy**

In `components/app/calculator-input-section.tsx`, replace visible copy:

```text
Network input -> Plan
Base Network -> Parent network
CIDR Notation -> Prefix
Subnet Requirements -> Requirements
Save this manual calculation to cloud history -> Save to history
Editing AI design plan -> AI
Editing saved plan -> Saved
```

Remove `Each entry defines a subnet name and required hosts.`.

Use exact state descriptions:

```tsx
{isAiPlan ? (
  <Field>
    <FieldDescription>
      {isEditingAiCloudPlan
        ? "Calculate to update this saved AI plan."
        : "Calculate to save this AI plan."}
    </FieldDescription>
  </Field>
) : null}

{!isAiPlan && isCloudLinkedPlan ? (
  <Field>
    <FieldDescription>Calculate to update this saved plan.</FieldDescription>
  </Field>
) : null}
```

Keep input IDs, validation associations, suggestions, plan-name field, and submit/reset behavior unchanged.

- [ ] **Step 6: Update planner browser locators**

In `tests/e2e/planner.spec.ts`:

```tsx
this.baseNetwork = page.getByLabel("Parent network")
this.baseCidr = page.getByLabel("Prefix")
```

Change other direct `getByLabel("Base Network")` and `getByLabel("CIDR Notation")` calls to new labels. Do not change test behavior.

- [ ] **Step 7: Verify planner input GREEN**

Run:

```bash
pnpm test tests/components/planner-workspace.test.tsx tests/components/calculator-input-section.test.tsx
pnpm exec playwright test tests/e2e/planner.spec.ts
pnpm lint app/app/page.tsx components/app/planner-workspace.tsx components/app/planner-toolbar.tsx components/app/calculator-input-section.tsx tests/components/planner-workspace.test.tsx tests/components/calculator-input-section.test.tsx tests/e2e/planner.spec.ts
pnpm typecheck
git diff --check
```

Expected: component tests and planner E2E pass; other commands exit `0`.

- [ ] **Step 8: Commit planner input refinement**

Run:

```bash
git add app/app/page.tsx components/app/planner-workspace.tsx components/app/planner-toolbar.tsx components/app/calculator-input-section.tsx tests/components/planner-workspace.test.tsx tests/components/calculator-input-section.test.tsx tests/e2e/planner.spec.ts
git commit -m "refactor: tighten planner language"
```

### Task 3: Capacity, Summary, and Results Hierarchy

**Files:**
- Modify: `components/app/live-intelligence.tsx`
- Modify: `components/app/plan-summary.tsx`
- Modify: `components/app/calculator-results-section.tsx`
- Modify: `tests/components/planner-workspace.test.tsx`
- Modify: `tests/components/result-views.test.tsx`
- Modify: `tests/e2e/planner.spec.ts`

**Interfaces:**
- Consumes: unchanged `PlanDiagnostics` and `VlsmCalculationSuccess` values.
- Produces: capacity aside named `Capacity`, summary region named `Plan summary`, results region named `VLSM results`, actions `Copy all` and `Export PDF`.

- [ ] **Step 1: Write failing capacity and result tests**

In `tests/components/planner-workspace.test.tsx`, update collapsed-guidance assertions and add:

```tsx
it("presents capacity as a direct fit status", () => {
  render(
    <PlannerWorkspace
      diagnostics={validDiagnostics}
      resultsAreStale={false}
      planName="Branch office"
      onPlanNameChange={vi.fn()}
      planBaseNetwork="192.168.10.0"
      planBaseCidr="24"
      requirementCount={1}
      hasMeaningfulEdits={false}
      onApplyTemplate={vi.fn()}
      editor={<div>Editor</div>}
      resultsContent={<div>Results</div>}
    />
  )

  expect(screen.getByRole("heading", { name: "Capacity" })).toBeInTheDocument()
  expect(screen.getByText("Fits · 192 addresses free")).toBeInTheDocument()
  expect(screen.getByRole("region", { name: "Plan summary" })).toBeInTheDocument()
  expect(screen.getByText("Used")).toBeInTheDocument()
  expect(screen.queryByText("Address summary")).not.toBeInTheDocument()
})
```

Update `tests/components/result-views.test.tsx` action assertions:

```tsx
expect(screen.getByRole("heading", { name: "Results" })).toBeInTheDocument()
expect(screen.getByRole("button", { name: "Copy all" })).toBeDisabled()
expect(screen.getByRole("button", { name: "Export PDF" })).toBeDisabled()
expect(screen.getByText("Calculate a valid plan to see results.")).toBeInTheDocument()
```

Keep every calculation, selection, proportional-map, clipboard, and touch-size assertion.

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
pnpm test tests/components/planner-workspace.test.tsx tests/components/result-views.test.tsx
```

Expected: FAIL on old `Live checks`, `Address summary`, `Committed results`, `Copy`, and `PDF` copy.

- [ ] **Step 3: Refine capacity panel**

In `components/app/live-intelligence.tsx`:

```tsx
<aside aria-label="Capacity" className="rounded-md border border-border bg-card/80 p-4 lg:sticky lg:top-20 lg:self-start">
```

Use heading `Capacity`. Replace valid paragraph with:

```tsx
<p className="mt-4 text-sm text-muted-foreground">
  Fits · {diagnostics.remainingAddresses.toLocaleString()} addresses free
</p>
```

Use toggle labels:

```tsx
{expanded ? "Hide allocation notes" : "Allocation notes"}
```

Keep issue list, metrics, storage key, and allocation explanations unchanged.

- [ ] **Step 4: Flatten summary metrics**

Replace `PlanSummary` return with:

```tsx
<section aria-label="Plan summary" className="border-y border-border py-4">
  {resultsAreStale ? (
    <p className="mb-3 font-mono text-xs text-amber-700 dark:text-amber-300">
      Results outdated · recalculate
    </p>
  ) : null}
  <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
    {[
      ["Subnets", diagnostics.allocations.length.toLocaleString()],
      ["Allocated", diagnostics.allocatedAddresses.toLocaleString()],
      ["Free", diagnostics.remainingAddresses.toLocaleString()],
      ["Used", `${diagnostics.utilizationPercent}%`],
    ].map(([label, value]) => (
      <div key={label}>
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="mt-1 font-mono text-lg font-semibold">{value}</dd>
      </div>
    ))}
  </dl>
</section>
```

- [ ] **Step 5: Apply direct results language**

In `components/app/calculator-results-section.tsx`:

```text
aria-label="Committed VLSM results" -> aria-label="VLSM results"
Committed results -> Results
Copy -> Copy all
PDF -> Export PDF
Run a valid calculation to commit results. -> Calculate a valid plan to see results.
Calculate a plan to view allocation. -> Calculate a valid plan to see results.
Calculate a plan to view hierarchy. -> Calculate a valid plan to see results.
```

Pending labels remain `Copied` and `Exporting`. Keep disablement, table, map, hierarchy, copy, PDF, and selection behavior unchanged.

- [ ] **Step 6: Update planner E2E accessible names**

In `tests/e2e/planner.spec.ts`:

```tsx
this.copyButton = page.getByRole("button", { name: /^(Copy all|Copied)$/ })
this.pdfButton = page.getByRole("button", { name: /^(Export PDF|Exporting)$/ })
this.results = page.getByRole("region", { name: "VLSM results" })
```

Change `Committed results` heading assertions to `Results`. Keep exact clipboard and PDF behavior assertions.

- [ ] **Step 7: Verify capacity/results GREEN**

Run:

```bash
pnpm test tests/components/planner-workspace.test.tsx tests/components/result-views.test.tsx
pnpm exec playwright test tests/e2e/planner.spec.ts
pnpm lint components/app/live-intelligence.tsx components/app/plan-summary.tsx components/app/calculator-results-section.tsx tests/components/planner-workspace.test.tsx tests/components/result-views.test.tsx tests/e2e/planner.spec.ts
pnpm typecheck
git diff --check
```

Expected: component tests and planner E2E pass; other commands exit `0`.

- [ ] **Step 8: Commit planner output refinement**

Run:

```bash
git add components/app/live-intelligence.tsx components/app/plan-summary.tsx components/app/calculator-results-section.tsx tests/components/planner-workspace.test.tsx tests/components/result-views.test.tsx tests/e2e/planner.spec.ts
git commit -m "refactor: clarify planner output"
```

### Task 4: Saved Plans and IPv4 Reference

**Files:**
- Modify: `components/app/history-list.tsx`
- Modify: `app/app/help/page.tsx`
- Modify: `tests/components/history-list.test.tsx`
- Modify: `tests/components/home-page.test.tsx`
- Modify: `tests/e2e/history.spec.ts`

**Interfaces:**
- Consumes: unchanged calculation query/mutation hooks and help reliability facts.
- Produces: page headings `Saved plans` and `IPv4 reference`; search placeholder `Search name or network`; rename input `Name`.

- [ ] **Step 1: Write failing history and reference tests**

Add or update `tests/components/history-list.test.tsx` assertions:

```tsx
expect(screen.getByRole("heading", { level: 1, name: "Saved plans" })).toBeInTheDocument()
expect(screen.getByPlaceholderText("Search name or network")).toBeInTheDocument()
expect(screen.queryByText("Cloud workspace")).not.toBeInTheDocument()

await user.click(screen.getByRole("button", { name: "Rename Branch office" }))
expect(screen.getByRole("textbox", { name: "Name" })).toBeInTheDocument()
expect(screen.queryByText(/short name you can recognize/i)).not.toBeInTheDocument()
await user.click(screen.getByRole("button", { name: "Save" }))
```

In the help test inside `tests/components/home-page.test.tsx`, add:

```tsx
expect(
  screen.getByRole("heading", { level: 1, name: "IPv4 reference" })
).toBeInTheDocument()
for (const name of [
  "Start",
  "CIDR",
  "Validation",
  "Templates",
  "AI plans",
  "Results",
  "Examples",
  "History",
]) {
  expect(screen.getByRole("link", { name })).toBeInTheDocument()
}
expect(screen.queryByText("Using Subnify")).not.toBeInTheDocument()
```

Keep assertions for canonical addresses, `/31`, `/32`, stable ties, capacity, efficiency, examples, deterministic AI validation, stored fields, and deletion.

Update the existing factual assertions to match the shorter sentences while preserving their meaning:

```tsx
expect(screen.getByText(/Larger host requirements allocate first/i)).toBeInTheDocument()
expect(screen.getByText(/equal host counts keep input order/i)).toBeInTheDocument()
expect(screen.getByText(/Allocated addresses include/i)).toBeInTheDocument()
expect(screen.getByText(/parent cannot fit 3 usable hosts/i)).toBeInTheDocument()
expect(screen.getByText(/Saved records retain/i)).toBeInTheDocument()
expect(
  screen.getByText(/Confirmed deletion removes the cloud copy/i)
).toBeInTheDocument()
```

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
pnpm test tests/components/history-list.test.tsx tests/components/home-page.test.tsx
```

Expected: FAIL on old history/help headings and rename labels.

- [ ] **Step 3: Apply saved-plan copy**

In `components/app/history-list.tsx`:

```text
Plan history -> Saved plans
Sign in to view plans saved to cloud history. -> Sign in to view saved plans.
Search title or network -> Search name or network
No cloud plans yet. Save one from the planner. -> No saved plans.
Plan title -> Name
Save name -> Save
```

Remove `Cloud workspace` eyebrow and rename-dialog generic advice. Keep delete-dialog consequence unchanged. Keep filters, record metadata, all actions, mutation calls, and toasts.

Update `tests/e2e/history.spec.ts` heading to `Saved plans`; leave authentication heading unchanged until Task 5.

- [ ] **Step 4: Replace help sections with concise factual copy**

Replace `sections` in `app/app/help/page.tsx` with:

```tsx
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
```

Render heading `IPv4 reference` without eyebrow. Keep sticky desktop navigation and section anchors. Split article body into concise bordered sections; no cards.

- [ ] **Step 5: Verify history/reference GREEN**

Run:

```bash
pnpm test tests/components/history-list.test.tsx tests/components/home-page.test.tsx
pnpm exec playwright test tests/e2e/history.spec.ts
pnpm lint components/app/history-list.tsx app/app/help/page.tsx tests/components/history-list.test.tsx tests/components/home-page.test.tsx tests/e2e/history.spec.ts
pnpm typecheck
git diff --check
```

Expected: component and history E2E tests pass; other commands exit `0`.

- [ ] **Step 6: Commit history/reference refinement**

Run:

```bash
git add components/app/history-list.tsx app/app/help/page.tsx tests/components/history-list.test.tsx tests/components/home-page.test.tsx tests/e2e/history.spec.ts
git commit -m "refactor: simplify history and reference"
```

### Task 5: Settings, Dialogs, and Utility Copy

**Files:**
- Modify: `app/app/settings/page.tsx`
- Modify: `components/core/auth-dialog.tsx`
- Modify: `components/app/template-dialog.tsx`
- Modify: `components/app/generate-requirements-dialog.tsx`
- Modify: `app/not-found.tsx`
- Create: `tests/components/settings-page.test.tsx`
- Modify: `tests/components/template-dialog.test.tsx`
- Modify: `tests/components/generate-requirements-dialog.test.tsx`
- Modify: `tests/components/home-page.test.tsx`
- Modify: `tests/e2e/history.spec.ts`
- Modify: `tests/e2e/ai-designer.spec.ts`

**Interfaces:**
- Consumes: unchanged auth, settings mutation, template, and AI generation contracts.
- Produces: direct headings `Settings`, `Sign in`, `Choose a template`, `Draft requirements`, and `Page not found`.

- [ ] **Step 1: Write failing settings hierarchy test**

Create `tests/components/settings-page.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import SettingsPage from "@/app/app/settings/page"

vi.mock("@/components/core/auth-provider", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    refreshUser: vi.fn(),
    user: {
      email: "user@example.com",
      app_metadata: { provider: "email", providers: ["email"] },
      user_metadata: { display_name: "Network admin" },
    },
  }),
}))

vi.mock("@/lib/queries/settings", () => ({
  useUpdateUsernameMutation: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useChangePasswordMutation: () => ({ isPending: false, mutateAsync: vi.fn() }),
}))

vi.mock("@/components/ui/theme-toggle", () => ({
  ThemeToggle: () => <button type="button">Theme control</button>,
}))

describe("SettingsPage", () => {
  it("uses flat editorial sections without redundant descriptions", () => {
    render(<SettingsPage />)

    expect(screen.getByRole("heading", { level: 1, name: "Settings" })).toBeInTheDocument()
    for (const title of ["Appearance", "Profile", "Security"]) {
      const heading = screen.getByRole("heading", { level: 2, name: title })
      expect(heading.closest("section")).toBeInTheDocument()
    }
    expect(screen.queryByText("Preferences")).not.toBeInTheDocument()
    expect(screen.queryByText("Choose light, dark, or system theme.")).not.toBeInTheDocument()
    expect(screen.queryByText("Your email cannot be changed.")).not.toBeInTheDocument()
    expect(screen.queryByText("This will be shown instead of your email.")).not.toBeInTheDocument()
    expect(screen.getByText("Use at least 6 characters.")).toBeInTheDocument()
    expect(screen.getByLabelText("Email")).toBeDisabled()
  })
})
```

- [ ] **Step 2: Update dialog and utility tests before implementation**

In `tests/components/template-dialog.test.tsx`, assert heading `Choose a template` and absence of `Use a realistic network shape`.

In `tests/components/generate-requirements-dialog.test.tsx`, replace every button query `Generate requirements` with `Draft requirements`, every `Apply to planner` with `Apply`, and `Discard preview` with `Discard`. Add:

```tsx
expect(screen.getByText("Describe users, devices, and trust zones. Review before applying.")).toBeInTheDocument()
expect(screen.getByText("3 of 3 available · 24h")).toBeInTheDocument()
expect(screen.queryByText("Daily generation quota")).not.toBeInTheDocument()
```

Add to `tests/components/home-page.test.tsx`:

```tsx
import NotFound from "@/app/not-found"

describe("NotFound", () => {
  it("uses a minimal recovery page", () => {
    render(<NotFound />)

    expect(screen.getByRole("heading", { level: 1, name: "Page not found" })).toBeInTheDocument()
    expect(screen.getByText("Check the address or return to Subnify.")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Planner" })).toHaveAttribute("href", "/app")
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/")
    expect(screen.queryByText("Path Resolution Trace")).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run focused tests and verify RED**

Run:

```bash
pnpm test tests/components/settings-page.test.tsx tests/components/template-dialog.test.tsx tests/components/generate-requirements-dialog.test.tsx tests/components/home-page.test.tsx
```

Expected: FAIL on card-based settings structure and old dialog/404 copy.

- [ ] **Step 4: Flatten settings sections**

In `app/app/settings/page.tsx`, import `type ReactNode` and remove `Card*` imports. Add:

```tsx
function SettingsSection({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: ReactNode
}) {
  return (
    <section
      aria-labelledby={id}
      className="grid gap-5 py-6 sm:grid-cols-[10rem_minmax(0,1fr)]"
    >
      <h2 id={id} className="text-base font-semibold">
        {title}
      </h2>
      <div className="min-w-0">{children}</div>
    </section>
  )
}
```

Render only `<h1>Settings</h1>` above a `divide-y divide-border border-y border-border` wrapper. Replace Appearance/Profile/Security cards with `SettingsSection` using IDs `settings-appearance`, `settings-profile`, and `settings-security`. Keep forms and mutations unchanged.

Remove three redundant field descriptions named in test. Keep `Use at least 6 characters.`. Use sentence-case action/field copy:

```text
Save Username -> Save username
New Password -> New password
Confirm Password -> Confirm password
Change Password -> Change password
```

- [ ] **Step 5: Apply direct auth/template/AI copy**

In `components/core/auth-dialog.tsx`:

```tsx
<h1 className="text-2xl font-semibold tracking-tight">
  {mode === "sign-in" ? "Sign in" : "Create account"}
</h1>
{mode === "sign-up" ? (
  <p className="mt-2 text-muted-foreground">
    Save plans and draft requirements.
  </p>
) : null}
```

Remove sign-in `to continue` description. Preserve screen-reader `DialogTitle`/`DialogDescription`, fields, errors, and mode switching.

In `components/app/template-dialog.tsx`, use `Choose a template` and remove generic dialog description. Keep replacement warning and each concrete template description.

In `components/app/generate-requirements-dialog.tsx`, use exact copy:

```text
Generate requirements -> Draft requirements
Generating requirements -> Drafting requirements
Describe users and trust zones. Review every generated value before applying it to the planner. -> Describe users, devices, and trust zones. Review before applying.
Discard preview -> Discard
Apply to planner -> Apply
```

Replace quota row with:

```tsx
<div className="flex items-center justify-between border-y border-border py-2 font-mono text-xs text-muted-foreground">
  <span>AI quota</span>
  <span>
    {quotaLoading
      ? "Loading"
      : quota
        ? `${quota.remaining} of ${quota.limit} available · ${quota.windowHours}h`
        : "Unavailable"}
  </span>
</div>
```

Keep prompt, character count, provider call, normalized preview, errors, quota exhaustion, and apply behavior unchanged.

- [ ] **Step 6: Replace 404 presentation**

Replace `app/not-found.tsx` with:

```tsx
import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="flex min-h-[calc(100svh-3.5rem)] items-center px-4 py-16 lg:px-6">
      <div className="mx-auto w-full max-w-xl border-y border-border py-10">
        <p className="font-mono text-xs text-primary">404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-3 text-muted-foreground">Check the address or return to Subnify.</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Button asChild><Link href="/app">Planner</Link></Button>
          <Button asChild variant="outline"><Link href="/">Home</Link></Button>
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 7: Update auth E2E copy**

In `tests/e2e/history.spec.ts` and `tests/e2e/ai-designer.spec.ts`, change auth heading `Welcome back` to `Sign in`. In AI E2E, change absence check from `Generate requirements` to `Draft requirements`.

- [ ] **Step 8: Verify settings/dialogs/utility GREEN**

Run:

```bash
pnpm test tests/components/settings-page.test.tsx tests/components/template-dialog.test.tsx tests/components/generate-requirements-dialog.test.tsx tests/components/home-page.test.tsx
pnpm exec playwright test tests/e2e/history.spec.ts tests/e2e/ai-designer.spec.ts
pnpm lint app/app/settings/page.tsx components/core/auth-dialog.tsx components/app/template-dialog.tsx components/app/generate-requirements-dialog.tsx app/not-found.tsx tests/components/settings-page.test.tsx tests/components/template-dialog.test.tsx tests/components/generate-requirements-dialog.test.tsx tests/components/home-page.test.tsx tests/e2e/history.spec.ts tests/e2e/ai-designer.spec.ts
pnpm typecheck
git diff --check
```

Expected: focused component and E2E tests pass; other commands exit `0`.

- [ ] **Step 9: Commit account/utility refinement**

Run:

```bash
git add app/app/settings/page.tsx components/core/auth-dialog.tsx components/app/template-dialog.tsx components/app/generate-requirements-dialog.tsx app/not-found.tsx tests/components/settings-page.test.tsx tests/components/template-dialog.test.tsx tests/components/generate-requirements-dialog.test.tsx tests/components/home-page.test.tsx tests/e2e/history.spec.ts tests/e2e/ai-designer.spec.ts
git commit -m "refactor: simplify account surfaces"
```

### Task 6: Whole-Product Browser Acceptance and Release Gate

**Files:**
- Create: `tests/e2e/product-language.spec.ts`
- Modify: `tests/e2e/theme.spec.ts`

**Interfaces:**
- Consumes: completed page headings, labels, links, and layouts from Tasks 1–5.
- Produces: automated whole-product copy and responsive acceptance at desktop, `390x844`, and `320x844`.

- [ ] **Step 1: Write whole-product Playwright acceptance**

Create `tests/e2e/product-language.spec.ts`:

```tsx
import { expect, test, type Page } from "@playwright/test"

function captureConsoleErrors(page: Page) {
  const errors: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text())
  })
  return errors
}

async function expectNoPageOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth
      )
    )
    .toBeLessThanOrEqual(1)
}

for (const viewport of [
  { name: "desktop", width: 1280, height: 720 },
  { name: "mobile", width: 390, height: 844 },
  { name: "narrow", width: 320, height: 844 },
]) {
  test(`landing uses technical editorial hierarchy on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    const consoleErrors = captureConsoleErrors(page)
    await page.goto("/")

    await expect(
      page.getByRole("heading", { level: 1, name: "Every address accounted for." })
    ).toBeVisible()
    await expect(page.getByRole("link", { name: "Plan a network" })).toBeVisible()
    await page.getByRole("link", { name: "See an example" }).click()
    await expect(
      page.getByRole("heading", { name: "Host counts in. CIDR blocks out." })
    ).toBeVisible()
    await expect(page.getByText("10.30.0.0/23")).toBeVisible()
    await expectNoPageOverflow(page)
    expect(consoleErrors).toEqual([])
  })
}

test("reference, settings, and 404 use direct page language", async ({ page }) => {
  const consoleErrors = captureConsoleErrors(page)

  await page.goto("/app/help")
  await expect(page.getByRole("heading", { level: 1, name: "IPv4 reference" })).toBeVisible()
  await expect(page.getByRole("link", { name: "CIDR" })).toBeVisible()
  await expect(page.getByText("/31")).toBeVisible()

  await page.goto("/app/settings")
  await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible()
  await expect(page.getByRole("heading", { level: 2, name: "Appearance" })).toBeVisible()
  await expect(page.getByText("Preferences")).toHaveCount(0)

  await page.goto("/missing-product-page")
  await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible()
  await expect(page.getByRole("link", { name: "Planner" })).toBeVisible()
  await expectNoPageOverflow(page)
  expect(consoleErrors).toEqual([])
})
```

Do not use CSS class locators, `waitForTimeout`, serial shared state, or screenshot baselines.

- [ ] **Step 2: Extend theme test with sans/mono role check**

In `tests/e2e/theme.spec.ts`, add to existing light-theme test:

```tsx
const headingFamily = await page
  .getByRole("heading", { level: 1 })
  .evaluate((element) => getComputedStyle(element).fontFamily)
const networkFamily = await page
  .getByRole("region", { name: "192.168.10.0/24 preview" })
  .getByText("192.168.10.0/24", { exact: true })
  .evaluate((element) => getComputedStyle(element).fontFamily)

expect(headingFamily).not.toBe(networkFamily)
```

Keep current exact Miqal blue assertions in light and dark mode.

- [ ] **Step 3: Run new E2E tests and verify GREEN**

Run:

```bash
pnpm exec playwright test tests/e2e/product-language.spec.ts tests/e2e/theme.spec.ts
```

Expected: all product-language and theme scenarios pass with parallel workers.

- [ ] **Step 4: Run copy and scope scans**

Run:

```bash
rg -n "made legible|one continuous workflow|ready when the network is|Define\. Inspect\. Continue|Committed results|current network map|Sign in to your account to continue" app components
rg -n "font-mono" app/page.tsx
rg -n "calculateVlsm|saveCalculation|useGenerateAiDesignMutation|useCalculationsQuery" app components
git diff --check
```

Expected:

- first command exits `1` with no forbidden visible copy;
- second command exits `1`, proving landing root no longer forces monospace;
- third command lists only existing behavior call sites, with no new calculation/persistence integration added by this refinement;
- diff check exits `0`.

- [ ] **Step 5: Run complete release gate**

Run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
pnpm audit --prod
git diff --check
```

Expected: every command exits `0`; unit/component/route tests and all Playwright scenarios pass; production audit reports no known vulnerabilities.

- [ ] **Step 6: Commit browser acceptance**

Run:

```bash
git add tests/e2e/product-language.spec.ts tests/e2e/theme.spec.ts
git commit -m "test: verify editorial product refinement"
```

## Final Verification Checklist

- [ ] Landing uses exact hero/example/CTA copy and real network specimens.
- [ ] Landing page root no longer applies monospace globally.
- [ ] Existing background treatment is quieter in light and dark themes.
- [ ] Planner title is primary; current parent/prefix/count metadata is explicit.
- [ ] Planner labels are Plan, Parent network, Prefix, Requirements, and Save to history.
- [ ] Capacity, metric strip, Results, Copy all, and Export PDF use direct language.
- [ ] Saved plans and IPv4 reference preserve all behavior and reliability facts.
- [ ] Settings uses flat sections; auth, templates, AI drafting, and 404 use concise copy.
- [ ] Miqal header identity, blue tokens, validation messages, security copy, destructive consequences, and behavior contracts remain unchanged.
- [ ] Desktop, `390x844`, and `320x844` show no page-level horizontal overflow.
- [ ] Full release gate passes with zero production audit findings.
