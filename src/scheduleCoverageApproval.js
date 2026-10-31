export function coverageApprovalGaps(analysis) {
  return analysis.days.flatMap(day => day.rules.flatMap(rule => rule.segments.filter(slot => slot.missing > 0).map(slot => ({
    date: day.date, department: rule.department, ruleId: rule.id, start: slot.start, end: slot.end,
    minimum: rule.minimum, available: slot.available, missing: slot.missing,
  }))));
}

export function buildCoverageApproval({ analysis, actor, reason, binding, expectedBinding, snapshotHash, publicationId, rulesVersion }) {
  if (!actor?.id || (!actor.isAdmin && !actor.isDeveloper)) throw new Error('Somente administradores podem autorizar déficit de cobertura.');
  if (!binding || binding !== expectedBinding) throw new Error('A simulação mudou. Revise novamente antes de autorizar.');
  if (analysis.unknown || analysis.days.some(day => day.rules.some(rule => rule.unknown || rule.configurationMissing || rule.closedConflict))) throw new Error('Defina o funcionamento e corrija os horários incompletos antes de autorizar.');
  if (typeof snapshotHash !== 'string' || !snapshotHash) throw new Error('Identificação da revisão indisponível. Tente novamente.');
  const justification = String(reason || '').trim();
  if (justification.length < 10 || justification.length > 1000) throw new Error('Informe uma justificativa de 10 a 1000 caracteres.');
  const gaps = coverageApprovalGaps(analysis);
  if (!gaps.length) throw new Error('Não existe déficit a autorizar nesta revisão.');
  if (gaps.length > 5000 || new TextEncoder().encode(JSON.stringify(gaps)).length > 600000) throw new Error('Há muitas faixas para uma autorização. Divida a publicação por setor ou período.');
  return { publicationId, actorId: String(actor.id), actorName: String(actor.name || actor.id), reason: justification,
    snapshotHash, rulesVersion: Number(rulesVersion || 1), gaps,
    departmentIds: [...new Set(gaps.map(gap => gap.department))], startDate: gaps[0].date, endDate: gaps.at(-1).date };
}
