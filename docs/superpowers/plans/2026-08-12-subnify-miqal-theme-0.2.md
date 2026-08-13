# Subnify Miqal Theme 0.2 Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the completed Subnify overhaul from `@miqal/theme@0.1.1` plus defect overrides to clean `0.2.0` layers without changing planner behavior.

**Architecture:** Consume package core/canvas/motion layers directly, apply canvas only to public/empty-space surfaces, and keep dense authenticated routes plain. Remove temporary primary/chart/sidebar overrides only after browser contract tests prove corrected package values. Align shared shadcn primitives to role radii while preserving all product workflows.

**Tech Stack:** Next.js 16.1, React 19.2, TypeScript 5.9, Tailwind CSS 4.2, `@miqal/theme@0.2`, TanStack Query/Form, Supabase, Vitest, Testing Library, Playwright, Axe.

## Global Constraints

- Start only after portfolio and SleepCycle migrations validate published `@miqal/theme@0.2.0`.
- Preserve untracked `docs/superpowers/plans/2026-08-12-subnify-reliability-v1.md` and all unrelated user work.
- Do not reimplement the completed Miqal workflow overhaul.
- No planner calculation, persistence, authentication, AI, history, export, or route behavior changes.
- Remove local semantic color overrides; use package roles directly.
- Inter is interface/body; JetBrains Mono is identity, CIDR, IP, masks, counts, and compact metadata.
- Landing may use full canvas; authenticated planner/history/help/settings use plain or quiet surfaces.
- Desktop controls remain compact; mobile hit areas remain at least 44×44px.
- Full existing Vitest and Playwright suites remain green.

## File Structure

- `app/globals.css`: explicit package layers and only Subnify-specific utilities.
- `app/layout.tsx`: canonical font loading; no global canvas.
- `app/page.tsx`: public landing canvas boundary.
- `app/app/layout.tsx`: dense application surface boundary.
- `components/ui/card.tsx`: contained-surface radius/border recipe.
- `components/ui/dialog.tsx`, `dropdown-menu.tsx`, `sheet.tsx`, `tooltip.tsx`: floating-layer radius recipe.
- `tests/e2e/theme.spec.ts`: package version, font, canvas, theme, and visual contract.
- `tests/components/theme-primitives.test.tsx`: role-class contract for shared primitives.

---

### Task 1: Replace defect overrides with package `0.2.0`

**Files:**
- Modify: `package.json:18`
- Modify: `pnpm-lock.yaml:1`
- Modify: `app/globals.css:1`
- Modify: `app/layout.tsx:1`
- Modify: `tests/e2e/theme.spec.ts:1`

**Interfaces:**
- Consumes: published `@miqal/theme@0.2.0` exports.
- Produces: canonical fonts and package semantic values without local theme variables.

- [ ] **Step 1: Rewrite the browser contract before upgrading**

Replace old hard-coded blue expectations with the approved `0.2.0` values:

```ts
test("uses corrected Miqal package values and fonts", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  const styles = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    return {
      primary: root.getPropertyValue("--primary").trim(),
      controlRadius: root.getPropertyValue("--radius-control").trim(),
      bodyFont: getComputedStyle(document.body).fontFamily,
      heroFont: getComputedStyle(document.querySelector("h1")!).fontFamily,
    };
  });
  expect(styles.primary).toBe("oklch(0.56 0.08 212)");
  expect(styles.controlRadius).toBe("0.375rem");
  expect(styles.bodyFont).toContain("Inter");
  expect(styles.heroFont).toContain("JetBrains Mono");
});
```

Dark-mode test expects `oklch(0.76 0.10 212)` after trimming surrounding whitespace.

- [ ] **Step 2: Run the contract against current state**

Run: `pnpm test:e2e tests/e2e/theme.spec.ts`

Expected: FAIL because local overrides expose `#2563eb`/`#60a5fa` and Geist.

- [ ] **Step 3: Upgrade registry dependency**

Run: `pnpm add @miqal/theme@^0.2.0`

Expected: lockfile resolves registry version `0.2.0`; no link dependency exists.

- [ ] **Step 4: Replace compatibility CSS and overrides**

Final leading imports in `app/globals.css`:

```css
@import "tailwindcss";
@import "@miqal/theme/core.css";
@import "@miqal/theme/canvas.css";
@import "@miqal/theme/motion.css";
@import "shadcn/tailwind.css";
```

Delete all current `:root`/`.dark` primary, accent, ring, chart, sidebar, font, gradient, and reduced-motion override blocks. If reliability-v1 already replaced `shadcn/tailwind.css` with `./shadcn-tailwind.css`, preserve that local final import; Miqal import order stays unchanged.

- [ ] **Step 5: Load canonical fonts**

Replace Geist imports with:

```tsx
import { Inter, JetBrains_Mono } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });
```

Apply both variables to `<html>`; leave `<body>` free of `miqal-canvas`.

- [ ] **Step 6: Run focused checks**

Run: `pnpm typecheck && pnpm test:e2e tests/e2e/theme.spec.ts`

Expected: PASS for light/dark package values and fonts.

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml app/globals.css app/layout.tsx tests/e2e/theme.spec.ts
git commit -m "feat: upgrade Subnify to Miqal theme 0.2"
```

### Task 2: Enforce product-shaped canvas boundaries

**Files:**
- Modify: `app/page.tsx:1`
- Modify: `app/app/layout.tsx:1`
- Modify: `app/not-found.tsx:1`
- Modify: `tests/e2e/theme.spec.ts:1`

**Interfaces:**
- Consumes: `.miqal-canvas` and `.miqal-canvas-quiet` from package canvas layer.
- Produces: atmospheric public landing and quiet dense application routes.

- [ ] **Step 1: Add failing canvas-boundary test**

```ts
test("limits full canvas to public landing", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-canvas='full']")).toHaveClass(/miqal-canvas/);
  await page.goto("/app");
  await expect(page.locator("body")).not.toHaveClass(/miqal-canvas/);
  const appBackground = await page.locator("main").evaluate((node) =>
    getComputedStyle(node).backgroundImage,
  );
  expect(appBackground).toBe("none");
});
```

- [ ] **Step 2: Run test and verify failure**

Run: `pnpm test:e2e --grep "limits full canvas"`

Expected: FAIL until canvas classes are explicit.

- [ ] **Step 3: Apply full canvas to landing only**

Add `data-canvas="full"` and `miqal-canvas` to the outermost landing wrapper in `app/page.tsx`. Preserve current header, technical hero, product proof, CTA, and footer composition.

Ensure `app/app/layout.tsx` creates an opaque `min-h-screen bg-background` application boundary below `MiqalHeader`; do not add canvas class. Use `miqal-canvas-quiet` only on a bounded empty state, never around planner tables or result visualizations. Apply `miqal-canvas` to the standalone public not-found page.

- [ ] **Step 4: Run route-boundary tests**

Run: `pnpm test:e2e --grep "limits full canvas"`

Expected: PASS; `/app` has no gradient/dot background behind dense content.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx app/app/layout.tsx app/not-found.tsx tests/e2e/theme.spec.ts
git commit -m "fix: scope Subnify canvas treatment"
```

### Task 3: Align shared primitives to role radii and elevation

**Files:**
- Modify: `components/ui/card.tsx:5`
- Modify: `components/ui/dialog.tsx:1`
- Modify: `components/ui/dropdown-menu.tsx:1`
- Modify: `components/ui/sheet.tsx:1`
- Modify: `components/ui/tooltip.tsx:1`
- Modify: `components/ui/button.tsx:7`
- Modify: `components/ui/input.tsx:5`
- Create: `tests/components/theme-primitives.test.tsx`

**Interfaces:**
- Consumes: Tailwind aliases generated from `--radius-control`, `--radius-surface`, `--radius-floating`.
- Produces: control `rounded-md`, surface `rounded-lg`, floating `rounded-xl` contracts.

- [ ] **Step 1: Write failing class-contract tests**

```tsx
it("uses surface radius and border before shadow", () => {
  render(<Card data-testid="card">content</Card>);
  expect(screen.getByTestId("card")).toHaveClass("rounded-lg", "border", "border-border");
  expect(screen.getByTestId("card")).not.toHaveClass("rounded-xl", "shadow-xs");
});

it("uses control radius for buttons and inputs", () => {
  render(<><Button>Save</Button><Input aria-label="Name" /></>);
  expect(screen.getByRole("button")).toHaveClass("rounded-md");
  expect(screen.getByLabelText("Name")).toHaveClass("rounded-md");
});
```

Add a rendered dialog/dropdown assertion that floating content includes `rounded-xl`.

- [ ] **Step 2: Run tests and verify failure**

Run: `pnpm test tests/components/theme-primitives.test.tsx`

Expected: FAIL because `Card` currently uses `rounded-xl` and `shadow-xs`.

- [ ] **Step 3: Normalize primitive classes**

- Card root: `rounded-lg border border-border bg-card shadow-none`; card image/header/footer corners use `rounded-lg`.
- Buttons and inputs: retain `rounded-md` and current visible focus ring. Add `max-sm:h-11` to default/small buttons and inputs, `max-sm:size-11` to icon variants, and keep existing compact desktop heights.
- Dialog, dropdown, sheet, tooltip content: `rounded-xl`; retain medium shadow only for overlays/floating layers.
- Pills/badges: keep full rounding only when they communicate status or grouping.

Do not alter component props, variants, slots, Radix behavior, or application call sites.

- [ ] **Step 4: Run component and workflow tests**

Run: `pnpm test tests/components/theme-primitives.test.tsx tests/components/planner-workspace.test.tsx tests/components/history-list.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/ui tests/components/theme-primitives.test.tsx
git commit -m "fix: apply Miqal shape and elevation roles"
```

### Task 4: Add package accessibility and visual regression gates

**Files:**
- Modify: `package.json:1`
- Modify: `pnpm-lock.yaml:1`
- Modify: `tests/e2e/theme.spec.ts:1`
- Create: `tests/e2e/theme.spec.ts-snapshots/`

**Interfaces:**
- Consumes: landing, planner, history, help, settings, auth dialog, and both themes.
- Produces: Axe, focus, touch, overflow, and reviewed screenshot gates.

- [ ] **Step 1: Add Axe Playwright integration**

Run: `pnpm add -D @axe-core/playwright@^4.13.0`

- [ ] **Step 2: Add representative accessibility tests**

```ts
for (const path of ["/", "/app", "/app/history", "/app/help", "/app/settings"]) {
  test(`${path} has no Axe violations`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}
```

Reuse existing auth/test setup for protected states. Add keyboard focus checks for header menus, planner inputs, result views, and dialog close. Assert mobile icon buttons expose at least 44×44px hit boxes or documented expanded hit areas. Assert page width never exceeds viewport.

- [ ] **Step 3: Add visual baselines**

Capture light/dark desktop and mobile screenshots for landing and populated planner. Capture one dense history state and one auth dialog. Use deterministic mocked data already used by existing E2E helpers.

- [ ] **Step 4: Generate and review baselines**

Run: `pnpm test:e2e tests/e2e/theme.spec.ts --update-snapshots`

Expected: package cyan is consistent; public canvas visible; planner canvas absent; tables, allocation map, dialogs, and header remain unclipped.

- [ ] **Step 5: Run full theme gate**

Run: `pnpm test:e2e tests/e2e/theme.spec.ts`

Expected: PASS with zero Axe violations and no screenshot drift.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml tests/e2e/theme.spec.ts tests/e2e/theme.spec.ts-snapshots
git commit -m "test: lock Subnify theme migration"
```

### Task 5: Run complete Subnify regression and document ownership

**Files:**
- Modify: `README.md:1`

**Interfaces:**
- Consumes: all migration commits and existing reliability/workflow suites.
- Produces: independently releasable Subnify migration.

- [ ] **Step 1: Search for forbidden local theme forks**

Run: `rg -n --glob '!docs/**' --glob '!pnpm-lock.yaml' -- '--primary:|--accent:|--ring:|--chart-[1-5]:|--radius:' app components lib`

Expected: no local semantic theme definitions. Component references such as `var(--primary)` are allowed.

- [ ] **Step 2: Document ownership boundary**

README states `@miqal/theme@0.2.x` owns tokens, fonts, shape, canvas, motion, and interaction language. Subnify owns planner composition, network visualizations, domain status mapping, Supabase state, and workflow behavior. Document all existing commands without removing reliability-v1 guidance.

- [ ] **Step 3: Run full verification**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm test:e2e && git diff --check`

Expected: all existing unit/component/E2E tests plus new theme gates PASS.

- [ ] **Step 4: Inspect final scope**

Run: `git diff --stat origin/main...HEAD && git status --short`

Expected: only package/theme/font/primitive/test/docs changes from this plan; the untracked reliability plan remains preserved unless separately committed by its owner.

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: define Subnify theme ownership"
```
