import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

test('inbox indicator cards filter unread, open, overdue and completed conversations', () => {
  assert.match(source, /const \[inboxStatusFilter, setInboxStatusFilter\] = useState\('all'\)/);
  assert.match(source, /inboxStatusFilter === 'unread' && thread\.unread > 0/);
  assert.match(source, /inboxStatusFilter === 'overdue'.*\/atras\/i\.test/s);
  assert.match(source, /aria-pressed=\{active\} onClick=\{\(\) => setInboxStatusFilter/);
});

test('dashboard templates expose consistent clickable indicator filters', () => {
  assert.match(source, /setServiceStatusFilter\(metric\.id\)/);
  assert.match(source, /setConversationAuditStatus\(previous => previous === metric\.id/);
  assert.match(source, /pollViewFilter === 'Pendentes'/);
  assert.match(source, /setCareerStageFilter\(previous => previous === 'reviewing'/);
  assert.match(source, /setCareerStageFilter\(previous => previous === 'interview'/);
});

test('audit counters remain stable while the selected card filters results', () => {
  assert.match(source, /const conversationAuditMetricRows = conversationAuditRows\.filter/);
  assert.match(source, /const conversationAuditFiltered = conversationAuditMetricRows\.filter/);
  assert.match(source, /conversationAuditStatus === 'reopened' && row\.reopened/);
  assert.match(source, /conversationAuditMetrics = conversationAuditMetricRows\.reduce/);
});
