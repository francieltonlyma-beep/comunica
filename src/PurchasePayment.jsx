import { useState } from "react";
import { PAYMENT_METHODS, PAYMENT_BASES } from "./purchasePaymentOptions.js";
export function PaymentEditor({ value, onChange, disabled = false }) {
  const [count, setCount] = useState(1);
  const [interval, setIntervalValue] = useState(30);
  const change = (key, v) => onChange({ ...value, [key]: v });
  const part = (index, key, v) =>
    change(
      "installments",
      value.installments.map((p, i) => (i === index ? { ...p, [key]: v } : p)),
    );
  function repeat() {
    const first = value.installments[0];
    const n = Math.max(1, Math.min(36, Number(count) || 1));
    change(
      "installments",
      Array.from({ length: n }, (_, i) => {
        const date = first.dueDate
          ? new Date(`${first.dueDate}T12:00:00Z`)
          : null;
        date?.setUTCDate(date.getUTCDate() + i * Number(interval));
        return {
          ...first,
          days: Number(first.days || 0) + i * Number(interval),
          dueDate: date?.toISOString().slice(0, 10) || "",
        };
      }),
    );
  }
  return (
    <fieldset className="pm-payment" disabled={disabled}>
      <legend>Pagamento negociado deste item</legend>
      <div className="pm-fields">
        <label>
          Forma
          <select
            value={value.method}
            onChange={(e) => change("method", e.target.value)}
          >
            {Object.entries(PAYMENT_METHODS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label>
          Referência dos vencimentos
          <select
            value={value.basis}
            onChange={(e) => change("basis", e.target.value)}
          >
            {Object.entries(PAYMENT_BASES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="pm-hint">
        Inclua a entrada como primeira parcela. A soma deve cobrir o total deste
        item com frete e desconto.
      </p>
      {value.installments.map((p, i) => (
        <div className="pm-payment-row" key={i}>
          <strong>{i + 1}ª</strong>
          <label>
            Valor (R$)
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={p.amount}
              onChange={(e) => part(i, "amount", e.target.value)}
            />
          </label>
          {value.basis === "datas" ? (
            <label>
              Vencimento
              <input
                type="date"
                value={p.dueDate}
                onChange={(e) => part(i, "dueDate", e.target.value)}
              />
            </label>
          ) : (
            <label>
              Dias após a referência
              <input
                type="number"
                min="0"
                max="3650"
                value={p.days}
                onChange={(e) => part(i, "days", e.target.value)}
              />
            </label>
          )}
          <button
            type="button"
            disabled={value.installments.length === 1}
            onClick={() =>
              change(
                "installments",
                value.installments.filter((_, j) => i !== j),
              )
            }
          >
            Remover
          </button>
        </div>
      ))}
      <div className="pm-payment-row">
        <button
          type="button"
          disabled={value.installments.length >= 36}
          onClick={() =>
            change("installments", [
              ...value.installments,
              { amount: "", dueDate: "", days: 0 },
            ])
          }
        >
          Adicionar parcela
        </button>
        <label>
          Repetir primeira parcela
          <input
            type="number"
            min="1"
            max="36"
            value={count}
            onChange={(e) => setCount(e.target.value)}
          />
        </label>
        <label>
          Intervalo em dias
          <input
            type="number"
            min="0"
            max="365"
            value={interval}
            onChange={(e) => setIntervalValue(e.target.value)}
          />
        </label>
        <button type="button" onClick={repeat}>
          Gerar parcelas
        </button>
      </div>
      <label>
        Observações do acordo
        <textarea
          value={value.note}
          maxLength={1000}
          onChange={(e) => change("note", e.target.value)}
        />
      </label>
    </fieldset>
  );
}
export function PaymentSummary({ plan }) {
  if (!plan) return <p>Pagamento não informado.</p>;
  return (
    <div className="pm-payment-summary">
      <strong>
        {PAYMENT_METHODS[plan.method]} · {PAYMENT_BASES[plan.basis]}
      </strong>
      <ol>
        {plan.installments.map((p, i) => (
          <li key={i}>
            {Number(p.amount).toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}{" "}
            ·{" "}
            {plan.basis === "datas"
              ? p.dueDate.split("-").reverse().join("/")
              : `${p.days} dias após a referência`}
          </li>
        ))}
      </ol>
      {plan.note && <p>{plan.note}</p>}
    </div>
  );
}
