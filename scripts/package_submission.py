"""Package committed source and the existing static build without dependencies/secrets."""
import io
import json
import shutil
import subprocess
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT.parent / 'output'
OUT.mkdir(exist_ok=True)
AUTHOR = 'Muratbek Nurniyaz'
NAME = 'Muratbek_Nurniyaz_Quadratic_Studio'
sha = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
if not (ROOT / 'dist/index.html').exists(): raise SystemExit('Run npm run build first.')
source = subprocess.check_output(['git', 'archive', '--format=zip', 'HEAD'], cwd=ROOT)

launcher = '''"""Run the prebuilt Quadratic Studio website with Python 3."""
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import argparse

parser = argparse.ArgumentParser(description='Start Quadratic Studio locally')
parser.add_argument('--port', type=int, default=8000)
args = parser.parse_args()
directory = str(Path(__file__).resolve().parent)
handler = partial(SimpleHTTPRequestHandler, directory=directory)
with ThreadingHTTPServer(('127.0.0.1', args.port), handler) as server:
    print(f'Quadratic Studio: http://127.0.0.1:{args.port}')
    print('Press Ctrl+C to stop. AI downloads its model on first use.')
    try: server.serve_forever()
    except KeyboardInterrupt: pass
'''
readme = '''# Quadratic Studio — Muratbek Nurniyaz

Topic 8: AI for Differentiated Learning / Quadratic equations

## Included

- report.pdf: the one-page project report.
- source/: complete committed source, prompts, tests and README.
- website/: a prebuilt, locally runnable website. No npm install is needed for this copy.
- preview-desktop.png and preview-mobile.png: interface previews.
- build-info.json: exact source commit used for this package.

## Open the prebuilt website

With Python 3 installed, open a terminal in website/ and run:

    python3 start.py

On Windows you can use `py start.py`. Open the address printed in the terminal.
Do not double-click index.html: browser module workers require an HTTP origin.

All three levels, answer checking, hints, walkthroughs, graphs and local progress work without an AI account.
The open-source AI coach downloads its model on first use and requires a compatible browser and model-host access.
If it fails, the application labels the fallback as verified guidance, not AI-generated text.

## Source and hosting

Live website: https://johndoe018.github.io/bekarys1/
Public source: https://github.com/johndoe018/bekarys1
See source/SUBMISSION.md for verified capabilities and the current real-AI/deployment status.
The website is deployed with GitHub Pages; the source includes its tested deployment workflow.
The contents of website/ can also be deployed to a static host such as Netlify.

The report and source disclose AI development assistance. Review the work before submitting it.
'''

archive = OUT / f'{NAME}_Complete.zip'
with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    prefix = NAME + '/'
    z.writestr(prefix + 'START_HERE.md', readme)
    z.writestr(prefix + 'build-info.json', json.dumps({'project':'Quadratic Studio','author':AUTHOR,'source_commit':sha}, indent=2))
    with zipfile.ZipFile(io.BytesIO(source)) as src:
        for member in src.infolist():
            if not member.is_dir(): z.writestr(prefix + 'source/' + member.filename, src.read(member))
    for path in (ROOT / 'dist').rglob('*'):
        if path.is_file(): z.write(path, prefix + 'website/' + path.relative_to(ROOT / 'dist').as_posix())
    z.writestr(prefix + 'website/start.py', launcher)
    z.write(ROOT / 'public/report.pdf', prefix + 'report.pdf')
    for name in ['preview-desktop.png','preview-mobile.png']:
        z.write(ROOT / 'docs' / name, prefix + name)

shutil.copyfile(ROOT / 'public/report.pdf', OUT / f'{NAME}_Report.pdf')
shutil.copyfile(ROOT / 'docs/preview-desktop.png', OUT / f'{NAME}_Preview.png')
print(archive)
print('Source commit:', sha)
print('Archive bytes:',archive.stat().st_size)
