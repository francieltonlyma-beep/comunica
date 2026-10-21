import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

test('saved announcements and posts enter the timeline immediately without duplicates', () => {
  assert.match(app, /await saveDoc\('announcements', annId, created\)[\s\S]*?setAnnouncements\(previous => \[created, \.\.\.previous\.filter\(item => item\.id !== annId\)\]\)/);
  assert.match(app, /await saveRelatedRecords\(createdPosts\.map[\s\S]*?setSectorPosts\(previous => \[\.\.\.createdPosts, \.\.\.previous\.filter\(post => !createdIds\.has\(post\.id\)\)\]\)/);
});

test('feed text and photos are not cropped', () => {
  for (const name of ['item', 'ann', 'post']) {
    assert.match(app, new RegExp(`texto=\\{${name}\\.content\\}[^<]*<\\/p>`));
    assert.match(app, new RegExp(`src=\\{${name}\\.image\\}[^>]*w-full h-auto[^>]*object-contain`));
  }
  assert.ok((app.match(/whitespace-pre-wrap break-words \[overflow-wrap:anywhere\]/g) || []).length >= 3);
});

test('tenant realtime listeners are all removed when the company changes', () => {
  for (const listener of ['Posts', 'Prod', 'Messages', 'Events', 'Absences', 'Presence', 'Documents', 'Polls']) {
    assert.match(app, new RegExp(`unsub${listener}\\(\\);`));
  }
});
