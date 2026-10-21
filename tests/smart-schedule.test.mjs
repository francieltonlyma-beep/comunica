import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');

test('regras da escala são persistidas por empresa e recarregadas em tempo real', () => {
  assert.match(app, /onSnapshot\(doc\(getTenantCollection\('settings'\), 'schedule-rules'\)/);
  assert.match(app, /saveDoc\('settings', 'schedule-rules'/);
  assert.match(rules, /id == 'schedule-rules'[\s\S]*scheduleManager\(app, company\)[\s\S]*canManageCalendar\(app, company\)/);
});

test('intervalo possui início e fim próprios e é salvo na escala', () => {
  assert.match(app, /breakStart: '12:00'/);
  assert.match(app, /breakEnd: '13:00'/);
  assert.match(app, /breakStart: item\.breakStart \|\| '', breakEnd: item\.breakEnd \|\| ''/);
  assert.match(app, /Início intervalo[\s\S]*Fim intervalo/);
});

test('cargas e horas extras são exibidas no padrão hh:mm', () => {
  assert.match(app, /const scheduleDurationToText = value =>/);
  assert.match(app, /type="time" disabled=\{!working\} min="00:00" max="12:00"/);
  assert.match(app, /Meta \{scheduleDurationToText\(item\.target\)\}/);
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
  assert.match(app, /Dias em que a operação pode escalar pessoas/);
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
