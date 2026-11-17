import { useState } from 'react';
import { normalizeSearch } from '../functions/src/procurement.mjs';

export default function PurchasePeoplePicker({ title, users, value = [], onChange }) {
  const [search, setSearch] = useState('');
  const [selectedOnly, setSelectedOnly] = useState(false);
  const visible = users.filter(person => (!selectedOnly || value.includes(person.id)) && normalizeSearch(`${person.name} ${person.role || ''}`).includes(normalizeSearch(search))).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  return <details className="pm-people-picker"><summary><strong>{title}</strong><span>{value.length ? `${value.length} selecionado(s)` : 'Todos autorizados'}</span></summary>
    <p className="pm-hint">{value.length ? 'Apenas as pessoas selecionadas poderão exercer este papel.' : 'Sem seleção, todos os colaboradores autorizados da empresa podem exercer este papel.'}</p>
    <div className="pm-people-tools"><input aria-label={`Buscar em ${title}`} placeholder="Buscar nome ou função" value={search} onChange={event => setSearch(event.target.value)} /><button type="button" aria-pressed={selectedOnly} onClick={() => setSelectedOnly(previous => !previous)}>Selecionados ({value.length})</button><button type="button" onClick={() => onChange([])}>Permitir todos</button></div>
    <div className="pm-people-list">{visible.map(person => <label key={person.id}><input type="checkbox" checked={value.includes(person.id)} onChange={event => onChange(event.target.checked ? [...value, person.id] : value.filter(id => id !== person.id))} /><span>{person.name}{person.role && <small>{person.role}</small>}</span></label>)}{!visible.length && <p>Nenhum colaborador com este filtro.</p>}</div>
  </details>;
}
