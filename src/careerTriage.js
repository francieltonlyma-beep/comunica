export function careerFitScore(value) {
  if (typeof value !== 'number' && (typeof value !== 'string' || !value.trim())) return null;
  const score = Number(value);
  return Number.isFinite(score) && score >= 0 && score <= 100 ? score : null;
}

export function careerDateMs(value) {
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (typeof value?.seconds === 'number') return value.seconds * 1000 + (value.nanoseconds || 0) / 1e6;
  return Number(value) || 0;
}

export const CAREER_STAGES = [
  { id: 'received', label: 'Recebidas', color: 'bg-sky-500' },
  { id: 'reviewing', label: 'Em análise', color: 'bg-amber-500' },
  { id: 'preselected', label: 'Pré-seleção', color: 'bg-blue-600' },
  { id: 'interview', label: 'Entrevistas', color: 'bg-violet-500' },
  { id: 'hired', label: 'Contratados', color: 'bg-emerald-500' },
  { id: 'rejected', label: 'Não aderentes', color: 'bg-rose-500' },
  { id: 'closed', label: 'Concluídas', color: 'bg-slate-500' },
];

export function matchesCareerOpportunity(application, vacancy, source, vacancyId) {
  const origin = application.source === 'talent_pool' ? 'talent_pool' : 'vacancy';
  if (source !== 'all' && source !== origin) return false;
  if (vacancyId !== 'all') return application.vacancyId === vacancyId;
  return origin === 'talent_pool' || Boolean(vacancy && vacancy.status !== 'archived');
}

export function groupCareerApplications(applications) {
  const groups = Object.fromEntries(CAREER_STAGES.map(stage => [stage.id, []]));
  applications.forEach(application => {
    const stage = Object.hasOwn(groups, application.status) ? application.status : 'received';
    groups[stage].push(application);
  });
  return groups;
}

export function countCareerCandidates(applications) {
  return new Set(applications.map(({ candidateUid, email, id }) => candidateUid
    ? `uid:${candidateUid}`
    : email?.trim() ? `email:${email.trim().toLowerCase()}` : `application:${id}`)).size;
}
