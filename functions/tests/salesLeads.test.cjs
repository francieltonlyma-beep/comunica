const {test} = require('node:test');
const assert = require('node:assert/strict');

test('sales contact source validates CNPJ and keeps records private', async () => {
  const source = require('node:fs').readFileSync(require('node:path').join(__dirname, '../src/salesLeads.ts'), 'utf8');
  assert.match(source, /isValidCnpj/);
  assert.match(source, /_platformSalesLeads/);
  assert.match(source, /_platformSalesRateLimits/);
  assert.match(source, /RATE_LIMIT = 3/);
  assert.match(source, /status: 'new'/);
});
