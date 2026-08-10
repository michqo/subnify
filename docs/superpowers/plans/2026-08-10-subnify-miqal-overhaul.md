# Subnify Miqal Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Subnify as a Miqal-branded IPv4 planning workspace with deterministic diagnostics, contextual learning, integrated AI requirements, templates, improved history, and a non-generic landing page.

**Architecture:** Preserve the VLSM engine, Supabase boundaries, TanStack Query server state, and existing form/persistence hooks. Add pure diagnostics and template modules, then compose them through focused planner components. Replace the sidebar shell with one Miqal product header and normalize every plan source through `ReplacePlanInput`.

**Tech Stack:** Next.js 16, React 19, TypeScript 5.9, Tailwind CSS 4, `@miqal/theme` 0.1.1, shadcn/ui, TanStack Query/Form, Supabase, Vitest, Testing Library, Playwright.

## Global Constraints

- Product balance: 65% professional, 35% learning.
- Keep IPv4 scope; do not add IPv6, collaboration, billing, public sharing, or chat UI.
- Use `@miqal/theme/theme.css` as canonical token source; no duplicated color/radius token block.
- Mono type for navigation, labels, and network data; sans type for guidance and prose.
- UI motion: 120–220 ms; landing entrance maximum 300 ms; respect reduced motion.
- Keep explicit Calculate/Recalculate; live diagnostics never persist or silently replace committed results.
- Desktop gutters: 24px. Mobile gutters: 16px. Below `lg`, intelligence moves below editor.
- Preserve `/app`, `/app/history`, `/app/help`, `/app/settings`; redirect `/app/designer` to `/app?generate=1`.
- Existing `view=cards` URLs resolve to `view=table`.
- Do not modify Supabase schema unless existing insert/update RLS proves insufficient.

---

## Planned File Structure

### New files

- `vitest.config.ts`: jsdom unit/component test configuration.
- `vitest.setup.ts`: Testing Library cleanup and DOM matchers.
- `playwright.config.ts`: browser-test configuration.
- `lib/projects.ts`: Miqal ecosystem application links.
- `lib/planner/diagnostics.ts`: pure IPv4, CIDR, capacity, and explanation diagnostics.
- `lib/planner/templates.ts`: typed built-in templates and application helper.
- `lib/plan-view.ts`: pure result-view type and legacy query migration.
- `components/core/miqal-header.tsx`: shared public/app product header.
- `components/app/planner-workspace.tsx`: top-level planner composition only.
- `components/app/planner-toolbar.tsx`: plan title, template, AI, save, and reset actions.
- `components/app/live-intelligence.tsx`: diagnostics, utilization, and explanations.
- `components/app/plan-summary.tsx`: committed-result metric strip.
- `components/app/generate-requirements-dialog.tsx`: integrated AI prompt and preview flow.
- `components/app/template-dialog.tsx`: template selection and replacement confirmation.
- `components/app/allocation-map.tsx`: synchronized proportional address map.
- `components/app/subnet-hierarchy.tsx`: synchronized parent/child allocation view.
- `components/home/product-proof.tsx`: deterministic production-style planner proof.
- `tests/lib/planner/diagnostics.test.ts`: diagnostics unit coverage.
- `tests/lib/planner/templates.test.ts`: template unit coverage.
- `tests/lib/plan-view-state.test.ts`: removed-card URL migration coverage.
- `tests/components/miqal-header.test.tsx`: header and responsive route behavior.
- `tests/components/planner-workspace.test.tsx`: planner flow and stale-result behavior.
- `tests/components/generate-requirements-dialog.test.tsx`: AI apply/cancel/error behavior.
- `tests/components/history-list.test.tsx`: history search/filter/action behavior.
- `tests/e2e/planner.spec.ts`: anonymous planner and responsive flow.
- `tests/e2e/history.spec.ts`: authenticated history flow using mocked Supabase boundary.
- `tests/e2e/ai-designer.spec.ts`: mocked AI generation application flow.

### Existing files with changed responsibility

- `package.json`: theme and test dependencies/scripts.
- `app/globals.css`: imports plus Subnify-only utilities.
- `app/layout.tsx`: theme-compatible font variables and root metadata.
- `components/ui/layout-shell.tsx`: one shell for public and application routes.
- `components/ui/nav-bar.tsx`: replaced by `MiqalHeader`, then removed.
- `app/app/layout.tsx`: remove sidebar provider; render application header and main outlet.
- `components/core/app-sidebar.tsx`: remove after navigation migration.
- `app/page.tsx` and `components/home/*`: new technical landing composition.
- `app/app/page.tsx`: controller wiring only; render `PlannerWorkspace`.
- `components/app/calculator-input-section.tsx`: split into editor primitives used by workspace.
- `components/app/calculator-results-section.tsx`: result tabs and actions; remove cards branch.
- `hooks/use-plan-view-state.ts`: support `table | visualizer | hierarchy`; migrate `cards`.
- `hooks/use-calculator-page-controller.ts`: diagnostics/stale state coordination and safe export errors.
- `lib/state/subnet-plan-types.ts`: shared normalized plan input types.
- `app/app/designer/page.tsx`: redirect compatibility route.
- `components/app/history-list.tsx`: search, filter, rename, duplicate, confirmation.
- `lib/queries/calculations.ts`: rename and duplicate mutations.
- `components/home/footer.tsx`: compact ecosystem footer.
- `app/app/help/page.tsx`: contextual learning reference.
- `lib/calculator/export-pdf.ts`: Miqal-styled report and deterministic filename helper.

---

### Task 1: Test Harness, Theme Foundation, and Miqal Header

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `playwright.config.ts`
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`
- Create: `lib/projects.ts`
- Create: `components/core/miqal-header.tsx`
- Modify: `components/ui/layout-shell.tsx`
- Modify: `app/app/layout.tsx`
- Remove: `components/core/app-sidebar.tsx`
- Remove: `components/ui/nav-bar.tsx`
- Test: `tests/components/miqal-header.test.tsx`

**Interfaces:**
- Produces: `PROJECT_LIST: Project[]` and `MiqalHeader({ variant }: { variant: "public" | "app" })`.
- Consumes: existing auth provider, theme toggle, pathname, shadcn dropdown/sheet/button primitives.

- [ ] **Step 1: Install exact foundation dependencies and scripts**

Add `@miqal/theme: ^0.1.1`; add dev dependencies `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `vite-tsconfig-paths`, and `@playwright/test`. Add scripts:

```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test"
}
```

Run: `pnpm install`
Expected: lockfile updates without peer-resolution errors.

- [ ] **Step 2: Create Vitest configuration**

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: { environment: "jsdom", setupFiles: ["./vitest.setup.ts"] },
})
```

Also install `@vitejs/plugin-react`. In `vitest.setup.ts`, import `@testing-library/jest-dom/vitest` and call Testing Library `cleanup` in `afterEach`.

- [ ] **Step 3: Write failing header tests**

```tsx
it("shows Miqal identity and app navigation", () => {
  render(<MiqalHeader variant="app" />)
  expect(screen.getByRole("link", { name: /miqal/i })).toBeInTheDocument()
  expect(screen.getByRole("link", { name: "Planner" })).toHaveAttribute("href", "/app")
  expect(screen.getByRole("link", { name: "History" })).toHaveAttribute("href", "/app/history")
  expect(screen.queryByText("AI Network Designer")).not.toBeInTheDocument()
})
```

Mock `next/navigation`, auth provider, and theme toggle with stable local values.

- [ ] **Step 4: Run header test and verify failure**

Run: `pnpm test -- tests/components/miqal-header.test.tsx`
Expected: FAIL because `MiqalHeader` does not exist.

- [ ] **Step 5: Implement theme imports and font mapping**

Replace local token declarations with:

```css
@import "tailwindcss";
@import "@miqal/theme/theme.css";
@import "shadcn/tailwind.css";

:root {
  --font-inter: var(--font-subnify-sans);
  --font-jetbrains-mono: var(--font-subnify-mono);
}
```

In `app/layout.tsx`, bind Inter to `--font-subnify-sans` and Geist Mono to `--font-subnify-mono`. Keep metadata and providers.

- [ ] **Step 6: Implement project links and header**

Define:

```ts
export type Project = { name: string; href: string; description: string; icon: LucideIcon }
export const PROJECT_LIST: Project[] = [
  { name: "Weather Station", href: "https://ms.miqal.xyz", description: "IoT monitoring dashboard", icon: Cloud },
  { name: "Subnify", href: "https://subnify.miqal.xyz", description: "IPv4 subnet planner", icon: Network },
  { name: "Sleep Cycle", href: "https://www.sleep.miqal.xyz", description: "Sleep schedule calculator", icon: Moon },
  { name: "Obedy", href: "https://obedy.miqal.xyz", description: "Menu obedov v okolí Nív", icon: Utensils },
]
```

Build one sticky header. Public variant links to landing anchors and `/app`; app variant links to Planner, History, Help. Both expose app switcher, source, theme, and account controls. Use `/miqal / subnify` mono wordmark. No standalone rounded network-logo tile.

- [ ] **Step 7: Replace sidebar shells**

`LayoutShell` renders `MiqalHeader` for every route with the correct variant. `app/app/layout.tsx` renders a simple min-height column and route content. Remove sidebar provider, sidebar trigger, sidebar component, and app-only duplicate navbar path.

- [ ] **Step 8: Run focused and project checks**

Run: `pnpm test -- tests/components/miqal-header.test.tsx && pnpm typecheck && pnpm lint`
Expected: all PASS.

- [ ] **Step 9: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts vitest.setup.ts playwright.config.ts app/globals.css app/layout.tsx lib/projects.ts components/core/miqal-header.tsx components/ui/layout-shell.tsx app/app/layout.tsx components/core/app-sidebar.tsx components/ui/nav-bar.tsx tests/components/miqal-header.test.tsx
git commit -m "feat: adopt Miqal theme and product shell"
```

---

### Task 2: Deterministic Planner Diagnostics

**Files:**
- Create: `lib/planner/diagnostics.ts`
- Test: `tests/lib/planner/diagnostics.test.ts`
- Modify: `lib/vlsm.ts`

**Interfaces:**
- Produces: `diagnosePlan(input: DiagnosePlanInput): PlanDiagnostics`.
- Produces: `explainAllocation(allocation: VlsmAllocation): string`.
- Consumes: `SubnetInput`, `totalAddressesFromCidr`, and `calculateVlsm`.

- [ ] **Step 1: Write failing diagnostics tests**

Cover valid `/24`, invalid octet, non-network base, invalid CIDR, zero hosts, duplicate/blank names, and capacity overflow:

```ts
expect(diagnosePlan({
  baseNetwork: "192.168.10.0",
  baseCidr: "24",
  subnets: [{ id: 1, name: "Engineering", hosts: 62 }],
})).toMatchObject({
  isValid: true,
  totalAddresses: 256,
  allocatedAddresses: 64,
  remainingAddresses: 192,
  utilizationPercent: 25,
})
```

For `192.168.10.10/24`, expect blocking code `base_not_aligned`. For two 126-host requirements inside `/24`, expect `capacity_overflow`.

- [ ] **Step 2: Run tests and verify failure**

Run: `pnpm test -- tests/lib/planner/diagnostics.test.ts`
Expected: FAIL because module does not exist.

- [ ] **Step 3: Define exact diagnostic types**

```ts
export type DiagnosticSeverity = "error" | "warning" | "info"
export type PlanDiagnosticCode =
  | "invalid_ipv4" | "invalid_cidr" | "base_not_aligned"
  | "invalid_hosts" | "blank_name" | "duplicate_name" | "capacity_overflow"

export type PlanDiagnostic = {
  code: PlanDiagnosticCode
  severity: DiagnosticSeverity
  message: string
  subnetId?: number
}

export type PlanDiagnostics = {
  isValid: boolean
  issues: PlanDiagnostic[]
  allocations: VlsmAllocation[]
  totalAddresses: number
  allocatedAddresses: number
  remainingAddresses: number
  utilizationPercent: number
}
```

- [ ] **Step 4: Implement strict IPv4 and alignment helpers**

Parse four decimal octets, each integer `0..255`; reject whitespace-only and extra segments. Keep unsigned integer conversion and mask-alignment helpers private to diagnostics so the existing VLSM public API stays unchanged.

- [ ] **Step 5: Implement allocation diagnostics**

Only call `calculateVlsm` when IPv4, CIDR, and host counts are valid. Determine overflow using each allocation’s `startOffset + blockSize > totalAddresses`. Errors block calculation; blank/duplicate names remain warnings. Clamp utilization only for display, not overflow detection.

- [ ] **Step 6: Implement deterministic explanation**

```ts
export function explainAllocation(a: VlsmAllocation): string {
  return `${a.requiredHosts} hosts plus network and broadcast require ${a.blockSize} addresses, so this subnet uses /${a.cidr}.`
}
```

- [ ] **Step 7: Run tests and project checks**

Run: `pnpm test -- tests/lib/planner/diagnostics.test.ts && pnpm typecheck && pnpm lint`
Expected: all PASS.

- [ ] **Step 8: Commit**

```bash
git add lib/vlsm.ts lib/planner/diagnostics.ts tests/lib/planner/diagnostics.test.ts
git commit -m "feat: add subnet plan diagnostics"
```

---

### Task 3: Templates and Unified Plan Replacement

**Files:**
- Create: `lib/planner/templates.ts`
- Modify: `lib/state/subnet-plan-types.ts`
- Create: `components/app/template-dialog.tsx`
- Test: `tests/lib/planner/templates.test.ts`
- Test: `tests/components/planner-workspace.test.tsx`

**Interfaces:**
- Produces: `PlannerTemplate`, `PLANNER_TEMPLATES`, `templateToPlan(template): ReplacePlanInput`.
- Produces: `TemplateDialog({ open, onOpenChange, hasMeaningfulEdits, onApply })`.
- Consumes: `ReplacePlanInput` with neutral `suggestedTitle?: string | null` metadata and existing dialog/button primitives.

- [ ] **Step 1: Write failing template normalization tests**

```ts
const plan = templateToPlan(PLANNER_TEMPLATES[0])
expect(plan.sourceType).toBe("manual")
expect(plan.subnets.map((item) => item.id)).toEqual([1, 2, 3])
expect(plan.aiPrompt).toBeNull()
```

Assert exact slugs: `home-lab`, `small-office`, `segmented-office`.

- [ ] **Step 2: Run unit test and verify failure**

Run: `pnpm test -- tests/lib/planner/templates.test.ts`
Expected: FAIL because module does not exist.

- [ ] **Step 3: Implement template types and data**

```ts
export type PlannerTemplate = {
  slug: "home-lab" | "small-office" | "segmented-office"
  title: string
  description: string
  baseNetwork: string
  baseCidr: string
  subnets: Array<{ name: string; hosts: number }>
}
```

Use realistic requirements: home lab (clients 30, servers 14, IoT 20), small office (staff 62, guest 40, infrastructure 12), segmented office (staff 120, guest 60, voice 40, IoT 30, servers 14).

- [ ] **Step 4: Normalize replacement title metadata and implement `templateToPlan`**

Rename `ReplacePlanInput.aiTitle` and form-state `aiTitle` to `suggestedTitle`. Update history restoration, AI normalization, and the planner effect that copies a non-empty suggested title into `planName`. `templateToPlan` maps stable one-based IDs, sets `suggestedTitle` to the template title, sets `sourceType: "manual"`, and clears `aiPrompt`/`aiRationale`.

- [ ] **Step 5: Write failing dialog tests**

Render with `hasMeaningfulEdits=true`, click Small office, assert confirmation appears and `onApply` is not called until confirm. With `false`, assert direct application.

- [ ] **Step 6: Implement template dialog**

Use one dialog with selectable rows, plain descriptions, and a confirmation state. No icon-card grid. Cancel preserves current form.

- [ ] **Step 7: Run focused checks**

Run: `pnpm test -- tests/lib/planner/templates.test.ts tests/components/planner-workspace.test.tsx && pnpm typecheck && pnpm lint`
Expected: all PASS.

- [ ] **Step 8: Commit**

```bash
git add lib/planner/templates.ts lib/state/subnet-plan-types.ts components/app/template-dialog.tsx tests/lib/planner/templates.test.ts tests/components/planner-workspace.test.tsx
git commit -m "feat: add subnet plan templates"
```

---

### Task 4: Planner Workspace and Live Intelligence

**Files:**
- Create: `components/app/planner-workspace.tsx`
- Create: `components/app/planner-toolbar.tsx`
- Create: `components/app/live-intelligence.tsx`
- Create: `components/app/plan-summary.tsx`
- Modify: `components/app/calculator-input-section.tsx`
- Modify: `app/app/page.tsx`
- Modify: `hooks/use-calculator-page-controller.ts`
- Modify: `hooks/use-calculator-plan-form.ts`
- Test: `tests/components/planner-workspace.test.tsx`

**Interfaces:**
- Consumes: `PlanDiagnostics`, plan form callbacks, committed `VlsmAllocation[]`, template dialog.
- Produces: focused workspace components; controller adds `diagnostics` and `resultsAreStale`.

- [ ] **Step 1: Extend failing workspace tests**

Test these exact behaviors:

```tsx
it("disables calculation for blocking diagnostics", async () => { /* invalid 999.1.1.1 */ })
it("marks committed results stale after an input edit", async () => { /* calculate, edit hosts */ })
it("shows utilization and free addresses", () => { /* valid /24 and 62 hosts */ })
it("collapses guidance and remembers preference", async () => { /* localStorage key subnify-guidance */ })
```

- [ ] **Step 2: Run test and verify failure**

Run: `pnpm test -- tests/components/planner-workspace.test.tsx`
Expected: FAIL on missing workspace behavior.

- [ ] **Step 3: Add diagnostics to controller**

Memoize `diagnosePlan(formValues)`. Track an input fingerprint when calculation commits. `resultsAreStale` is true when results exist and current fingerprint differs. `calculateVLSM` returns early for blocking diagnostics and never persists invalid results.

- [ ] **Step 4: Split editor responsibility**

Keep subnet row editing in `calculator-input-section.tsx`, but remove outer generic Card and persistence policy copy. The parent toolbar owns plan name, save toggle/state, template, AI, reset, and calculate actions.

- [ ] **Step 5: Implement intelligence and summary**

`LiveIntelligence` renders blocking issues first, warnings second, capacity metrics, then per-allocation explanations. `PlanSummary` renders subnet count, allocated, free, utilization, required hosts, and stale marker using semantic `<dl>` markup.

- [ ] **Step 6: Implement responsive workspace composition**

Use a desktop `lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,.65fr)]` editor/intelligence region. Below `lg`, stack. Results occupy full width below. Use region borders and small radii; avoid nested cards.

- [ ] **Step 7: Wire template application and guidance preference**

Detect meaningful edits by comparing against the exact initial form state. On apply, call `replacePlan(templateToPlan(template))`, clear committed results, and close dialog. Store guidance preference under `subnify-guidance` as `expanded|collapsed`.

- [ ] **Step 8: Run focused and project checks**

Run: `pnpm test -- tests/components/planner-workspace.test.tsx tests/lib/planner/diagnostics.test.ts tests/lib/planner/templates.test.ts && pnpm typecheck && pnpm lint`
Expected: all PASS.

- [ ] **Step 9: Commit**

```bash
git add app/app/page.tsx components/app/planner-workspace.tsx components/app/planner-toolbar.tsx components/app/live-intelligence.tsx components/app/plan-summary.tsx components/app/calculator-input-section.tsx hooks/use-calculator-page-controller.ts hooks/use-calculator-plan-form.ts tests/components/planner-workspace.test.tsx
git commit -m "feat: rebuild subnet planner workspace"
```

---

### Task 5: Consolidated and Synchronized Result Views

**Files:**
- Modify: `components/app/calculator-results-section.tsx`
- Create: `components/app/allocation-map.tsx`
- Create: `components/app/subnet-hierarchy.tsx`
- Create: `lib/plan-view.ts`
- Modify: `hooks/use-plan-view-state.ts`
- Create: `tests/lib/plan-view-state.test.ts`
- Extend: `tests/components/planner-workspace.test.tsx`

**Interfaces:**
- Produces: `PlanView = "table" | "visualizer" | "hierarchy"`.
- Produces: `AllocationMap` and `SubnetHierarchy`, both consuming `results`, `totalAddresses`, `selectedSubnet`, and `onToggleSubnet`.
- Consumes: shared selection state from calculator controller.

- [ ] **Step 1: Write failing view migration tests**

Create the pure parser in `lib/plan-view.ts`:

```ts
expect(parsePlanView("cards")).toBe("table")
expect(parsePlanView("hierarchy")).toBe("hierarchy")
expect(parsePlanView(null)).toBe("table")
```

- [ ] **Step 2: Run tests and verify failure**

Run: `pnpm test -- tests/lib/plan-view-state.test.ts`
Expected: FAIL because new view type/parser does not exist.

- [ ] **Step 3: Implement view type and URL migration**

Remove `cards` from generated URLs. Parse legacy `cards` as `table`. Add hierarchy. Keep query replacement behavior and history restoration intact.

- [ ] **Step 4: Write failing interaction tests**

Click a subnet in allocation map, switch to table, assert matching row has `aria-selected=true`. Switch hierarchy, activate same subnet again, assert selection clears.

- [ ] **Step 5: Implement allocation map**

Render proportional buttons using `startOffset / totalAddresses` and `blockSize / totalAddresses`. Include a free-space region. Each allocation button has an accessible name containing subnet, CIDR, and address count. Selected state uses border plus pattern/label, not color alone.

- [ ] **Step 6: Implement hierarchy**

Render parent CIDR summary, allocation children, then unused region. Use a list/tree-like readable structure; do not infer a deeper binary trie in this release.

- [ ] **Step 7: Simplify result section**

Remove card view markup. Keep copy/PDF actions in a compact toolbar. Table uses sticky first column below desktop width and horizontal scroll for remaining fields. Network data uses mono type.

- [ ] **Step 8: Run focused checks**

Run: `pnpm test -- tests/lib/plan-view-state.test.ts tests/components/planner-workspace.test.tsx && pnpm typecheck && pnpm lint`
Expected: all PASS.

- [ ] **Step 9: Commit**

```bash
git add components/app/calculator-results-section.tsx components/app/allocation-map.tsx components/app/subnet-hierarchy.tsx lib/plan-view.ts hooks/use-plan-view-state.ts tests/lib/plan-view-state.test.ts tests/components/planner-workspace.test.tsx
git commit -m "feat: unify subnet result views"
```

---

### Task 6: Integrated AI Requirements Flow

**Files:**
- Create: `components/app/generate-requirements-dialog.tsx`
- Modify: `app/app/designer/page.tsx`
- Remove: `app/app/designer/designer-page-client.tsx`
- Modify: `components/app/planner-toolbar.tsx`
- Modify: `app/app/page.tsx`
- Modify: `hooks/use-ai-design-application.ts`
- Modify: `lib/queries/ai-designer.ts`
- Test: `tests/components/generate-requirements-dialog.test.tsx`

**Interfaces:**
- Produces: `GenerateRequirementsDialog({ open, onOpenChange, currentPlan, onApply })`.
- Consumes: current AI query/mutation, quota response, `normalizeAiDesignedSubnets`, and `ReplacePlanInput`.
- Produces: `/app/designer` server redirect to `/app?generate=1`.

- [ ] **Step 1: Write failing AI dialog tests**

Mock generation. Assert prompt remains after failure; cancel preserves planner; successful preview shows base CIDR, rationale, and subnets; Apply calls `onApply` exactly once with normalized AI metadata.

```tsx
expect(onApply).toHaveBeenCalledWith(expect.objectContaining({
  sourceType: "ai_design",
  aiPrompt: "three-floor office",
  subnets: expect.arrayContaining([expect.objectContaining({ name: "Staff" })]),
}))
```

- [ ] **Step 2: Run test and verify failure**

Run: `pnpm test -- tests/components/generate-requirements-dialog.test.tsx`
Expected: FAIL because integrated dialog does not exist.

- [ ] **Step 3: Refactor AI request state into dialog**

Preserve quota loading, generation timer, and structured error messages. Distinguish quota exhausted, timeout/request failure, malformed response, and optional save failure. Generation does not automatically save or navigate.

- [ ] **Step 4: Implement preview and apply**

Preview uses compact rows, not chat bubbles. Apply returns a normalized `ReplacePlanInput`; caller replaces editor state and clears committed results. Current manual plan remains untouched until Apply.

- [ ] **Step 5: Wire toolbar and query opening**

Toolbar opens dialog. `/app?generate=1` opens on mount, then removes only the `generate` query parameter after the dialog is visible. Signed-out users receive auth action without losing current inputs.

- [ ] **Step 6: Add compatibility redirect**

```tsx
import { redirect } from "next/navigation"
export default function DesignerPage() { redirect("/app?generate=1") }
```

- [ ] **Step 7: Remove obsolete sessionStorage/navigation application path**

Delete the standalone designer client. Keep normalization helpers used by history restoration and AI results. Remove copy that tells users to visit the Designer tab.

- [ ] **Step 8: Run focused and project checks**

Run: `pnpm test -- tests/components/generate-requirements-dialog.test.tsx tests/components/planner-workspace.test.tsx && pnpm typecheck && pnpm lint`
Expected: all PASS.

- [ ] **Step 9: Commit**

```bash
git add components/app/generate-requirements-dialog.tsx components/app/planner-toolbar.tsx app/app/page.tsx app/app/designer/page.tsx app/app/designer/designer-page-client.tsx hooks/use-ai-design-application.ts lib/queries/ai-designer.ts tests/components/generate-requirements-dialog.test.tsx
git commit -m "feat: integrate AI requirements into planner"
```

---

### Task 7: Searchable and Editable History

**Files:**
- Modify: `lib/queries/calculations.ts`
- Modify: `components/app/history-list.tsx`
- Test: `tests/components/history-list.test.tsx`

**Interfaces:**
- Produces: `useRenameCalculationMutation(userId)` and `useDuplicateCalculationMutation(userId)`.
- Consumes: existing `CalculationRecord`, Supabase client, query keys, and RLS-secured calculations table.

- [ ] **Step 1: Write failing history tests**

With three fixture records, assert search by title and base network, source filter, rename pending state, duplicate action, delete confirmation, signed-out call-to-action, and no-results-filter message.

- [ ] **Step 2: Run test and verify failure**

Run: `pnpm test -- tests/components/history-list.test.tsx`
Expected: FAIL because controls/mutations do not exist.

- [ ] **Step 3: Implement rename mutation**

Update `title`, scoped by record ID and user ID, returning selected ID. Reject empty trimmed names and 80+ character names in client and mutation. Invalidate the user's calculation list on success.

- [ ] **Step 4: Implement duplicate mutation**

Insert a new record using source record fields, title `${record.title ?? `${record.base_network}/${record.base_cidr}`} copy`, and current user ID. Do not copy record ID or created time. Return new ID and invalidate list.

- [ ] **Step 5: Implement history controls**

Use one search input and source dropdown. Filter the existing 50 cached records client-side. Render compact bordered rows. Rename uses inline form or focused dialog. Delete always requires confirmation.

- [ ] **Step 6: Improve states**

Signed-out state shows “Sign in to view cloud history” and auth action. Query error preserves retry. Empty account and empty filter results use different copy.

- [ ] **Step 7: Run focused checks**

Run: `pnpm test -- tests/components/history-list.test.tsx && pnpm typecheck && pnpm lint`
Expected: all PASS.

- [ ] **Step 8: Commit**

```bash
git add lib/queries/calculations.ts components/app/history-list.tsx tests/components/history-list.test.tsx
git commit -m "feat: expand subnet plan history"
```

---

### Task 8: Technical Landing and Product Proof

**Files:**
- Modify: `app/page.tsx`
- Modify: `components/home/hero-section.tsx`
- Create: `components/home/product-proof.tsx`
- Modify: `components/home/cta-section.tsx`
- Modify: `components/home/footer.tsx`
- Remove: `components/home/features-section.tsx`
- Remove or reduce: `components/home/calculator-preview.tsx`
- Modify: `components/home/motion.ts`
- Create: `tests/components/home-page.test.tsx`

**Interfaces:**
- Produces: landing built from `HeroSection`, `ProductProof`, compact CTA, and footer.
- Consumes: deterministic diagnostics/allocation helpers and production-style presentation primitives; no persistence hooks.

- [ ] **Step 1: Write failing landing tests**

Assert heading “Address space, made legible.”, primary Open planner link, product proof network `192.168.10.0/24`, absence of “Alpha”, absence of “in seconds”, and absence of a seven-card Features section.

- [ ] **Step 2: Run test and verify failure**

Run: `pnpm test -- tests/components/home-page.test.tsx`
Expected: FAIL on old landing content.

- [ ] **Step 3: Rebuild hero**

Use two columns: concise copy and a production-style plan preview. Use small mono eyebrow “IPv4 planning workspace.” Buttons: Open planner and How it works. No gradient text, floating pill, fake usage metrics, or generic feature grid.

- [ ] **Step 4: Build deterministic product proof**

Generate a fixed sample using pure diagnostics/VLSM code. Show two requirement rows, capacity explanation, allocation map, and result rows. Disable editing or label clearly as example. Reuse allocation presentation rather than duplicate calculator logic.

- [ ] **Step 5: Replace feature wall with proof-led copy**

One section explains: define requirements, inspect allocation, export/save. Use numbered text and one shared visualization. Keep AI as a secondary sentence, not headline.

- [ ] **Step 6: Simplify footer and motion**

Footer links: Planner, Help, Source, Miqal portfolio. Motion only small fade/translate under 300 ms and reduced-motion fallback.

- [ ] **Step 7: Run focused and project checks**

Run: `pnpm test -- tests/components/home-page.test.tsx && pnpm typecheck && pnpm lint`
Expected: all PASS.

- [ ] **Step 8: Commit**

```bash
git add app/page.tsx components/home/hero-section.tsx components/home/product-proof.tsx components/home/cta-section.tsx components/home/footer.tsx components/home/features-section.tsx components/home/calculator-preview.tsx components/home/motion.ts tests/components/home-page.test.tsx
git commit -m "feat: rebuild Subnify landing page"
```

---

### Task 9: Help, PDF, Accessibility, and Error Completion

**Files:**
- Modify: `app/app/help/page.tsx`
- Modify: `app/app/settings/page.tsx`
- Modify: `lib/calculator/export-pdf.ts`
- Modify: `hooks/use-calculator-page-controller.ts`
- Modify: affected `components/ui/*` only where accessible labels or focus states are missing
- Create: `tests/lib/calculator/export-pdf.test.ts`
- Extend: `tests/components/planner-workspace.test.tsx`

**Interfaces:**
- Produces: `buildPdfFilename(planName: string | null, createdAt: Date): string`.
- Consumes: existing export args, theme provider/settings queries, diagnostics copy.

- [ ] **Step 1: Write failing PDF and accessibility tests**

```ts
expect(buildPdfFilename("Branch Office", new Date("2026-08-10T12:00:00Z")))
  .toBe("subnify-branch-office-20260810.pdf")
```

In workspace test, use `getByRole` for every icon-only planner action and assert selected result is exposed through `aria-selected`.

- [ ] **Step 2: Run tests and verify failure**

Run: `pnpm test -- tests/lib/calculator/export-pdf.test.ts tests/components/planner-workspace.test.tsx`
Expected: FAIL because filename helper/accessibility states are missing.

- [ ] **Step 3: Restyle PDF**

Use Miqal blue `[37, 99, 235]`, restrained gray borders, mono-like network formatting where jsPDF supports it, plan title, utilization summary, full result table, and allocation visualization. Filename uses normalized plan name plus date, with `subnify-plan-YYYYMMDD.pdf` fallback.

- [ ] **Step 4: Report export failures safely**

Keep `finally` state cleanup. Add `catch` that shows “PDF export failed. Your plan is unchanged.” Do not clear results.

- [ ] **Step 5: Rewrite Help**

Sections: Quick start, CIDR/VLSM explanation, why two addresses are reserved, templates, AI requirements, saving/history, result views, exports. Use anchored sections and real examples, not cards for every paragraph.

- [ ] **Step 6: Align Settings**

Keep appearance/profile/security features. Use the same section borders and typography as planner. Keep guidance visibility as the planner-local `subnify-guidance` preference; do not duplicate it in account settings.

- [ ] **Step 7: Accessibility and reduced motion pass**

Ensure labels, touch targets, visible focus, semantic tables, status text, and non-color selection. Add local CSS reduced-motion guard for Subnify-specific animations not already handled by motion library.

- [ ] **Step 8: Run focused and project checks**

Run: `pnpm test -- tests/lib/calculator/export-pdf.test.ts tests/components/planner-workspace.test.tsx && pnpm typecheck && pnpm lint`
Expected: all PASS.

- [ ] **Step 9: Commit**

```bash
git add app/app/help/page.tsx app/app/settings/page.tsx lib/calculator/export-pdf.ts hooks/use-calculator-page-controller.ts components/ui tests/lib/calculator/export-pdf.test.ts tests/components/planner-workspace.test.tsx
git commit -m "feat: finish Subnify guidance and accessibility"
```

---

### Task 10: Browser Coverage and Final Verification

**Files:**
- Modify: `playwright.config.ts`
- Create: `tests/e2e/planner.spec.ts`
- Create: `tests/e2e/history.spec.ts`
- Create: `tests/e2e/ai-designer.spec.ts`
- Modify: `README.md`

**Interfaces:**
- Consumes: completed public/app UI, stable route URLs, and API/Supabase request interception.
- Produces: repeatable cross-viewport browser verification and updated project documentation.

- [ ] **Step 1: Write anonymous planner browser test**

Open `/app`, enter `192.168.10.0/24`, add Engineering 62 and Guest 40, calculate, assert `/26` rows, utilization, free space, allocation-map accessible names, table/map selection synchronization, copy action, and PDF button enabled.

- [ ] **Step 2: Run and verify initial browser failure**

Run: `pnpm test:e2e -- tests/e2e/planner.spec.ts`
Expected: FAIL until selectors/configuration match completed UI.

- [ ] **Step 3: Add responsive and theme cases**

Run planner at 390×844 and 1440×1000. Assert no body horizontal overflow, editor precedes intelligence on mobile, app menu opens, and theme choice survives reload.

- [ ] **Step 4: Add mocked authenticated history flow**

Intercept Supabase calculation list/update/insert/delete calls with deterministic fixtures. Test search, source filter, rename, duplicate, open, and confirmed delete. Never use production credentials.

- [ ] **Step 5: Add mocked AI flow**

Intercept `/api/ai-designer` with a deterministic plan. Open via toolbar and legacy `/app/designer`; assert redirect, preview, explicit Apply, and editable planner values. Test quota failure leaves manual plan intact.

- [ ] **Step 6: Update README**

Document `@miqal/theme`, integrated AI flow, templates, diagnostics, routes, all test commands, and environment variables. Remove separate Designer-page description.

- [ ] **Step 7: Run full automated verification**

Run:

```bash
pnpm test
pnpm test:e2e
pnpm lint
pnpm typecheck
pnpm build
```

Expected: all commands exit 0.

- [ ] **Step 8: Perform visual verification**

Inspect landing, planner, history, help, settings, auth dialog, AI dialog, template dialog, loading/empty/error/stale states at 390×844 and 1440×1000 in light and dark modes. Record any visual defect as a failing browser/component test before fixing it.

- [ ] **Step 9: Confirm scope and repository cleanliness**

Run: `git status --short` and `git diff --check`.
Expected: only intentional plan/implementation changes; `.superpowers/` remains untracked and excluded from commits.

- [ ] **Step 10: Commit**

```bash
git add playwright.config.ts tests/e2e README.md
git commit -m "test: verify Subnify overhaul workflows"
```

---

## Completion Criteria

- Every Global Constraint is represented by implementation and verification.
- All ten task commits exist or equivalent scoped commits preserve the same review boundaries.
- Full automated verification exits 0.
- Visual verification covers both themes and both required viewport sizes.
- No `.superpowers/` companion artifacts are committed.
- Deferred features remain absent.
