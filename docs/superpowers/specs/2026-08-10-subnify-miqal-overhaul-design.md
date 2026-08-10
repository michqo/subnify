# Subnify Miqal UI and Workflow Overhaul

Date: 2026-08-10
Status: Approved

## Goal

Turn Subnify into a recognizable Miqal ecosystem app and a credible IPv4 planning instrument. Serve experienced users first without hiding the reasoning needed by learners.

Success means:

- Subnify consumes `@miqal/theme` as its canonical token source.
- Landing and app share portfolio typography, blue accent, restrained motion, thin borders, and technical tone.
- UI no longer resembles a generic shadcn SaaS template or AI-generated landing page.
- Planner remains fast for repeat use.
- Contextual guidance explains CIDR decisions without forcing a wizard.
- Existing calculation, authentication, persistence, and export behavior remains reliable.
- First release adds focused workflow improvements: diagnostics, templates, integrated AI requirements, and stronger history controls.

## Product Position

Subnify is a hybrid professional and learning tool, weighted 65/35 toward professionals.

Professional behavior:

- Dense, direct planner workspace.
- Explicit inputs and deterministic output.
- Useful keyboard and copy/export flows.
- Technical labels and stable information placement.

Learning behavior:

- Short explanations beside calculated decisions.
- Clear capacity and validation feedback.
- Starter templates with understandable network shapes.
- Full concepts isolated in Help, not repeated throughout the workspace.

## Current Product Comparison

| Area | Current Subnify | Miqal portfolio/theme | Overhaul decision |
| --- | --- | --- | --- |
| Theme | Local teal token set | Shared blue OKLCH tokens | Import `@miqal/theme/theme.css`; delete duplicate tokens |
| Typography | General sans dashboard | Mono-led technical identity | Mono for navigation, labels, and IP data; sans for prose |
| Landing | Centered gradient hero, alpha pill, feature-card wall | Narrow deliberate composition, thin borders | Technical two-column hero with real planner preview |
| Navigation | Generic app sidebar plus separate marketing header | `/miqal` identity and ecosystem switcher | One Miqal product header; compact route navigation |
| Planner | Stacked configuration and results cards | Restrained surfaces | Continuous workspace with editor, intelligence, and results regions |
| AI | Separate primary navigation destination | No AI-first identity | Embedded “Generate requirements” action inside planner |
| Results | Table, cards, visualizer | Content-led hierarchy | Table, allocation map, hierarchy; remove redundant cards view |
| Motion | Repeated stagger/fade patterns | Short restrained transitions | Motion only for state, focus, route, and layout feedback |
| Shape | Many rounded cards, pills, icon containers | Small radius and thin strokes | Fewer containers, smaller radii, pills only for true status |

## Information Architecture

### Public landing

The landing page has four concise regions:

1. Miqal header with ecosystem app switcher, source link, theme control, and account action.
2. Technical hero: compact label, “Address space, made legible” message, planner CTA, help CTA, and real planner preview.
3. Capability proof: one allocation example showing input, address map, and output. Avoid a feature-card grid.
4. Focused footer with product, source, portfolio, and status links.

The current interactive calculator preview becomes the proof section. It reuses production planner presentation primitives and deterministic sample data. Avoid maintaining a second independent calculator experience.

### Application

Routes remain stable where practical:

- `/app`: unified planner workspace.
- `/app/history`: searchable plan history.
- `/app/help`: concepts, examples, and usage reference.
- `/app/settings`: appearance, profile, and security.

`/app/designer` stops being a primary route. Existing deep links redirect to `/app?generate=1` during migration.

Desktop navigation uses a single sticky Miqal product header. It contains brand, Planner, History, Help, ecosystem switcher, save/account state, and theme control. Mobile uses the same hierarchy inside a compact menu or sheet. Remove the persistent shadcn dashboard sidebar.

## Visual Language

### Foundation

- Add `@miqal/theme` dependency at the released package version used by the portfolio.
- `app/globals.css` imports Tailwind, `@miqal/theme/theme.css`, and shadcn Tailwind integration.
- Keep only Subnify-specific utilities and component overrides locally.
- Map existing Next fonts to `--font-inter` and `--font-jetbrains-mono`, or use Inter and JetBrains Mono directly. One mapping must serve the whole app.
- Preserve light and dark modes through the existing class-based theme provider.

### Composition

- Reading pages use `max-w-7xl`. Planner uses available viewport width with 24px desktop gutters and 16px mobile gutters.
- Thin borders divide regions. Card surfaces appear only where containment carries meaning.
- Base radius comes from the theme. Technical inputs and tables favor `rounded-sm` or `rounded-md`.
- Blue primary is the sole brand accent. Green, amber, and red communicate success, warning, and failure only.
- Dot-grid and ambient gradient appear on landing and empty space. Dense planner surfaces remain legible and quieter.

### Typography

- Mono: brand, navigation, section labels, CIDR, IP addresses, masks, counts, and compact status.
- Sans: page headings, descriptive copy, help explanations, dialogs, and validation guidance.
- Avoid large uppercase headings. Uppercase remains limited to small section labels.
- Avoid gradient text.

### Motion

- Duration range: 120–220 ms for UI state changes.
- Landing entrance transitions use at most 300 ms.
- Remove repeated staggered feature-card animation.
- Preserve layout animation where rows are inserted, removed, or reordered.
- Respect reduced-motion preference.

## Planner Workspace

### Regions

Desktop uses three coordinated regions:

1. Plan editor: plan name, base network/CIDR, subnet requirement rows, template action, AI generation action, calculate/recalculate, reset, and save state.
2. Live intelligence: capacity state, expected blocks, free space, validation, and optional “why?” guidance.
3. Results: summary strip plus table, allocation map, and hierarchy views.

Below the `lg` breakpoint, intelligence moves below the editor. Mobile uses the order editor → intelligence → summary → results. Important actions remain visible without horizontal scrolling.

### Plan lifecycle

1. User starts blank, opens a saved plan, chooses a template, or generates requirements.
2. Inputs update diagnostics immediately.
3. Explicit Calculate/Recalculate creates authoritative results.
4. User inspects synchronized result views.
5. User saves, updates, copies, exports, duplicates, or continues editing.

Explicit calculation remains. Live diagnostics must not silently persist a plan or replace committed results.

### Diagnostics

Create a pure diagnostics layer around existing VLSM logic. It reports:

- Valid IPv4 syntax and octet bounds.
- CIDR integer range and whether base address aligns to the CIDR network boundary.
- Positive finite host counts.
- Required block size and calculated CIDR for each requirement.
- Total allocated address count.
- Remaining address count and utilization percentage.
- Capacity overflow when requirements exceed the parent block.
- Duplicate or blank subnet names as non-blocking warnings.

Diagnostics returns structured data rather than throwing for expected user mistakes. Calculation is disabled for blocking diagnostics. Unexpected failures use a stable inline error region plus toast where an action failed.

### Contextual explanations

Each calculated subnet exposes one short explanation, for example: “62 hosts plus network and broadcast require 64 addresses, so this subnet uses /26.”

Rules:

- Explanations remain concise and derived from deterministic calculation data.
- A global preference collapses guidance.
- The default is visible for first-time/local users, then remembered locally.
- Help owns longer theory and examples.

### Result views

- Table: complete copyable network data. IP fields use mono type. At narrow widths, subnet identity stays in the first sticky column and the remaining columns scroll horizontally.
- Allocation map: proportionally displays allocated and free address space. Hover/focus/click selects a subnet.
- Hierarchy: shows parent/child allocation context and unused regions.
- All views share selected subnet state.
- Remove card view because it duplicates table content and weakens information density.
- Query values using `view=cards` map to `view=table` during migration.

## Integrated AI Requirements

AI remains optional and authenticated under current quota rules.

- Entry: secondary “Generate requirements” action beside templates.
- Surface: dialog or sheet inside planner.
- Input: environment description and existing prompt guidance.
- Output: editable proposed base network, CIDR, named subnet requirements, and rationale.
- Apply: replaces editor values only after explicit confirmation.
- Save: follows normal plan lifecycle; generation does not create a separate product mode.

Failures preserve prompt text and current planner state. Quota, timeout, malformed response, and save failures use distinct messages. Existing API route and schema normalization remain the backend boundary.

## Templates

First release includes local, version-controlled templates:

- Home lab.
- Small office.
- Segmented office with staff, guest, voice, IoT, and servers.

Each template defines title, base CIDR suggestion, subnet names, host requirements, and one-sentence use case. Applying a template replaces editor fields only after confirmation if the current plan has meaningful edits. Templates do not require database changes.

## History

History keeps Supabase and current row-level security.

First-release improvements:

- Client-side search across title and base network for the fetched result set.
- Source filter: all, manual, AI-generated.
- Rename through the existing update permission.
- Duplicate through a new insert using the existing calculation record shape.
- Delete with confirmation and clear pending state.
- Open returns to planner with the selected record.

Search and filters do not require server pagination in this release because the query is capped at 50 records. Pagination remains explicitly deferred.

## State and Data Flow

Retain current boundaries where they are useful:

- `useCalculatorPlanForm`: editable plan fields and source metadata.
- `useCalculatorPageController`: committed results, export, copy, selection, and reset coordination.
- `usePlanPersistence`: save/update orchestration.
- TanStack Query modules: server state, history mutations, settings, and AI quota.
- Pure `lib/vlsm.ts`: allocation engine.

Add focused boundaries:

- Pure planner diagnostics module.
- Template definitions and application helper.
- Planner workspace presentation components.
- Integrated AI generation dialog and controller.
- History rename/duplicate mutations.

Avoid a single oversized planner component. Editor, intelligence, summary, result navigation, and each result visualization receive typed props and expose narrow callbacks.

Data flow:

```text
editable plan state
  -> pure diagnostics
  -> explicit calculate
  -> VLSM allocations
  -> shared result selection
  -> table / map / hierarchy
  -> optional save or export
```

Template, AI, and history inputs all normalize into the same `ReplacePlanInput` boundary.

## Error and Empty States

- Blank planner: show starter prompt, templates, and a valid default network.
- Invalid input: field-level message plus intelligence summary; keep prior committed results visually marked as stale.
- Capacity overflow: show required versus available addresses and identify the requirement that crosses the boundary.
- No history: explain cloud saves and provide “Open planner.”
- Signed-out history: show sign-in action, not destructive error styling.
- AI unavailable: preserve manual planner and prompt; AI never blocks core functionality.
- Export failure: restore button state and report failure. The current `finally` cleanup remains.
- Network/server failure: retain existing data, show retry, avoid blanking successful cached results.

## Accessibility

- All icon-only actions receive explicit labels and tooltips where meaning is not obvious.
- Keyboard order follows visible layout.
- Result rows and allocation regions use buttons or equivalent interactive semantics.
- Selection never depends on color alone.
- Status colors meet contrast requirements in light and dark modes.
- Mobile controls meet minimum touch targets.
- Reduced-motion media query disables nonessential motion.
- Tables preserve headers and accessible names during responsive scrolling.

## Verification Strategy

Introduce automated tests because calculation and workflow risk increases with diagnostics.

### Unit tests

- Existing VLSM allocation behavior: sorting, block sizing, boundaries, masks, ranges, and offsets.
- IPv4/CIDR diagnostics and network alignment.
- Capacity overflow and utilization.
- Template normalization.
- History duplication payload.
- Migration of removed `cards` view to `table`.

### Component tests

- Add/remove subnet rows.
- Blocking and non-blocking diagnostic display.
- Calculate and stale-results behavior.
- Apply/cancel templates.
- Apply/cancel AI-generated requirements.
- History search, filter, rename, duplicate, and delete states.

### Browser tests

- Anonymous manual calculation and PDF/copy entry points.
- Authenticated save, reopen, update, duplicate, and delete flow.
- AI generation apply flow with mocked API response.
- Responsive planner at mobile and desktop widths.
- Theme switch persistence.

### Required project checks

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- New unit/component/browser test commands introduced by implementation

Visual verification includes landing, planner, history, help, settings, auth dialog, empty/error/loading states, both themes, and representative mobile/desktop widths.

## Delivery Slices

1. Theme foundation and shared Miqal header.
2. Landing redesign.
3. Diagnostics and planner workspace shell.
4. Result-view consolidation and synchronization.
5. Templates and contextual guidance.
6. AI integration and designer-route compatibility.
7. History improvements.
8. PDF restyle, accessibility pass, and full verification.

Each slice should leave the app buildable. Database migration is not expected unless rename/duplicate implementation reveals an RLS gap; current update and insert policies appear sufficient.

## Explicitly Deferred

- Public share links.
- Real-time collaboration or teams.
- Billing or plan tiers.
- IPv6 planning.
- Server-side template management.
- Advanced export formats beyond copy and PDF.
- Unlimited or chat-style AI interaction.

## Approved Decisions

- Contextual hybrid layout.
- Visual plus workflow overhaul.
- Professional/learning balance near 65/35.
- Miqal technical visual language.
- Unified planner information architecture.
- AI integrated into planner.
- First-release feature matrix defined above.
