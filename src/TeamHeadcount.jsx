export default function TeamHeadcount({
  employment, headcountMetrics, headcountRows, headcountVisibleEmployees, departmentsList, mgmtSectorFilter, setMgmtSectorFilter,
  headcountDrafts, setHeadcountDrafts, savingHeadcountKey, handleSaveHeadcount, canOpenCareers, openRoleRecruitment,
  openEmployeeList, openRoleCatalog,
}) {
  if (employment.error || employment.loading) return <p role="status">{employment.error || 'Consultando vínculos efetivos…'}</p>;
  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-200">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 to-blue-950 p-6 text-white shadow-sm">
        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-200">Planejamento de pessoas</span>
        <h3 className="mt-1 text-xl font-black">Composição do quadro por setor</h3>
        <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-300">Compare o quadro previsto com os vínculos efetivos do setor. As vagas de recrutamento são exibidas por cargo na empresa.</p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div><label htmlFor="headcount-sector-filter" className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Setor analisado</label><select id="headcount-sector-filter" value={mgmtSectorFilter} onChange={event => setMgmtSectorFilter(event.target.value)} className="mt-1.5 min-w-56 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"><option value="all">Todos os setores</option>{departmentsList.map(department => <option key={department.id} value={department.id}>{department.name}</option>)}</select></div>
        <p className="max-w-xl text-[10px] leading-4 text-slate-500">Sem um quadro previsto, o cargo fica como <strong>não planejado</strong> e não entra no cálculo de vagas ou excedentes. Um colaborador vinculado a mais de um setor conta em cada vínculo correspondente.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4"><span className="text-[9px] font-black uppercase tracking-wide text-blue-700">Pessoas únicas</span><strong className="mt-1 block text-2xl font-black text-blue-950">{headcountVisibleEmployees.length}</strong><span className="text-[10px] text-blue-700">nos setores selecionados</span></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><span className="text-[9px] font-black uppercase tracking-wide text-slate-500">Quadro planejado</span><strong className="mt-1 block text-2xl font-black text-slate-900">{headcountMetrics.planned}</strong><span className="text-[10px] text-slate-500">em {headcountMetrics.configuredRoles} cargo(s) configurado(s)</span></div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4"><span className="text-[9px] font-black uppercase tracking-wide text-amber-700">Vagas do quadro</span><strong className="mt-1 block text-2xl font-black text-amber-950">{headcountMetrics.vacancies}</strong><span className="text-[10px] text-amber-700">posições sem ocupante</span></div>
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4"><span className="text-[9px] font-black uppercase tracking-wide text-rose-700">Acima do previsto</span><strong className="mt-1 block text-2xl font-black text-rose-950">{headcountMetrics.excess}</strong><span className="text-[10px] text-rose-700">vínculos além do quadro</span></div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4"><h4 className="text-sm font-extrabold text-slate-800">Quadro previsto e composição atual</h4><p className="mt-1 text-[10px] text-slate-500">Cadastre o número previsto para cada combinação de cargo e setor. Use 0 para indicar que não há posição prevista.</p></div>
        <div className="overflow-x-auto">
          <table className="team-headcount-table w-full text-left text-xs lg:min-w-[880px]">
            <thead className="bg-slate-50 text-[9px] font-black uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Setor</th><th className="px-4 py-3">Cargo</th><th className="px-4 py-3 text-center">Atual</th><th className="px-4 py-3 text-center">Previsto</th><th className="px-4 py-3 text-center">Vagas do quadro</th><th className="px-4 py-3 text-center">Excedente</th><th className="px-4 py-3 text-center">Vagas abertas do cargo</th><th className="px-5 py-3 text-right">Ação</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {headcountRows.map(row => {
                const value = headcountDrafts[row.key] ?? (row.planned === null ? '' : String(row.planned));
                const isDirty = value !== (row.planned === null ? '' : String(row.planned));
                return <tr key={row.key} className="hover:bg-slate-50/70">
                  <td data-label="Setor" className="px-5 py-3 font-semibold text-slate-700">{row.department.name}</td>
                  <td data-label="Cargo" className="px-4 py-3"><strong className="text-slate-800">{row.role.name}</strong><span className={`ml-2 rounded-full px-2 py-0.5 text-[9px] font-bold ${row.configured ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{row.configured ? 'Planejado' : 'Não planejado'}</span></td>
                  <td data-label="Vínculos atuais" className="px-4 py-3 text-center font-bold text-slate-700">
                    {row.current ? <button type="button" className="font-bold text-blue-700 underline"
                      aria-label={`Ver ${row.current} ocupantes de ${row.role.name} em ${row.department.name}`}
                      onClick={() => openEmployeeList({ occupants: row.occupants.map(user => user.id) })}>{row.current}</button> : 0}
                  </td>
                  <td data-label="Previsto" className="px-4 py-3 text-center"><input aria-label={`Quadro previsto para ${row.role.name} em ${row.department.name}`} type="number" min="0" max="10000" step="1" value={value} onChange={event => setHeadcountDrafts(previous => ({ ...previous, [row.key]: event.target.value }))} placeholder="Definir" className="w-24 rounded-lg border border-slate-200 px-2 py-1.5 text-center text-xs font-semibold outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /></td>
                  <td data-label="Vagas" className="px-4 py-3 text-center">{row.configured ? <span className={`font-black ${row.vacancies ? 'text-amber-700' : 'text-slate-400'}`}>{row.vacancies}</span> : <span className="text-slate-300">—</span>}</td>
                  <td data-label="Excedente" className="px-4 py-3 text-center">{row.configured ? <span className={`font-black ${row.excess ? 'text-rose-700' : 'text-slate-400'}`}>{row.excess}</span> : <span className="text-slate-300">—</span>}</td>
                  <td data-label="Vagas abertas do cargo" className="px-4 py-3 text-center">
                    {canOpenCareers && row.activeRecruitment > 0
                      ? <button type="button" onClick={() => openRoleRecruitment(row.role)} className="font-bold text-blue-800 underline" aria-label={`Ver vagas abertas de ${row.role.name} na empresa`}>{row.activeRecruitment}</button>
                      : row.activeRecruitment}
                  </td>
                  <td data-label="Ações" className="px-5 py-3 text-right"><button type="button" disabled={!isDirty || savingHeadcountKey === row.key} onClick={() => handleSaveHeadcount(row)} className="rounded-lg bg-slate-900 px-3 py-2 text-[10px] font-bold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400">{savingHeadcountKey === row.key ? 'Salvando…' : 'Salvar'}</button></td>
                </tr>;
              })}
              {!headcountRows.length && <tr><td colSpan="8" className="px-5 py-12 text-center"><strong className="block text-xs text-slate-700">Nenhum cargo vinculado a este setor</strong><span className="mt-1 block text-[10px] text-slate-500">Cadastre um cargo e associe-o ao setor para planejar o quadro.</span><button type="button" onClick={openRoleCatalog} className="mt-3 rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-bold text-blue-700 hover:bg-blue-50">Abrir cargos</button></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
