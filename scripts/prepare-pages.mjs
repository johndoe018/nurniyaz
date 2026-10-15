import { cpSync, copyFileSync, existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const at = path => resolve(root, path);

// Keep the editable entry separate from the files served by branch-based Pages.
copyFileSync(at('dist/app.html'), at('dist/index.html'));
rmSync(at('dist/app.html'));
const current = readdirSync(at('dist/assets'));
const manifest = at('.pages-assets.json');
const previous = existsSync(manifest) ? JSON.parse(readFileSync(manifest, 'utf8')) : [];
for (const name of previous) {
  if (typeof name === 'string' && !name.includes('/') && !name.includes('\\') && !current.includes(name)) {
    rmSync(at(`assets/${name}`), { force: true });
  }
}
cpSync(at('dist/assets'), at('assets'), { recursive: true });
for (const name of ['index.html', 'report.pdf', 'report-nurniyaz.pdf', 'favicon.svg']) copyFileSync(at(`dist/${name}`), at(name));
writeFileSync(manifest, JSON.stringify(current, null, 2) + '\n');
writeFileSync(at('.nojekyll'), '');
console.log('Compiled website prepared in dist/ and repository root for GitHub Pages.');
