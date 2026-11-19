import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source = readFileSync(new URL('../public/firebase-messaging-sw.js', import.meta.url), 'utf8');

function loadWorker(existingWindow) {
  const handlers = [];
  const opened = [];
  const sent = [];
  let focused = 0;
  const client = existingWindow ? {
    url: 'https://comunica-info.web.app/',
    async focus() { focused++; return this; },
    postMessage(value) { sent.push(value); },
  } : null;
  const clients = {
    async matchAll() { return client ? [client] : []; },
    async openWindow(url) { opened.push(url); return client; },
  };
  const self = {
    location: {origin: 'https://comunica-info.web.app'},
    addEventListener(name, handler) { if (name === 'notificationclick') handlers.push(handler); },
  };
  runInNewContext(source, {
    importScripts() {},
    firebase: {initializeApp() {}, messaging() {}},
    self, clients, URL,
  });
  return {handlers, opened, sent, get focused() { return focused; }};
}

function click(worker, type = 'message', data = {}) {
  let waiting;
  let stopped = 0;
  let closed = 0;
  const event = {
    notification: {
      data: {FCM_MSG: {data: {type, companyId: 'company-123', threadId: 'thread-456', ...data}}},
      close() { closed++; },
    },
    stopImmediatePropagation() { stopped++; },
    waitUntil(promise) { waiting = promise; },
  };
  worker.handlers[0](event);
  return {get waiting() { return waiting; }, get stopped() { return stopped; }, get closed() { return closed; }};
}

test('message click focuses an existing site tab and passes its company and conversation', async () => {
  const worker = loadWorker(true);
  const result = click(worker);
  await result.waiting;
  assert.equal(result.stopped, 1);
  assert.equal(result.closed, 1);
  assert.equal(worker.focused, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(worker.sent[0])), {
    type: 'comunica-open-message', companyId: 'company-123', threadId: 'thread-456',
  });
  assert.equal(worker.opened.length, 0);
});

test('message click opens a deep link when no site tab exists', async () => {
  const worker = loadWorker(false);
  await click(worker).waiting;
  const url = new URL(worker.opened[0]);
  assert.equal(url.origin, 'https://comunica-info.web.app');
  assert.equal(url.searchParams.get('messageCompany'), 'company-123');
  assert.equal(url.searchParams.get('messageThread'), 'thread-456');
});

test('other notification types remain with the Firebase handler', () => {
  const worker = loadWorker(true);
  const result = click(worker, 'announcement');
  assert.equal(result.stopped, 0);
  assert.equal(result.closed, 0);
  assert.equal(result.waiting, undefined);
});

test('career notification opens the filtered vacancy in an existing or new tab', async () => {
  const data = {careerVacancyId: 'talent-pool--operator'};
  const existing = loadWorker(true);
  await click(existing, 'career_application', data).waiting;
  assert.equal(existing.focused, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(existing.sent[0])), {
    type: 'comunica-open-career', companyId: 'company-123', vacancyId: data.careerVacancyId,
  });

  const fresh = loadWorker(false);
  await click(fresh, 'career_application', data).waiting;
  const url = new URL(fresh.opened[0]);
  assert.equal(url.searchParams.get('careerCompany'), 'company-123');
  assert.equal(url.searchParams.get('careerVacancy'), data.careerVacancyId);
  assert.equal(url.searchParams.has('messageThread'), false);
});
