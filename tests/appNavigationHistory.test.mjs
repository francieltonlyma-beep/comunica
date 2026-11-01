import test from 'node:test';
import assert from 'node:assert/strict';
import { APP_NAVIGATION_HISTORY_KEY, appHistoryState, appNavigationKey, normalizeAppNavigation, readAppNavigation } from '../src/appNavigationHistory.js';

test('the app history preserves the previous browser state and the active screen', () => {
  const navigation = normalizeAppNavigation({
    tab: 'inbox', threadId: 'thread-42', threadInfo: true, serviceWorkspace: 'activities', managementTab: 'roles',
  });
  const state = appHistoryState({ external: 'kept' }, navigation);

  assert.equal(state.external, 'kept');
  assert.deepEqual(readAppNavigation(state), navigation);
  assert.equal(state[APP_NAVIGATION_HISTORY_KEY].threadId, 'thread-42');
});

test('invalid history data falls back to a safe app screen', () => {
  assert.deepEqual(normalizeAppNavigation({ tab: 'forged', threadInfo: true, addParticipant: true }), {
    tab: 'dashboard', threadId: '', composing: false, messagesModal: false,
    serviceWorkspace: 'requests', managementTab: 'employees', dashboardDetail: '',
    serviceActivityKey: '', threadInfo: false, addParticipant: false,
  });
  assert.equal(readAppNavigation({}), null);
});

test('navigation keys change for modules and nested inbox screens', () => {
  assert.notEqual(appNavigationKey({ tab: 'dashboard' }), appNavigationKey({ tab: 'inbox' }));
  assert.notEqual(appNavigationKey({ tab: 'inbox' }), appNavigationKey({ tab: 'inbox', threadId: 'thread-1' }));
  assert.notEqual(appNavigationKey({ tab: 'inbox', threadId: 'thread-1' }), appNavigationKey({ tab: 'inbox', threadId: 'thread-1', composing: true }));
});
