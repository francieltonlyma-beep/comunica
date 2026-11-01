import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('../', import.meta.url));
const eslint = fileURLToPath(new URL('../node_modules/eslint/bin/eslint.js', import.meta.url));

function lint(source, filename) {
  const result = spawnSync(process.execPath, [eslint, '--stdin', '--stdin-filename', filename, '--format', 'json', '--pass-on-unpruned-suppressions'], {
    cwd: root,
    input: source,
    encoding: 'utf8',
    timeout: 30_000,
  });
  assert.ifError(result.error);
  assert.ok([0, 1].includes(result.status), result.stderr);
  return { status: result.status, messages: JSON.parse(result.stdout)[0]?.messages ?? [] };
}

test('CI lint recognizes CommonJS and service worker globals', () => {
  assert.equal(lint("const fs = require('node:fs'); module.exports = fs;", 'comunica/index.js').status, 0);
  assert.equal(lint("importScripts('/firebase.js'); firebase.initializeApp({}); clients.matchAll();", 'public/firebase-messaging-sw.js').status, 0);
});

test('CI lint still rejects undefined names in the legacy application', () => {
  const result = lint('missingCiGlobal();', 'src/App.jsx');
  assert.equal(result.status, 1);
  assert.ok(result.messages.some(message => message.ruleId === 'no-undef'));
});

test('CI lint rejects increases above existing violations for a file and rule', () => {
  const result = lint('const firstUnused = 1; const secondUnused = 2;', 'src/Careers.jsx');
  assert.equal(result.status, 1);
  assert.equal(result.messages.filter(message => message.ruleId === 'no-unused-vars').length, 2);
});
