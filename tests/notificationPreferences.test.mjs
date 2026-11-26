import test from 'node:test';
import assert from 'node:assert/strict';
import {canSeeSectorPost, notificationEnabled, notificationTab} from '../functions/src/notificationPreferences.mjs';

test('notification preferences default to enabled and only mute the selected tab', () => {
  assert.equal(notificationEnabled(undefined, 'careers'), true);
  assert.equal(notificationEnabled({careers:false}, 'careers'), false);
  assert.equal(notificationEnabled({careers:false}, 'inbox'), true);
  assert.equal(notificationEnabled({careers:true}, 'careers'), true);
});

test('push and bell alerts resolve to their source tab', () => {
  assert.equal(notificationTab('career_application'), 'careers');
  assert.equal(notificationTab('announcement'), 'announcements');
  assert.equal(notificationTab('post'), notificationTab('sector_post'));
  assert.equal(notificationTab('poll'), 'polls');
  assert.equal(notificationTab('message_deadline'), 'inbox');
  assert.equal(notificationTab('activity_update', 'thread-id'), 'inbox');
  assert.equal(notificationTab('activity_update'), 'services');
  assert.equal(notificationTab('purchase'), 'integra');
  assert.equal(notificationTab('sales_lead'), '');
});

test('sector recipients follow current assignments and support legacy profiles', () => {
  const profile = {depts: ['loja', 'caixa'], departments: ['antigo']};
  assert.equal(canSeeSectorPost(profile, 'caixa'), true);
  assert.equal(canSeeSectorPost(profile, 'antigo'), false);
  assert.equal(canSeeSectorPost({departments: ['rh']}, 'rh'), true);
  assert.equal(canSeeSectorPost({dept: 'loja'}, 'loja'), true);
  assert.equal(canSeeSectorPost({depts: ['rh']}, 'loja'), false);
  assert.equal(canSeeSectorPost({isAdmin: true}, 'loja'), true);
});
