import test from 'node:test';
import assert from 'node:assert/strict';
import { absenceOverlapsShift, findScheduleAbsence, isFullDayAbsence } from '../src/scheduleAbsences.js';

test('detecta somente ausências que coincidem com a jornada', () => {
  const partial = { userId: 'u', date: '2026-11-02', startTime: '10:00', endTime: '11:00' };
  assert.equal(absenceOverlapsShift(partial, '2026-11-02', '08:00', '17:00'), true);
  assert.equal(absenceOverlapsShift({ ...partial, startTime: '18:00', endTime: '19:00' }, '2026-11-02', '08:00', '17:00'), false);
  assert.equal(findScheduleAbsence([partial], 'other', '2026-11-02', '08:00', '17:00'), undefined);
});

test('ausência noturna do dia anterior protege a madrugada seguinte', () => {
  const absence = { userId: 'u', date: '2026-11-02', startTime: '22:00', endTime: '02:00' };
  assert.equal(absenceOverlapsShift(absence, '2026-11-03', '00:00', '06:00'), true);
  assert.equal(absenceOverlapsShift(absence, '2026-11-03', '03:00', '06:00'), false);
});

test('ausência sem horários é integral apenas nas datas ativas', () => {
  const absence = { userId: 'u', startDate: '2026-11-02', endDate: '2026-11-03' };
  assert.equal(isFullDayAbsence(absence, '2026-11-02'), true);
  assert.equal(isFullDayAbsence(absence, '2026-11-04'), false);
  assert.equal(absenceOverlapsShift(absence, '2026-11-03', '08:00', '17:00'), true);
});

