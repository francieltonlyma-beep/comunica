import { useEffect, useRef, useState } from 'react';
import { accountKey, employeeAccount } from './savedAccounts.js';
import { filterLoginEmployees, loginDirectoryUsers } from './loginDirectory.js';
import { loginErrorMessage } from './loginError.js';

export default function SwitchUserDialog({ accounts, currentUserId, company, publicComputer, loadDirectory, onClose, onSwitch }) {
  const dialogRef = useRef(null);
  const inFlight = useRef(false);
  const [selected, setSelected] = useState(null);
  const [directory, setDirectory] = useState(null);
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');
  const [pin, setPin] = useState('');
  const [remember, setRemember] = useState(!publicComputer);
  const [error, setError] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  const select = account => {
    setSelected(account);
    setPin('');
    setError('');
  };

  const addAccount = async () => {
    setAdding(true);
    select(null);
    if (directory) return;
    setLoading(true);
    try {
      const result = await loadDirectory(company.code);
      const source = { code: company.code, companyId: result.company.id, users: result.users };
      setDirectory(loginDirectoryUsers(source, company, company.code).filter(user => user.id !== currentUserId));
    } catch (problem) {
      setError(loginErrorMessage(problem));
    } finally {
      setLoading(false);
    }
  };

  const submit = async event => {
    event.preventDefault();
    if (inFlight.current || !selected || !/^\d{4}$/.test(pin)) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    try {
      await onSwitch(selected, pin, remember);
    } catch (problem) {
      setPin('');
      setError(problem?.code === 'switch/browser-push' ? problem.message : loginErrorMessage(problem));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  const visible = adding && !selected && directory ? filterLoginEmployees(directory, query) : [];
  const accountButton = account => (
    <button key={accountKey(account)} type="button" onClick={() => select(account)}
      className="block w-full rounded-xl border border-slate-200 px-3 py-2 text-left hover:bg-blue-50 focus-visible:outline-blue-700">
      <span className="block font-semibold">{account.name}</span>
      <span className="text-xs text-slate-600">{account.companyName}</span>
    </button>
  );

  return (
    <dialog ref={dialogRef} aria-labelledby="switch-user-title" onCancel={event => {
      event.preventDefault();
      if (!inFlight.current) onClose();
    }} className="m-auto max-h-[85dvh] w-[min(94vw,26rem)] overflow-auto rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-900 shadow-2xl backdrop:bg-slate-950/60">
      <h2 id="switch-user-title" className="text-lg font-extrabold">Trocar usuário</h2>
      {selected ? (
        <form className="mt-4 space-y-3" onSubmit={submit}>
          <p>Entrar como <strong>{selected.name}</strong> · {selected.companyName}</p>
          <label className="block font-semibold" htmlFor="switch-user-pin">PIN de acesso</label>
          <input key={accountKey(selected)} autoFocus id="switch-user-pin" type="password" inputMode="numeric" autoComplete="off"
            required pattern="[0-9]{4}" maxLength={4} disabled={busy} value={pin}
            onChange={event => { setPin(event.target.value.replace(/\D/g, '')); setError(''); }}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 tracking-widest" />
          {publicComputer && <label className="flex items-center gap-2">
            <input type="checkbox" checked={remember} disabled={busy} onChange={event => setRemember(event.target.checked)} />
            Lembrar contas e manter a sessão conectada neste navegador
          </label>}
          {error && <p role="alert" className="text-rose-700">{error}</p>}
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button type="button" disabled={busy} onClick={() => select(null)} className="rounded-xl px-3 py-2 font-semibold">Voltar</button>
            <button type="submit" disabled={busy || pin.length !== 4} className="rounded-xl bg-blue-700 px-4 py-2 font-bold text-white disabled:opacity-50">{busy ? 'Validando…' : 'Entrar'}</button>
          </div>
        </form>
      ) : (
        <div className="mt-4 space-y-3">
          {adding ? <>
            <label htmlFor="switch-user-search" className="block font-semibold">Colaborador de {company.name || company.code}</label>
            <input id="switch-user-search" type="search" value={query} placeholder="Buscar pelo nome" onChange={event => setQuery(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2" />
            {loading && <p role="status">Carregando colaboradores…</p>}
            {directory && visible.length === 0 && <p>Nenhum colaborador encontrado.</p>}
            <div className="max-h-60 space-y-2 overflow-auto">{visible.map(person => employeeAccount(company, person)).filter(Boolean).map(accountButton)}</div>
            {error && <><p role="alert" className="text-rose-700">{error}</p><button type="button" onClick={addAccount} className="font-semibold text-blue-700">Tentar novamente</button></>}
          </> : <>
            {accounts.length > 0 && <div className="max-h-60 space-y-2 overflow-auto">{accounts.map(accountButton)}</div>}
            <button type="button" onClick={addAccount} className="font-semibold text-blue-700">{accounts.length ? 'Entrar com outra conta da empresa' : 'Escolher colaborador da empresa'}</button>
          </>}
          <div className="flex justify-end gap-2 pt-2">
            {adding && !loading && <button type="button" onClick={() => { setAdding(false); setError(''); }} className="rounded-xl px-3 py-2 font-semibold">Voltar</button>}
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-300 px-3 py-2 font-semibold">Cancelar</button>
          </div>
        </div>
      )}
    </dialog>
  );
}
