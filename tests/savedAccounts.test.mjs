import test from 'node:test';
import assert from 'node:assert/strict';
import { accountKey, clearSavedAccounts, employeeAccount, readSavedAccounts, rememberAccounts, signInToSavedAccount } from '../src/savedAccounts.js';

const company = { id: 'company-a', code: 'AAAA', name: 'Empresa A' };
const person = { id: 'employee', name: 'Ana', pin: '0123', token: 'session', isAdmin: true };
const account = employeeAccount(company, person);

function storage() {
  const data = new Map();
  return {
    getItem: key => data.get(key),
    setItem: (key, value) => data.set(key, value),
    removeItem: key => data.delete(key),
  };
}

test('lembra apenas a identificação, distingue empresas e atualiza a conta sem duplicá-la', () => {
  const device = storage();
  const secondAccount = employeeAccount({ id: 'company-b', code: 'BBBB', name: 'Empresa B' }, person);
  const updated = { ...account, name: 'Ana Silva' };
  rememberAccounts(device, account, secondAccount, updated);

  assert.notEqual(accountKey(account), accountKey(secondAccount));
  assert.deepEqual(readSavedAccounts(device), [updated, secondAccount]);
  assert.doesNotMatch(device.getItem('comunica_saved_accounts'), /0123|token|isAdmin/);
  assert.equal(employeeAccount(company, { ...person, isDeveloper: true }), null);
  clearSavedAccounts(device);
  assert.deepEqual(readSavedAccounts(device), []);
});

test('ignora dados inválidos e descarta credenciais adicionadas ao armazenamento local', () => {
  const device = storage();
  device.setItem('comunica_saved_accounts', '{');
  assert.deepEqual(readSavedAccounts(device), []);
  device.setItem('comunica_saved_accounts', JSON.stringify([{}, null, { ...account, pin: '0123', token: 'other' }]));
  assert.deepEqual(readSavedAccounts(device), [account]);
});

test('usa o servidor para validar o PIN antes de trocar a sessão', async () => {
  const calls = [];
  const session = { token: 'firebase-token', user: person, company, requiresPinChange: true };
  const result = await signInToSavedAccount({
    account, pin: '0123',
    authenticate: async payload => {
      calls.push(payload);
      return { data: session };
    },
    prepareDevice: async () => { calls.push('prepare'); },
    signIn: async token => { calls.push(token); },
  });
  assert.deepEqual(calls, [{ companyCode: 'AAAA', userId: 'employee', pin: '0123' }, 'prepare', 'firebase-token']);
  assert.equal(result.requiresPinChange, true);
});

test('PIN recusado ou escopo divergente mantém a sessão atual', async () => {
  const forbidden = () => assert.fail('A sessão antiga deve ser preservada.');
  for (const authenticate of [
    async () => { throw Object.assign(new Error('PIN inválido'), { code: 'functions/permission-denied' }); },
    async () => ({ data: { token: 'different-token', user: person, company: { id: 'other-company' } } }),
  ]) {
    await assert.rejects(signInToSavedAccount({ account, pin: '0000', authenticate, prepareDevice: forbidden, signIn: forbidden }));
  }
});
