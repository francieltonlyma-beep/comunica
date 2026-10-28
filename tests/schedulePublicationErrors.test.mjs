import test from 'node:test';
import assert from 'node:assert/strict';
import { schedulePublicationError } from '../src/schedulePublicationErrors.js';

test('falhas de publicação distinguem permissão, sessão, conexão e dados sem expor o erro bruto', () => {
  for (const code of ['permission-denied', 'unauthenticated', 'unavailable', 'invalid-argument', 'failed-precondition', 'resource-exhausted', 'aborted']) {
    const message = schedulePublicationError({ code: `firestore/${code}`, message: 'sensitive-backend-detail' }, 'Não foi possível publicar.');
    assert.ok(message.includes(code));
    assert.ok(!message.includes('sensitive-backend-detail'));
    assert.notEqual(message, 'Não foi possível publicar.');
  }
  assert.match(schedulePublicationError({ code: 'planning-stale' }, 'Falha'), /outra sessão/);
  assert.equal(schedulePublicationError(new Error('private'), 'Falha de publicação.'), 'Falha de publicação.');
});
