import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const storageRules = fs.readFileSync(new URL('../storage.rules', import.meta.url), 'utf8');
const firestoreRules = fs.readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
const documentFunction = fs.readFileSync(new URL('../functions/src/documents.ts', import.meta.url), 'utf8');

test('current company profile controls administrator access without a stale session flag', () => {
  const storageAdmin = storageRules.match(/function activeAdmin\(companyId\) \{([\s\S]*?)\n    \}/)?.[1] || '';
  const firestoreAdmin = firestoreRules.match(/function admin\(app, company\) \{([\s\S]*?)\n    \}/)?.[1] || '';

  assert.match(storageAdmin, /firestore\.get\(userPath\(companyId, request\.auth\.uid\)\)\.data\.get\('isAdmin', false\) == true/);
  assert.doesNotMatch(storageAdmin, /request\.auth\.token\.get\('isAdmin'/);
  assert.match(firestoreAdmin, /users\/\$\(request\.auth\.uid\)\)\.data\.get\('isAdmin', false\) == true/);
  assert.doesNotMatch(firestoreAdmin, /request\.auth\.token\.get\('isAdmin'/);
  assert.match(documentFunction, /isAdmin = data\.isAdmin === true/);
});

test('tenant identity is still required before the current profile can grant access', () => {
  assert.match(storageRules, /request\.auth\.token\.get\('companyId', ''\) == companyId/);
  assert.match(firestoreRules, /request\.auth\.token\.get\('companyId', ''\) == company/);
  assert.match(documentFunction, /identity\.token\.companyId !== companyId/);
});

test('platform support uses the immutable uid and private authorization record instead of a stale claim', () => {
  const storageSupport = storageRules.match(/function activePlatformSupport\(\) \{([\s\S]*?)\n    \}/)?.[1] || '';
  const firestoreSupport = firestoreRules.match(/function support\(\) \{([\s\S]*?)\n    \}/)?.[1] || '';

  for (const supportRule of [storageSupport, firestoreSupport]) {
    assert.match(supportRule, /request\.auth\.uid == 'platform-support-francielton'/);
    assert.match(supportRule, /_platformSupport/);
    assert.match(supportRule, /enabled/);
    assert.doesNotMatch(supportRule, /isDeveloper/);
  }
  assert.match(documentFunction, /const isSupport = identity\.uid === 'platform-support-francielton'/);
});
