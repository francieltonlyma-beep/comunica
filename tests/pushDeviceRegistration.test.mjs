import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const start = source.indexOf('  // Associa o dispositivo');
const effect = source.slice(start, source.indexOf('\n  useEffect(() => {', source.indexOf('  }, [pushToken, currentUser, activeCompany, dbUser, functionsClient]);', start)));

const register = async ({serverTokens, localTokens = [], token, fail = false}) => {
  let pending;
  let local = {id: 'u1', pushTokens: localTokens};
  const writes = [];
  const context = {
    useRef: () => ({current: null}),
    useEffect: callback => callback(),
    pushToken: token, currentUser: local, isFirebaseAvailable: true,
    dbUser: {uid: 'u1'}, activeCompany: {id: 'c1'}, functionsClient: {},
    db: {}, appId: 'comunica-salvador',
    doc: (...path) => path,
    arrayUnion: value => ({union: value}),
    updateDoc: (ref, data) => {
      writes.push({ref, data});
      pending = fail ? Promise.reject(new Error('offline')) : Promise.resolve().then(() => {
        if (data.pushTokens?.union) serverTokens.push(...[data.pushTokens.union].filter(value => !serverTokens.includes(value)));
        else serverTokens.splice(0, serverTokens.length, ...data.pushTokens);
      });
      return pending;
    },
    updateDocField: async (_collection, _id, data) => {
      serverTokens.splice(0, serverTokens.length, ...data.pushTokens);
      return true;
    },
    setCurrentUser: update => {local = update(local);},
    triggerNotification: () => {},
    console: {error: () => {}},
  };
  vm.runInNewContext(effect, context);
  await new Promise(resolve => setImmediate(resolve));
  return {local, writes};
};

test('automatic registration preserves another device absent from the local profile', async () => {
  const serverTokens = ['android'];
  await register({serverTokens, token: 'desktop'});
  assert.deepEqual(serverTokens, ['android', 'desktop']);
});

test('concurrent registrations preserve all devices and do not duplicate tokens', async () => {
  const serverTokens = ['existing'];
  await Promise.all([
    register({serverTokens, token: 'android'}),
    register({serverTokens, token: 'desktop'}),
    register({serverTokens, token: 'android'}),
  ]);
  assert.deepEqual([...serverTokens].sort(), ['android', 'desktop', 'existing']);
});

test('failed persistence does not mark the device as registered', async () => {
  const serverTokens = ['android'];
  const result = await register({serverTokens, token: 'desktop', fail: true});
  assert.deepEqual(serverTokens, ['android']);
  assert.deepEqual(result.local.pushTokens, []);
});
