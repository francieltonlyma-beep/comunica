import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const editor = readFileSync(new URL('../src/ScheduleRuleEditor.jsx', import.meta.url), 'utf8');
const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');

test('regras da escala são persistidas por empresa e recarregadas em tempo real', () => {
  assert.match(app, /onSnapshot\(doc\(getTenantCollection\('settings'\), 'schedule-rules'\)/);
  assert.match(app, /saveDoc\('settings', 'schedule-rules'/);
  assert.match(rules, /id == 'schedule-rules'[\s\S]*scheduleManager\(app, company\)[\s\S]*canManageScheduleRules\(app, company\)/);
});

test('filtros da escala funcionam em todos os tamanhos de tela', () => {
  for (const term of ['memberSearch', 'memberDepartment', 'memberAssignment', 'Selecionar visíveis', 'Desmarcar visíveis']) assert.match(editor, new RegExp(term));
  for (const term of ["role: 'Todos'", "selectionFilter: 'Todos'", 'Não selecionados', 'Limpar seleção']) assert.match(app, new RegExp(term));
  assert.match(editor, /sm:grid-cols-3/);
  assert.match(app, /sm:grid-cols-2 lg:grid-cols-4/);
});

test('dias e colaboradores preservam contraste ao selecionar e passar o mouse', () => {
  assert.match(editor, /aria-pressed=\{Boolean\(rule\.weekdays\?\.includes\(value\)\)\}/);
  assert.match(editor, /className=\{choiceButton\(rule\.weekdays\?\.includes\(value\)\)\}/);
  assert.match(editor, /hover:border-slate-300 hover:bg-slate-100/);
  assert.doesNotMatch(editor, /hover:border-slate-200 hover:bg-white/);
});

test('configuração das regras inteligentes possui permissão própria', () => {
  assert.match(app, /canManageScheduleRules: true/);
  assert.match(app, /Configurar regras da escala inteligente/);
  assert.match(app, /canConfigureScheduleRules/);
  assert.match(rules, /function canManageScheduleRules\(app, company\)/);
});

test('intervalo possui início e fim próprios e é salvo na escala', () => {
  assert.match(app, /breakStart: '12:00'/);
  assert.match(app, /breakEnd: '13:00'/);
  assert.match(app, /breakStart: item\.breakStart \|\| '', breakEnd: item\.breakEnd \|\| ''/);
  assert.match(app, /Início intervalo[\s\S]*Fim intervalo/);
});

test('cargas e horas extras são exibidas no padrão hh:mm', () => {
  assert.match(app, /const scheduleDurationToText = value =>/);
  assert.match(app, /type="time" disabled=\{!working \|\| preserved\} min="00:00" max=\{scheduleDurationToText\(item\.maxExtraHoursPerDay \?\? automaticScheduleRules\.maxExtraHoursPerDay\)\}/);
  assert.match(app, /Meta \{scheduleDurationToText\(item\.target\)\}/);
});

test('limites operacionais são configuráveis, versionados e vinculados à escala publicada', () => {
  for (const term of ['minRestHours', 'maxDailyHours', 'maxWeeklyHours', 'maxExtraHoursPerDay', 'limitSeverity', 'Salvar nova versão', 'Ver histórico de versões']) assert.match(app, new RegExp(term));
  assert.match(app, /rulesVersion: Number\(item\.rulesVersion \|\| automaticScheduleRules\.version \|\| 1\)/);
  assert.match(app, /profileName: item\.profileName \|\| item\.groupName/);
  assert.match(editor, /Avançado: limites e horários próprios da turma/);
  assert.match(editor, /Herdar padrão/);
});

test('novo planejamento reaproveita o último padrão individual sem copiar horas extras', () => {
  assert.match(app, /reuseLastSchedule: true/);
  assert.match(app, /const latestWorkSchedule = automaticScheduleRules\.reuseLastSchedule/);
  assert.match(app, /shiftStart: isWorkDay \? defaultShiftStart/);
  assert.match(app, /extraHours: 0/);
});

test('operação possui entrada, saída e dias da semana configuráveis', () => {
  assert.match(app, /shiftEnd: '21:00'/);
  assert.match(app, /allowedWeekdays: \[0, 1, 2, 3, 4, 5, 6\]/);
  assert.match(app, /Dias padrão para turmas sem dias próprios/);
  assert.match(app, /Saída padrão/);
});

test('folgas usam rodízio em vez de fixar sábado e domingo', () => {
  assert.match(app, /const restSet = new Set\(\)/);
  assert.match(app, /userIndex \+ weekIndex \+ offset \* restStep/);
  assert.doesNotMatch(app, /const workSet = new Set\(availableDays\.slice\(0, plannedWorkDays\)\)/);
});

test('exceção individual permite saída própria aos sábados e complemento automático', () => {
  assert.match(app, /saturdayEnd/);
  assert.match(app, /weekday === 6 && employeeOverride\.saturdayEnd/);
  assert.match(app, /remainingExtra = Math\.max\(0, targetWeekHours - baseHours\)/);
  assert.match(app, /Complemento automático/);
});
