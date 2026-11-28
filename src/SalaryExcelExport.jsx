import { useEffect, useRef, useState } from 'react';
import { collection, getDocsFromServer } from 'firebase/firestore';
import { salaryExcelOptions, salaryWorkbook } from './salaryExcel.js';

export default function SalaryExcelExport({ db, company, roles, standard, employees, today, initialScope }) {
  const [scope, setScope] = useState(salaryExcelOptions[initialScope] ? initialScope : 'all');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const pending = useRef(null);

  useEffect(() => () => pending.current?.abort(), []);

  async function download(event) {
    event.preventDefault();
    if (pending.current) return;
    const request = new AbortController();
    pending.current = request;
    setBusy(true);
    setStatus('Preparando o arquivo Excel…');
    const companyPath = ['artifacts', 'comunica-salvador', 'public', 'data', 'companies', company];

    try {
      const [planSnapshot, changeSnapshot, { default: writeExcelFile }] = await Promise.all([
        scope !== 'compensation' && getDocsFromServer(collection(db, ...companyPath, 'salaryPlans')),
        (scope === 'all' || scope === 'compensation') && getDocsFromServer(collection(db, ...companyPath, 'salaryChanges')),
        import('write-excel-file/browser'),
      ]);
      if (request.signal.aborted) return;
      const records = Object.fromEntries(planSnapshot ? planSnapshot.docs.map(item => [item.id, item.data()]) : []);
      const changes = changeSnapshot ? changeSnapshot.docs.map(item => item.data()) : [];
      const sheets = salaryWorkbook(scope, { roles, records, standard, employees, changes });
      const blob = await writeExcelFile(sheets).toBlob();
      if (request.signal.aborted) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${salaryExcelOptions[scope].filename}-${today}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 30000);
      setStatus('Arquivo Excel gerado.');
    } catch {
      if (!request.signal.aborted) setStatus('Não foi possível exportar. Confira sua conexão e seu acesso aos dados salariais.');
    } finally {
      pending.current = null;
      if (!request.signal.aborted) setBusy(false);
    }
  }

  return <form onSubmit={download} className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4" aria-label="Exportação de cargos e salários">
    <label className="min-w-0 flex-1 font-semibold sm:flex-none">
      Conteúdo do arquivo Excel
      <select disabled={busy} value={scope} onChange={event => { setScope(event.target.value); setStatus(''); }}
        className="mt-1 block w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm">
        {Object.entries(salaryExcelOptions).map(([key, option]) => <option key={key} value={key}>{option.label}</option>)}
      </select>
    </label>
    <button type="submit" disabled={busy} className="rounded-xl bg-blue-800 px-4 py-2.5 font-semibold text-white disabled:opacity-50">
      Baixar Excel (.xlsx)
    </button>
    {status && <p role="status" className="basis-full">{status}</p>}
  </form>;
}
