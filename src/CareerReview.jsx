import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { completeMonths, salaryPosition, timelyDeliveries } from './careerReview.js';
import { displayDay, isInactiveEmployee } from './personnelModel.js';
import { roleNameKey } from './roleCatalog.js';

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const root = company => ['artifacts', 'comunica-salvador', 'public', 'data', 'companies', company];
const unknown = 'A confirmar';
const threshold = value => value !== '' && value != null && Number.isFinite(Number(value)) ? Number(value) : null;

export default function CareerReview({ db, company, person, roles, activities, today }) {
  const catalog = roles.filter(role => !role.mergedIntoRoleId);
  const candidates = catalog.filter(role => person.role && roleNameKey(role.name) === roleNameKey(person.role));
  const role = catalog.find(item => item.id === person.roleId) || (candidates.length === 1 ? candidates[0] : null);
  const roleId = role?.id;
  const [matrix, setMatrix] = useState(null);
  const [payroll, setPayroll] = useState(null);
  const [goals, setGoals] = useState(null);

  useEffect(() => {
    if (!roleId) return undefined;
    const id = roleId;
    return onSnapshot(doc(db, ...root(company), 'salaryPlans', id),
      snapshot => setMatrix({ id, plan: snapshot.data()?.plan }),
      () => setMatrix({ id, error: true }));
  }, [db, company, roleId]);

  useEffect(() => onSnapshot(query(collection(db, ...root(company), 'salaryChanges'), where('person', '==', person.id)),
    snapshot => setPayroll({ records: snapshot.docs.map(item => item.data()) }),
    () => setPayroll({ error: true })), [db, company, person.id]);

  useEffect(() => onSnapshot(collection(db, ...root(company), 'development', person.id, 'goals'),
    snapshot => setGoals({ records: snapshot.docs.map(item => item.data()) }),
    () => setGoals({ error: true })), [db, company, person.id]);

  const matchingMatrix = role && matrix?.id === role.id ? matrix : null;
  const savedPlan = matchingMatrix?.plan;
  const plan = savedPlan && savedPlan.active !== false && savedPlan.effective <= today ? savedPlan : null;
  const pay = payroll?.records?.filter(item => item.effective <= today).sort((a, b) => b.effective.localeCompare(a.effective))[0];
  const months = completeMonths(person.hireDate, today);
  const delivery = timelyDeliveries(activities, person.id, today);
  const next = goals?.records?.filter(goal => goal.status === 'active' && goal.nextStep)
    .sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999'))[0];
  const feedback = goals?.records?.filter(goal => goal.feedback)
    .sort((a, b) => (b.feedbackAt?.toMillis() || 0) - (a.feedbackAt?.toMillis() || 0))[0];
  const pending = !payroll || !goals || Boolean(role && !matchingMatrix);
  const error = payroll?.error || goals?.error || matchingMatrix?.error;
  const minimumMonths = threshold(plan?.months);
  const minimumScore = threshold(plan?.score);
  const missing = [
    !role && 'vínculo com um cargo do catálogo',
    role && !plan && !matchingMatrix?.error && 'plano salarial vigente',
    !pay && !payroll?.error && 'salário individual vigente',
    months === null && 'data de admissão',
    plan && minimumMonths === null && 'tempo mínimo no plano',
    plan && minimumScore === null && 'desempenho mínimo no plano',
    !delivery && (activities ? 'atividades concluídas com prazo nos últimos 90 dias' : 'indicadores com um administrador'),
  ].filter(Boolean);
  const meetsTime = minimumMonths !== null && months !== null && months >= minimumMonths;
  const meetsScore = minimumScore !== null && delivery && 100 * delivery.onTime >= minimumScore * delivery.total;
  const inactive = isInactiveEmployee(person, today);

  return <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
    <h3 className="text-lg font-bold">Revisão de carreira</h3>
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[
        ['Cargo', role?.name || person.role || unknown],
        ['Salário vigente', pay ? money.format(pay.amount) : unknown],
        ['Faixa pelo valor vigente', salaryPosition(pay, plan)],
        ['Tempo de casa', months === null ? unknown : `${months} meses completos`],
      ].map(([label, value]) => <div key={label} className="rounded-lg bg-slate-50 p-3">
        <dt className="text-xs text-slate-600">{label}</dt><dd className="mt-1 break-words text-sm font-semibold">{value}</dd>
      </div>)}
    </dl>
    <div className="rounded-xl border border-slate-200 p-3">
      <h4 className="font-semibold">Critérios para avaliar</h4>
      <ul className="mt-1 space-y-1 text-sm">
        {minimumMonths !== null && <li>Tempo de casa mínimo de {minimumMonths} meses · {months === null ? unknown : meetsTime ? 'Atendido' : 'Abaixo do mínimo'}</li>}
        <li>Entregas no prazo nos últimos 90 dias · {delivery ? `${delivery.onTime} de ${delivery.total} (${(100 * delivery.onTime / delivery.total).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%)` : 'Sem dados disponíveis'}</li>
        {minimumScore !== null && <li>Mínimo de entregas no prazo definido no plano · {minimumScore}% · {delivery ? (meetsScore ? 'Atendido' : 'Abaixo do mínimo') : unknown}</li>}
      </ul>
      {pending ? <p role="status" className="mt-2 text-sm">Consultando dados da carreira…</p> :
        error ? <p role="alert" className="mt-2 text-sm text-rose-700">Parte dos dados está indisponível. Reabra a ficha para tentar novamente.</p> :
        inactive ? <p className="mt-2 text-sm font-semibold">Vínculo inativo</p> :
        missing.length ? <p className="mt-2 text-sm">Para avaliar, confira {missing.join(', ')}.</p> :
        <p className="mt-2 text-sm font-semibold text-blue-800">{meetsTime && meetsScore ? 'Pronto para avaliação do RH' : 'Há critérios abaixo do mínimo'}</p>}
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      <div><h4 className="text-sm font-semibold">Metas concluídas</h4><p className="text-sm">{goals?.records ? goals.records.filter(goal => goal.status === 'done').length : unknown}</p></div>
      <div><h4 className="text-sm font-semibold">Próximo passo do PDI</h4><p className="whitespace-pre-wrap break-words text-sm">{next ? `${next.title} · ${next.nextStep}${next.due ? ' · ' + displayDay(next.due) : ''}` : 'Nenhum passo registrado'}</p></div>
      <div className="sm:col-span-2"><h4 className="text-sm font-semibold">Último feedback</h4><p className="whitespace-pre-wrap break-words text-sm">{feedback?.feedback || 'Nenhum feedback registrado'}</p></div>
    </div>
  </section>;
}
