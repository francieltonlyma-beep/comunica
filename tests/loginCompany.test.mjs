import test from 'node:test';
import assert from 'node:assert/strict';
import { isLoginCompanyIdentified } from '../src/loginCompany.js';

test('empresa da sessão anterior não aparece antes de um novo código ser informado', () => {
  const previousCompany = { id: 'empresa-anterior', name: 'Empresa Anterior' };
  assert.equal(isLoginCompanyIdentified(previousCompany, ''), false);
  assert.equal(isLoginCompanyIdentified(previousCompany, '08'), false);
  assert.equal(isLoginCompanyIdentified(previousCompany, '082026'), true);
});

test('código sem empresa validada não libera as próximas etapas', () => {
  assert.equal(isLoginCompanyIdentified(null, '082026'), false);
});
