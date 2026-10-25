"""Optional real-browser E2E. Requires Python Playwright + installed Chromium.
Run from project root: python tests/e2e_playwright.py
Browser-native zero-dependency test runner: tests/run-tests.html
"""
import json
import http.server
import threading
import functools
import pathlib
import sys
import shutil
import os
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
EVIDENCE = ROOT / 'evidence'
EVIDENCE.mkdir(exist_ok=True)


def main():
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT))
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base_url = f'http://127.0.0.1:{server.server_port}'
    with sync_playwright() as pw:
        browser_path = os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE') or shutil.which('chromium')
        browser = pw.chromium.launch(headless=True, executable_path=browser_path if browser_path else None)
        page = browser.new_page(viewport={"width": 1440, "height": 1100}, device_scale_factor=1,
                                accept_downloads=True)
        errors = []
        remote_requests = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('request', lambda r: remote_requests.append(r.url) if
                (r.url.startswith('http://') or r.url.startswith('https://')) and not r.url.startswith(base_url) else None)
        page.goto(base_url + '/tests/run-tests.html')
        summary = page.locator('#summary').inner_text()
        print('Browser unit tests:', summary)
        assert page.locator('#summary').get_attribute('data-passed') == page.locator('#summary').get_attribute('data-total'), page.locator('#results').inner_text()
        unit_count = int(page.locator('#summary').get_attribute('data-passed'))
        page.goto(base_url + '/index.html')
        assert 'See the barriers' in page.locator('h1').inner_text()
        page.get_by_role('button', name='Load flawed example').click()
        page.get_by_role('button', name='Inspect HTML').click()
        assert page.locator('#findingHeader').inner_text() == 'FINDINGS / 5', page.locator('#findingHeader').inner_text()
        assert page.locator('#highCount').inner_text() == '3'
        assert page.locator('#mediumCount').inner_text() == '1'
        assert page.locator('#reviewCount').inner_text() == '1'
        assert page.locator('article.finding').count() == 5
        page.screenshot(path=str(EVIDENCE / 'flawed-inspection.png'), full_page=True)
        print('E2E flawed sample: 5 findings [high=3, medium=1, review=1] PASS')
        page.locator('#priorityFilter').select_option('medium')
        assert page.locator('article.finding').count() == 1
        assert 'Duplicate id' in page.locator('article.finding').inner_text()
        print('E2E priority filter: PASS')
        page.locator('#priorityFilter').select_option('all')
        with page.expect_download() as item:
            page.get_by_role('button', name='Export report .md').click()
        download = item.value
        assert download.suggested_filename == 'accesslens-report.md'
        saved = EVIDENCE / 'downloaded-flawed-report.md'
        download.save_as(saved)
        content = saved.read_text(encoding='utf-8')
        assert 'Image missing alt attribute' in content
        assert 'Duplicate id attribute' in content
        assert 'not a WCAG' in content
        print('E2E export report: PASS')
        page.get_by_role('button', name='Load corrected example').click()
        page.get_by_role('button', name='Inspect HTML').click()
        assert page.locator('#findingHeader').inner_text() == 'FINDINGS / 0'
        assert page.locator('#highCount').inner_text() == '0'
        assert 'human accessibility review' in page.locator('#findings').inner_text().lower()
        page.screenshot(path=str(EVIDENCE / 'corrected-inspection.png'), full_page=True)
        print('E2E corrected sample: 0 findings PASS')
        page.get_by_role('button', name='Clear').click()
        page.get_by_role('button', name='Inspect HTML').click()
        assert 'Paste HTML' in page.locator('#errorText').inner_text()
        print('E2E empty input error: PASS')
        page.locator('#htmlInput').fill('<h1>Hello</h1><img src="https://accesslens-example.invalid/pixel.png" onerror="alert(1)">')
        page.get_by_role('button', name='Inspect HTML').click()
        assert page.locator('#highCount').inner_text() == '1'
        assert not errors, f'JS page errors: {errors}'
        # A hostile page is NEVER inserted into live app DOM. Check alert/remote fetch separately.
        print('E2E untrusted markup treated as text: PASS')
        print('E2E network requests during local file test:', json.dumps(remote_requests))
        print('E2E JavaScript errors:', len(errors))
        browser.close()
        server.shutdown()
        return unit_count, remote_requests

if __name__ == '__main__':
    try:
        unit_count, remote = main()
        print(f'RESULT: PASS ({unit_count} browser unit tests + 6 UI workflows)')
        if remote:
            print('WARNING: Browser attempted external requests. Check privacy claim before shipping.')
            sys.exit(2)
    except Exception as error:
        print(f'RESULT: FAIL: {error!r}')
        raise
