import { useId, useState } from 'react';
import { normalizeSearch } from '../functions/src/procurement.mjs';

// Inline suggestions stay beside the field when the mobile keyboard opens.
export default function PurchaseAutocomplete({ label, value = '', options = [], onChange, onSelect, disabled = false, required = false, placeholder = 'Digite para buscar...', emptyMessage }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const matches = options.filter(option => normalizeSearch(`${option.label} ${option.detail || ''}`).includes(normalizeSearch(value))).slice(0, 30);
  const choose = option => { onSelect ? onSelect(option) : onChange(option.label); setOpen(false); };
  return <div className="pm-autocomplete" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <input aria-label={label} role="combobox" aria-autocomplete="list" aria-expanded={open && !disabled} aria-controls={open ? `${id}-list` : undefined} aria-activedescendant={open && matches[active] ? `${id}-${active}` : undefined}
      value={value} disabled={disabled} required={required} placeholder={placeholder} autoComplete="off"
      onFocus={() => setOpen(true)} onChange={event => { onChange(event.target.value); setActive(0); setOpen(true); }}
      onKeyDown={event => {
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setOpen(false); }
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setOpen(true); setActive(index => Math.max(0, Math.min(matches.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)))); }
        if (event.key === 'Enter' && open) { event.preventDefault(); if (matches[active]) choose(matches[active]); }
      }} />
    {open && !disabled && <div id={`${id}-list`} role="listbox" aria-label={`Sugestões de ${label}`} className="pm-suggestions">
      {matches.map((option, index) => <button type="button" role="option" aria-selected={active === index} id={`${id}-${index}`} key={option.id} onMouseDown={event => event.preventDefault()} onClick={() => choose(option)}><strong>{option.label}</strong>{option.detail && <small>{option.detail}</small>}</button>)}
      {!matches.length && <p>{emptyMessage || `Nenhum cadastro encontrado. ${options.length ? 'Tente outro nome ou código.' : 'Cadastre para receber sugestões.'}`}</p>}
    </div>}
  </div>;
}
