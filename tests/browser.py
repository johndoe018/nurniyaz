"""Functional browser checks. Run against `npm run preview -- --port 4173`."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

URL = os.environ.get('QUADRATIC_TEST_URL', 'http://127.0.0.1:4173')
OUT = Path(__file__).resolve().parents[1] / 'test-results'
OUT.mkdir(exist_ok=True)
checks = []

with sync_playwright() as p:
    executable = os.environ.get('BROWSER_EXECUTABLE', '/usr/bin/chromium')
    browser = p.chromium.launch(executable_path=executable, headless=True, args=['--no-sandbox'])
    page = browser.new_page(viewport={'width': 1440, 'height': 1100})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(URL, wait_until='networkidle')
    page.evaluate('localStorage.clear()')
    page.reload(wait_until='networkidle')
    expect(page.locator('#equation')).to_have_text('x² − 5x + 6 = 0')
    checks.append('Foundation task renders with its verified equation')

    page.locator('#answer-form button').click()
    expect(page.locator('#feedback')).to_contain_text('Enter a value')
    page.locator('#answer-1').fill('1')
    page.locator('#answer-2').fill('1')
    page.locator('#answer-form button').click()
    expect(page.locator('#feedback')).to_contain_text('two distinct roots')
    page.locator('#answer-1').fill('3')
    page.locator('#answer-2').fill('2')
    page.locator('#answer-form button').click()
    expect(page.locator('#feedback')).to_have_class('feedback success')
    expect(page.locator('#progress-number')).to_have_text('1')
    checks.append('Empty/wrong answers rejected; reversed correct roots accepted; progress updates')

    for _ in range(3): page.locator('#hint-button').click()
    expect(page.locator('#hint-list li')).to_have_count(3)
    expect(page.locator('#hint-button')).to_be_disabled()
    page.locator('#solution-button').click()
    expect(page.locator('#solution')).to_be_visible()
    expect(page.locator('#solution-answer')).to_contain_text('x = 2 or x = 3')
    checks.append('Three progressive hints and the complete walkthrough work')

    page.locator('#tab-standard').click()
    expect(page.locator('#equation')).to_have_text('2x² − 10x + 9 = 0')
    page.locator('#answer-1').fill('(5-sqrt(7))/2')
    page.locator('#answer-2').fill('(5+sqrt(7))/2')
    page.locator('#answer-form button').click()
    expect(page.locator('#feedback')).to_have_class('feedback success')
    expect(page.locator('#scaffold')).to_be_empty()
    checks.append('Standard accepts exact irrational roots and reduces scaffolding')

    page.locator('#tab-advanced').click()
    expect(page.locator('#equation')).to_have_text('h(t) = −5t² + 25t + 30')
    page.locator('#answer-1').fill('-1')
    page.locator('#answer-2').fill('61.25')
    page.locator('#answer-form button').click()
    expect(page.locator('#feedback')).to_contain_text('choose the positive time')
    page.locator('#answer-1').fill('6')
    page.locator('#answer-form button').click()
    expect(page.locator('#feedback')).to_have_class('feedback success')
    expect(page.locator('#progress-number')).to_have_text('3')
    checks.append('Advanced rejects negative time and accepts landing time plus maximum height')

    old = page.locator('#graph-readout').inner_text()
    page.locator('#graph-slider').fill('2.5')
    page.locator('#graph-slider').dispatch_event('input')
    assert page.locator('#graph-readout').inner_text() != old
    checks.append('Graph slider updates the mathematical point and accessible readout')

    page.locator('#tab-advanced').focus()
    page.keyboard.press('ArrowRight')
    expect(page.locator('#tab-foundation')).to_be_focused()
    expect(page.locator('#tab-foundation')).to_have_attribute('aria-selected', 'true')
    expect(page.locator('#answer-1')).to_have_value('3')
    checks.append('Keyboard tab navigation works and level switching preserves current answers')

    page.locator('#new-task').click()
    expect(page.locator('#task-id')).to_have_text('Q–002')
    expect(page.locator('#equation')).to_have_text('x² − 5x + 4 = 0')
    expect(page.locator('#answer-1')).to_have_value('')
    page.reload(wait_until='networkidle')
    expect(page.locator('#progress-number')).to_have_text('3')
    expect(page.locator('#task-id')).to_have_text('Q–002')
    checks.append('New task changes parameters; progress and current seed survive reload')

    page.locator('#about-button').click()
    expect(page.locator('#about-dialog')).to_be_visible()
    page.keyboard.press('Escape')
    expect(page.locator('#about-dialog')).not_to_be_visible()
    checks.append('Explanation dialog opens and closes with keyboard support')

    # A denied model-host request verifies the real failure path, not model inference.
    page.route('https://huggingface.co/**', lambda route: route.abort('blockedbyclient'))
    page.locator('[data-question]').first.click()
    expect(page.locator('#ai-status')).to_have_text('AI UNAVAILABLE', timeout=60000)
    expect(page.locator('#coach-answer')).to_have_attribute('data-source', 'verified-fallback')
    expect(page.locator('#coach-answer')).to_contain_text('not AI-generated')
    expect(page.locator('#coach-form button')).not_to_be_disabled()
    checks.append('Model download failure gives honestly labelled verified guidance and re-enables controls')

    page.locator('#new-task').click()
    expect(page.locator('#coach-state')).not_to_contain_text('Model loaded')
    page.screenshot(path=str(OUT / 'desktop.png'), full_page=True)
    assert not page.evaluate('document.documentElement.scrollWidth > innerWidth')
    for width in [375, 768, 1024]:
        page.set_viewport_size({'width': width, 'height': 900})
        assert not page.evaluate('document.documentElement.scrollWidth > innerWidth'), f'Overflow at {width}px'
        for name in ['foundation', 'standard', 'advanced']:
            page.locator(f'#tab-{name}').click()
            assert not page.evaluate('document.documentElement.scrollWidth > innerWidth'), f'Overflow at {width}px / {name}'
        if width == 375: page.screenshot(path=str(OUT / 'mobile.png'), full_page=True)
    checks.append('All levels fit mobile, tablet and desktop widths without horizontal overflow')

    page.locator('#reset-progress').click()
    expect(page.locator('#progress-number')).to_have_text('0')
    assert not errors, errors
    checks.append('Reset works; no uncaught browser errors')
    assert page.request.get(URL + '/report.pdf').status == 200
    checks.append('Downloadable project report returns HTTP 200')
    browser.close()

(OUT / 'browser-results.json').write_text(json.dumps({'passed': len(checks), 'checks': checks}, indent=2))
for check in checks: print('PASS:', check)
print(f'{len(checks)} functional checks passed')
