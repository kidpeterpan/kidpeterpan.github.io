import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../assets/css/main.css', import.meta.url), 'utf8');

// Returns the body of the first block whose header matches `header`, using brace matching.
function block(source, header) {
  const start = source.indexOf(header);
  if (start === -1) return null;
  const open = source.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}' && --depth === 0) return source.slice(open + 1, i);
  }
  return null;
}

function tokens(body) {
  const map = {};
  for (const m of body.matchAll(/--([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g)) map[m[1]] = m[2];
  return map;
}

const light = tokens(block(css, ':root {') ?? '');
const dark = { ...light, ...tokens(block(css, 'html[data-theme="dark"] {') ?? '') };

function lum(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a, b) {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const TEXT_PAIRS = [
  ['ink', 'paper'], ['ink', 'face'], ['muted', 'paper'], ['muted', 'face'],
  ['accent', 'paper'], ['accent', 'face'], ['title-ink', 'title'],
  ['term-ink', 'term-bg'], ['term-prompt', 'term-bg'],
];
const EDGE_PAIRS = [['edge', 'face'], ['edge', 'paper']];

for (const [name, theme] of [['Default', light], ['Midnight', dark]]) {
  test(`palette contrast meets AA: ${name}`, () => {
    for (const [fg, bg] of TEXT_PAIRS) {
      assert.ok(theme[fg] && theme[bg], `missing token --${fg} or --${bg}`);
      const r = ratio(theme[fg], theme[bg]);
      assert.ok(r >= 4.5, `--${fg} on --${bg} is ${r.toFixed(2)}:1, needs 4.5`);
    }
    for (const [fg, bg] of EDGE_PAIRS) {
      assert.ok(theme[fg] && theme[bg], `missing token --${fg} or --${bg}`);
      const r = ratio(theme[fg], theme[bg]);
      assert.ok(r >= 3, `--${fg} on --${bg} is ${r.toFixed(2)}:1, needs 3`);
    }
  });
}

test('forced-colors keeps borders', () => {
  const body = block(css, '@media (forced-colors: active)');
  assert.ok(body, 'no @media (forced-colors: active) block');
  assert.match(body, /\.out\b/);
  assert.match(body, /\.in\b/);
  assert.match(body, /border-color:\s*CanvasText/);
});

test('nothing is hidden without JS', () => {
  const noPref = block(css, '@media (prefers-reduced-motion: no-preference)') ?? '';
  const hidden = [...css.matchAll(/([^{}]+)\{([^{}]*opacity:\s*0\b[^{}]*)\}/g)]
    .filter((m) => m[1].includes('.reveal'));
  for (const m of hidden) assert.match(m[1], /html\.anim-pre/, `rule hides .reveal without html.anim-pre: ${m[1].trim()}`);
  const blinkRules = css.match(/animation:[^;]*blink[^;]*;/g) ?? [];
  const inNoPref = noPref.match(/animation:[^;]*blink[^;]*;/g) ?? [];
  assert.equal(blinkRules.length, inNoPref.length, 'blink animation used outside prefers-reduced-motion: no-preference');
});

test('high-contrast preference drops the stipple', () => {
  const body = block(css, '@media (prefers-contrast: more)');
  assert.ok(body, 'no @media (prefers-contrast: more) block');
  assert.match(body, /body\s*\{[^}]*background-image:\s*none/);
});
