# Inline Plan Rename Design

## Summary

Make planner title directly editable from planner toolbar. Rename works for signed-in and signed-out users. Existing plan-name state remains source of truth.

## Goals

- Expose clear rename action beside current plan title.
- Keep rename flow fast, keyboard accessible, and mobile friendly.
- Preserve current cloud save and update behavior.
- Avoid adding new persistence, route, or database concepts.

## Non-goals

- Immediate standalone cloud-history rename from planner toolbar.
- Automatic local-storage persistence for signed-out plans.
- Version history for title changes.
- Changing history-page rename behavior.

## Interaction

Toolbar renders current trimmed name or `Untitled plan` inside a level-one heading. Heading content is a title-styled rename button containing the displayed name and a decorative pencil icon, so clicking either visible element starts editing.

Activating title or rename button replaces heading with focused text input:

- Input starts with current raw plan name.
- `Enter` commits current value and exits edit mode.
- Blur commits current value and exits edit mode.
- `Escape` restores value present when editing began and exits edit mode.
- Empty or whitespace-only committed value stores empty string and displays `Untitled plan`.
- Input accepts at most 80 characters, matching existing plan-name field.

Rename control remains available regardless of authentication or cloud-save selection. Mobile target height remains at least 44 pixels.

## State and Persistence

`planName` and `onPlanNameChange` remain controlled props. `PlannerWorkspace` forwards both to `PlannerToolbar`.

Toolbar owns only transient edit state:

- whether editor is open;
- original value used by `Escape`.

Each edit session calls existing `onPlanNameChange` at most once when committed. `Escape` does not call it. No new store added.

Persistence remains unchanged:

- signed-out or unsaved plans keep name for current page session;
- new cloud saves include current title on next valid calculation;
- cloud-linked plans persist current title on next valid calculation/update;
- history-page rename continues updating title immediately through existing history mutation.

Template, AI apply, history restore, and reset continue setting plan name through existing callbacks.

## Accessibility

- Visible title remains semantic level-one heading outside edit mode.
- Rename action exposes plan-specific accessible name such as `Rename plan: Untitled plan`.
- Input label is available to assistive technology as `Plan name`.
- Focus moves into input after activation.
- `Enter`, blur, and `Escape` behavior works without pointer input.
- Focus indicator uses existing shared input/button styles.
- Control meets 44-pixel mobile target requirement.

## Error Handling

Rename has no network operation. Empty names fall back to `Untitled plan`; values over 80 characters cannot be entered. Cloud persistence failures continue through existing calculation-save error handling.

## Testing

Component tests prove:

- `Untitled plan` exposes rename action;
- activation focuses input;
- typing and `Enter` commit new name;
- blur commits new name;
- `Escape` restores original name;
- whitespace-only value displays `Untitled plan`;
- 80-character limit exists;
- controlled prop update renders committed title.

Browser test proves rename remains usable at desktop and `390x844`, uses keyboard flow, and does not introduce horizontal overflow.

Run full release gate:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
pnpm audit --prod
```

## Acceptance Criteria

- User can rename any current plan directly from toolbar.
- Rename works while signed out and without enabling cloud save.
- Enter and blur commit; Escape cancels.
- Blank name displays `Untitled plan`.
- Current save/update flow receives committed name.
- Desktop and mobile layouts remain accessible and unclipped.
- Existing unit, browser, build, and audit gates pass.
