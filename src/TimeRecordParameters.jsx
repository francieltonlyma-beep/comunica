import { useState } from 'react';

export default function TimeRecordParameters({ policy, busy, onSave }) {
  const [days, setDays] = useState(policy.adjustmentDays);
  const [minimum, setMinimum] = useState(policy.reasonLength);
  const changed = Number(days) !== policy.adjustmentDays || Number(minimum) !== policy.reasonLength;
  const input = 'mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2';
  return <form className="space-y-4 rounded-2xl border bg-white p-5" onSubmit={event => {
    event.preventDefault();
    if (changed) onSave({ adjustmentDays: Number(days), reasonLength: Number(minimum) });
  }}>
    <h2 className="font-bold">Parâmetros dos registros</h2>
    <div className="grid gap-4 sm:grid-cols-2">
      <label>Prazo para solicitar ajuste (dias)
        <input type="number" required min="0" max="365" className={input} value={days} onChange={event => setDays(event.target.value)} />
        <small>Conte a partir do horário da batida faltante. Use 0 para deixar sem prazo.</small>
      </label>
      <label>Tamanho mínimo da justificativa (caracteres)
        <input type="number" required min="4" max="500" className={input} value={minimum} onChange={event => setMinimum(event.target.value)} />
      </label>
    </div>
    <button disabled={busy || !changed} className="rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-50">Salvar parâmetros</button>
  </form>;
}
