import { Users } from 'lucide-react';

const sections = [
  { id: 'dpi', label: 'PDI e desempenho', views: ['dpi', 'development'] },
  { id: 'roles', label: 'Cargos e salários', views: ['roles', 'salary'] },
  { id: 'hr-pending', label: 'Rotinas do RH', views: ['hr-pending', 'hr-action', 'hr-file'] },
];

const menu = [
  { id: 'overview', label: 'Visão da equipe' },
  { id: 'employees', label: 'Colaboradores' },
  sections[0],
  sections[1],
  { id: 'headcount', label: 'Quadro por setor' },
  { id: 'sectors', label: 'Setores' },
  sections[2],
];

export default function TeamManagementNavigation({ view, salaryView, admin, confidential, personnel, onNavigate }) {
  const items = admin ? menu.filter(item =>
    (item.id !== 'dpi' || confidential) && (item.id !== 'hr-pending' || personnel)) : [
    sections[2],
    ...(confidential ? [sections[0], { id: 'salary', label: 'Cargos e salários' }, { id: 'managers', label: 'Gerência por setor' }] : []),
  ];
  const subitems = ['dpi', 'development'].includes(view)
    ? [['dpi', 'Indicadores'], ['development', 'Metas e feedback']]
    : confidential && ['roles', 'salary'].includes(view)
      ? [
        ...(admin ? [['roles', 'Cadastro de cargos']] : []),
        ['matrix', 'Matriz salarial'], ['hierarchy', 'Hierarquia'], ['compensation', 'Reajustes individuais'],
      ] : [];
  const selectedView = view === 'salary' ? salaryView : view;
  return (
    <header data-tour="management" className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900"><Users aria-hidden="true" className="h-5 w-5 text-blue-700" /> Gestão de Equipes</h2>
      <nav aria-label="Gestão de Equipes" className="flex flex-wrap gap-1">
        {items.map(item => {
          const selected = item.views?.includes(view) || item.id === view;
          return <button key={item.id} type="button" aria-current={selected ? 'page' : undefined}
            className={`min-h-10 rounded-lg px-3 text-xs font-bold ${selected ? 'bg-blue-700 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
            onClick={() => onNavigate(item.id)}>{item.label}</button>;
        })}
      </nav>
      {subitems.length > 0 && <nav aria-label="Ferramentas da seção" className="flex flex-wrap gap-1 border-t border-slate-100 pt-2">
        {subitems.map(([id, label]) => <button key={id} type="button" aria-pressed={selectedView === id}
          className="min-h-9 rounded-lg px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 aria-pressed:bg-blue-50 aria-pressed:text-blue-800"
          onClick={() => onNavigate(id)}>{label}</button>)}
      </nav>}
    </header>
  );
}
