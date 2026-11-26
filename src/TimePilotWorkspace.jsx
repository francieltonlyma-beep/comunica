import { useEffect, useRef, useState } from 'react';
import { CalendarDays, Clock, Download } from 'lucide-react';
import { collection, doc, onSnapshot, orderBy, query, runTransaction, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import TimeDeviceButton from './TimeDeviceButton.jsx';
import TimeRecordParameters from './TimeRecordParameters.jsx';
import { calendarRecordsForDay } from './scheduleCalendarModel.js';

const defaultPolicy = { adjustmentDays: 0, reasonLength: 4 };
const punchTypes = { entry: 'Entrada', breakStart: 'Saída para intervalo', breakEnd: 'Retorno do intervalo', exit: 'Saída' };
const zone = 'America/Sao_Paulo';
const calendar = new Intl.DateTimeFormat('sv-SE', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' });
const datetime = new Intl.DateTimeFormat('pt-BR', { timeZone: zone, dateStyle: 'short', timeStyle: 'medium' });
const time = new Intl.DateTimeFormat('pt-BR', { timeZone: zone, hour: '2-digit', minute: '2-digit', second: '2-digit' });
const day = new Intl.DateTimeFormat('pt-BR', { timeZone: zone, weekday: 'long', day: 'numeric', month: 'long' });
const states = { pending: 'Aguardando análise', approved: 'Aprovado', rejected: 'Recusado' };
const panel = 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6';
const field = 'min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm';
const button = 'min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-50';
const primary = 'min-h-11 rounded-xl bg-blue-700 px-4 py-2 font-bold text-white hover:bg-blue-800 disabled:opacity-50';

function monthBounds(month) {
  const [year, number] = month.split('-').map(Number);
  const next = new Date(Date.UTC(year, number, 1)).toISOString().slice(0, 10);
  return [new Date(`${month}-01T00:00:00-03:00`), new Date(`${next}T00:00:00-03:00`)];
}

function download(filename, content, type) {
  const url = URL.createObjectURL(new Blob(Array.isArray(content) ? content : [content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function receipt(row) {
  download(`batida-piloto-${row.id}.txt`,
    `Comunica Gestão — comprovante de teste\nBatida: ${datetime.format(row.occurredAt.toDate())} (Brasília)\nIdentificador: ${row.id}\nUso exclusivo para validação do piloto.\n`,
    'text/plain;charset=utf-8');
}

export default function TimePilotWorkspace({ functionsClient, db, appId, company, uid, admin, canReview, employees, settings, schedules, absences, departments, getDepartments, onCalendar, onEmployee }) {
  const [now, setNow] = useState(() => new Date());
  const [view, setView] = useState('self');
  const [policy, setPolicy] = useState(null);
  const [employee, setEmployee] = useState('');
  const [month, setMonth] = useState(() => calendar.format(new Date()).slice(0, 7));
  const [read, setRead] = useState(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const locked = useRef(false);
  const pendingPunch = useRef(null);
  const [adjustmentHour, setAdjustmentHour] = useState('');
  const [reason, setReason] = useState('');
  const target = view === 'team' && canReview ? employee : uid;
  const isTeam = view === 'team' && canReview;
  const scope = JSON.stringify([target, month]);
  const rows = read?.scope === scope ? read.rows : null;
  const base = ['artifacts', appId, 'public', 'data', 'companies', company];
  const enabled = settings?.enabled === true;
  const person = employees.find(item => item.id === target);
  const today = calendar.format(now);
  const daily = calendarRecordsForDay(today, { schedules, absences }, { employee: target });
  const roster = employees.filter(person => person.id !== uid && !person.isDeveloper);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!enabled || !target || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return undefined;
    const [start, end] = monthBounds(month);
    const records = collection(db, 'artifacts', appId, 'public', 'data', 'companies', company, 'timePilotUsers', target, 'records');
    return onSnapshot(query(records, where('occurredAt', '>=', start), where('occurredAt', '<', end), orderBy('occurredAt', 'desc')), { includeMetadataChanges: true },
      snapshot => setRead({ scope, rows: snapshot.docs.filter(item => !item.metadata.hasPendingWrites)
        .map(item => ({ id: item.id, ...item.data() })) }),
      () => setRead({ scope, rows: [], error: true }));
  }, [db, appId, company, enabled, month, target, scope]);

  useEffect(() => onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'companies', company, 'timePilot', 'parameters'),
    snap => setPolicy(snap.data() || defaultPolicy), () => setPolicy(null)), [db, appId, company]);

  function savePolicy(next) {
    if (!window.confirm('Aplicar aos novos pedidos de toda a empresa? Prazo: ' + (next.adjustmentDays || 'sem limite') + (next.adjustmentDays ? ' dias' : '') + '. Justificativa mínima: ' + next.reasonLength + ' caracteres. Verificação pelo aparelho: ' + (next.deviceVerification ? 'ativada' : 'desativada') + '.')) return;
    const ref = doc(db, ...base, 'timePilot', 'parameters');
    void save(() => runTransaction(db, async transaction => {
      const latest = (await transaction.get(ref)).data() || defaultPolicy;
      if (latest.adjustmentDays !== policy.adjustmentDays || latest.reasonLength !== policy.reasonLength || Boolean(latest.deviceVerification) !== Boolean(policy.deviceVerification)) throw new Error('stale');
      transaction.set(ref, { ...next, updatedAt: serverTimestamp(), updatedBy: uid });
    }), 'Parâmetros salvos.');
  }

  async function save(action, success) {
    if (locked.current) return false;
    if (!navigator.onLine) {
      setMessage('Sem conexão. Reconecte-se para enviar o registro.');
      return false;
    }
    locked.current = true;
    setSaving(true);
    setMessage('');
    try {
      const result = await action();
      setMessage(typeof result === 'string' ? result : success);
      return true;
    } catch (error) {
      if (error.name === 'NotAllowedError' || error.code === 'ERROR_CEREMONY_ABORTED') { setMessage('Verificação cancelada ou indisponível.'); return false; }
      if (error.code?.startsWith('functions/')) { setMessage(error.message); return false; }
      if (error.message === 'stale') { setMessage('Os parâmetros mudaram. Revise os valores atuais.'); return false; }
      setMessage('Não foi possível concluir. Confira sua conexão e tente novamente.');
      return false;
    } finally {
      locked.current = false;
      setSaving(false);
    }
  }

  const recordsFor = user => collection(db, ...base, 'timePilotUsers', user, 'records');
  function showPunch(punchType) {
    setMonth(calendar.format(new Date()).slice(0, 7));
    const label = punchTypes[punchType];
    return label ? 'Batida de teste registrada — ' + label + '.' : 'Batida de teste registrada.';
  }

  function registerPunch() {
    if (!window.confirm('Registrar agora a batida de teste?')) return;
    void save(async () => {
      pendingPunch.current ??= doc(recordsFor(uid)).id;
      const call = httpsCallable(functionsClient, 'timeDeviceVerification');
      const { data } = await call({ company, action: 'record', requestId: pendingPunch.current });
      pendingPunch.current = null;
      return showPunch(data.punchType);
    }, 'Batida de teste registrada.');
  }

  async function requestAdjustment(event) {
    event.preventDefault();
    const occurrence = new Date(`${adjustmentHour}:00-03:00`);
    if (!Number.isFinite(occurrence.getTime()) || occurrence > new Date() || reason.trim().length < 4) {
      setMessage('Informe um horário já ocorrido e um motivo com pelo menos quatro caracteres.');
      return;
    }
    if (!policy || reason.trim().length < policy.reasonLength || (policy.adjustmentDays && Date.now() - occurrence.getTime() > policy.adjustmentDays * 86400000)) {
      setMessage('Confira o prazo do ajuste e o tamanho mínimo da justificativa.');
      return;
    }
    if (!window.confirm('Enviar ao RH o pedido de ajuste para ' + datetime.format(occurrence) + '?')) return;
    const ref = doc(recordsFor(uid));
    const sent = await save(() => setDoc(ref, {
      kind: 'adjustment', occurredAt: occurrence, createdAt: serverTimestamp(), reason: reason.trim(), status: 'pending',
    }), 'Ajuste enviado para análise.');
    if (sent) {
      setMonth(calendar.format(occurrence).slice(0, 7));
      setAdjustmentHour('');
      setReason('');
    }
  }

  function review(row, status) {
    if (!window.confirm((status === 'approved' ? 'Aprovar' : 'Recusar') + ' o ajuste de ' + (person?.name || 'colaborador') + ' para ' + datetime.format(row.occurredAt.toDate()) + '?')) return;
    void save(() => updateDoc(doc(recordsFor(target), row.id), { status, reviewedAt: serverTimestamp(), reviewedBy: uid }),
      status === 'approved' ? 'Ajuste aprovado.' : 'Ajuste recusado.');
  }

  function exportMonth() {
    const marks = rows.filter(row => row.kind === 'punch' || row.status === 'approved');
    const csv = ['Data e hora (Brasília);Origem;Verificação;Identificador', ...marks.map(row =>
      `${datetime.format(row.occurredAt.toDate())};${row.kind === 'punch' ? (punchTypes[row.punchType] || 'Batida original') : 'Ajuste aprovado'};${row.verification === 'webauthn' ? 'Aparelho' : '—'};${row.id}`)];
    download(`espelho-piloto-${month}.csv`, ['\uFEFF', csv.join('\r\n')], 'text/csv;charset=utf-8');
  }

  return (
    <section className="mx-auto max-w-6xl space-y-4 text-slate-900">
      <header className="rounded-2xl bg-slate-950 p-5 text-white sm:p-7">
        <h1 className="text-2xl font-bold">Ponto e jornada</h1>
        <p className="mt-2 max-w-xl text-sm text-slate-200">Piloto para testar batidas, ajustes e o espelho mensal. Continue usando o controle oficial da empresa.</p>
      </header>
      {message && <p className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950" role="status">{message}</p>}
      {settings?.error && <p role="alert">Não foi possível consultar a configuração do piloto.</p>}
      {admin && <details className={panel}><summary className="cursor-pointer font-bold">Parâmetros do ponto</summary>
        {policy ? <TimeRecordParameters key={JSON.stringify([policy.adjustmentDays, policy.reasonLength, policy.deviceVerification])} policy={policy} busy={saving} onSave={savePolicy} /> : <p>Parâmetros indisponíveis.</p>}
      </details>}
      {enabled && <>
        {canReview && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Visão do ponto">
            <button type="button" className={isTeam ? button : primary} aria-pressed={!isTeam} onClick={() => setView('self')}>Meu ponto</button>
            <button type="button" className={isTeam ? primary : button} aria-pressed={isTeam} onClick={() => setView('team')}>Painel da equipe</button>
          </div>
        )}
        {person && <section className={panel}>
          <h2 className="font-bold">{person.name}</h2>
          <p>{[person.role, ...departments.filter(d => getDepartments(person).includes(d.id)).map(d => d.name)].filter(Boolean).join(' · ')}</p>
          <h3 className="mt-3 font-semibold">Jornada de hoje · {day.format(now)}</h3>
          {daily.schedules.map(row => <p key={row.id}>{[row.status, [row.shiftStart, row.shiftEnd].filter(Boolean).join(' às '), row.breakStart && row.breakEnd && ('Intervalo ' + row.breakStart + ' às ' + row.breakEnd)].filter(Boolean).join(' · ')}</p>)}
          {daily.absences.map(row => <p key={row.id}>Ausência registrada no calendário</p>)}
          {!daily.schedules.length && !daily.absences.length && <p>Sem jornada publicada disponível para hoje.</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {onCalendar && <button className={button} onClick={() => onCalendar(today)}>Abrir escalas e calendário</button>}
            {onEmployee && <button className={button} onClick={() => onEmployee(person)}>Editar cadastro na gestão da equipe</button>}
          </div>
        </section>}
        {!isTeam && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className={panel}>
              <h2 className="flex items-center gap-2 font-bold"><Clock size={19} aria-hidden="true" /> Registrar batida</h2>
              <p className="mt-4 text-4xl font-bold tabular-nums">{time.format(now)}</p>
              <p className="mt-1 text-sm text-slate-600">{day.format(now)} · Horário de Brasília</p>
              <p className="mt-3 text-sm text-slate-600">O tipo de batida é definido automaticamente ao registrar.</p>
              <button className={`${primary} mt-5 w-full sm:w-auto`} disabled={saving} onClick={registerPunch} type="button">Bater ponto de teste</button>
              {policy?.deviceVerification && <TimeDeviceButton functionsClient={functionsClient} company={company} busy={saving} save={save} onPunch={showPunch} />}
              <p className="mt-2 text-xs text-slate-600">A batida salva usa o horário confirmado pelo servidor.</p>
            </div>
            <form className={`${panel} grid content-start gap-3`} onSubmit={requestAdjustment}>
              <h2 className="font-bold">Pedir ajuste de batida faltante</h2>
              <label className="grid gap-1 text-sm font-medium">Data e hora em Brasília
                <input className={field} required type="datetime-local" value={adjustmentHour} onChange={event => setAdjustmentHour(event.target.value)} />
              </label>
              <p className="text-sm">{policy ? `Prazo: ${policy.adjustmentDays ? policy.adjustmentDays + ' dias' : 'sem limite'}. Justificativa de ${policy.reasonLength} a 500 caracteres.` : 'Aguardando parâmetros.'}</p>
              <label className="grid gap-1 text-sm font-medium">Motivo
                <textarea className={field} required minLength={policy?.reasonLength || 4} maxLength="500" rows="2" value={reason} onChange={event => setReason(event.target.value)} />
              </label>
              <button className={`${button} justify-self-start`} disabled={saving || !policy} type="submit">Enviar ajuste</button>
            </form>
          </div>
        )}
        <div className={panel}>
          <div className="mb-4 flex flex-wrap justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 font-bold"><CalendarDays size={19} aria-hidden="true" /> Espelho mensal do piloto</h2>
              <p className="mt-1 text-sm text-slate-600">Batidas originais e pedidos de ajuste ficam no histórico.</p>
            </div>
            <button className={`${button} inline-flex items-center gap-2`} disabled={!rows?.some(row => row.kind === 'punch' || row.status === 'approved')} onClick={exportMonth} type="button">
              <Download size={16} aria-hidden="true" /> Baixar CSV
            </button>
          </div>
          <div className="mb-4 flex flex-wrap gap-3">
            {isTeam && (
              <label className="grid flex-1 gap-1 text-sm font-medium">Colaborador
                <select className={field} value={employee} onChange={event => setEmployee(event.target.value)}>
                  <option value="">Selecione uma pessoa</option>
                  {roster.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}
                </select>
              </label>
            )}
            <label className="grid gap-1 text-sm font-medium">Mês de referência
              <input className={field} type="month" value={month} max={currentMonth} onChange={event => setMonth(event.target.value || currentMonth)} />
            </label>
          </div>
          {!target ? <p className="text-sm text-slate-600">Escolha o colaborador para carregar o espelho.</p>
            : read?.scope === scope && read.error ? <p role="alert">Falha ao carregar o espelho mensal.</p>
            : !rows ? <p className="text-sm text-slate-600">Carregando registros…</p>
            : rows.length === 0 ? <p className="text-sm text-slate-600">Nenhum registro neste mês.</p>
            : <ul className="divide-y divide-slate-200">{rows.map(row => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div className="min-w-0">
                  <p className="font-semibold">{datetime.format(row.occurredAt.toDate())}</p>
                  {row.verification === 'webauthn' && <small>Verificada pelo aparelho</small>}
                  <p className="break-words text-sm text-slate-600">{row.kind === 'punch' ? (punchTypes[row.punchType] || 'Batida original') : `Ajuste · ${states[row.status]} · ${row.reason}`}</p>
                </div>
                {row.kind === 'punch' && !isTeam && <button type="button" className={button} onClick={() => receipt(row)}>Comprovante de teste</button>}
                {isTeam && row.status === 'pending' && <div className="flex gap-2">
                  <button className={primary} type="button" disabled={saving} onClick={() => review(row, 'approved')}>Aprovar</button>
                  <button className={button} type="button" disabled={saving} onClick={() => review(row, 'rejected')}>Recusar</button>
                </div>}
              </li>
            ))}</ul>}
        </div>
      </>}
    </section>
  );
}
