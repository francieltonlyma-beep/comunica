import { bandNames, salaryBands } from './careerReview.js';
import { resolveEmployeeRole } from './roleCatalog.js';
import { buildSalaryHierarchy } from './salaryHierarchy.js';

export const salaryExcelOptions = {
  all: { label: 'Arquivo único com as três abas', filename: 'cargos-e-salarios' },
  matrix: { label: 'Matriz salarial', filename: 'matriz-salarial' },
  hierarchy: { label: 'Hierarquia', filename: 'hierarquia' },
  compensation: { label: 'Reajustes individuais', filename: 'reajustes-individuais' },
};

function sheet(key, headers, rows, widths) {
  return {
    sheet: salaryExcelOptions[key].label,
    stickyRowsCount: 1,
    columns: headers.map((_, index) => ({ width: widths[index] ?? 16 })),
    data: [
      headers.map(value => ({ value, fontWeight: 'bold', backgroundColor: '#1E3A5F', color: '#FFFFFF' })),
      ...rows.map(row => row.map(value => value === '' || value == null ? null : typeof value === 'object' ? value : { value })),
    ],
  };
}

function numberCell(value, format) {
  if (value == null || value === '' || !Number.isFinite(Number(value))) return null;
  return { value: Number(value), format };
}

const currency = value => numberCell(value, '"R$" #,##0.00');
const percent = value => value == null || value === '' ? null : numberCell(Number(value) / 100, '0.00%');

function dateCell(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return value || null;
  const date = new Date(value + 'T00:00:00Z');
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) return value;
  return { value: date, format: 'dd/mm/yyyy' };
}

function matrixSheet(roles, records, standard) {
  const matrixRoles = records[standard.id]?.plan && !records[standard.id].plan.hierarchyOnly
    ? [standard, ...roles] : roles;
  return sheet('matrix', [
    'Cargo', 'ID do cargo', 'Situação do plano', 'Vigência', 'Piso da CCT', 'Salário mínimo de referência',
    'Salário-base da empresa', 'Progressão por faixa', 'Progressão por nível', 'Desempenho mínimo',
    'Tempo mínimo de casa (meses)', ...bandNames,
  ], matrixRoles.map(role => {
    const plan = records[role.id]?.plan;
    if (!plan || plan.hierarchyOnly) return [role.name, role.id, 'Sem plano salarial'];
    return [
      role.name, role.id, plan.active === false ? 'Inativo' : 'Ativo', dateCell(plan.effective), currency(plan.cct),
      currency(plan.minimum), currency(plan.base), percent(plan.bandRate), percent(plan.levelRate),
      percent(plan.score), numberCell(plan.months), ...salaryBands(plan).map(band => currency(band.value)),
    ];
  }), [36, 32, 22, 14, 16, 30, 25, 23, 23, 22, 32]);
}

function hierarchySheet(roles, records) {
  const { rows } = buildSalaryHierarchy(roles, records);
  const situations = { cycle: 'Vínculo circular', missing: 'Cargo superior indisponível' };
  return sheet('hierarchy', ['Cargo', 'Superior direto', 'Subordinados diretos', 'Situação do vínculo', 'ID do cargo', 'ID do superior'],
    rows.map(node => [
      node.name, node.parent?.name, node.reports.length,
      situations[node.issue] || (node.parent ? 'Vinculado' : 'Sem superior direto'),
      node.id, node.plan?.supervisor,
    ]), [36, 36, 24, 32, 32, 32]);
}

function compensationSheet(roles, employees, changes) {
  const employeesById = new Map(employees.map(employee => [employee.id, employee]));
  const rows = [...changes].sort((a, b) => String(b.effective || '').localeCompare(a.effective || '')
    || String(a.person || '').localeCompare(b.person || ''));
  return sheet('compensation', ['Colaborador', 'Cargo atual', 'Vigência', 'Salário registrado', 'ID do colaborador'], rows.map(change => {
    const employee = employeesById.get(change.person);
    return [
      employee?.name || 'Cadastro indisponível', resolveEmployeeRole(employee, roles)?.name || employee?.role,
      dateCell(change.effective), currency(change.amount), change.person,
    ];
  }), [36, 36, 16, 22, 36]);
}

export function salaryWorkbook(scope, { roles, records, standard, employees, changes }) {
  const sheets = [];
  if (scope === 'all' || scope === 'matrix') sheets.push(matrixSheet(roles, records, standard));
  if (scope === 'all' || scope === 'hierarchy') sheets.push(hierarchySheet(roles, records));
  if (scope === 'all' || scope === 'compensation') sheets.push(compensationSheet(roles, employees, changes));
  return sheets;
}
