# Real browser test limitation | 2026-10-23

## Actual attempt

The worker attempted to execute `python tests/e2e_playwright.py` with Playwright and Chromium in the current sandbox.

1. First attempt used Playwright's default headless browser; failed before test navigation because the installed Playwright package's expected `chromium_headless_shell-1200` binary did not exist.
2. Switched to the installed `/usr/bin/chromium` (Chromium 144.0.7559.96). Attempt to navigate to `file:///mnt/data/AccessLens_08/tests/run-tests.html` failed with `net::ERR_BLOCKED_BY_ADMINISTRATOR`.
3. Started a local Python `http.server` and retried navigation to `http://127.0.0.1:<ephemeral_port>/tests/run-tests.html`; this **also** failed with `net::ERR_BLOCKED_BY_ADMINISTRATOR`. Managed Chromium policy showed `URLBlocklist: ["*"]`.

## Consequence

**Browser UI verification: BLOCKED / UNVERIFIED.** No genuine UI screenshot exists, and no downloaded browser report has been claimed as actual. Do not describe Playwright E2E as PASS. The screenshots expected from the optional Playwright script were **not** produced in this environment.

## Separate actual evidence

Node/Python DOM test-double execution of `analyzer.js` passed 24/24 rule assertions plus two fixture expectations. See `evidence/node-tests.txt`. JavaScript syntax checks also passed. These are verified but **not substitutes for real browser interaction**.

## Reproduce on an unrestricted machine

Open `tests/run-tests.html` in a modern browser for native DOMParser rule tests. Then, if Playwright and a supported Chromium binary are available, run `python tests/e2e_playwright.py` for real user-interface verification and screenshots. This script starts a local HTTP server and does not deploy the application.

**Network/privacy validation is not complete:** application source contains no fetch, API, analytics or telemetry calls and uses a restrictive CSP on the inert document; external resource loading was not independently tested in an unrestricted browser.
