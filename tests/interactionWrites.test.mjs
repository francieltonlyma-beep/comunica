import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

test('read confirmations use atomic array union', () => {
  assert.match(app, /updateDocField\('announcements', announcement\.id, \{ readBy: arrayUnion\(currentUser\.id\) \}\)/);
  assert.match(app, /updateDocField\('documents', documentItem\.id, \{ readBy: arrayUnion\(currentUser\.id\) \}\)/);
});

test('votes update only the authenticated voter key', () => {
  assert.match(app, /updateDoc\(doc\(pollsCollection, poll\.id\), new FieldPath\('votes', currentUser\.id\), optionIndex\)/);
});
