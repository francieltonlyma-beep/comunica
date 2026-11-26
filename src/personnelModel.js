export const personnelKinds = {
  admission: {
    label: 'Admissão',
    steps: ['Documentação', 'Integração', 'Concluído'],
    checks: ['Documentos recebidos', 'Integração realizada', 'Uniforme e equipamentos entregues'],
  },
  experience: {
    label: 'Experiência',
    steps: ['Avaliação pendente', 'Em avaliação', 'Concluído'],
    checks: ['Gestor consultado', 'Retorno registrado'],
  },
  termination: {
    label: 'Desligamento',
    steps: ['Em preparação', 'Em conferência', 'Concluído'],
    checks: ['Documentos conferidos', 'Equipamentos devolvidos', 'Encerramento dos acessos confirmado'],
  },
  exam: {
    label: 'Exame ocupacional',
    private: true,
    steps: ['A agendar', 'Aguardando realização', 'Realizado'],
    checks: ['Agendamento comunicado', 'Comprovante recebido'],
  },
  warning: {
    label: 'Advertência ou orientação',
    private: true,
    steps: ['Em registro', 'Aguardando retorno', 'Concluído'],
    checks: ['Ciência registrada', 'Retorno realizado'],
  },
  transfer: {
    label: 'Mudança de cargo, setor ou gestor',
    steps: ['Previsto', 'Efetivado'],
    checks: ['Cadastro atualizado'],
  },
  leave: {
    label: 'Férias ou afastamento',
    steps: ['Previsto', 'Em andamento', 'Retorno confirmado'],
    checks: ['Gestor comunicado', 'Retorno registrado'],
  },
};
export const hrDay = (date = new Date()) =>
  new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(date);
export const displayDay = (date) => (date ? date.split('-').reverse().join('/') : '—');
export const isInactiveEmployee = (person, today) =>
  Boolean(person.terminationDate && person.terminationDate <= today);

export function pendingDate(row) {
  if (row.status === 'Cancelado') return '';
  if (row.kind === 'leave' && row.status === 'Em andamento' && row.nextDate) return row.nextDate;
  if (row.status !== personnelKinds[row.kind].steps.at(-1)) return row.due;
  return ['exam', 'admission'].includes(row.kind) ? row.nextDate : '';
}
export function activeHeadcount(employees, events, today) {
  const latest = new Map();
  const admissions = new Set();
  for (const event of events) {
    if (event.status === 'Cancelado') continue;
    if (event.kind === 'admission') admissions.add(event.employeeId);
    if (!event.effective || event.effective > today) continue;
    const prev = latest.get(event.employeeId);
    if (
      !prev ||
      prev.effective < event.effective ||
      (prev.effective === event.effective && prev.at < event.at)
    )
      latest.set(event.employeeId, event);
  }
  return employees.filter((person) => {
    if (isInactiveEmployee(person, today)) return false;
    const event = latest.get(person.id);
    if (event) return event.kind === 'admission';
    if (person.hireDate) return person.hireDate <= today;
    return !admissions.has(person.id);
  });
}
