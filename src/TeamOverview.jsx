export default function TeamOverview({
  employeeViews, peopleOverview, peopleAttentionList, activeSectorCounts, openEmployeeList, openPersonnel,
  openPerformance, employeeAccessLabel, getUserDepts, handleEditUser,
}) {
  const largestSectors = [...activeSectorCounts].sort((a, b) => b.count - a.count).slice(0, 5);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-extrabold text-slate-900">Visão da equipe</h3>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          {openPersonnel && <button type="button" className="rounded-lg border bg-white px-3 py-2 text-blue-800" onClick={openPersonnel}>Pendências do RH</button>}
          {openPerformance && <button type="button" className="rounded-lg border bg-white px-3 py-2 text-blue-800" onClick={openPerformance}>Indicadores de atividades</button>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Object.entries(employeeViews).map(([key, [label]]) => (
          <button key={key} type="button" onClick={() => openEmployeeList({attention: key})}
            className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500">
            <span className="block text-xs font-semibold text-slate-600">{label}</span>
            <strong className="mt-1 block text-2xl tabular-nums text-slate-900">{peopleOverview[key]}</strong>
          </button>
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-[1.25fr_.75fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="text-sm font-extrabold text-slate-800">Cadastros que precisam de atenção</h4>
            <button type="button" onClick={() => openEmployeeList()} className="rounded-lg border px-3 py-2 text-xs font-bold text-blue-800">Abrir colaboradores</button>
          </div>
          <ul className="mt-2 divide-y divide-slate-100">
            {peopleAttentionList.slice(0, 6).map(user => {
              const pending = [
                !employeeAccessLabel(user.lastLoginAt) && 'Primeiro acesso pendente',
                !user.role && 'Cargo pendente',
                !getUserDepts(user).length && 'Setor pendente',
              ].filter(Boolean);
              return <li key={user.id} className="flex items-center justify-between gap-2 py-2.5">
                <div className="min-w-0">
                  <strong className="block break-words text-sm text-slate-800">{user.name}</strong>
                  <span className="text-xs text-slate-600">{pending.join(' · ')}</span>
                </div>
                <button type="button" onClick={() => handleEditUser(user)} className="rounded-lg px-2 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-50">Editar</button>
              </li>;
            })}
          </ul>
          {!peopleAttentionList.length && <p className="mt-3 text-xs text-slate-600">Nenhuma pendência de cadastro.</p>}
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h4 className="text-sm font-extrabold text-slate-800">Distribuição da equipe</h4>
          <div className="mt-2 space-y-1">
            {largestSectors.map(sector => (
              <button type="button" key={sector.id} onClick={() => openEmployeeList({sector: sector.id, attention: 'active'})}
                className="block w-full rounded-lg px-2 py-2 text-left hover:bg-slate-50">
                <span className="flex justify-between gap-2 text-xs font-semibold text-slate-700"><span>{sector.name}</span><span>{sector.count}</span></span>
                <span aria-hidden="true" className="mt-1.5 block h-2 overflow-hidden rounded-full bg-slate-100">
                  <span className="block h-full rounded-full bg-[var(--comunica-chart-series)]" style={{width: `${peopleOverview.active ? Math.round(sector.count / peopleOverview.active * 100) : 0}%`}} />
                </span>
              </button>
            ))}
          </div>
          {!largestSectors.length && <p className="mt-3 text-xs text-slate-600">Cadastre setores para acompanhar a distribuição.</p>}
        </section>
      </div>
    </div>
  );
}
