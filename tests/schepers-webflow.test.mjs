import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../schepers-webflow.js', import.meta.url), 'utf8')
  .catch(() => '');

test('is isolated to Schepers data-page roots', () => {
  assert.match(source, /\[data-page\^="schepers-"\]/);
  assert.match(source, /if \(!root\) return/);
});

test('respects reduced motion', () => {
  assert.match(source, /prefers-reduced-motion: reduce/);
});

test('supports accessible mobile navigation', () => {
  assert.match(source, /data-menu-open/);
  assert.match(source, /data-menu-close/);
  assert.match(source, /aria-hidden/);
  assert.match(source, /Escape/);
});

test('initializes page-specific modules defensively', () => {
  assert.match(source, /schepers-home/);
  assert.match(source, /schepers-training/);
  assert.match(source, /schepers-stallungen/);
  assert.match(source, /schepers-privatunterricht/);
  assert.match(source, /querySelector/);
});
