import { analyzeProposalCoverage, isFixedProposalRow } from './scheduleOptimizer.js';
import { isWorking, scheduleRuleIssues } from './scheduleDayRules.js';
import { appendScheduleTrace } from './scheduleExplanation.js';

const SYSTEM = 'Você auxilia o planejamento de escalas. Os dados são pseudonimizados. Proponha somente trocas entre um dia de trabalho (from) e uma folga (to) da MESMA pessoa e semana. Nunca altere linhas fixed. Preserve jornada, intervalos, domingos protegidos, limite de folgas e descanso. Não invente pessoas ou datas. Responda apenas JSON: {"summary":"diagnóstico curto em português brasileiro","swaps":[{"person":"P1","from":"AAAA-MM-DD","to":"AAAA-MM-DD"}]}. No máximo 20 trocas; cada dia pode participar uma única vez. Se não houver solução segura, retorne swaps vazio e explique o motivo. Nenhuma sugestão será publicada automaticamente.';
export const scheduleAiSystemInstruction = SYSTEM;
const minute = value => /^([01]\d|2[0-3]):[0-5]\d$/.test(value || '') ? Number(value.slice(0, 2)) * 60 + Number(value.slice(3)) : NaN;
const sameWeek = (a, b) => a.weekKey && a.weekKey === b.weekKey;
const movable = row => !isFixedProposalRow(row) && (!row.holiday || row.holidayWorkingDay) && ['Presencial', 'Home Office', 'Folga'].includes(row.status);
const issueKey = issue => JSON.stringify([issue.userId, issue.date, issue.rowKey, issue.code, issue.message]);
const displayDate = date => date.split('-').reverse().join('/');

function coverageBlockMessage(analysis, context) {
  const pending = analysis.days.flatMap(day => day.rules.filter(rule => rule.unknown).map(rule => {
    const sector = context.departments?.find(item => item.id === rule.department)?.name || rule.department;
    const reason = rule.configurationMissing
      ? 'defina aberto ou fechado em Necessidade de pessoas (domingos e feriados exigem configuração própria)'
      : rule.closedConflict ? 'há trabalho marcado em um setor fechado; revise o funcionamento ou a marcação'
        : 'confira entrada, saída e início/fim do intervalo nas marcações da prévia e do calendário';
    return `${displayDate(day.date)} · ${sector}: ${reason}.`;
  }));
  return 'Confira os horários e o funcionamento dos setores na semana analisada:\n' + pending.slice(0, 6).join('\n')
    + (pending.length > 6 ? `\nMais ${pending.length - 6} pendência(s) nesta semana.` : '');
}
const operationFields = ['status', 'shiftStart', 'shiftEnd', 'breakStart', 'breakEnd', 'breakMinutes', 'extraHours', 'shift'];

export function buildScheduleAiRequest(rows, requirements, context = {}) {
  if (!rows.length || !requirements.length) throw new Error('Gere a prévia e cadastre a necessidade de pessoas antes de analisar com IA.');
  const analysis = analyzeProposalCoverage(rows, requirements, context);
  const issues = scheduleRuleIssues(rows, context.history || []).filter(issue => issue.blocking);
  if (!analysis.missingMinutes && !issues.length && !analysis.unknown) throw new Error('A prévia já atende à cobertura e às regras verificadas. Não é necessário consumir uma análise de IA.');
  const weeks = [...new Set(rows.map(row => row.weekKey).filter(Boolean))];
  const score = week => analysis.days.filter(day => rows.some(row => row.weekKey === week && row.date === day.date))
    .reduce((sum, day) => sum + day.rules.reduce((total, rule) => total + rule.segments.reduce((minutes, slot) => minutes + (minute(slot.end) - minute(slot.start)) * slot.missing, 0), 0), 0)
    + issues.filter(issue => rows.some(row => row.weekKey === week && row.date === issue.date)).length
    + analysis.days.filter(day => rows.some(row => row.weekKey === week && row.date === day.date)).reduce((sum, day) => sum + day.rules.reduce((total, rule) => total + rule.unknown, 0), 0);
  const week = weeks.sort((a, b) => score(b) - score(a) || a.localeCompare(b))[0];
  const weekRows = rows.filter(row => row.weekKey === week);
  if (!week || weekRows.some(row => !row.dept)) throw new Error('Confira a semana e os setores da prévia antes de analisar com IA.');
  const dates = new Set(weekRows.map(row => row.date));
  const weekAnalysis = analyzeProposalCoverage(rows, requirements, context, dates);
  if (weekAnalysis.unknown) throw new Error(coverageBlockMessage(weekAnalysis, context));
  const weekIssues = issues.filter(issue => dates.has(issue.date));
  const timeIssues = weekIssues.filter(issue => ['missing-time', 'zero-shift', 'incomplete-break', 'invalid-break', 'unlocated-break', 'invalid-overtime', 'long-shift'].includes(issue.code));
  if (timeIssues.length) throw new Error('Confira os horários e intervalos da prévia na semana analisada:\n' + timeIssues.slice(0, 6).map(issue => `${displayDate(issue.date)}: ${issue.message}`).join('\n'));

  const people = [...new Set(weekRows.map(row => String(row.userId)))].sort();
  if (people.length > 40) throw new Error('Para esta análise, selecione até 40 colaboradores. A cobertura continuará considerando toda a equipe do setor.');
  const tokens = new Map(people.map((id, index) => [id, 'P' + (index + 1)]));
  const departments = [...new Set(weekRows.map(row => row.dept))];
  const departmentTokens = new Map(departments.map((id, index) => [id, 'S' + (index + 1)]));
  const payload = {
    week,
    people: people.map(id => ({ person: tokens.get(id),
      days: weekRows.filter(row => String(row.userId) === id).map(row => ({
        date: row.date, sector: departmentTokens.get(row.dept), status: row.status, start: row.shiftStart || '', end: row.shiftEnd || '',
        breakStart: row.breakStart || '', breakEnd: row.breakEnd || '', extra: Number(row.extraHours) || 0,
        fixed: !movable(row), allowed: row.allowed !== false, maxRestDays: Number(row.maxConsecutiveRestDays) || 0,
        maxWorkDays: Number(row.restEveryDays) - 1 || 0, minRestHours: Number(row.minRestHours) || 0,
      })),
    })),
    coverage: analysis.days.filter(day => dates.has(day.date)).flatMap(day => day.rules.filter(rule => departmentTokens.has(rule.department)).map(rule => ({
      date: day.date, sector: departmentTokens.get(rule.department), closed: Boolean(rule.closed), min: rule.minimum, max: rule.maximum ?? null,
      slots: rule.segments.map(slot => ({ start: slot.start, end: slot.end, available: slot.available, missing: slot.missing, excess: slot.excess || 0 })),
    }))),
    issues: weekIssues.map(issue => ({ person: tokens.get(String(issue.userId)) || '', date: issue.date, code: issue.code })),
  };
  const prompt = JSON.stringify(payload);
  if (prompt.length > 45000) throw new Error('A semana tem muitos detalhes. Reduza a quantidade de pessoas selecionadas para analisar.');
  return { prompt, week, people: Object.fromEntries([...tokens].map(([id, token]) => [token, id])), binding: JSON.stringify(rows), analysis };
}

function preservesCoverage(before, after) {
  return after.days.every(day => day.rules.every(rule => rule.segments.every(slot => {
    const original = before.days.find(old => old.date === day.date)?.rules.find(old => old.id === rule.id);
    const overlaps = original?.segments.filter(old => minute(old.start) < minute(slot.end) && minute(old.end) > minute(slot.start)) || [];
    return (!slot.missing || overlaps.length > 0 && overlaps.every(old => old.missing >= slot.missing))
      && (!slot.excess || overlaps.length > 0 && overlaps.every(old => (old.excess || 0) >= slot.excess));
  })));
}

export function validateScheduleAiResponse(text, request, rows, requirements, context = {}) {
  if (request.binding !== JSON.stringify(rows)) throw new Error('A prévia mudou. Analise a versão atual novamente.');
  if (typeof text !== 'string' || text.length > 12000) throw new Error('A IA retornou uma resposta inválida.');
  let response;
  try { response = JSON.parse(text.trim().replace(/^\x60\x60\x60(?:json)?\s*/i, '').replace(/\s*\x60\x60\x60$/, '')); }
  catch { throw new Error('Não foi possível interpretar as sugestões da IA. Nenhum dia foi alterado.'); }
  if (!response || !Array.isArray(response.swaps) || response.swaps.length > 20 || typeof response.summary !== 'string') throw new Error('A resposta da IA não contém uma proposta válida.');
  const summary = response.summary.trim().slice(0, 1200);
  if (!response.swaps.length) return { summary, swaps: [], rows: null, week: request.week };
  const proposed = rows.map(row => ({ ...row }));
  const used = new Set();
  for (const swap of response.swaps) {
    if (!swap || typeof swap.person !== 'string' || typeof swap.from !== 'string' || typeof swap.to !== 'string') throw new Error('A IA retornou uma troca inválida. Nenhum dia foi alterado.');
    const id = request.people[swap.person];
    const fromIndex = proposed.findIndex(row => String(row.userId) === id && row.date === swap.from);
    const toIndex = proposed.findIndex(row => String(row.userId) === id && row.date === swap.to);
    const from = proposed[fromIndex], to = proposed[toIndex];
    if (!id || !from || !to || fromIndex === toIndex || !sameWeek(from, to) || from.weekKey !== request.week || !movable(from) || !movable(to)
      || !isWorking(from) || to.status !== 'Folga' || used.has(fromIndex) || used.has(toIndex)
      || minute(from.shiftEnd) <= minute(from.shiftStart) || minute(from.shiftEnd) + Number(from.extraHours || 0) * 60 >= 1440
      || to.allowed === false && !request.analysis.days.find(day => day.date === to.date)?.rules.some(rule => rule.department === to.dept && !rule.closed && rule.minimum > 0)) {
      throw new Error('A IA sugeriu uma troca fora das pessoas, dias ou regras permitidos. Nenhum dia foi alterado.');
    }
    used.add(fromIndex); used.add(toIndex);
    const work = Object.fromEntries(operationFields.map(field => [field, from[field] ?? (['breakMinutes', 'extraHours'].includes(field) ? 0 : '')]));
    proposed[fromIndex] = { ...from, status: 'Folga', shiftStart: '', shiftEnd: '', breakStart: '', breakEnd: '', breakMinutes: 0, extraHours: 0, shift: 'Folga' };
    proposed[toIndex] = { ...to, ...work };
    for (const index of [fromIndex, toIndex]) {
      const row = proposed[index];
      row.ruleReason = 'Troca sugerida pela IA e verificada na prévia';
      row.locked = true; row.manuallyAdjusted = true;
      row.ruleTrace = appendScheduleTrace(row, { source: 'ai', label: row.ruleReason, detail: 'Trabalho e folga reorganizados na mesma semana. Aplicação depende da revisão do gestor.' });
    }
  }
  const dates = new Set(rows.filter(row => row.weekKey === request.week).map(row => row.date));
  const originalIssues = scheduleRuleIssues(rows, context.history || []).filter(issue => issue.blocking);
  const originalIssueKeys = new Set(originalIssues.map(issueKey));
  const blocking = scheduleRuleIssues(proposed, context.history || []).filter(issue => issue.blocking
    && (dates.has(issue.date) || !originalIssueKeys.has(issueKey(issue))));
  if (blocking.length) throw new Error('A sugestão não passou na validação: ' + blocking[0].message);
  const after = analyzeProposalCoverage(proposed, requirements, context);
  const before = request.analysis;
  const fixedIssues = originalIssues.some(issue => dates.has(issue.date));
  const weekAfter = analyzeProposalCoverage(proposed, requirements, context, dates);
  if (weekAfter.unknown || after.unknown > before.unknown || !preservesCoverage(before, after) || after.missingMinutes > before.missingMinutes
    || !(after.missingMinutes < before.missingMinutes || after.excessMinutes < before.excessMinutes || fixedIssues)) {
    throw new Error('A sugestão não melhora a cobertura com segurança. Nenhum dia foi alterado.');
  }
  return { summary, swaps: response.swaps, rows: proposed, week: request.week, before, after };
}

