# Inline Plan Rename Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let every planner user rename current plan directly from toolbar with accessible Enter, blur, and Escape behavior.

**Architecture:** Keep `planName` controlled by existing `usePlanPersistence` state. `PlannerWorkspace` forwards existing `onPlanNameChange` callback to `PlannerToolbar`; toolbar owns only temporary draft/edit-session state. Existing save/update calls persist committed title without new API, storage, or database work.

**Tech Stack:** Next.js 16.3 App Router, React 19, TypeScript, Tailwind v4, Testing Library/Vitest, Playwright.

## Global Constraints

- Read `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` before editing client components; repository AGENTS rule requires installed Next documentation.
- Rename works signed in or signed out and without cloud-save selection.
- Display trimmed current value or `Untitled plan`; edit current raw value.
- `Enter` and blur commit once; `Escape` cancels without calling `onPlanNameChange`.
- Whitespace-only commit stores empty string; non-empty commit preserves entered value.
- Input `maxLength` is `80`.
- Rename button and input remain at least `44px` high on mobile.
- No new persistence, route, database migration, or local-storage behavior.
- Existing template, AI apply, history restore, reset, cloud save, and cloud update behavior remains unchanged.
- Preserve unrelated untracked `AGENTS.md`, `CLAUDE.md`, and Miqal plan files.

---

## File Structure

- Modify `components/app/planner-toolbar.tsx`: render title rename button/input and own transient edit session state.
- Modify `components/app/planner-workspace.tsx`: forward existing `onPlanNameChange` prop into toolbar.
- Modify `tests/components/planner-workspace.test.tsx`: prove controlled rename, commit, cancel, blank fallback, focus, and length limit.
- Modify `tests/e2e/planner.spec.ts`: prove keyboard rename at desktop and `390x844` without overflow.

### Task 1: Accessible Inline Plan Rename

**Files:**
- Modify: `components/app/planner-toolbar.tsx`
- Modify: `components/app/planner-workspace.tsx`
- Test: `tests/components/planner-workspace.test.tsx`
- Test: `tests/e2e/planner.spec.ts`

**Interfaces:**
- Consumes: `planName: string` and `onPlanNameChange: (name: string) => void` already exposed by `PlannerWorkspaceProps`.
- Produces: `PlannerToolbarProps.onPlanNameChange: (name: string) => void`; accessible button named `Rename plan: ${displayName}`; input named `Plan name`.

- [ ] **Step 1: Read installed Next client-component guidance**

Run:

```bash
sed -n '1,240p' node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md
```

Expected: confirm toolbar/workspace remain client components and interactive state stays below existing `"use client"` boundaries.

- [ ] **Step 2: Add controlled test harness**

In `tests/components/planner-workspace.test.tsx`, import `useState` and add:

```tsx
import { useState } from "react"

function RenameHarness({ initialName = "" }: { initialName?: string }) {
  const [planName, setPlanName] = useState(initialName)

  return (
    <PlannerWorkspace
      diagnostics={validDiagnostics}
      resultsAreStale={false}
      planName={planName}
      onPlanNameChange={setPlanName}
      hasMeaningfulEdits={false}
      onApplyTemplate={vi.fn()}
      editor={<div>Editor</div>}
      resultsContent={<div>Results</div>}
    />
  )
}
```

Expected: harness exercises real controlled component updates without mocking React state.

- [ ] **Step 3: Write failing Enter/focus test**

Add inside `describe("PlannerWorkspace", ...)`:

```tsx
it("renames an untitled plan inline with the keyboard", async () => {
  const user = userEvent.setup()
  render(<RenameHarness />)

  await user.click(
    screen.getByRole("button", { name: "Rename plan: Untitled plan" })
  )

  const input = screen.getByRole("textbox", { name: "Plan name" })
  expect(input).toHaveFocus()
  expect(input).toHaveAttribute("maxlength", "80")

  await user.type(input, "Branch office{Enter}")

  expect(
    screen.getByRole("button", { name: "Rename plan: Branch office" })
  ).toBeInTheDocument()
})
```

- [ ] **Step 4: Write failing blur, blank, Escape, and callback-once tests**

Add:

```tsx
it("commits a blank name on blur as Untitled plan", async () => {
  const user = userEvent.setup()
  render(<RenameHarness initialName="Branch office" />)

  await user.click(
    screen.getByRole("button", { name: "Rename plan: Branch office" })
  )
  const input = screen.getByRole("textbox", { name: "Plan name" })
  await user.clear(input)
  await user.type(input, "   ")
  await user.tab()

  expect(
    screen.getByRole("button", { name: "Rename plan: Untitled plan" })
  ).toBeInTheDocument()
})

it("restores the original name when Escape cancels editing", async () => {
  const user = userEvent.setup()
  const onPlanNameChange = vi.fn()

  render(
    <PlannerWorkspace
      diagnostics={validDiagnostics}
      resultsAreStale={false}
      planName="Branch office"
      onPlanNameChange={onPlanNameChange}
      hasMeaningfulEdits={false}
      onApplyTemplate={vi.fn()}
      editor={<div>Editor</div>}
      resultsContent={<div>Results</div>}
    />
  )

  await user.click(
    screen.getByRole("button", { name: "Rename plan: Branch office" })
  )
  const input = screen.getByRole("textbox", { name: "Plan name" })
  await user.clear(input)
  await user.type(input, "Temporary{Escape}")

  expect(
    screen.getByRole("button", { name: "Rename plan: Branch office" })
  ).toBeInTheDocument()
  expect(onPlanNameChange).not.toHaveBeenCalled()
})

it("commits one rename callback when Enter triggers blur", async () => {
  const user = userEvent.setup()
  const onPlanNameChange = vi.fn()

  render(
    <PlannerWorkspace
      diagnostics={validDiagnostics}
      resultsAreStale={false}
      planName="Branch office"
      onPlanNameChange={onPlanNameChange}
      hasMeaningfulEdits={false}
      onApplyTemplate={vi.fn()}
      editor={<div>Editor</div>}
      resultsContent={<div>Results</div>}
    />
  )

  await user.click(
    screen.getByRole("button", { name: "Rename plan: Branch office" })
  )
  const input = screen.getByRole("textbox", { name: "Plan name" })
  await user.clear(input)
  await user.type(input, "Datacenter{Enter}")

  expect(onPlanNameChange).toHaveBeenCalledTimes(1)
  expect(onPlanNameChange).toHaveBeenCalledWith("Datacenter")
})
```

- [ ] **Step 5: Run component tests and verify RED**

Run:

```bash
pnpm test tests/components/planner-workspace.test.tsx
```

Expected: FAIL because toolbar has no rename button or `Plan name` input.

- [ ] **Step 6: Forward rename callback into toolbar**

In `components/app/planner-workspace.tsx`, destructure `onPlanNameChange` and pass it:

```tsx
export function PlannerWorkspace({
  diagnostics,
  resultsAreStale,
  planName,
  onPlanNameChange,
  hasMeaningfulEdits,
  onApplyTemplate,
  onApplyRequirements = onApplyTemplate,
  editor,
  resultsContent,
}: PlannerWorkspaceProps) {
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 px-4 py-5 lg:px-6 lg:py-6">
      <PlannerToolbar
        planName={planName}
        onPlanNameChange={onPlanNameChange}
        hasMeaningfulEdits={hasMeaningfulEdits}
        onApplyTemplate={onApplyTemplate}
        onApplyRequirements={onApplyRequirements}
      />
```

Leave remaining workspace markup unchanged.

- [ ] **Step 7: Implement minimal toolbar edit session**

In `components/app/planner-toolbar.tsx`:

1. Import `Pencil`, `Input`, `useRef`, and `KeyboardEvent` type.
2. Add callback prop:

```tsx
type PlannerToolbarProps = {
  planName: string
  onPlanNameChange: (name: string) => void
  hasMeaningfulEdits: boolean
  onApplyTemplate: (plan: ReplacePlanInput) => void
  onApplyRequirements: (plan: ReplacePlanInput) => void
}
```

3. Add transient state and handlers inside `PlannerToolbar`:

```tsx
const [isEditingName, setIsEditingName] = useState(false)
const [draftName, setDraftName] = useState(planName)
const nameInputRef = useRef<HTMLInputElement>(null)
const editSessionActiveRef = useRef(false)
const originalNameRef = useRef(planName)
const displayName = planName.trim() || "Untitled plan"

const startNameEdit = () => {
  originalNameRef.current = planName
  setDraftName(planName)
  editSessionActiveRef.current = true
  setIsEditingName(true)
}

const commitNameEdit = () => {
  if (!editSessionActiveRef.current) return
  editSessionActiveRef.current = false
  onPlanNameChange(draftName.trim().length === 0 ? "" : draftName)
  setIsEditingName(false)
}

const cancelNameEdit = () => {
  if (!editSessionActiveRef.current) return
  editSessionActiveRef.current = false
  setDraftName(originalNameRef.current)
  setIsEditingName(false)
}

const handleNameKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
  if (event.key === "Enter") {
    event.preventDefault()
    event.currentTarget.blur()
  } else if (event.key === "Escape") {
    event.preventDefault()
    cancelNameEdit()
  }
}

useEffect(() => {
  if (!isEditingName) return
  nameInputRef.current?.focus()
  nameInputRef.current?.select()
}, [isEditingName])
```

4. Replace static heading with:

```tsx
<div className="min-w-0 flex-1">
  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-primary">
    IPv4 plan
  </p>
  <h1 className="mt-1 min-w-0 text-xl font-semibold tracking-tight">
    {isEditingName ? (
      <Input
        ref={nameInputRef}
        aria-label="Plan name"
        value={draftName}
        maxLength={80}
        onChange={(event) => setDraftName(event.target.value)}
        onBlur={commitNameEdit}
        onKeyDown={handleNameKeyDown}
        className="min-h-11 max-w-sm text-xl font-semibold md:min-h-11 md:text-xl"
      />
    ) : (
      <button
        type="button"
        aria-label={`Rename plan: ${displayName}`}
        onClick={startNameEdit}
        className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-md text-left outline-none transition-colors hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="truncate">{displayName}</span>
        <Pencil aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      </button>
    )}
  </h1>
</div>
```

Keep template and generator actions unchanged.

- [ ] **Step 8: Run component tests and verify GREEN**

Run:

```bash
pnpm test tests/components/planner-workspace.test.tsx
```

Expected: all planner-workspace tests PASS with no React warnings.

- [ ] **Step 9: Write desktop/mobile browser regression**

In `tests/e2e/planner.spec.ts`, add:

```tsx
for (const viewport of [
  { name: "desktop", width: 1280, height: 720 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test(`renames current plan inline on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    const consoleErrors = captureConsoleErrors(page)
    const planner = new PlannerPage(page)
    await planner.goto()

    await page
      .getByRole("button", { name: "Rename plan: Untitled plan" })
      .click()
    const input = page.getByRole("textbox", { name: "Plan name" })
    await expect(input).toBeFocused()
    await expect(input).toHaveAttribute("maxlength", "80")
    await input.fill("Branch office")
    await input.press("Enter")

    await expect(
      page.getByRole("button", { name: "Rename plan: Branch office" })
    ).toBeVisible()

    await page
      .getByRole("button", { name: "Rename plan: Branch office" })
      .click()
    await input.fill("Temporary")
    await input.press("Escape")

    await expect(
      page.getByRole("button", { name: "Rename plan: Branch office" })
    ).toBeVisible()
    const renameButton = page.getByRole("button", {
      name: "Rename plan: Branch office",
    })
    const box = await renameButton.boundingBox()
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44)
    await planner.assertNoHorizontalOverflow()
    expect(consoleErrors).toEqual([])
  })
}
```

- [ ] **Step 10: Run browser regression**

Run:

```bash
pnpm exec playwright test tests/e2e/planner.spec.ts --grep "renames current plan inline"
```

Expected: 2 tests PASS, desktop and mobile; no console errors or page overflow.

- [ ] **Step 11: Run focused React and TypeScript gates**

Run:

```bash
pnpm lint components/app/planner-toolbar.tsx components/app/planner-workspace.tsx tests/components/planner-workspace.test.tsx tests/e2e/planner.spec.ts
pnpm typecheck
pnpm test tests/components/planner-workspace.test.tsx
```

Expected: all commands exit `0`.

- [ ] **Step 12: Run full release gate**

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

Expected: lint, TypeScript, build, audit, and diff check exit `0`; all existing unit/component/route and Playwright tests pass.

- [ ] **Step 13: Commit feature**

Run:

```bash
git add components/app/planner-toolbar.tsx components/app/planner-workspace.tsx tests/components/planner-workspace.test.tsx tests/e2e/planner.spec.ts
git commit -m "feat: rename plans inline"
```

Expected: one feature commit containing only rename implementation and tests. Unrelated untracked files remain untouched.
