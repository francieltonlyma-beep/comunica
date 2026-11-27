import assert from 'node:assert/strict';
import { teamHeadcount } from '../src/teamHeadcount.js';
import test from 'node:test';
import { activeHeadcount, pendingDate } from '../src/personnelModel.js';
test('quadro considera datas efetivas, cancelamentos, readmissão e cadastros antigos', () => {
  const people = ['old', 'new', 'out', 'back', 'planned'].map((id) => ({ id }));
  const row = (employeeId, kind, effective, status = 'Concluído') => ({
    employeeId,
    kind,
    effective,
    status,
  });
  const rows = [
    row('new', 'admission', '2026-11-25'),
    row('out', 'termination', '2026-11-22'),
    row('back', 'termination', '2026-11-01'),
    row('back', 'admission', '2026-11-20'),
    row('old', 'termination', '2026-11-20', 'Cancelado'),
    row('planned', 'admission', ''),
  ];
  assert.deepEqual(
    activeHeadcount(people, rows, '2026-11-22').map((p) => p.id),
    ['old', 'back'],
  );
  assert.deepEqual(
    activeHeadcount(people, rows, '2026-11-25').map((p) => p.id),
    ['old', 'new', 'back'],
  );
});
test('exames realizados têm próxima renovação e cancelamentos saem das pendências', () => {
  const exam = { kind: 'exam', status: 'Aguardando realização', due: '2026-11-22', nextDate: '2027-11-22' };
  assert.equal(pendingDate(exam), exam.due);
  assert.equal(pendingDate({ ...exam, status: 'Realizado' }), exam.nextDate);
  assert.equal(pendingDate({ ...exam, status: 'Cancelado' }), '');
});

test('a data de demissão do perfil retira o colaborador do quadro na data efetiva', () => {
  const employee = { id: 'profile', hireDate: '2026-11-01', terminationDate: '2026-11-25' };
  assert.deepEqual(activeHeadcount([{ ...employee, terminationDate: '' }], [], '2026-11-26').map(person => person.id), ['profile']);
});

test('quadro usa o vínculo com o cargo atualizado e conta somente vagas com inscrições abertas', () => {
  const role = {id: 'role-a', name: 'Atendimento', depts: ['norte', 'sul'], approvedHeadcountByDept: {norte: 2, sul: 0}};
  const employee = {id: 'emp-a', roleId: 'role-a', role: 'Nome antigo', depts: ['norte', 'sul', 'sul']};
  const {headcountRows, headcountMetrics} = teamHeadcount({
    activeEmployees: [employee],
    departmentsList: [{id: 'norte'}, {id: 'sul'}],
    rolesList: [role, {id: 'old', name: 'Atendimento antigo', depts: ['sul'], mergedIntoRoleId: role.id}],
    vacanciesList: [
      {roleId: role.id, status: 'published', closesAt: '2026-11-27'},
      {roleId: role.id, status: 'published', closesAt: '2026-11-26'},
      {roleId: role.id, status: 'closed'},
    ],
    getUserDepts: user => user.depts,
    employeeStatusDay: '2026-11-27',
    mgmtSectorFilter: 'all',
  });
  assert.deepEqual(headcountRows.map(row => [row.current, row.activeRecruitment]), [[1, 1], [1, 1]]);
  assert.deepEqual(headcountMetrics, {planned: 2, vacancies: 1, excess: 1, configuredRoles: 2});
});
