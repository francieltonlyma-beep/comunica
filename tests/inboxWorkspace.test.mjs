import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

test('caixa de entrada é um módulo próprio da navegação e das permissões', () => {
  assert.match(app, /\{ id: 'inbox', label: 'Caixa de entrada' \}/);
  assert.match(app, /id: 'inbox', label: 'Caixa de entrada', description: 'Conversas, demandas e prazos'/);
  assert.match(app, /badge: unreadMessages\.length \|\| null/);
  assert.match(app, /activeTab === 'inbox' && inboxSurface/);
});

test('atalhos abrem a aba sem depender de uma janela sobreposta', () => {
  assert.match(app, /title="Abrir Caixa de entrada" aria-label="Abrir Caixa de entrada"/);
  assert.match(app, /onClick=\{\(\) => setActiveTab\('inbox'\)\}/);
  assert.doesNotMatch(app, /setShowMessagesModal\(true\)/);
});

test('layout adapta lista e leitura sem perder o contexto da conversa', () => {
  assert.match(app, /const inboxSurface = \(/);
  assert.match(app, /Alterne sem sair da leitura atual/);
  assert.match(app, /hidden w-\[320px\][^\n]+lg:flex/);
  assert.match(app, /Voltar às conversas/);
  assert.match(app, /h-\[calc\(100dvh-7rem\)\]/);
});
