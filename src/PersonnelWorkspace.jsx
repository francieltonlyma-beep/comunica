import { CareerReviewQueue } from './CareerReviewWorkflow.jsx';
import CareerReview from './CareerReview.jsx';
import PurchaseSelect from './PurchaseSelect.jsx';
import { useEffect, useRef, useState } from 'react';
import {
  Bytes,
  collection,
  doc,
  getDocFromServer,
  getDocsFromServer,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { personnelKinds, hrDay, displayDay, pendingDate } from './personnelModel';
import { usePersonnelRows, usePersonnelDay } from './usePersonnelRows';

const panel = 'rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-3';
const control = 'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900';
const button = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800';
const primary = 'rounded-lg bg-blue-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50';
const instructions = [
  'Conferir documentação',
  'Liberar para compromisso',
  'Dar retorno ao RH',
  'Conferir equipamentos',
];
const root = (company) => ['artifacts', 'comunica-salvador', 'public', 'data', 'companies', company];
const source = (kind) => (personnelKinds[kind].private ? 'hrConfidential' : 'hrCases');
const labelDate = (kind) =>
  ({
    admission: 'Admissão efetiva',
    termination: 'Desligamento efetivo',
    exam: 'Data de realização',
    warning: 'Data da ocorrência',
    leave: 'Início',
    transfer: 'Data efetiva',
  })[kind] || 'Data efetiva';
const labelNext = (kind) =>
  ({ exam: 'Próximo vencimento', leave: 'Retorno previsto', admission: 'Fim da experiência' })[kind] ||
  'Data de retorno';
function Field({ label, children }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      {children}
    </label>
  );
}
function newCase(employeeId, uid, kind = 'admission') {
  return {
    employeeId,
    owner: uid,
    kind,
    title: '',
    due: hrDay(),
    planned: '',
    effective: '',
    nextDate: '',
    status: personnelKinds[kind].steps[0],
    checks: [],
    instruction: '',
    note: '',
  };
}

export function AssignedPersonnelTasks({ db, company, uid }) {
  const result = usePersonnelRows(db, company, 'hrAssignments', 'assigned', uid);
  const [error, setError] = useState('');
  const tasks = result.rows.filter((row) => row.instruction && !row.completed);
  if (!tasks.length && !result.error && !error) return null;
  return (
    <section className={panel}>
      <h3 className="font-bold">Minhas pendências com o RH</h3>
      {(error || result.error) && <p role="alert">{error || result.error}</p>}
      {tasks.map((row) => (
        <div className="flex flex-wrap items-center justify-between gap-2" key={row.id}>
          <span>
            {row.instruction} · {row.employeeName} · {displayDay(row.due)}
          </span>
          <button
            className={button}
            onClick={async () => {
              try {
                await updateDoc(doc(db, ...root(company), 'hrAssignments', row.id), { completed: true });
                setError('');
              } catch {
                setError('Falha ao confirmar a providência. Tente novamente.');
              }
            }}
          >
            Confirmar providência
          </button>
        </div>
      ))}
    </section>
  );
}

function CaseEditor({ db, company, uid, employees, confidential, record, close, saved }) {
  const [draft, setDraft] = useState(record);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const identity = useRef(doc(collection(db, ...root(company), source(record.kind))).id);
  const definition = personnelKinds[draft.kind];
  function change(field, value) {
    setDraft((previous) => ({ ...previous, [field]: value }));
  }
  async function submit(event) {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      const employee = employees.find((person) => person.id === draft.employeeId);
      if (!draft.title.trim() || (!employee && !record.id)) throw Error('Informe o colaborador e um título.');
      if (draft.status === definition.steps.at(-1) && !draft.effective)
        throw Error('Informe a data efetiva para concluir.');
      if (draft.nextDate && draft.effective && draft.nextDate < draft.effective)
        throw Error('A próxima data deve ser igual ou posterior à data efetiva.');
      if (file && file.size > 700 * 1024) throw Error('Selecione um PDF de até 700 KB.');
      const bytes = file ? new Uint8Array(await file.arrayBuffer()) : null;
      if (bytes && String.fromCharCode(...bytes.slice(0, 5)) !== '%PDF-')
        throw Error('Selecione um arquivo PDF válido.');
      const ref = doc(db, ...root(company), source(draft.kind), record.id || identity.current);
      const history = doc(collection(ref, 'history'));
      const entry = {
        employeeId: draft.employeeId,
        employeeName: employee?.name || record.employeeName,
        owner: draft.owner,
        kind: draft.kind,
        title: draft.title.trim(),
        due: draft.due,
        planned: draft.planned || '',
        effective: draft.effective,
        nextDate: draft.nextDate,
        status: draft.status,
        checks: draft.checks,
        instruction: draft.instruction,
        note: draft.note.trim(),
        updatedBy: uid,
        updatedAt: serverTimestamp(),
        revision: history.id,
        previous: record.revision || '',
        hasFile: Boolean(bytes),
      };
      const batch = writeBatch(db);
      batch.set(ref, entry);
      batch.set(history, entry);
      if (bytes) batch.set(doc(ref, 'files', history.id), { pdf: Bytes.fromUint8Array(bytes) });
      const closed = draft.status === 'Cancelado' || draft.status === definition.steps.at(-1);
      const taskChanged =
        record.instruction !== draft.instruction || record.owner !== draft.owner || record.due !== draft.due;
      const previouslyClosed = record.status === 'Cancelado' || record.status === definition.steps.at(-1);
      if ((draft.instruction || record.instruction) && (taskChanged || closed !== previouslyClosed)) {
        batch.set(doc(db, ...root(company), 'hrAssignments', ref.id), {
          source: source(draft.kind),
          owner: draft.owner,
          employeeName: entry.employeeName,
          due: draft.due,
          instruction: draft.instruction,
          completed: closed || !draft.instruction,
        });
      }
      await batch.commit();
      saved(entry.employeeId);
    } catch (err) {
      setError(
        err.code === 'permission-denied'
          ? 'O registro mudou ou seu acesso foi alterado. Feche e reabra a ficha antes de tentar novamente.'
          : err.message,
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <form className={panel} onSubmit={submit}>
      <h3 className="text-lg font-bold">{record.id ? 'Atualizar acompanhamento' : 'Novo acompanhamento'}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Colaborador">
          <PurchaseSelect searchPlaceholder="Buscar por nome" label="Colaborador" value={draft.employeeId} onChange={selectedId => change('employeeId', selectedId)} required disabled={Boolean(record.id)} placeholder="Selecione" options={[...employees.map(p => [p.id, p.name]), ...(record.id && !employees.some((p) => p.id === record.employeeId) ? [[record.employeeId, record.employeeName]] : [])]} />
        </Field>
        <Field label="Tipo">
          <select
            disabled={Boolean(record.id)}
            className={control}
            value={draft.kind}
            onChange={(e) =>
              setDraft({ ...newCase(draft.employeeId, draft.owner, e.target.value), due: draft.due })
            }
          >
            {Object.entries(personnelKinds)
              .filter(([, v]) => confidential || !v.private)
              .map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
          </select>
        </Field>
        <Field label={draft.kind === 'exam' ? 'Tipo de exame' : 'Título do acompanhamento'}>
          <input
            required
            maxLength={160}
            className={control}
            value={draft.title}
            onChange={(e) => change('title', e.target.value)}
          />
        </Field>
        <Field label="Etapa">
          <select className={control} value={draft.status} onChange={(e) => change('status', e.target.value)}>
            {[...definition.steps, 'Cancelado'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Responsável">
          <PurchaseSelect searchPlaceholder="Buscar por nome" label="Responsável" value={draft.owner} onChange={selectedId => change('owner', selectedId)} required placeholder="Selecione" options={[...employees.map(p => [p.id, p.name])]} />
        </Field>
        <Field label="Prazo da próxima ação">
          <input
            type="date"
            required
            className={control}
            value={draft.due}
            onChange={(e) => change('due', e.target.value)}
          />
        </Field>
        <Field label={draft.kind === 'exam' ? 'Data agendada' : 'Data prevista'}>
          <input
            type="date"
            className={control}
            value={draft.planned || ''}
            onChange={(e) => change('planned', e.target.value)}
          />
        </Field>
        <Field label={labelDate(draft.kind)}>
          <input
            type="date"
            className={control}
            value={draft.effective}
            onChange={(e) => change('effective', e.target.value)}
          />
        </Field>
        <Field label={labelNext(draft.kind)}>
          <input
            type="date"
            className={control}
            value={draft.nextDate}
            onChange={(e) => change('nextDate', e.target.value)}
          />
        </Field>
      </div>
      <fieldset>
        <legend className="font-semibold text-sm">Checklist</legend>
        <div className="flex flex-wrap gap-3 py-2">
          {definition.checks.map((item) => (
            <label key={item} className="text-sm">
              <input
                type="checkbox"
                checked={draft.checks.includes(item)}
                onChange={(e) =>
                  change(
                    'checks',
                    e.target.checked ? [...draft.checks, item] : draft.checks.filter((i) => i !== item),
                  )
                }
              />{' '}
              {item}
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="Providência a mostrar ao responsável na Central de serviços">
        <select
          className={control}
          value={draft.instruction}
          onChange={(e) => change('instruction', e.target.value)}
        >
          <option value="">Sem tarefa delegada</option>
          {instructions.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </Field>
      <Field label="Observações do RH">
        <textarea
          maxLength={3000}
          className={control}
          rows={3}
          value={draft.note}
          onChange={(e) => change('note', e.target.value)}
        />
      </Field>
      <Field label="Anexar PDF a esta atualização (até 700 KB)">
        <input
          type="file"
          accept="application/pdf"
          className={control}
          onChange={(e) => setFile(e.target.files[0])}
        />
      </Field>
      {error && (
        <p role="alert" className="text-rose-700">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button disabled={busy} className={primary}>
          {busy ? 'Salvando…' : 'Salvar acompanhamento'}
        </button>
        <button type="button" disabled={busy} className={button} onClick={close}>
          Voltar
        </button>
      </div>
    </form>
  );
}

function CaseHistory({ db, company, row, employees }) {
  const [versions, setVersions] = useState(null);
  const [task, setTask] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let valid = true;
    const ref = doc(db, ...root(company), source(row.kind), row.id);
    const taskRead = row.instruction
      ? getDocFromServer(doc(db, ...root(company), 'hrAssignments', row.id))
      : Promise.resolve(null);
    Promise.all([
      getDocsFromServer(query(collection(ref, 'history'), orderBy('updatedAt', 'desc'))),
      taskRead,
    ])
      .then(([snap, assignment]) => {
        if (valid) {
          setVersions(snap.docs.map((d) => d.data()));
          setTask(assignment?.data());
        }
      })
      .catch(() => {
        if (valid) setError('Não foi possível carregar o histórico.');
      });
    return () => {
      valid = false;
    };
  }, [db, company, row.id, row.kind, row.instruction, row.revision]);
  async function download(revision) {
    try {
      const snap = await getDocFromServer(
        doc(db, ...root(company), source(row.kind), row.id, 'files', revision),
      );
      if (!snap.exists()) throw Error();
      const url = URL.createObjectURL(
        new Blob([snap.data().pdf.toUint8Array()], { type: 'application/pdf' }),
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = 'documento-rh.pdf';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch {
      setError('Não foi possível baixar o anexo.');
    }
  }
  return (
    <div className="space-y-2 border-t pt-3 text-sm">
      {task?.instruction && (
        <p>Providência delegada · {task.completed ? 'Confirmada ou encerrada' : 'Aguardando confirmação'}</p>
      )}
      {error && <p role="alert">{error}</p>}
      {!versions && !error && <p>Carregando histórico…</p>}
      {versions?.map((v) => (
        <article key={v.revision} className="space-y-1 rounded-lg bg-slate-50 p-3">
          <strong>
            {v.title} · {v.status}
          </strong>
          <p>
            {v.updatedAt?.toDate().toLocaleString('pt-BR')} ·{' '}
            {employees.find((p) => p.id === v.updatedBy)?.name || v.updatedBy}
          </p>
          <p>
            Responsável: {employees.find((p) => p.id === v.owner)?.name || v.owner} · Prazo:{' '}
            {displayDay(v.due)}
          </p>
          {v.planned && <p>Data prevista: {displayDay(v.planned)}</p>}
          {v.effective && (
            <p>
              {labelDate(v.kind)}: {displayDay(v.effective)}
            </p>
          )}
          {v.nextDate && (
            <p>
              {labelNext(v.kind)}: {displayDay(v.nextDate)}
            </p>
          )}
          {v.checks.length > 0 && <p>{v.checks.join(' · ')}</p>}
          {v.note && <p className="whitespace-pre-wrap">{v.note}</p>}
          {v.hasFile && (
            <button className={button} onClick={() => download(v.revision)}>
              Baixar PDF desta atualização
            </button>
          )}
        </article>
      ))}
    </div>
  );
}

export default function PersonnelWorkspace({
  db,
  company,
  uid,
  employees,
  departments,
  confidential,
  view,
  go,
  employeeId,
  selectEmployee,
  roles = [],
  reviewActivities,
  careerActions,
}) {
  const common = usePersonnelRows(db, company, 'hrCases');
  const restricted = usePersonnelRows(db, company, confidential ? 'hrConfidential' : '');
  const [draft, setDraft] = useState(null);
  const [history, setHistory] = useState('');
  const [showReviewQueue, setShowReviewQueue] = useState(false);
  const [kind, setKind] = useState('');
  const [period, setPeriod] = useState('all');
  const [message, setMessage] = useState('');
  const all = [...common.rows, ...restricted.rows];
  const people = new Map(all.map((row) => [row.employeeId, { id: row.employeeId, name: row.employeeName }]));
  employees.forEach((person) => people.set(person.id, person));
  const options = [...people.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  const person = people.get(employeeId);
  const today = usePersonnelDay(true);
  const soon = new Date(Date.parse(today + 'T12:00:00Z') + 30 * 86400000).toISOString().slice(0, 10);
  const weekEnd = new Date(Date.parse(today + 'T12:00:00Z') + 7 * 86400000).toISOString().slice(0, 10);
  const pending = all.filter(row => pendingDate(row) ||
    (row.status !== 'Cancelado' && row.status !== personnelKinds[row.kind]?.steps.at(-1)));
  const matchesKind = row => !kind || row.kind === kind;
  const pendingOfKind = pending.filter(matchesKind);
  const filters = [
    ['all', 'Todas', () => true],
    ['late', 'Vencidas', r => Boolean(pendingDate(r) && pendingDate(r) < today)],
    ['today', 'Para hoje', r => pendingDate(r) === today],
    ['week', 'Próximos 7 dias', r => pendingDate(r) > today && pendingDate(r) <= weekEnd],
    ['undated', 'Sem prazo', r => !pendingDate(r)],
    ['exams', 'Exames a vencer', (r) => r.kind === 'exam' && pendingDate(r) >= today && pendingDate(r) <= soon],
  ].filter(([id]) => id !== 'exams' || confidential);
  const visible =
    view === 'file'
      ? all.filter((r) => r.employeeId === employeeId).sort((a, b) => b.at - a.at)
      : pendingOfKind
          .filter(filters.find(([key]) => key === period)?.[2] || (() => true))
          .sort((a, b) => (pendingDate(a) || '9999').localeCompare(pendingDate(b) || '9999'));
  const loading = common.loading || restricted.loading;
  function openFile(id) {
    selectEmployee(id);
    setHistory('');
    go('file');
  }
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">
            {view === 'file' ? 'Ficha do colaborador' : 'Pendências do RH'}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className={button}
            onClick={() => {
              setDraft(null);
              go(view === 'file' ? 'pending' : 'file');
            }}
          >
            {view === 'file' ? 'Ver pendências' : 'Consultar ficha'}
          </button>
          <button
            className={primary}
            onClick={() => {
              setMessage('');
              setDraft(newCase(view === 'file' ? employeeId : '', uid));
            }}
          >
            Novo acompanhamento
          </button>
        </div>
      </div>
      {message && (
        <p role="status" className="text-emerald-800">
          {message}
        </p>
      )}
      {draft ? (
        <CaseEditor
          db={db}
          company={company}
          uid={uid}
          employees={employees}
          confidential={confidential}
          record={draft}
          close={() => setDraft(null)}
          saved={(id) => {
            setDraft(null);
            setMessage('Acompanhamento salvo.');
            openFile(id);
          }}
        />
      ) : (
        <>
          {view !== 'file' && confidential && <div className="flex flex-wrap gap-2">
            <button type="button" aria-pressed={!showReviewQueue} className={!showReviewQueue ? primary : button} onClick={() => setShowReviewQueue(false)}>Acompanhamentos</button>
            <button type="button" aria-pressed={showReviewQueue} className={showReviewQueue ? primary : button} onClick={() => setShowReviewQueue(true)}>Avaliações de carreira</button>
          </div>}
          {view !== 'file' && confidential && showReviewQueue ? (
            <CareerReviewQueue db={db} company={company} employees={employees} today={today} openFile={openFile} />
          ) : view === 'file' ? (
            <>
            <div className={panel}>
              <Field label="Colaborador">
                <PurchaseSelect searchPlaceholder="Buscar por nome" label="Colaborador da ficha" value={employeeId} onChange={selectedId => openFile(selectedId)} placeholder="Selecione um colaborador" options={[...options.map(p => [p.id, p.name])]} />
              </Field>
              {person && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-bold">{person.name}</h3>
                    <p className="text-sm text-slate-600">
                      {[
                        person.role,
                        ...(Array.isArray(person.depts) ? person.depts : []).map(
                          (id) => departments.find((d) => d.id === id)?.name || id,
                        ),
                        person.hireDate && 'Admissão em ' + displayDay(person.hireDate),
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  {careerActions && <div className="flex flex-wrap gap-2">
                    <button type="button" className={button} onClick={() => careerActions('dpi', person)}>Indicadores</button>
                    <button type="button" className={button} onClick={() => careerActions('development', person)}>Metas do PDI</button>
                    <button type="button" className={button} onClick={() => careerActions('salary', person)}>Cargos e salários</button>
                  </div>}
                </div>
              )}
            </div>
            {person && confidential && <CareerReview key={JSON.stringify([company, person.id])}
              db={db} company={company} uid={uid} person={person} roles={roles} activities={reviewActivities} today={today} />}
            </>
          ) : (
            <div className={panel}>
              <div className="flex flex-wrap gap-2">
                {filters.map(([id, label, match]) => (
                  <button
                    key={id}
                    aria-pressed={period === id}
                    className={period === id ? primary : button}
                    onClick={() => setPeriod(id)}
                  >
                    {label} · {loading ? '…' : pendingOfKind.filter(match).length}
                  </button>
                ))}
              </div>
              <Field label="Tipo de acompanhamento">
                <select className={control} value={kind} onChange={(e) => setKind(e.target.value)}>
                  <option value="">Todos os tipos</option>
                  {Object.entries(personnelKinds)
                    .filter(([, v]) => !v.private || confidential)
                    .map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                </select>
              </Field>
            </div>
          )}
          {(common.error || restricted.error) && <p role="alert">{common.error || restricted.error}</p>}
          {loading && <p role="status">Consultando registros…</p>}
          {(view === 'file' || !confidential || !showReviewQueue) && !loading && !common.error && !restricted.error && !visible.length && (
            <p className={panel}>
              {view === 'file' && !person
                ? 'Selecione uma pessoa para consultar a ficha.'
                : 'Nenhum acompanhamento nesta seleção.'}
            </p>
          )}
          {(view === 'file' || !confidential || !showReviewQueue) && visible.map((row) => (
            <article className={panel} key={row.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-blue-800">
                    {personnelKinds[row.kind].label} · {row.status}
                  </p>
                  <h3 className="font-bold">{row.title}</h3>
                  <button
                    className="text-sm text-blue-800 underline"
                    onClick={() => openFile(row.employeeId)}
                  >
                    {row.employeeName}
                  </button>
                  <p className="mt-1 text-sm">
                    Responsável: {people.get(row.owner)?.name || row.owner} · Prazo:{' '}
                    {displayDay(pendingDate(row) || row.due)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className={button} onClick={() => setHistory(history === row.id ? '' : row.id)}>
                    Histórico
                  </button>
                  <button
                    className={button}
                    onClick={() => {
                      setMessage('');
                      setDraft(row);
                    }}
                  >
                    Atualizar
                  </button>
                </div>
              </div>
              {history === row.id && <CaseHistory db={db} company={company} row={row} employees={options} />}
            </article>
          ))}
        </>
      )}
    </section>
  );
}
