import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

test('platform support exposes a private laboratory with the fleet prototype', () => {
  assert.match(source, /Laboratório do Comunica/);
  assert.match(source, /Ambiente privado de homologação/);
  assert.match(source, /Comunica Integra — Frotas|Controle de Frotas/);
  assert.match(source, /comunica-integra-frotas\.savoryanole130\.chatgpt\.site/);
  assert.match(source, /Empresa piloto/);
  assert.match(source, /Liberação geral/);
});

test('destructive content actions require an explicit confirmation', () => {
  for (const type of ['document', 'post', 'event', 'announcement']) {
    assert.match(source, new RegExp(`type: '${type}'`));
  }
  assert.match(source, /pendingContentDeletion/);
  assert.match(source, /role="alertdialog"/);
  assert.match(source, /Manter publicação/);
  assert.match(source, /Sim, excluir/);
  assert.match(source, /confirmContentDeletion/);
});
