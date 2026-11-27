import { useState } from 'react';
import { Search } from 'lucide-react';
import { normalizeSearch } from '../functions/src/procurement.mjs';

export default function EmployeeChecklist({ title, employees, value, onChange, disabled = false }) {
  const [search, setSearch] = useState('');
  const [selectedOnly, setSelectedOnly] = useState(false);
  const words = normalizeSearch(search).trim().split(/\s+/);
  const visible = employees.filter(person => {
    const text = normalizeSearch(`${person.name || person.email || person.id} ${person.role || ''}`);
    return (!selectedOnly || value.includes(person.id)) && words.every(word => text.includes(word));
  }).sort((a, b) => String(a.name || a.email || a.id).localeCompare(String(b.name || b.email || b.id), 'pt-BR', { sensitivity: 'base' }));

  return (
    <fieldset className="min-w-0 space-y-2 rounded-xl border border-slate-200 p-3 text-xs" disabled={disabled}>
      <legend className="px-1 font-bold">{title}</legend>
      <div className="flex flex-wrap gap-2">
        <label className="relative min-w-36 flex-1">
          <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-3 top-3" />
          <input type="search" value={search} onChange={event => setSearch(event.target.value)}
            onKeyDown={event => { if (event.key === 'Enter') event.preventDefault(); }}
            aria-label={`Buscar em ${title}`} placeholder="Buscar por nome ou cargo"
            className="min-h-10 w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-2" />
        </label>
        <button type="button" aria-pressed={selectedOnly} onClick={() => setSelectedOnly(previous => !previous)}
          className="min-h-10 rounded-lg border border-slate-200 px-3 aria-pressed:border-blue-600 aria-pressed:bg-blue-50">
          Selecionados ({value.length})
        </button>
      </div>
      <div className="max-h-52 space-y-1 overflow-y-auto overscroll-contain">
        {visible.map(person => (
          <label key={person.id} className="flex min-h-10 cursor-pointer items-center gap-3 rounded-lg px-2 py-1 hover:bg-slate-50">
            <input type="checkbox" checked={value.includes(person.id)}
              onChange={event => onChange(event.target.checked ? [...value, person.id] : value.filter(id => id !== person.id))} />
            <span className="min-w-0 break-words">
              {person.name || person.email || person.id}
              {person.role && <small className="block text-slate-500">{person.role}</small>}
            </span>
          </label>
        ))}
        {!visible.length && <p className="p-2" role="status">Nenhum colaborador encontrado.</p>}
      </div>
    </fieldset>
  );
}
