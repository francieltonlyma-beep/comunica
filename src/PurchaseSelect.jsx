import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search } from 'lucide-react';
import './PurchaseSelect.css';

const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();

function popupPosition(element) {
    const rect = element.getBoundingClientRect();
    const viewport = window.visualViewport;
    const viewportHeight = viewport?.height || window.innerHeight;
    const viewportWidth = viewport?.width || window.innerWidth;
    const below = viewportHeight - rect.bottom - 12;
    const above = rect.top - 12;
    const height = Math.min(340, Math.max(below, above), viewportHeight - 16);
    const width = Math.min(Math.max(rect.width, 240), viewportWidth - 16);
    return { left: Math.max(8, Math.min(rect.left, viewportWidth - width - 8)), width,
      top: below >= Math.min(240, height) ? rect.bottom + 6 : Math.max(8, rect.top - height - 6), maxHeight: Math.max(120, height) };
}

export default function PurchaseSelect({ label, value: controlledValue, name, options = [], pinnedOptions = [], onChange, disabled = false, required = false, placeholder = 'Selecione...', searchPlaceholder, clearable = !pinnedOptions.length, sort = true }) {
  const [internalValue, setInternalValue] = useState('');
  const value = String(controlledValue ?? internalValue);
  const id = useId();
  const trigger = useRef(null);
  const popup = useRef(null);
  const searchInput = useRef(null);
  const activeOption = useRef(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState(0);
  const [position, setPosition] = useState({});
  const [popupHost,setPopupHost] = useState(null);
  const entries = options.map(([key, text]) => [String(key ?? ''), text]);
  const pinned = pinnedOptions.map(([key, text]) => [String(key), text]);
  const choices = [...new Map(entries.filter(([key]) => key !== '').map(option => [option[0], option])).values()];
  const ordered = sort ? [...choices].sort((a, b) => String(a[1]).localeCompare(String(b[1]), 'pt-BR', { sensitivity: 'base', numeric: true })) : choices;
  const words = normalize(search).split(/\s+/);
  const matches = [...pinned, ...ordered].filter(([, text]) => words.every(word => normalize(text).includes(word)));
  const selected = [...pinned, ...entries].find(([key]) => key === value);
  const emptyLabel = entries.find(([key]) => key === '')?.[1] || placeholder;

  function close(restoreFocus = false) {
    setOpen(false);
    if (restoreFocus) trigger.current?.focus();
  }
  function show() {
    setPopupHost(trigger.current?.closest('[role="dialog"]') || document.body);
    setPosition(popupPosition(trigger.current));
    setSearch(''); setActive(0); setOpen(true);
  }
  function choose(key) {
    if (controlledValue === undefined) setInternalValue(key);
    onChange?.(key);
    close(true);
  }

  useEffect(() => {
    if (!open) return undefined;
    const dismiss = event => { if (!popup.current?.contains(event.target) && !trigger.current?.contains(event.target)) setOpen(false); };
    searchInput.current?.focus({ preventScroll: true });
    const reposition = event => {
      if (!trigger.current || popup.current?.contains(event.target)) return;
      const bounds = trigger.current.getBoundingClientRect();
      const height = window.visualViewport?.height || window.innerHeight;
      if (bounds.bottom <= 0 || bounds.top >= height) setOpen(false);
      else setPosition(popupPosition(trigger.current));
    };
    document.addEventListener('pointerdown', dismiss);
    window.addEventListener('scroll', reposition, true);
    const resize = () => { if (trigger.current) setPosition(popupPosition(trigger.current)); };
    window.addEventListener('resize', resize);
    window.visualViewport?.addEventListener('resize', resize);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', resize);
      window.visualViewport?.removeEventListener('resize', resize);
    };
  }, [open]);
  useEffect(() => {
    const option = activeOption.current;
    const list = option?.parentElement;
    if (!list) return;
    const bounds = list.getBoundingClientRect();
    const row = option.getBoundingClientRect();
    if (row.top < bounds.top) list.scrollTop -= bounds.top - row.top;
    if (row.bottom > bounds.bottom) list.scrollTop += row.bottom - bounds.bottom;
  }, [active, open, search]);

  function navigate(event) {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); }
    if (event.key === 'Tab') close(true);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setActive(previous => Math.max(0, Math.min(matches.length - 1, previous + (event.key === 'ArrowDown' ? 1 : -1))));
    }
    if (event.key === 'Enter') { event.preventDefault(); if (matches[active]) choose(matches[active][0]); }
  }

  return <div className="purchase-select">
    <button ref={trigger} type="button" className="purchase-select-trigger" disabled={disabled} aria-label={`${label}: ${selected?.[1] || emptyLabel}`}
      aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? `${id}-list` : undefined}
      onClick={() => open ? close() : show()} onKeyDown={event => { if (['ArrowDown','ArrowUp'].includes(event.key)) { event.preventDefault(); show(); } }}>
      <span>{selected?.[1] || (value ? 'Seleção indisponível' : emptyLabel)}</span><ChevronDown size={15} aria-hidden="true" />
    </button>
    {(required || name) && <input name={name} className="purchase-select-validation" aria-hidden="true" aria-label={label} tabIndex={-1} value={value} required={required} disabled={disabled} onChange={() => {}} onInvalid={event => { event.preventDefault(); trigger.current?.focus(); show(); }} />}
    {open && !disabled && createPortal(<div ref={popup} className="purchase-select-popup" data-dialog-popup style={position}>
      <div className="purchase-select-search"><Search size={16} aria-hidden="true" /><input ref={searchInput} role="combobox" aria-expanded="true" aria-autocomplete="list" aria-controls={`${id}-list`}
        aria-activedescendant={matches[active] ? `${id}-option-${active}` : undefined} aria-label={`Pesquisar em ${label}`} placeholder={searchPlaceholder || `Pesquisar ${label.toLocaleLowerCase('pt-BR')}...`}
        value={search} onChange={event => { event.stopPropagation(); setSearch(event.target.value); setActive(0); }} onKeyDown={navigate} /></div>
      <div className="purchase-select-meta" aria-live="polite">{matches.length} opções encontradas</div>
      {!required && clearable && <button type="button" className="purchase-select-clear" onClick={() => choose('')}>{emptyLabel}</button>}
      <div id={`${id}-list`} role="listbox" aria-label={label} className="purchase-select-options">
        {matches.map(([key, text], index) => <div key={key} id={`${id}-option-${index}`} role="option" aria-selected={key === value}
          ref={index === active ? activeOption : undefined} className={index === active ? 'purchase-select-active' : ''}
          onPointerMove={() => setActive(index)} onMouseDown={event => event.preventDefault()} onClick={() => choose(key)}>{text}</div>)}
        {matches.length === 0 && <p className="purchase-select-empty">Nenhuma opção encontrada. Tente outro nome.</p>}
      </div>
    </div>, popupHost || document.body)}
  </div>;
}
