import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const functionSource = fs.readFileSync(new URL('../functions/src/platformCompanyHealth.ts', import.meta.url), 'utf8');
const indexSource = fs.readFileSync(new URL('../functions/src/index.ts', import.meta.url), 'utf8');
const appSource = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

test('company health summary is restricted to the authorized platform support account', () => {
  assert.match(functionSource, /auth\.uid !== SUPPORT_UID/);
  assert.match(functionSource, /auth\.token\.isDeveloper !== true/);
  assert.match(functionSource, /_platformSupport\/\$\{SUPPORT_UID\}/);
  assert.match(functionSource, /access\.data\(\)\?\.enabled !== true/);
});

test('company health uses bounded, cached, on-demand reads', () => {
  assert.match(functionSource, /const CACHE_MS = 5 \* 60 \* 1000/);
  assert.match(functionSource, /\.limit\(100\)\.get\(\)/);
  assert.match(functionSource, /if \(!forceRefresh && cachedHealth/);
  assert.match(indexSource, /platformCompanyHealth = onCall\(\{invoker: 'public', maxInstances: 1\}/);
});

test('support dashboard exposes transparent onboarding checks without personal names', () => {
  for (const label of ['Equipe cadastrada', 'Setores definidos', 'Cargos configurados', 'Primeiro acesso realizado', 'Permissões revisadas', 'Primeiro comunicado', 'Documentos publicados', 'Notificações ativadas']) {
    assert.ok(appSource.includes(label), `missing onboarding label: ${label}`);
  }
  assert.match(appSource, /Saúde das empresas/);
  assert.match(appSource, /cache por cinco minutos/);
  assert.doesNotMatch(functionSource, /employeeNames|userNames|employeeName/);
});

test('health distinguishes environment setup from real adoption', () => {
  assert.match(functionSource, /implementationScore \* 0\.6 \+ adoptionRate \* 0\.3 \+ notificationRate \* 0\.1/);
  assert.match(appSource, /Implantação \{company\.implementationScore\}%/);
  assert.match(appSource, /Adoção \{company\.adoptionRate\}%/);
  assert.match(appSource, /Notificações \{company\.notificationRate\}%/);
});
