import { useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { normalizeSearch } from "../functions/src/procurement.mjs";
export default function PurchaseProducts({
  db,
  companyId,
  products,
  online,
  onError,
  onNotice,
}) {
  const [draft, setDraft] = useState({
    name: "",
    code: "",
    specification: "",
    unit: "un",
    category: "Outros",
  });
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(e) {
    e.preventDefault();
    if (busy || !online) return;
    setBusy(true);
    try {
      await httpsCallable(
        getFunctions(db.app, "us-central1"),
        "purchaseWorkspace",
      )({ action: "saveProduct", companyId, ...draft });
      onNotice(
        "Produto salvo. As sugestões já podem ser usadas na solicitação.",
      );
      setDraft({
        name: "",
        code: "",
        specification: "",
        unit: "un",
        category: "Outros",
      });
    } catch (e) {
      onError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="pm-section">
      <summary>Cadastro de produtos · {products.length}</summary>
      <label>
        Buscar por código, produto ou categoria
        <input value={search} onChange={(e) => setSearch(e.target.value)} />
      </label>
      <div className="pm-supplier-list">
        {products
          .filter((p) =>
            normalizeSearch(`${p.name} ${p.code} ${p.category}`).includes(
              normalizeSearch(search),
            ),
          )
          .slice(0, 100)
          .map((p) => (
            <button type="button" key={p.id} onClick={() => setDraft(p)}>
              {p.code && `${p.code} · `}
              {p.name} · {p.unit}
            </button>
          ))}
      </div>
      <form className="pm-fields" onSubmit={save}>
        {[
          ["code", "Código"],
          ["name", "Produto"],
          ["specification", "Especificação"],
          ["unit", "Unidade"],
          ["category", "Categoria"],
        ].map(([k, label]) => (
          <label key={k}>
            {label}
            <input
              required={["name", "unit"].includes(k)}
              value={draft[k]}
              maxLength={
                k === "specification"
                  ? 1000
                  : k === "unit"
                    ? 30
                    : k === "code" || k === "category"
                      ? 80
                      : 160
              }
              onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
            />
          </label>
        ))}
        <button type="submit" disabled={busy || !online}>
          Salvar produto
        </button>
      </form>
    </details>
  );
}
