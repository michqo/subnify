# Technical Editorial Completion Design

## Summary

Complete the remaining presentation work from the Technical Editorial Product Refinement Design. Landing, planner, history, and help already establish the intended direction. This pass brings settings, authentication, templates, AI requirements, the not-found page, typography, and tests into the same system.

This remains presentation-only work. Calculation, validation, authentication, persistence, quota enforcement, routing, and database behavior must not change.

## Current State

Already complete:

- landing hero, technical specimen, proof calculation, final action, and metadata;
- planner title hierarchy, explicit network metadata props, input labels, capacity status, summary strip, and result actions;
- saved-plan title, search, empty state, rename flow, and deletion consequence;
- IPv4 reference title, section names, examples, and reliability facts;
- planner mobile overflow checks and dark-mode Miqal blue coverage.

Remaining inconsistencies:

- settings still uses an eyebrow, redundant descriptions, and elevated cards;
- authentication still uses generic sign-in copy;
- template and AI dialogs retain old titles and action labels;
- AI quota copy implies a calendar-day reset;
- the not-found page uses a fake route monitor, trace, and tip card;
- some non-technical titles still use monospace;
- component and browser tests still assert old accessible names.

## Goals

- Finish the original refinement without reopening completed surfaces.
- Make all visible product copy use one concise technical-editorial voice.
- Remove remaining decorative or simulated operational UI.
- Keep technical data in monospace and product language in sans-serif.
- Update accessible names and tests together.
- Preserve every behavioral, security, and reliability contract.

## Non-goals

- New features, settings, routes, providers, or data fields.
- Shared primitive redesigns.
- Authentication, AI generation, quota, history, or persistence changes.
- Changes to VLSM calculations, diagnostics, exports, or saved-plan semantics.
- New animation, illustration, or branding systems.
- Broad refactoring of already-complete landing, planner, history, or help code.

## Requirements

### Settings

The settings page shall:

- use `Settings` as its only page heading;
- remove the `Preferences` eyebrow;
- render Appearance, Profile, and Security as flat border-separated sections;
- remove `Choose light, dark, or system theme.`;
- remove `Your email cannot be changed.`;
- remove `This will be shown instead of your email.`;
- keep the email field visibly disabled or read-only;
- preserve username validation, password constraints, provider-dependent security visibility, mutation behavior, errors, and success feedback.

The page shall not modify the shared `Card` primitive to achieve this layout.

### Authentication

The authentication dialog shall:

- use `Sign in` for sign-in mode;
- remove `Sign in to your account to continue`;
- use `Create account` for account-creation mode;
- use `Save plans and draft requirements.` as the account-creation description;
- preserve provider buttons, fields, password constraints, mode switching, errors, and redirect behavior.

Dialog semantics shall expose the visible title as the accessible dialog title. Existing icon-only password visibility controls shall retain explicit accessible names.

### Templates

The template dialog shall:

- use `Choose a template` as its title;
- remove the generic introductory description;
- keep each template description because it distinguishes the network shape;
- show replacement consequences only when current inputs would be replaced;
- preserve template selection, confirmation, cancellation, and apply behavior.

### AI Requirements

The AI requirements dialog shall:

- use `Draft requirements` as its title and generation action;
- use `Describe users, devices, and trust zones. Review before applying.` as its description;
- use `Discard` and `Apply` for preview actions;
- present remaining requests and rolling-window timing as compact metadata;
- avoid `daily`, `today`, or other language implying a calendar-day reset;
- preserve prompt examples, character limits, loading state, deterministic preview, quota exhaustion, retries, errors, and explicit application.

The toolbar and dialog shall use the same `Draft requirements` label.

### Not Found

The not-found page shall:

- use `Page not found` as its level-one heading;
- use `Check the address or return to Subnify.` as its description;
- provide `Planner` as the primary action to `/app`;
- provide `Home` as the secondary action to `/`;
- use a compact centered layout;
- remove the route-monitor label, resolution trace, skeletons, tip card, and elevated card presentation.

### Typography

Visible page, section, and dialog titles shall use the sans-serif typeface. Monospace shall remain limited to IP addresses, CIDR prefixes, counts, compact status, source labels, and technical metadata.

At minimum, remove title-level monospace from:

- signed-out `Saved plans`;
- `Choose a template`;
- `Draft requirements`.

Miqal header identity and technical footer metadata may remain monospace.

### Background Treatment

Reduce the opacity of the existing global blue glow and dot texture while retaining Miqal blue identity in light and dark themes. Do not add gradients, decorative objects, glass effects, or shadows.

This is lower priority than completing copy, structure, and tests. It may be omitted if visual verification shows the current treatment is already sufficiently quiet.

## Accessibility

- Preserve one level-one heading per page or primary product surface.
- Keep form labels visible and associated with their controls.
- Keep dialog titles and visible headings aligned with accessible names.
- Preserve keyboard navigation, focus restoration, live regions, and validation focus.
- Preserve minimum 44px mobile targets.
- Preserve reduced-motion behavior.
- Keep disabled email presentation understandable without explanatory prose.

## Responsive Behavior

- Settings sections remain single-column on mobile.
- Dialog content fits at `390x844` without page-level horizontal overflow.
- The not-found actions wrap without clipping at `320px` and `390px` widths.
- Copy changes must not displace planner toolbar actions or history controls.

## Testing

Update focused component tests to assert the new visible copy and accessible names:

- authentication sign-in and account-creation titles and descriptions;
- template dialog title, replacement warning, and retained descriptions;
- AI dialog title, generation action, quota metadata, preview actions, and preserved behavior;
- settings heading, flat section titles, removed redundant descriptions, and authenticated visibility;
- not-found heading, description, and action destinations.

Update browser tests that currently expect `Welcome back`, `Generate requirements`, `Apply to planner`, or other removed labels.

Browser coverage shall verify:

- signed-out history opens a dialog titled `Sign in`;
- the legacy AI route preserves its auth gate and does not expose the AI dialog before authentication;
- settings and not-found pages have no horizontal overflow at `390x844`;
- no affected page emits console errors;
- dark-mode primary identity remains Miqal blue.

Run the full release gate:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
pnpm audit --prod
git diff --check
```

## Implementation Order

1. Replace authentication, template, AI, and not-found copy and structure.
2. Flatten settings sections without modifying shared primitives.
3. Remove inappropriate title-level monospace.
4. Update focused component tests and stale browser assertions.
5. Perform mobile and dark-mode browser verification.
6. Run the complete release gate.

## Error Handling

| Surface | Required behavior |
| --- | --- |
| Authentication | Preserve provider and credential errors without weakening detail. |
| Settings | Preserve validation, mutation, and success feedback. |
| Templates | Preserve replacement warning when current inputs would be lost. |
| AI requirements | Preserve quota exhaustion, request errors, retry behavior, and deterministic validation failures. |
| Not found | Always provide working routes to Planner and Home. |

## Acceptance Criteria

- Given a signed-out user opens authentication, when the dialog appears, then its visible and accessible title is `Sign in` and no generic continuation description is shown.
- Given account-creation mode, when the dialog appears, then it explains `Save plans and draft requirements.` while preserving password constraints.
- Given the template dialog opens, when no replacement confirmation is active, then its title is `Choose a template` and concrete template descriptions remain visible.
- Given the AI dialog opens, when the user drafts and previews requirements, then the actions read `Draft requirements`, `Discard`, and `Apply`, and quota copy does not imply a calendar-day reset.
- Given settings renders, when the user scans the page, then `Settings` is the only page heading and Appearance, Profile, and Security use flat bordered sections without redundant descriptions.
- Given an unknown route, when the not-found page renders, then it shows `Page not found`, the direct description, and working `Planner` and `Home` actions without simulated monitoring UI.
- Given any affected page at mobile width, when it renders and is used, then no content causes page-level horizontal overflow.
- Given the full release gate runs, then all commands pass with zero production audit findings.