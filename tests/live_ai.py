"""Real model integration check. Runs in CI; downloads public model weights.

This is distinct from browser.py's deliberately blocked-download fallback check.
Generated explanations are recorded for human review, not treated as a math oracle.
"""
import html
import json
import os
import subprocess
import time
import urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'test-results'
OUT.mkdir(exist_ok=True)
results = []
diagnostics = []
external_url = os.environ.get('QUADRATIC_TEST_URL')
server = None if external_url else subprocess.Popen(['npm', 'run', 'preview', '--', '--port', '4180', '--strictPort'], cwd=ROOT,
                          stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
url = external_url or 'http://127.0.0.1:4180'
try:
    for _ in range(80):
        try:
            response = urllib.request.urlopen(url, timeout=3)
            if response.status == 200 and b'Quadratic Studio' in response.read(): break
        except Exception: time.sleep(.25)
    else: raise RuntimeError('Production server did not start')
    with sync_playwright() as p:
        launch = {'headless': True, 'args': ['--no-sandbox']}
        if os.environ.get('BROWSER_EXECUTABLE'): launch['executable_path'] = os.environ['BROWSER_EXECUTABLE']
        browser = p.chromium.launch(**launch)
        page = browser.new_page(viewport={'width': 1280, 'height': 1000})
        page.on('console', lambda message: diagnostics.append(message.text[:500]) if message.type in ['error', 'warning'] else None)
        page.on('requestfailed', lambda request: diagnostics.append(request.url.split('?')[0] + ': ' + str(request.failure)))
        page.goto(url, wait_until='networkidle')
        for level in ['foundation', 'standard', 'advanced']:
            page.locator(f'#tab-{level}').click()
            started = time.monotonic()
            page.locator('[data-question]').first.click()
            page.wait_for_function("['AI RESPONSE','AI UNAVAILABLE'].includes(document.getElementById('ai-status').textContent)", timeout=200000)
            status = page.locator('#ai-status').inner_text()
            text = page.locator('#coach-answer').inner_text()
            source = page.locator('#coach-answer').get_attribute('data-source')
            strategy = page.locator('#coach-answer').get_attribute('data-strategy')
            results.append({'level': level, 'equation': page.locator('#equation').inner_text(), 'status': status,
                            'source': source, 'strategy': strategy, 'text': text, 'seconds': round(time.monotonic() - started, 2)})
            page.screenshot(path=str(OUT / f'live-ai-{level}.png'), full_page=True)
            passed = status == 'AI RESPONSE' and source == 'model-selected' and strategy in ['A','B','C','D'] and len(text.strip()) > 10
            annotation = ('Live model inference passed: ' + text) if passed else ('Live model inference failed: ' + ' | '.join(diagnostics[-6:]))
            annotation = annotation.replace('%', '%25').replace('\r', '%0D').replace('\n', '%0A')
            print(f'::{"notice" if passed else "error"} title=AI browser {level}::{annotation}', flush=True)
            assert passed, f'{level}: live model inference failed: {text}'
            print(f'PASS real browser model inference / {level}: {text}', flush=True)
        browser.close()
finally:
    import signal
    if server: os.killpg(server.pid, signal.SIGTERM)
    (OUT / 'live-ai-results.json').write_text(json.dumps({'results': results, 'diagnostics': diagnostics}, indent=2))
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        summary = ['## Real on-device AI browser check',
                   'Runs the production website in Chromium and downloads the real open-source model. The entries below distinguish model output from verified fallback. Generated prose still needs mathematical review.']
        for result in results:
            summary.append(f"### {result['level'].title()} — {result['status']} ({result['seconds']} s)")
            summary.append(f"<pre>{html.escape(result['equation'])}\nSource: {html.escape(result['source'] or 'none')}\n\n{html.escape(result['text'])}</pre>")
        Path(os.environ['GITHUB_STEP_SUMMARY']).write_text('\n\n'.join(summary))
