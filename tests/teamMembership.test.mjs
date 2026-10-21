import test from 'node:test';
import assert from 'node:assert/strict';
import { isCompanyEmployee } from '../src/teamMembership.js';

test('excludes platform support even when legacy employee flags are missing or wrong', () => {
  assert.equal(isCompanyEmployee({ id: 'platform-support-francielton', isEmployee: true }), false);
  assert.equal(isCompanyEmployee({ uid: 'platform-support-francielton' }), false);
  assert.equal(isCompanyEmployee({ id: 'other', isDeveloper: true }), false);
  assert.equal(isCompanyEmployee({ id: 'external', isEmployee: false }), false);
});
test('keeps regular staff and company administrators without relying on names or job titles', () => {
  assert.equal(isCompanyEmployee({ id: 'employee', role: 'Suporte TI' }), true);
  assert.equal(isCompanyEmployee({ id: 'admin', isAdmin: true }), true);
  assert.equal(isCompanyEmployee(null), false);
});
