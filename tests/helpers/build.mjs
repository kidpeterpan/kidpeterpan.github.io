import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));
let cached;

// Builds the production site once per test process and returns the output dir.
export function buildSite() {
  if (cached) return cached;
  const out = mkdtempSync(join(tmpdir(), 'kpp-site-'));
  const hugo = process.env.HUGO || 'hugo';
  const run = spawnSync(hugo, ['--minify', '-d', out], { cwd: root, encoding: 'utf8' });
  const log = `${run.stdout || ''}${run.stderr || ''}`;
  if (run.error) throw new Error(`could not run ${hugo}: ${run.error.message}`);
  if (run.status !== 0 || /\b(WARN|ERROR)\b/.test(log)) {
    throw new Error(`hugo build failed or warned (exit ${run.status}):\n${log}`);
  }
  cached = out;
  return out;
}

// Every emitted page as { path: '/open-mtp-client/', html }.
export function pages(dir) {
  const found = [];
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const full = join(d, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (name === 'index.html' || name === '404.html') {
        const rel = '/' + relative(dir, full).split(sep).join('/');
        const html = readFileSync(full, 'utf8');
        // Hugo writes a <meta http-equiv=refresh> stub at /en/ pointing at the root; it is not a page.
        if (!/http-equiv=["']?refresh/.test(html)) found.push({ path: rel.replace(/index\.html$/, ''), html });
      }
    }
  };
  walk(dir);
  return found.sort((a, b) => a.path.localeCompare(b.path));
}

// What the parity test compares: the page's h1 text and the sorted unique hrefs inside <main>.
export function summarize(html) {
  const main = (html.match(/<main\b[\s\S]*?<\/main>/) || [''])[0];
  const h1 = ((main.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '').replace(/<[^>]+>/g, '').trim();
  const hrefs = [...new Set([...main.matchAll(/\bhref=("([^"]*)"|([^\s>]+))/g)].map((m) => m[2] ?? m[3]))].sort();
  return { h1, hrefs };
}
