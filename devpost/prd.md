---
status: draft
project: AccessLens
owner: X / ShanX Services L.L.C.
method: independently prepared draft, not a verified official skill execution
---
# Product Requirements (DRAFT)

## Audience and job
Small-site makers want to catch obvious static accessibility problems before HTML goes live. Success means understanding what element has a problem and obtaining a sensible example to adapt, not memorizing standards.

## User path
1. Arrive at the workbench with a clear no-upload statement and examples.
2. Paste markup, browse a local file, or load the deliberately flawed example.
3. Click Inspect HTML and review the count of **findings** by workflow priority, without an invented overall score.
4. For each finding, see a short title, DOM-approximate location, excerpt, why it matters, and a copyable example fix.
5. Filter by priority; export Markdown report or copy snippets.
6. Load corrected sample and observe that it has fewer findings, though not a WCAG compliance stamp.

## Layout and visual direction (recommendation, awaiting owner decision)
Dark, text-forward split workbench with an editorial headline, lime accents, monospaced code, large input panel and right-hand finding panel. On small screens stack the panels. Use native buttons, a labeled textarea, consistent focus indication, role=alert errors, and a polite live-updating findings area.

## Core behavior
- Operate fully on local HTML text. Never insert supplied HTML into the live page as active markup.
- Process no more than 500,000 HTML characters. File selection is limited to 1 MB.
- Sort results by high, medium, then review; surface findings per element with an ID and rule name.
- Accept empty alt for truly decorative images. Flag only a *missing* alt attribute, not empty alt.
- Accept label associations through associated `label`, nesting, `aria-label`, or valid `aria-labelledby` text. Placeholders alone are insufficient.
- Flag first heading not `h1` or an upward skip, marking it for review, not a conformance failure.
- Explain that five checks cannot determine full accessibility or WCAG conformance.

## Error paths
Empty or plain-text input yields a visible, actionable error. Oversized source is rejected. Changing markup clears stale results. Filter with no results shows a distinct empty state. If a clipboard write is blocked, show a clear unavailable status and allow manual selection of the displayed code. Export stays disabled before inspection.

## Now / later
**Now:** exact minimum loop, examples, export, error handling and tests.
**Later (not in this entry):** richer accessible-name algorithm, source line mappings, HTML patch preview, contrast inspection, visual browser tests, and optional user-assented AI explanation.

## Owner decisions still needed
Approval of scope, audience phrasing, visual style, prioritization and later features, followed by final license/publication approval. The worker's choices above are recommendations, not claimed owner selections.
