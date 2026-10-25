# AccessLens

**An original, local-first accessibility issue inspector for HTML authors.**

AccessLens checks locally authored HTML for five specific patterns: missing `alt` attributes on images, empty/unnamed links, form fields without detectable labels, duplicate IDs, and heading-level jumps. Each finding includes a CSS-like location, a readable element excerpt, a *reviewable example repair*, and a workflow-priority label. You can export a Markdown inspection report. There is **no overall accessibility score** and **no WCAG-conformance claim**.

## Quick start: no account, server, npm, or installation

1. Extract the entire ZIP. Keep the folder structure intact.
2. Open **`index.html`** in a modern desktop browser (Chrome, Edge, Firefox, or Safari). A normal static file works; alternatively, run `python -m http.server 8000` from the extracted folder and open `http://localhost:8000`.
3. Click **Load flawed example**, then **Inspect HTML**. You should see five findings: 3 high priority, 1 medium, 1 review.
4. Choose the **corrected example** and inspect again. Expect zero findings across the same five heuristics.
5. To inspect your own page, paste its HTML or use **Choose a local .html file**; then run the inspector. Download a `.md` report and/or copy individual example fixes. **Your source file is not changed.**

If clipboard access is restricted by the browser, select and copy the displayed repair snippet manually. The ZIP also provides `fixtures/flawed.html` and `fixtures/corrected.html` as separate sample files.

## What a finding means

| Check | Trigger | Example response |
| --- | --- | --- |
| Image alternatives | `<img>` lacks an `alt` attribute | Provide useful alternative text, or `alt=""` when truly decorative |
| Link names | `<a>` has no detectable text, ARIA name, image alternative or SVG title | Give the link clear destination text |
| Form labels | An interactive input, select or textarea has no detectable label | Associate a meaningful `<label>` or use appropriate accessible naming |
| Unique IDs | An `id` appears on multiple elements | Change the duplicate ID and update its references |
| Heading order | First heading is not `h1`, or heading levels skip upwards | Review the document's heading hierarchy |

**Priority labels are approximate workflow hints, not conformance severity ratings.** The checker is a static DOM heuristic, not a full accessible-name computation. Some links and controls may be falsely flagged or missed. For example, it does not execute JavaScript, measure color contrast, verify keyboard navigation, evaluate the quality of alt text, scan remote websites, or test the rendered site with assistive technology. Zero findings means **only that these checks found nothing**.

## Trust, privacy and source-code boundaries

- Your HTML is parsed locally in the browser, not uploaded to a server. The application contains no telemetry, accounts, external libraries or API calls. It adds a restrictive CSP to the inert inspection document, and source excerpts render as text rather than executable markup.
- No remote crawling, editing originals, site deployment or third-party audits.
- Source size is capped at 500,000 characters (and imported file size at 1 MB) to avoid unbounded local work. Large/invalid inputs are rejected with clear messages.
- Treat recommended repairs as illustrative examples. Replace placeholder names and paths with correct site-specific content.

## Tests and reproduction

**Zero-dependency browser unit test suite:** open `tests/run-tests.html` and verify all **24/24** tests pass. It exercises the exact `analyzer.js` used by the interface. Tests do not replace a complete browser UI smoke test.

**Node-based CLI tests with Python standard library DOM test double:** if Python 3 and Node 18+ are available, run:

```shell
node tests/node-tests.cjs
```

This runs the same 24 assertions and two integration-fixture checks and writes `evidence/example-flawed-report.md` and `evidence/example-corrected-report.md`. Unlike a browser, the DOM test double uses Python's `HTMLParser`, so its results are **not** proof of identical browser behavior for arbitrary broken HTML.

**Optional actual Chromium/Playwright end-to-end run:** requires `pip install playwright` and a supported Chromium executable or an installed Playwright browser. It launches a local HTTP server for testing.

```shell
python tests/e2e_playwright.py
```

The script performs UI interactions, verifies result counts and priority filtering, downloads a report, checks invalid input, and writes browser screenshots when allowed. The original sandbox's managed Chromium policy blocked all navigation (including localhost); thus the shipped proof does **not** claim this E2E run passed. See `evidence/browser-run-limitation.md`.

## Project files

- `index.html`: accessible user interface.
- `assets/style.css`: responsive styling; no external fonts.
- `app.js`: local file picker, demo loading, findings UI, clipboard and download handling.
- `analyzer.js`: inspection and Markdown export engine.
- `fixtures/`: flawed and corrected HTML examples.
- `tests/`: browser-native tests, reproducible Node DOM-test-double tests, optional Playwright E2E.
- `evidence/`: actual terminal test outputs and example reports; browser limitation disclosure.
- `devpost/`: scope, PRD, spec and build checklist marked **draft**, plus an app map.
- `ACCEPTANCE_REPORT.md`: precise acceptance and remaining blocks.
- `DEMO_PLAN.md`: demo outline shorter than three minutes; not a Devpost entry written for the owner.
- `SHA256SUMS.txt`: per-file SHA-256 hashes; reproducibility manifest.

## Project provenance and publication

AccessLens is newly written for the **Build With AI: Basics** concept in this ChatGPT sandbox. The owner's pre-existing ShanX website/game ecosystem served as **inspiration only**; no owner site code, assets or credentials were imported. The product scope and planning documents remain *draft pending owner approval*. **Official Devpost Learn Skill Pack invocation was not verified in this environment.** The hackathon rules require actual Skill Pack use; a coordinator must resolve that requirement before submission. No public repository, demo video, submission text or exit survey has been created on the owner's behalf.

Official resources: [Devpost rules](https://learn-ai-basics.devpost.com/rules), [Devpost Learn Skill Pack](https://github.com/challengepost/learn-ai-basics).

## License

See `LICENSE-DRAFT.md`. The owner has **not** selected or approved a publication license; no third-party license is implied.
