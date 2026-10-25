import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const showcase = fs.readFileSync(new URL('../src/LoginShowcase.jsx', import.meta.url), 'utf8');
const functionsSource = fs.readFileSync(new URL('../functions/src/index.ts', import.meta.url), 'utf8');
const leadSource = fs.readFileSync(new URL('../functions/src/salesLeads.ts', import.meta.url), 'utf8');
const rules = fs.readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
const serviceWorker = fs.readFileSync(new URL('../public/firebase-messaging-sw.js', import.meta.url), 'utf8');
const styles = fs.readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');

test('login presents the platform solutions and a complete business contact form', () => {
  for (const solution of ['Comunicação interna', 'Demandas e serviços', 'Escalas e calendário', 'Documentos corporativos', 'Pessoas e clima', 'Gestão e indicadores', 'Banco de talentos', 'Canal de denúncias']) {
    assert.match(showcase, new RegExp(solution));
  }
  for (const field of ['companyName', 'cnpj', 'phone', 'email']) assert.match(showcase, new RegExp(field));
  assert.match(app, /<LoginShowcase onSubmit=\{handleSalesContact\}/);
  assert.doesNotMatch(showcase, /Elton/);
  assert.match(app, /login-page[^\"]*overflow-x-clip/);
  assert.match(styles, /\.login-page \{[^}]*touch-action: pan-y/);
});

test('public contact submission is validated, rate limited and stored only by the server', () => {
  assert.match(functionsSource, /submitPlatformSalesContact = onCall/);
  assert.match(leadSource, /isValidCnpj/);
  assert.match(leadSource, /RATE_LIMIT = 3/);
  assert.match(leadSource, /_platformSalesRateLimits/);
  assert.match(rules, /_platformSalesLeads/);
  assert.match(rules, /allow create, delete: if false/);
  assert.match(rules, /allow read: if support\(\)/);
});

test('support receives leads and can contact or classify them', () => {
  assert.match(app, /collection\(db, '_platformSalesLeads'\)/);
  assert.match(app, /Contatos comerciais/);
  assert.match(app, /WhatsApp/);
  assert.match(app, /Contato realizado/);
  assert.match(app, /Convertido/);
  assert.match(app, /Arquivado/);
  assert.match(app, /comunica-open-sales-lead/);
  assert.match(app, /supportLead/);
  assert.match(serviceWorker, /sales_lead/);
});
