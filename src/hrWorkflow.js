import { careerIsStalled, careerStageAge, careerStageDue } from './careerTriage.js';
import { effectiveSalaryPlan, salaryBands } from './careerReview.js';
import { getRoleDepts, resolveEmployeeRole } from './roleCatalog.js';

export function hrActionItems({ applications, reviews, overdueGoals, today, horizon, now }) {
  const items = [];
  for (const application of applications) {
    const { interview } = application;
    if (application.status === 'interview' && interview?.date && interview.date <= horizon) {
      items.push({ key: `interview:${application.id}`, type: 'interview', title: application.name,
        detail: `Entrevista · ${interview.time || 'Horário a confirmar'}`, due: interview.date,
        owner: application.interviewScheduledBy || 'Equipe de recrutamento', application });
    } else if (careerIsStalled(application, now)) {
      items.push({ key: `stalled:${application.id}`, type: 'stalled', title: application.name,
        detail: `${careerStageAge(application, now)} dias na etapa · ${application.vacancyTitle || 'Candidatura'}`,
        owner: application.stageStart?.actorName || application.decisionBy || 'Equipe de recrutamento', due: careerStageDue(application), application });
    }
  }
  for (const review of reviews) {
    if (review.status !== 'ready' && (!review.nextDate || review.nextDate > horizon)) continue;
    items.push({ key: `review:${review.id}`, type: 'review', title: review.employeeName, due: review.nextDate,
      detail: 'Avaliação de carreira', owner: review.ownerName || 'RH', employeeId: review.id });
  }
  for (const goal of overdueGoals) {
    if (goal.status !== 'active' || !goal.due || goal.due >= today) continue;
    items.push({ key: `goal:${goal.employeeId}:${goal.id}`, type: 'goal', title: goal.employeeName,
      detail: `Meta de PDI · ${goal.title}`, due: goal.due, owner: goal.employeeName, employeeId: goal.employeeId, goalId: goal.id });
  }
  return items.sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999') || String(a.title).localeCompare(String(b.title), 'pt-BR'));
}

export function nextSalaryBand(pay, plan, effective) {
  const matrix = effectiveSalaryPlan(plan, effective);
  if (!matrix || !(Number(pay?.amount) > 0)) return null;
  return salaryBands(matrix).filter(band => Number.isFinite(band.value) && Math.round(band.value * 100) > Math.round(pay.amount * 100))
    .sort((a, b) => a.value - b.value)[0] || null;
}

export function employeeTransferImpact({ employee, draft, roles, departments, getDepartments }) {
  const previousRole = resolveEmployeeRole(employee, roles);
  const nextRole = resolveEmployeeRole({role: draft.role}, roles);
  const before = getDepartments(employee);
  const after = [...new Set(draft.depts || [])];
  const from = before.filter(id => !after.includes(id));
  const to = after.filter(id => !before.includes(id));
  const changedRole = employee.role !== draft.role;
  if (!changedRole && !from.length && !to.length) return [];
  const name = id => departments.find(department => department.id === id)?.name || id;
  const lines = [];
  if (changedRole) lines.push(`Cargo: ${employee.role || 'Sem cargo'} → ${draft.role || 'Sem cargo'}`);
  if (from.length) lines.push(`Sai de: ${from.map(name).join(', ')}`);
  if (to.length) lines.push(`Entra em: ${to.map(name).join(', ')}`);
  if (changedRole || from.length || to.length) lines.push('Revise o quadro previsto dos setores afetados e o gestor vinculado ao cadastro.');
  if (changedRole) lines.push(`Confira o enquadramento e a hierarquia de ${nextRole?.name || draft.role || previousRole?.name || 'cargo'}.`);
  return lines;
}

export function roleChangeImpact({ role, name, sectors, people, vacancies, departments, getDepartments }) {
  const before = getRoleDepts(role);
  const removed = before.filter(id => !sectors.includes(id));
  const added = sectors.filter(id => !before.includes(id));
  if (name === role.name && !removed.length && !added.length) return [];
  const label = id => departments.find(department => department.id === id)?.name || id;
  const lines = [];
  if (name !== role.name) lines.push(`Renomear ${role.name} para ${name}. Cadastros vinculados: ${people.length}.`);
  if (added.length) lines.push(`Incluir setores: ${added.map(label).join(', ')}.`);
  if (removed.length) {
    const impacted = people.filter(person => getDepartments(person).some(id => removed.includes(id)));
    lines.push(`Retirar setores: ${removed.map(label).join(', ')}. Revise ${impacted.length} cadastro(s) e o quadro destes setores.`);
    const opened = vacancies.filter(vacancy => vacancy.roleId === role.id && removed.includes(vacancy.sectorId) && vacancy.status === 'published').length;
    if (opened) lines.push(`Revise ${opened} vaga(s) publicada(s) com vínculo aos setores retirados.`);
  }
  if (people.length) {
    const sample = people.slice(0, 6).map(person => person.name).filter(Boolean);
    if (sample.length) lines.push(`Cadastros vinculados: ${sample.join(', ')}${people.length > sample.length ? ` e mais ${people.length - sample.length}` : ''}.`);
    lines.push('Confira a supervisão e o enquadramento salarial dos colaboradores vinculados.');
  }
  return lines;
}

export async function hiredEmployeeId(companyId, application) {
  const key = new TextEncoder().encode(JSON.stringify([companyId, application.candidateUid || application.id]));
  const digest = await crypto.subtle.digest('SHA-256', key);
  return 'u-hire-' + Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}
