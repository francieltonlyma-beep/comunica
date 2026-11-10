import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { loginDirectoryUsers, filterLoginEmployees, normalizeLoginName } from '../src/loginDirectory.js';

const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const extract = (name, next, context) => vm.runInNewContext('(' + app.split('const ' + name + ' = ')[1].split('const ' + next + ' = ')[0].trim().replace(/;$/, '') + ')', context);
const users = [{ id: 'joao', name: 'JOÃO PEDRO', role: 'Operação' }, { id: 'jose', name: 'José' }, { id: 'ana', name: 'Ana' }];
const company = { id: 'ver', code: '092026', name: 'Verdurão' };

function lookupContext(call) {
  const state = { company: null, directory: null, code: '', usersList: users, loading: false, error: '' };
  const context = { isFirebaseAvailable: true, functionsClient: {}, appId: 'comunica-salvador', companies: [], companyLookupRequestRef: { current: 0 },
    httpsCallable: () => call, setCompanyCode: value => { state.code = value; }, setLoginSelectedUserId() {}, setLoginSearchText() {},
    setLoginError: value => { state.error = value; }, setActiveCompany: value => { state.company = value; state.usersList = []; },
    setLoginDirectory: value => { state.directory = value; }, setUsersList: value => { state.usersList = value; },
    setCompanyLookupLoading: value => { state.loading = value; }, setCompanies() {}, loginErrorMessage: () => 'Acesso não autorizado. Contate o suporte.' };
  return { state, run: extract('handleCompanyCodeChange', 'handleUserLoginSubmit', context) };
}

test('a sincronização sem sessão pode limpar a equipe sem apagar a lista retornada para o login', async () => {
  const { state, run } = lookupContext(async () => ({ data: { company, users } }));
  await run('092026');
  assert.equal(state.usersList.length, 0);
  const directory = loginDirectoryUsers(state.directory, state.company, state.code);
  assert.equal(directory.length, 3);
  assert.equal(filterLoginEmployees(directory, 'Jo').length, 2);
  assert.equal(state.loading, false);
});

test('resultado antigo não troca a empresa nem interrompe o carregamento de uma digitação nova', async () => {
  const pending = new Map();
  const { state, run } = lookupContext(data => new Promise(resolve => pending.set(data.companyCode, resolve)));
  const first = run('082026');
  const second = run('092026');
  pending.get('082026')({ data: { company: { id: 'old', code: '082026' }, users: [{ id: 'old-user', name: 'Antigo' }] } });
  await first;
  assert.equal(state.loading, true);
  assert.equal(state.company, null);
  pending.get('092026')({ data: { company, users } });
  await second;
  assert.deepEqual(loginDirectoryUsers(state.directory, state.company, state.code), users);
  assert.equal(state.loading, false);
});

test('erro e código incompleto limpam a lista anterior e não revelam nomes de outra empresa', async () => {
  let calls = 0;
  const { state, run } = lookupContext(async () => { calls++; throw { code: 'functions/failed-precondition' }; });
  state.directory = { companyId: company.id, code: company.code, users };
  await run('092026');
  assert.equal(state.directory, null);
  assert.match(state.error, /Acesso não autorizado/);
  await run('09');
  assert.equal(calls, 1);
  assert.equal(state.loading, false);
  assert.equal(loginDirectoryUsers({ companyId: 'old', code: '092026', users }, company, '092026').length, 0);
});

test('busca aceita acentos, espaços e caixa e a lista vazia de busca mostra toda a equipe válida', () => {
  assert.equal(normalizeLoginName('  João   Pedro '), 'joao pedro');
  assert.equal(filterLoginEmployees(users, 'joao')[0].id, 'joao');
  assert.equal(filterLoginEmployees(users, ' JOSÉ ')[0].id, 'jose');
  const valid = loginDirectoryUsers({ code: '092026', companyId: 'ver', users: [...users, { id: 'platform-support-francielton', name: 'Suporte' }, { id: 'x', name: 'Inativo', isEmployee: false }] }, company, '092026');
  assert.equal(filterLoginEmployees(valid, '').length, 3);
});

test('envio do PIN usa o diretório do login mesmo com a equipe interna vazia', async () => {
  let sent = null, logged = null, error = '', busy = false;
  const context = { activeCompany: company, usersList: [], loginUsers: users, loginSelectedUserId: 'joao', loginSearchText: 'João Pedro',
    normalizeLoginName, loginPin: '1234', loginSubmitInFlight: { current: false }, companyLookupLoading: false, appId: 'comunica-salvador',
    isFirebaseAvailable: true, functionsClient: {}, httpsCallable: () => async data => { sent = data; return { data: { token: 'token', company, user: users[0] } }; },
    authPersistenceReady: Promise.resolve(), auth: {}, signInWithCustomToken: async () => {}, setActiveCompany() {},
    setCurrentUser: user => { logged = user; }, setLoginPin() {}, setLoginSearchText() {}, setLoginSelectedUserId() {},
    setLoginError: value => { error = value; }, setLoginSubmitting: value => { busy = value; }, triggerNotification() {}, console,
    loginErrorMessage: e => String(e) };
  await extract('handleUserLoginSubmit', 'handleDeveloperLogin', context)({ preventDefault() {} });
  assert.equal(sent.userId, 'joao');
  assert.equal(logged.id, 'joao');
  assert.equal(error, '');
  assert.equal(busy, false);
});

test('instalação oferece ajuda em modo aplicativo e quando o navegador não libera o prompt', async () => {
  for (const standalone of [true, false]) {
    let help = false;
    const context = { isStandaloneApp: standalone, installPrompt: null, setShowInstallHelp: value => { help = value; } };
    await extract('handleInstallApp', 'persistBrowserPushToken', context)();
    assert.equal(help, true);
  }
  const entry = app.indexOf("isStandaloneApp ? 'Instalação do aplicativo' : 'Instalar o Comunica no celular'");
  const codeField = app.indexOf('>Código da empresa</label>');
  assert.ok(entry > 0 && entry < codeField);
  const dropdown = app.slice(app.indexOf('{visibleLoginUsers.map'), app.indexOf('{visibleLoginUsers.length'));
  assert.match(dropdown, /onPointerDown=/);
  assert.match(dropdown, /onClick=/);
});
