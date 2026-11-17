import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { catalogProductForRequest } from "../functions/src/purchaseProductCatalog.mjs";
import PurchaseBundleComparison from "./PurchaseBundleComparison.jsx";
import PurchaseSelect from "./PurchaseSelect.jsx";
import PurchaseAutocomplete from "./PurchaseAutocomplete.jsx";
import { PaymentEditor, PaymentSummary } from "./PurchasePayment.jsx";
import { emptyPayment, PAYMENT_METHODS } from "./purchasePaymentOptions.js";
import {
  normalizeSearch,
  resolveInstallments,
} from "../functions/src/procurement.mjs";
const money = (v) =>
  Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
const emptyOffer = (quantity) => ({
  available: true,
  unitPrice: "",
  freight: 0,
  discount: 0,
  availableQuantity: quantity,
  expectedDate: "",
  alternative: "",
  note: "",
  paymentPlan: emptyPayment(),
});
export default function PurchaseWorkspace({
  db,
  appId,
  companyId,
  selected,
  records,
  products = [],
  suppliers,
  user,
  online,
  onNotice,
  onError,
  onAward,
}) {
  const [now] = useState(() => Date.now());
  const [offers, setOffers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [supplierId, setSupplierId] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [offer, setOffer] = useState(() => emptyOffer(selected.quantity));
  const [filter, setFilter] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [links, setLinks] = useState([]);
  const linkedProduct = catalogProductForRequest(products,selected);
  const [supplierSelection, setSupplierIds] = useState(null);
  const supplierIds = supplierSelection || (linkedProduct?.suggestedSupplierIds || []).filter(id=>suppliers.some(s=>s.id===id));
  const [supplierQuery, setSupplierQuery] = useState("");
  const [compareSelected, setCompareSelected] = useState(false);
  const [payment, setPayment] = useState(
    () => selected.procurement?.offer.paymentPlan || emptyPayment(),
  );
  const [referenceDate, setReferenceDate] = useState("");
  const current = selected.procurement;
  const canEdit =
    selected.buyerId === user?.id &&
    !selected.approvedAt &&
    ["requested", "quotation"].includes(selected.status);
  const readPath = useMemo(() => collection(
    db,
    "artifacts",
    appId,
    "public",
    "data",
    "companies",
    companyId,
    "purchaseRequests",
    selected.id,
    "offers",
  ),[db,appId,companyId,selected.id]);
  useEffect(
    () =>
      onSnapshot(
        readPath,
        (s) => setOffers(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
        () => onError("Não foi possível carregar as propostas."),
      ),
    [readPath,onError],
  );
  useEffect(
    () =>
      onSnapshot(
        collection(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "companies",
          companyId,
          "purchaseRequests",
          selected.id,
          "invitations",
        ),
        (s) => setInvitations(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
        () => onError("Não foi possível carregar os convites."),
      ),
    [db, appId, companyId, selected.id, onError],
  );
  const callable = httpsCallable(
    getFunctions(db.app, "us-central1"),
    "purchaseWorkspace",
  );
  async function run(action, extra, success) {
    if (busy || !online) return;
    setBusy(true);
    onError("");
    try {
      const response = await callable({
        action,
        companyId,
        requestId: selected.id,
        ...extra,
      });
      success?.(response.data);
    } catch (e) {
      onError(e.message || "Não foi possível concluir a operação.");
    } finally {
      setBusy(false);
    }
  }
  function chooseSupplier(value) {
    setSupplierId(value);
    const existing = offers.find((o) => o.supplierId === value);
    setOffer(
      existing
        ? { ...existing, paymentPlan: existing.paymentPlan || emptyPayment() }
        : emptyOffer(selected.quantity),
    );
  }
  async function generateLinks() {
    if (busy || !online || !supplierIds.length) return;
    setBusy(true); onError("");
    const requestIds = records.filter(p => (selected.bundleId ? p.bundleId === selected.bundleId : p.id === selected.id) && p.buyerId === user.id && !p.approvedAt && ["requested", "quotation"].includes(p.status)).map(p => p.id);
    const failures = [];
    for (const supplierId of supplierIds) {
      try {
        const { data } = await callable({action:"createInvitation", companyId, requestIds, supplierId});
        setLinks(previous => [...previous.filter(l => l.supplierId !== supplierId), {supplierId, supplier:data.supplier, url:`${window.location.origin}/cotacao#${data.token}`}]);
      } catch (problem) { failures.push(`${suppliers.find(s => s.id === supplierId)?.name || supplierId}: ${problem.message}`); }
    }
    setBusy(false);
    if (failures.length) onError(`Alguns links não foram gerados. ${failures.join("; ")}`);
    else onNotice("Links gerados. Envie a cada fornecedor o seu próprio link.");
  }
  const comparable = offers.filter(
    (o) =>
      o.available && o.availableQuantity >= selected.quantity && !o.alternative,
  );
  const best = Math.min(...comparable.map((o) => o.totalCents));
  const shown = offers
    .filter(
      (o) =>
        (!compareSelected || supplierIds.includes(o.supplierId)) &&
        normalizeSearch(`${o.supplier} ${o.note}`).includes(
          normalizeSearch(filter),
        ) &&
        (!maxPrice || o.totalCents / 100 <= Number(maxPrice)) &&
        (!methodFilter || o.paymentPlan?.method === methodFilter),
    )
    .sort((a, b) => a.totalCents - b.totalCents);
  const previous = records
    .filter(
      (p) =>
        p.id !== selected.id &&
        !["requested", "quotation", "rejected", "cancelled"].includes(
          p.status,
        ) &&
        normalizeSearch(p.item) === normalizeSearch(selected.item) &&
        p.unit === selected.unit &&
        p.quotedPrice > 0,
    )
    .sort(
      (a, b) => (b.approvedAt || b.updatedAt) - (a.approvedAt || a.updatedAt),
    )[0];
  return (
    <section className="pm-section pm-commercial">
      <h4>Cotação do item · {selected.item}</h4>
      {!selected.buyerId && <p className="pm-hint">Defina o comprador nos responsáveis acima para registrar propostas. Não é necessário iniciar outra cotação.</p>}
      <p className="pm-hint">
        Cada proposta e pagamento correspondem à quantidade total deste item.
        Frete informado aqui deve ser a parcela atribuída ao item, para evitar
        cobrança repetida.
      </p>
      {previous && (
        <p>
          Último pedido aprovado:{" "}
          {money(previous.procurement?.offer.unitPrice ?? previous.quotedPrice)}
          /{selected.unit} · {previous.supplier}
        </p>
      )}
      {canEdit && (
        <>
          <div className="pm-supplier-picker">
            <h4>Fornecedores desta cotação · {supplierIds.length} selecionado(s)</h4>
            {!!linkedProduct?.suggestedSupplierIds?.length && <p className="pm-hint">Fornecedores vinculados ao produto sugeridos automaticamente. Você pode alterar a seleção antes de gerar os links.</p>}
            <p className="pm-hint">Selecione vários fornecedores para solicitar preços. Cada um recebe um link individual. Registre os preços de cada proposta separadamente.</p>
            <label>Buscar fornecedores<input value={supplierQuery} onChange={e => setSupplierQuery(e.target.value)} placeholder="Nome, documento ou produto" /></label>
            <div className="pm-supplier-checks">{suppliers.filter(s => normalizeSearch(`${s.name} ${s.taxId || ''} ${s.products || ''}`).includes(normalizeSearch(supplierQuery))).map(s => <label key={s.id}><input type="checkbox" checked={supplierIds.includes(s.id)} disabled={busy} onChange={e => setSupplierIds(previous => e.target.checked ? [...(previous || supplierIds),s.id] : (previous || supplierIds).filter(id => id !== s.id))} /><span><strong>{s.name}</strong><small>{linkedProduct?.suggestedSupplierIds?.includes(s.id) ? 'Sugerido para este produto · ' : ''}{s.taxId || 'Sem documento'}</small></span></label>)}</div>
            {!suppliers.length && <p>Cadastre os fornecedores para solicitar propostas.</p>}
          </div>
          <label>
            Justificativa da escolha
            <input
              maxLength={1000}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Obrigatória para maior custo ou produto alternativo"
            />
          </label>
          <details open>
            <summary>Adicionar ou atualizar proposta</summary>
            <label>
              Fornecedor cadastrado
              <PurchaseAutocomplete label="Fornecedor da proposta" value={supplierSearch}
                options={suppliers.map(s => ({id:s.id,label:s.name,detail:`${s.taxId || "Sem documento"} · ${s.activity || ""} · ${s.products || ""}`}))}
                onChange={value => { setSupplierSearch(value); setSupplierId(""); }}
                onSelect={option => { setSupplierSearch(option.label); chooseSupplier(option.id); }} />
              {supplierId && <small className="pm-hint">Fornecedor selecionado. Preencha a proposta abaixo.</small>}
              {!!supplierIds.length && <div className="pm-supplier-tabs">{suppliers.filter(s => supplierIds.includes(s.id)).map(s => <button type="button" key={s.id} aria-pressed={supplierId === s.id} onClick={() => {setSupplierSearch(s.name); chooseSupplier(s.id);}}>{s.name}{offers.some(o => o.supplierId === s.id) ? ' · proposta salva' : ''}</button>)}</div>}
            </label>
            <label>
              <input
                type="checkbox"
                checked={!offer.available}
                onChange={(e) =>
                  setOffer({ ...offer, available: !e.target.checked })
                }
              />{" "}
              Produto indisponível
            </label>
            {offer.available && (
              <>
                <div className="pm-fields">
                  {[
                    ["unitPrice", "Preço unitário (R$)"],
                    ["availableQuantity", "Quantidade disponível"],
                    ["freight", "Frete atribuído ao item (R$)"],
                    ["discount", "Desconto do item (R$)"],
                  ].map(([k, label]) => (
                    <label key={k}>
                      {label}
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={offer[k]}
                        onChange={(e) =>
                          setOffer({ ...offer, [k]: e.target.value })
                        }
                      />
                    </label>
                  ))}
                  <label>
                    Data de entrega
                    <input
                      type="date"
                      value={offer.expectedDate}
                      onChange={(e) =>
                        setOffer({ ...offer, expectedDate: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Produto alternativo
                    <input
                      value={offer.alternative}
                      maxLength={500}
                      onChange={(e) =>
                        setOffer({ ...offer, alternative: e.target.value })
                      }
                    />
                  </label>
                </div>
                <PaymentEditor
                  value={offer.paymentPlan}
                  onChange={(v) => setOffer({ ...offer, paymentPlan: v })}
                />
              </>
            )}
            <label>
              Observações
              <textarea
                value={offer.note}
                maxLength={1000}
                onChange={(e) => setOffer({ ...offer, note: e.target.value })}
              />
            </label>
            <button
              type="button"
              disabled={!supplierId || busy || !online}
              onClick={() =>
                run("saveOffer", { supplierId, offer }, () =>
                  onNotice("Proposta salva no quadro comparativo."),
                )
              }
            >
              Salvar proposta
            </button>
          </details>
          <details>
            <summary>Gerar links para os fornecedores selecionados</summary>
            <p>Os links incluem os itens em aberto desta cotação sob sua responsabilidade e valem por 7 dias. Cada fornecedor vê somente a própria proposta.</p>
            <button type="button" disabled={!supplierIds.length || busy || !online} onClick={generateLinks}>{busy ? 'Gerando...' : `Gerar ${supplierIds.length} link(s) de cotação`}</button>
            {links.map(link => <label key={link.supplierId}>{link.supplier}<input readOnly value={link.url} onFocus={e => e.target.select()} /><button type="button" onClick={async () => {try {await navigator.clipboard.writeText(link.url); onNotice("Link copiado.");} catch {onError("Selecione o link e copie manualmente.");}}}>Copiar link de {link.supplier}</button></label>)}
          </details>
        </>
      )}
      <div className="pm-fields">
        <label>
          Filtrar propostas por fornecedor
          <PurchaseAutocomplete label="Fornecedor nas propostas" emptyMessage="Nenhuma proposta encontrada. Para cotar com um fornecedor, use o cadastro na proposta acima." value={filter} onChange={setFilter} options={[...new Map(offers.map(o => [o.supplierId, {id:o.supplierId,label:o.supplier,detail:o.note}])).values()]} />
        </label>
        <label>
          Custo total máximo (R$)
          <input
            type="number"
            min="0"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </label>
        <label>
          Pagamento
          <PurchaseSelect
            label="Forma de pagamento das propostas"
            value={methodFilter}
            onChange={setMethodFilter}
            options={Object.entries(PAYMENT_METHODS)}
            placeholder="Todas"
          />
        </label>
      </div>
      {selected.bundleId && <PurchaseBundleComparison db={db} appId={appId} companyId={companyId} items={records.filter(p => p.bundleId === selected.bundleId).sort((a,b) => a.bundleIndex - b.bundleIndex)} onError={onError} />}
      <h4>Comparar propostas recebidas ({offers.length})</h4>
      {!!supplierIds.length && <label><input type="checkbox" checked={compareSelected} onChange={e => setCompareSelected(e.target.checked)} /> Comparar somente os fornecedores selecionados</label>}
      <p className="pm-hint">Compare as colunas lado a lado. No celular, deslize a tabela para ver todos os fornecedores.</p>
      <div className="pm-offer-scroll">
        <table className="pm-offer-table">
          <thead>
            <tr>
              <th>Condição</th>
              {shown.map((o) => (
                <th key={o.id}>
                  {o.supplier}
                  {current?.offerId === o.id && <small>Escolhido</small>}
                  {o.totalCents === best &&
                    !o.alternative &&
                    o.availableQuantity >= selected.quantity && (
                      <small>Menor custo total</small>
                    )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              [
                "Preço unitário",
                (o) => (o.available ? money(o.unitPrice) : "Indisponível"),
              ],
              [
                "Quantidade disponível",
                (o) => `${o.availableQuantity} ${selected.unit}`,
              ],
              ["Frete do item", (o) => money(o.freight)],
              ["Desconto", (o) => money(o.discount)],
              [
                "Custo total",
                (o) => (o.available ? money(o.totalCents / 100) : "—"),
              ],
              [
                "Entrega",
                (o) =>
                  o.expectedDate
                    ? o.expectedDate.split("-").reverse().join("/")
                    : "—",
              ],
              [
                "Alternativa / observações",
                (o) =>
                  [o.alternative, o.note].filter(Boolean).join(" · ") || "—",
              ],
              ["Pagamento", (o) => <PaymentSummary plan={o.paymentPlan} />],
            ].map(([label, render]) => (
              <tr key={label}>
                <th>{label}</th>
                {shown.map((o) => (
                  <td key={o.id}>{render(o)}</td>
                ))}
              </tr>
            ))}
            <tr>
              <th>Escolha</th>
              {shown.map((o) => (
                <td key={o.id}>
                  <button
                    type="button"
                    disabled={
                      !canEdit ||
                      busy ||
                      !online ||
                      !o.available ||
                      o.availableQuantity < selected.quantity
                    }
                    onClick={() =>
                      run(
                        "awardOffer",
                        {
                          offerId: o.id,
                          offerUpdatedAt: o.updatedAt,
                          expectedUpdatedAt: selected.updatedAt,
                          reason,
                        },
                        () => {
                          onNotice(
                            "Proposta escolhida. O acordo de pagamento segue para aprovação e financeiro.",
                          );
                          onAward();
                        },
                      )
                    }
                  >
                    Escolher proposta
                  </button>
                  {previous &&
                    o.unitPrice >
                      Number(
                        previous.procurement?.offer.unitPrice ??
                          previous.quotedPrice,
                      ) && (
                      <p className="pm-roles-alert">
                        Preço unitário acima do último pedido aprovado.
                      </p>
                    )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      {!shown.length && <p>Nenhuma proposta com esses filtros.</p>}
      {!!invitations.length && (
        <div>
          <h4>Respostas dos fornecedores</h4>
          {invitations.map((i) => (
            <p key={i.id}>
              {i.supplier} ·{" "}
              {i.status === "responded"
                ? "Respondido"
                : i.status === "revoked"
                  ? "Revogado"
                  : i.expiresAt < now
                    ? "Expirado"
                    : "Aguardando resposta"}{" "}
              {canEdit && i.status === "pending" && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    run("revokeInvitation", { invitationId: i.id }, () =>
                      onNotice("Link revogado."),
                    )
                  }
                >
                  Revogar
                </button>
              )}
            </p>
          ))}
        </div>
      )}
      {current && (
        <div className="pm-agreement">
          <h4>Acordo escolhido · {current.offer.supplier}</h4>
          <p>
            Preço {money(current.offer.unitPrice)} · Frete{" "}
            {money(current.offer.freight)} · Desconto{" "}
            {money(current.offer.discount)} · Total{" "}
            {money(current.offer.totalCents / 100)}
          </p>
          <PaymentSummary plan={current.offer.paymentPlan} />
          {current.reason && <p>Justificativa: {current.reason}</p>}
          <p className="pm-hint">
            O preço unitário usado no fluxo do pedido corresponde ao custo total
            dividido pela quantidade, incluindo frete e desconto.
          </p>
        </div>
      )}
      {current &&
        selected.status === "delivered" &&
        selected.financeId === user?.id && (
          <div className="pm-finance-check">
            <h4>Conferir pagamento recebido com o acordo</h4>
            <p>
              Informe as condições efetivas do boleto ou cobrança. Esta
              conferência registra conformidade; o pagamento continua sendo
              realizado pelo financeiro.
            </p>
            {current.offer.paymentPlan.basis !== "datas" && (
              <label>
                Data base ({current.offer.paymentPlan.basis})
                <input
                  type="date"
                  value={referenceDate}
                  onChange={(e) => setReferenceDate(e.target.value)}
                />
              </label>
            )}
            <button
              type="button"
              onClick={() => {
                try {
                  setPayment({
                    ...current.offer.paymentPlan,
                    basis: "datas",
                    installments: resolveInstallments(
                      current.offer.paymentPlan,
                      referenceDate,
                    ),
                  });
                } catch (e) {
                  onError(e.message);
                }
              }}
            >
              Preencher vencimentos previstos
            </button>
            <PaymentEditor
              value={{ ...payment, basis: "datas" }}
              onChange={setPayment}
            />
            <button
              type="button"
              disabled={busy || !online}
              onClick={() =>
                run(
                  "confirmPayment",
                  { version: current.version, payment, referenceDate },
                  () => onNotice("Pagamento conferido com o acordo aprovado."),
                )
              }
            >
              Confirmar conferência das condições
            </button>
            {selected.paymentReview?.version === current.version && (
              <p className="pm-match-ok">Conferência registrada.</p>
            )}
            <p className="pm-hint">
              Se houver diferença, use o motivo de não conformidade abaixo e
              devolva para correção. Anexe o boleto em Documentos da compra.
            </p>
          </div>
        )}
    </section>
  );
}
