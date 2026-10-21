import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const aliases = JSON.parse(readFileSync(new URL('../.firebaserc', import.meta.url), 'utf8'));
const stagingConfig = JSON.parse(readFileSync(new URL('../firebase.staging.json', import.meta.url), 'utf8'));
const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('production and staging use explicit different Firebase projects', () => {
  assert.equal(aliases.projects.production, 'comunica-salvador');
  assert.equal(aliases.projects.staging, 'comunica-info-staging');
  assert.notEqual(aliases.projects.production, aliases.projects.staging);
  assert.equal(stagingConfig.hosting.site, 'comunica-info-staging');
});

test('staging bundle blocks accidental production configuration', () => {
  assert.match(appSource, /IS_STAGING && firebaseConfig\.projectId === 'comunica-salvador'/);
  assert.match(appSource, /A homologação tentou usar o projeto de produção e foi bloqueada/);
  assert.match(appSource, /Ambiente de homologação/);
});

test('free staging deploy excludes services that require billing', () => {
  assert.match(packageJson.scripts['deploy:staging'], /--only hosting,firestore$/);
  assert.doesNotMatch(packageJson.scripts['deploy:staging'], /functions|storage/);
});
