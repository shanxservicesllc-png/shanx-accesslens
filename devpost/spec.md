---
status: draft
project: AccessLens
owner: X / ShanX Services L.L.C.
method: independently prepared draft, not a verified official skill execution
---
# Technical Specification (DRAFT)

## Runtime and file map
A dependency-free static browser app: `index.html`, `app.js`, `analyzer.js`, `assets/style.css`. The browser's native `DOMParser` creates an inert document, prefixed with a restrictive CSP meta tag to prevent fetched resources. No external libraries, storage, network endpoints or accounts are required.

## Inspection data flow
User input (textarea/File API) → validation (nonempty, looks like HTML, length ceiling) → inert `DOMParser` → five `querySelectorAll` checks → structured findings array with `id`, `rule`, `title`, `priority`, `selector`, `element`, `description`, `suggestedFix` → DOM rendering using `textContent` → optional downloadable Markdown Blob.

All user-supplied snippets are inserted with `textContent`. Source is never `eval`'d, run, added via `innerHTML`, or embedded in an iframe. Content Security Policy on the workbench blocks network requests by default. These controls are defense-in-depth and do not replace a formal security review.

## Heuristics
- `img:not([alt])`: high-priority issue; an empty decorative `alt` is accepted.
- `a`: high-priority issue if no detectable link name via visible text, `aria-label`, `aria-labelledby`, nonempty image alt, or SVG title.
- `input,select,textarea`: high-priority issue if no nonempty native `label`/`aria-label`/`aria-labelledby`; submit/reset/button/hidden inputs are skipped.
- Duplicate `id`: medium-priority issue for each later reuse.
- Headings `h1..h6`: review issue for first non-h1 or skipped upward level.

This is a limited static heuristic. It does not compute the complete accessibility tree or assign normative WCAG severity. Locations are CSS-like hints, not precise original file line numbers.

## Rendering and safeguards
- Input changes invalidate previous results.
- Errors are shown in a live alert region.
- Filters alter only the already computed findings array, avoiding re-analysis.
- Markdown report is produced locally and downloaded as a Blob. Suggested fixes are examples; they are never automatically inserted into the source.
- Clipboard tries `navigator.clipboard` then a user-initiated legacy copy fallback. If both fail, the snippet remains manually selectable.
- Responsive style and visible keyboard focus; native controls and reduced-motion preference support.

## Test architecture
- `tests/tests.js` contains 24 browser assertions; `tests/run-tests.html` executes them with native DOMParser.
- `tests/node-tests.cjs` runs the same assertions under a Python `HTMLParser` DOM test double, and asserts exact counts on both shipped fixtures. This *does not* prove browser-native parser behavior.
- `tests/e2e_playwright.py` is an optional real browser smoke script. Its attempted run in this sandbox was blocked by the managed Chromium navigation policy; do not mark passed until rerun on an unrestricted machine.

## Technical decisions pending owner approval
Static HTML/JS instead of hosted SaaS; five check categories; Markdown export format; no scoring; conservative content-size limit; no auto-fixing original. These are worker technical choices following the handoff, not approved Devpost skill stages.
