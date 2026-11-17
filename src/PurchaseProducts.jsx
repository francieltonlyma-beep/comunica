import { Package, Plus, Search } from "lucide-react";
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
    <details className="pm-section pm-products">
      <summary><Package size={18} /> Cadastro de produtos <span>{products.length} cadastrado(s)</span></summary>
      <p className="pm-hint">Organize o catálogo para preencher solicitações e cotações com rapidez.</p>
      <div className="pm-product-layout"><section className="pm-product-catalog">
      <label>
        <Search size={16} /> Buscar no catálogo
        <input placeholder="Código, nome ou categoria" value={search} onChange={(e) => setSearch(e.target.value)} />
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
            <button type="button" key={p.id} aria-pressed={draft.id === p.id} onClick={() => setDraft(p)}>
              <strong>{p.name}</strong><span>{p.code || 'Sem código'} · {p.unit} · {p.category || 'Outros'}</span><small>{p.specification}</small>
            </button>
          ))}
      </div>
      {!products.length && <p className="pm-hint">Seu catálogo está vazio. Cadastre o primeiro produto ao lado.</p>}
      </section><form className="pm-form-grid pm-product-form" onSubmit={save}>
        <header className="pm-wide"><div><h4>{draft.id ? 'Editar produto' : 'Novo produto'}</h4><p className="pm-hint">Nome e unidade são obrigatórios.</p></div><button type="button" onClick={() => setDraft({name:'',code:'',specification:'',unit:'un',category:'Outros'})}><Plus size={16} /> Novo</button></header>
        {[
          ["code", "Código"],
          ["name", "Produto"],
          ["specification", "Especificação"],
          ["unit", "Unidade"],
          ["category", "Categoria"],
        ].map(([k, label]) => (
          <label key={k} className={k === "specification" || k === "name" ? "pm-wide" : ""}>
            {label}
            <input
              required={["name", "unit"].includes(k)}
              value={draft[k] || ""}
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
          {busy ? 'Salvando...' : draft.id ? 'Salvar alterações' : 'Cadastrar produto'}
        </button>
      </form></div>
    </details>
  );
}
