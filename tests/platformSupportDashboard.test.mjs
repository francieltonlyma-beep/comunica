import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSupportTickets, filterSupportTickets, supportDashboardMetrics } from '../src/platformSupportDashboard.js';
import fs from 'node:fs';

const companies = [
  { id: 'alpha', name: 'Empresa Alfa', code: '100001' },
  { id: 'beta', name: 'Empresa Beta', code: '100002' },
];

const requests = {
  alpha: [
    { id: 'm1', threadId: 't1', ticketNumber: 12, subject: 'Falha no acesso', senderName: 'Ana', content: 'Não consigo entrar', timestamp: 100, readBy: [], dueDate: '2026-10-17' },
    { id: 'm2', threadId: 't2', ticketNumber: 13, subject: 'Dúvida de uso', senderName: 'Bruno', content: 'Como publicar?', timestamp: 200, readBy: ['support'], completedAt: 200 },
  ],
  beta: [{ id: 'm3', threadId: 't3', subject: 'Cadastro', senderName: 'Carla', timestamp: 300, readBy: ['support'] }],
};

test('builds a prioritized multi-company support queue', () => {
  const tickets = buildSupportTickets(companies, requests, 'support', '2026-10-18');
  assert.equal(tickets.length, 3);
  assert.equal(tickets[0].threadId, 't1');
  assert.equal(tickets[0].status, 'overdue');
  assert.equal(tickets[0].unread, true);
  assert.equal(tickets.find(item => item.threadId === 't2').status, 'completed');
});

test('filters tickets by status, company, requester and ticket number', () => {
  const tickets = buildSupportTickets(companies, requests, 'support', '2026-10-18');
  assert.deepEqual(filterSupportTickets(tickets, '', 'unread').map(item => item.threadId), ['t1']);
  assert.deepEqual(filterSupportTickets(tickets, 'Empresa Beta').map(item => item.threadId), ['t3']);
  assert.deepEqual(filterSupportTickets(tickets, 'Ana').map(item => item.threadId), ['t1']);
  assert.deepEqual(filterSupportTickets(tickets, '13').map(item => item.threadId), ['t2']);
});

test('summarizes the support operation without counting completed tickets as open', () => {
  const tickets = buildSupportTickets(companies, requests, 'support', '2026-10-18');
  assert.deepEqual(supportDashboardMetrics(companies, tickets), { companies: 2, open: 2, unread: 1, overdue: 1 });
});

test('changing modules returns the workspace to the beginning of the selected screen', () => {
  const appSource = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(appSource, /window\.scrollTo\(\{ top: 0, left: 0, behavior: 'auto' \}\);\s*\}, \[activeTab\]\);/);
});
