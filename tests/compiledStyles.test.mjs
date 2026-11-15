import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import config from '../tailwind.config.js';

test('styles compile without a browser compiler and include lazy modules and saved badge colors', async () => {
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /cdn\.tailwindcss\.com/);
  const { css } = await postcss([tailwindcss(config)]).process('@tailwind base; @tailwind utilities;', { from: undefined });
  const selectors = new Set();
  postcss.parse(css).walkRules(rule => selectors.add(rule.selector));
  // Layout, arbitrary sizes and stored colors must exist before opening a module.
  for (const selector of ['.fixed', '.bg-slate-900', '.text-white', '.border-rose-300', '.bg-violet-500', '.rounded-3xl', '.text-\\[9px\\]', '.z-\\[10020\\]']) {
    assert.ok(selectors.has(selector), `Missing compiled style: ${selector}`);
  }
  assert.match(css, /@media \(min-width: 1024px\)/);
  assert.match(css, /--tw-backdrop-blur/);
});
