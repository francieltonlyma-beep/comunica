import test from 'node:test';
import assert from 'node:assert/strict';
import { careerIsStalled, careerStageAge, careerStageDue } from '../src/careerTriage.js';
import { employeeTransferImpact, hiredEmployeeId, hrActionItems, nextSalaryBand, roleChangeImpact } from '../src/hrWorkflow.js';

const now = Date.parse('2026-11-27T15:00:00Z');
const entered = Date.parse('2026-11-19T15:00:00Z');

test('tempo usa a data da etapa atual e evita estimar datas antigas sem informação', () => {
  const application = {status: 'reviewing', stageStart: {status: 'reviewing', at: entered}, createdAt: entered - 1000};
  assert.equal(careerStageAge(application, now), 8);
  assert.equal(careerStageDue(application), '2026-11-26');
  assert.equal(careerIsStalled(application, now), true);
  assert.equal(careerStageAge({...application, status:'preselected'}, now), null);
  assert.equal(careerIsStalled({...application, status:'hired'}, now), false);
  assert.equal(careerStageAge({createdAt: entered}, now), 8);
});

test('fila ordena pendências e mantém o registro de origem para abrir cada ação', () => {
  const booked = {id:'a', name:'Ana', status:'interview', interview:{date:'2026-11-28', time:'09:00'}, interviewScheduledBy:'Bia'};
  const stalled = {id:'b', name:'Daniel', status:'reviewing', stageStart:{status:'reviewing', at: entered}};
  const rows = hrActionItems({
    applications:[booked, stalled, {id:'x', status:'hired', interview:booked.interview}],
    reviews:[{id:'r', employeeName:'Caio', nextDate:'2026-11-27'}],
    overdueGoals:[{id:'g', employeeId:'e', employeeName:'Eva', title:'Aferir', due:'2026-11-25', status:'active'}],
    today:'2026-11-27', horizon:'2026-12-04', now,
  });
  assert.deepEqual(rows.map(item => item.type), ['goal', 'stalled', 'review', 'interview']);
  assert.equal(rows[0].goalId, 'g');
  assert.equal(rows.at(-1).application, booked);
  assert.equal(rows.at(-1).owner, 'Bia');
});

test('sugere a próxima faixa vigente acima do salário em centavos', () => {
  const plan = {effective: '2026-11-27', cct: 2000, minimum: 1600, base: 2000, bandRate: 5, levelRate: 10};
  assert.deepEqual(nextSalaryBand({amount: 2000}, plan, '2026-11-27'), {label:'I · B', calculated:2100, value:2100});
  assert.equal(nextSalaryBand({amount: 9000}, plan, '2026-11-27'), null);
  assert.equal(nextSalaryBand({amount: 2000}, plan, '2026-11-26'), null);
  assert.equal(nextSalaryBand(null, plan, '2026-11-28'), null);
});

test('candidaturas distintas da mesma pessoa retomam o mesmo cadastro por empresa', async () => {
  const first = await hiredEmployeeId('empresa1', {id:'v1_uid', candidateUid:'uid'});
  assert.match(first, /^u-hire-[a-f0-9]{64}$/);
  assert.equal(first, await hiredEmployeeId('empresa1', {id:'v2_uid', candidateUid:'uid'}));
  assert.notEqual(first, await hiredEmployeeId('empresa2', {id:'v1_uid', candidateUid:'uid'}));
});

test('impacto lista setores e registros afetados antes da mudança', () => {
  const role = {id:'role', name:'Caixa', depts:['n']};
  const employee = {name: 'Ana', role: 'Caixa', roleId:'role', depts:['n']};
  const departments = [{id:'n', name:'Loja Norte'}, {id:'s', name:'Loja Sul'}];
  const getDepartments = person => person.depts;
  assert.match(employeeTransferImpact({employee, draft:{role:'Supervisor', depts:['s']}, roles:[role], departments, getDepartments}).join(' '), /Loja Norte.*Loja Sul.*enquadramento/);
  const impact = roleChangeImpact({role, name:'Caixa Líder', sectors:['s'], people:[employee],
    vacancies:[{roleId:'role', sectorId:'n', status:'published'}], departments, getDepartments}).join(' ');
  assert.match(impact, /Loja Norte.*1 cadastro.*1 vaga.*Ana/);
});
