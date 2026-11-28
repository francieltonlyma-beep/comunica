import assert from 'node:assert/strict';
import test from 'node:test';
import readExcel from 'read-excel-file/node';
import writeExcel from 'write-excel-file/node';
import { salaryWorkbook } from '../src/salaryExcel.js';

const data = {
  roles: [{ id: 'lead', name: 'Gerência' }, { id: 'staff', name: 'Operação' }],
  standard: { id: 'standard', name: 'Padrão da empresa' },
  records: {
    lead: { plan: { effective: '2026-11-28', cct: 0, minimum: 0, base: 2500, bandRate: 10, levelRate: 20, overrides: ['', 2800] } },
    staff: { plan: { hierarchyOnly: true, supervisor: 'lead' } },
  },
  employees: [{ id: 'staff-1', name: '=1+1', roleId: 'staff' }],
  changes: [
    { person: 'former-1', effective: '2026-10-01', amount: 1200 },
    { person: 'staff-1', effective: '2026-11-28', amount: 2450.5 },
  ],
};

async function openWorkbook(scope, input = data) {
  return readExcel(await writeExcel(salaryWorkbook(scope, input)).toBuffer());
}

test('salary Excel keeps numeric salary bands, dates and hierarchy in one workbook', async () => {
  const sheets = await openWorkbook('all');
  assert.deepEqual(sheets.map(item => item.sheet), ['Matriz salarial', 'Hierarquia', 'Reajustes individuais']);
  const [matrix, hierarchy, adjustments] = sheets.map(item => item.data);
  assert.equal(matrix[1][3].toISOString(), '2026-11-28T00:00:00.000Z');
  assert.equal(matrix[1][7], 0.10);
  assert.deepEqual(matrix[1].slice(11, 14), [2500, 2800, 3025]);
  assert.deepEqual(matrix[2].slice(0, 4), ['Operação', 'staff', 'Sem plano salarial', null]);
  assert.deepEqual(hierarchy[2], ['Operação', 'Gerência', 0, 'Vinculado', 'staff', 'lead']);
  assert.deepEqual(adjustments[1].slice(0, 2), ['=1+1', 'Operação']);
  assert.equal(adjustments[1][3], 2450.5);
  assert.equal(adjustments[2][4], 'former-1');
});

test('each salary export produces one named sheet, including a header for an empty history', async () => {
  for (const [scope, name] of Object.entries({ matrix: 'Matriz salarial', hierarchy: 'Hierarquia', compensation: 'Reajustes individuais' })) {
    const sheets = await openWorkbook(scope, { ...data, changes: [] });
    assert.deepEqual(sheets.map(item => item.sheet), [name]);
    if (scope === 'compensation') assert.equal(sheets[0].data.length, 1);
  }
});
