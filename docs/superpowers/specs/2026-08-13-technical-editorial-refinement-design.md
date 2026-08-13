# Technical Editorial Product Refinement Design

## Summary

Refine Subnify across landing, planner, history, help, settings, dialogs, and utility pages. Keep current Miqal palette and technical character. Replace formulaic marketing copy and repeated card patterns with concrete language, stronger data hierarchy, flatter sections, and quieter visual treatment.

This is presentation work. Planner behavior, validation, persistence, AI safeguards, database contracts, routes, and result semantics remain unchanged.

## Goals

- Make product feel authored, specific, and technically credible.
- Replace generic titles and descriptions with concise network language.
- Reduce repeated eyebrow, title, and paragraph stacks.
- Make real subnet data primary visual material.
- Improve hierarchy without adding ornament or interaction complexity.
- Apply one coherent language across public and authenticated surfaces.
- Preserve accessibility, responsive behavior, dark mode, and Miqal identity.

## Non-goals

- New features, routes, settings, or data fields.
- Database, API, authentication, quota, or migration changes.
- Changes to VLSM calculation or validation behavior.
- Removal or weakening of error, security, trust, or destructive-action copy.
- New illustration system, bespoke icon set, or animation framework.
- Full redesign of shared Miqal header identity.
- Product rebrand.

## Direction

Use a technical editorial direction.

Rejected alternatives:

- Instrument-panel styling would improve density but push product toward a generic enterprise dashboard.
- Terminal-first styling would be distinctive in isolation but repeat common developer-tool clichés and overuse monospace.

Technical editorial styling keeps existing geometry and blue palette while making hierarchy, copy, and data presentation more deliberate.

## Content System

### Voice

- Use concrete nouns: network, prefix, address, subnet, host, result, plan.
- Use direct verbs: enter, calculate, copy, export, save, apply.
- Keep titles between one and four words.
- Use descriptions only for constraints, consequences, or unfamiliar actions.
- Prefer visible data over claims about speed, clarity, or workflow.
- Use sentence case for interface labels and titles.
- Keep status copy fragmentary when meaning remains clear.

### Remove

Do not use these phrases or close variants in visible product copy:

- `made legible`
- `one continuous workflow`
- `ready when the network is`
- `define, inspect, continue`
- `committed results`
- `current network map`
- generic `to continue` descriptions

### Preserve

Keep technical meaning intact in:

- VLSM validation errors and canonical-address suggestions;
- AI privacy, quota, and validation explanations;
- cloud-history boundary and save/update states;
- deletion and replacement confirmations;
- password constraints and authentication failures;
- help-page reliability facts.

## Visual System

### Typography

- Use sans-serif for page titles, section titles, body copy, and actions.
- Use monospace for IP addresses, CIDR prefixes, counts, short status, and compact metadata.
- Remove landing-page-wide monospace inheritance.
- Keep headings compact; avoid multiple title levels saying same thing.
- Use tracking and uppercase sparingly. No repeated eyebrow label above every page title.

### Surfaces

- Prefer border-separated sections over independent cards.
- Keep cards for dialogs, saved-plan records, and grouped actions requiring containment.
- Keep current compact radius scale.
- Reduce background glow and dot texture opacity; do not remove Miqal blue identity.
- Avoid new gradients, glass effects, floating decorative objects, and ornamental shadows.
- Preserve clear focus rings, selected states, error colors, and success colors.

### Data hierarchy

- Treat actual network values as visual anchors.
- Prefer one compact metadata line over descriptive paragraphs.
- Keep allocation bars, tables, hierarchy, CIDR values, and totals visually prominent.
- Do not duplicate same metric in adjacent panels without purpose.

## Landing Page

### Hero

Replace current hero copy with:

- Title: `Every address accounted for.`
- Description: `Enter a network and host counts. Get valid CIDR blocks, free space, and exports.`
- Primary action: `Plan a network`
- Secondary action: `See an example`

Remove `IPv4 planning workspace` eyebrow.

Keep two-column layout. Turn preview into integrated technical specimen rather than elevated SaaS card:

- header value: `192.168.10.0/24`;
- status: `valid`;
- allocation rows and proportional bar;
- compact totals for subnets, allocated addresses, and free addresses.

Specimen uses border separation and restrained background, without large shadow.

### Example section

Replace section title with `Host counts in. CIDR blocks out.`

Use three compact steps:

1. `Input` — `Parent range and required hosts.`
2. `Allocate` — `Smallest fitting blocks, largest first.`
3. `Use` — `Copy, export, or save.`

Keep real `10.30.0.0/23` proof calculation and allocation output. Remove `One continuous workflow` eyebrow and `Define. Inspect. Continue.` heading.

### Final action

Replace CTA copy with:

- Title: `Start with 192.168.1.0/24.`
- Action: `Open planner`

Remove supporting marketing paragraph and eyebrow.

### Metadata

Keep metadata title unchanged. Use description: `Plan IPv4 subnets with VLSM, live capacity checks, saved history, and export.`

## Planner

### Toolbar

- Remove `IPv4 plan` eyebrow.
- Keep editable plan name as sole level-one title.
- Add compact metadata line from current inputs: `{baseNetwork or —}/{baseCidr or —} · {count} requirements`.
- Preserve inline rename, Templates, and AI actions.
- `Generate requirements` toolbar action → `Draft requirements`.
- Keep actions visually secondary to plan name.

`PlannerToolbar` must receive base network, prefix, and requirement count through explicit props. It must not derive form state indirectly or duplicate planner logic.

### Input section

Use these labels:

- `Network input` → `Plan`
- `Base Network` → `Parent network`
- `CIDR Notation` → `Prefix`
- `Subnet Requirements` → `Requirements`
- `Save this manual calculation to cloud history` → `Save to history`
- saved badge → `Saved`
- AI-plan badge → `AI`

Remove `Each entry defines a subnet name and required hosts.`

Keep technical errors, suggestions, AI save/update guidance, and cloud-linked behavior unchanged. Concise guidance may replace long state copy only when same consequence remains explicit.

### Capacity panel

- `Live checks` → `Capacity`
- Valid state: `Fits · {remaining} addresses free`
- Invalid state: existing direct issue list.
- `Show explanations` / `Hide explanations` → `Allocation notes` / `Hide allocation notes`

Remove generic `Inputs fit inside the parent network with no overlap.` because valid status plus remaining count conveys same result.

Keep available, remaining, utilization, and allocation explanations. Do not change diagnostics calculation.

### Summary

Remove `Address summary` heading. Keep flat metric strip:

- `Subnets`
- `Allocated`
- `Free`
- `Used`

Keep stale-results status explicit and visible.

### Results

Use:

- `Committed results` → `Results`
- `Copy` → `Copy all`
- `PDF` → `Export PDF`
- empty table state: `Calculate a valid plan to see results.`

Keep result metadata compact: parent CIDR, subnet count, allocated addresses, and free addresses. Preserve Table, Allocation map, and Hierarchy labels and all result behavior.

## History

- Remove `Cloud workspace` eyebrow.
- `Plan history` → `Saved plans`
- Search placeholder: `Search name or network`
- Empty state: `No saved plans.`
- Signed-out copy: `Sign in to view saved plans.`

Keep source, parent CIDR, subnet count, and timestamp as compact metadata. Keep search, source filters, rename, duplicate, reopen, and deletion behavior.

Rename dialog:

- Title: `Rename plan`
- Remove generic recognition advice.
- Label: `Name`
- Action: `Save`

Delete dialog must retain consequence that cloud copy is removed and exports stay unchanged.

## Help

- Remove `Reference` eyebrow.
- `Using Subnify` → `IPv4 reference`
- Rename sections:
  - `Quick start` → `Start`
  - `CIDR and VLSM` → `CIDR`
  - `Live checks` → `Validation`
  - `Generated requirements` → `AI plans`
  - `Reading results` → `Results`
  - `Worked examples` → `Examples`
  - `History and export` → `History`
  - `Templates` remains `Templates`

Split long prose into short paragraphs or compact factual blocks. Preserve every reliability fact:

- canonical parent addresses;
- `/0` through `/30` parent model;
- network and broadcast reservation;
- `/31` and `/32` exclusion;
- largest-first allocation and stable ties;
- capacity meaning;
- AI deterministic validation and explicit apply;
- stored-history fields and deletion behavior;
- valid and failing examples.

## Settings

- Remove `Preferences` eyebrow.
- Keep page title `Settings`.
- Render Appearance, Profile, and Security as flat bordered sections rather than separate elevated cards.
- Remove descriptions that merely repeat controls:
  - `Choose light, dark, or system theme.`
  - `Your email cannot be changed.`
  - `This will be shown instead of your email.`
- Keep immutable-email affordance clear through disabled/read-only presentation.
- Preserve password constraints, errors, success feedback, and authentication behavior.

## Dialogs

### Authentication

- `Welcome back` → `Sign in`
- Remove `Sign in to your account to continue`.
- Account creation description: `Save plans and draft requirements.`
- Preserve providers, email/password fields, password constraints, errors, and mode switching.

### Templates

- `Start from a template` → `Choose a template`
- Remove generic template description.
- Keep replacement warning only when current inputs would be replaced.
- Keep template descriptions because they distinguish concrete network shapes.

### AI requirements

- `Generate requirements` → `Draft requirements`
- Description: `Describe users, devices, and trust zones. Review before applying.`
- Keep prompt examples, character limit, deterministic preview, quota, error, discard, and apply behavior.
- `Discard preview` → `Discard`
- `Apply to planner` → `Apply`
- Present quota as compact rolling-window metadata; do not imply calendar-day reset.

## Utility Pages

### Not found

Remove fake network-monitor presentation, skeleton trace, and tip card.

Use:

- Title: `Page not found`
- Description: `Check the address or return to Subnify.`
- Primary action: `Planner`
- Secondary action: `Home`

Keep page compact and centered.

### Header and footer

- Preserve `/miqal / subnify` identity and product navigation.
- `How it works` public link may remain because it targets actual example section.
- Keep theme, source, app switcher, authentication, and mobile-navigation behavior.
- Footer remains compact; copy changes only where needed for link consistency.

## Component Boundaries

- Keep copy close to owning component unless reused by multiple surfaces.
- Do not introduce a general copy registry.
- Keep page-level layout changes in page or feature components, not shared primitives.
- Shared `Card`, `Button`, `Input`, `Tabs`, and dialog primitives retain behavior.
- Global CSS changes limited to background treatment and typography defaults needed by this design.
- No feature component may import planner state solely for presentation; add explicit props when needed.

## Accessibility

- Preserve one level-one heading per page or primary product surface.
- Preserve logical heading order after eyebrow removal.
- Keep visible labels for form controls.
- Keep existing live regions and validation focus behavior.
- Maintain at least 44px targets on mobile.
- Preserve keyboard access to inline rename, tabs, menus, dialogs, and result selection.
- Keep reduced-motion override.
- Maintain sufficient contrast in light and dark themes.
- Copy changes must update accessible names and their tests together.

## Responsive Behavior

- Landing hero remains readable at `320px`, `390x844`, and desktop.
- Technical specimens scroll internally only when content cannot wrap; page itself must not overflow.
- Planner metadata truncates or wraps without displacing toolbar actions.
- History controls stack cleanly on narrow screens.
- Help navigation becomes non-sticky before desktop breakpoint.
- Settings sections remain single-column on mobile.

## Testing

Update component tests for intentional visible-copy and accessible-name changes. Tests should assert new specific copy, not broad snapshots.

Browser coverage must verify:

- landing title, actions, and example anchor;
- planner title, input labels, capacity state, metric strip, and results actions;
- signed-out saved-plans and authentication copy;
- help title and section navigation;
- signed-out settings boundary; authenticated settings title and section structure through component coverage;
- 404 title and actions;
- desktop and `390x844` layout without horizontal overflow;
- dark-mode primary identity remains Miqal blue;
- no page console errors.

Run full release gate:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
pnpm audit --prod
git diff --check
```

## Acceptance Criteria

- Whole product uses one concise technical-editorial voice.
- Repeated eyebrow/title/description pattern is removed from primary surfaces.
- Landing page no longer uses global monospace or generic marketing claims.
- Planner prioritizes plan name, network metadata, capacity, and output data.
- History, help, settings, dialogs, and 404 use direct titles and necessary descriptions only.
- Existing technical, security, validation, and destructive-action meaning remains intact.
- No calculation, persistence, AI, history, route, or database behavior changes.
- Mobile, keyboard, screen-reader, reduced-motion, dark-mode, and overflow behavior remain valid.
- Full automated gate passes with zero production audit findings.
