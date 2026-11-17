import { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getFunctions, httpsCallable } from "firebase/functions";
import { PaymentEditor } from "./PurchasePayment.jsx";
import { emptyPayment } from "./purchasePaymentOptions.js";
import "./PurchaseManagement.css";
const app = initializeApp(
  {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  },
  "purchase-supplier",
);
const callable = httpsCallable(
  getFunctions(app, "us-central1"),
  "purchaseWorkspace",
);
export default function PublicPurchaseQuote() {
  const [data, setData] = useState(null);
  const [offers, setOffers] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const token = window.location.hash.slice(1);
  useEffect(() => {
    document.title = "Responder cotação · Comunica";
    let live = true;
    callable({ action: "readInvitation", token })
      .then((r) => {
        if (!live) return;
        setData(r.data);
        setSubmitted(r.data.submitted);
        setOffers(
          Object.fromEntries(
            r.data.items.map((p) => [
              p.id,
              {
                available: true,
                unitPrice: "",
                freight: 0,
                discount: 0,
                availableQuantity: p.quantity,
                expectedDate: "",
                alternative: "",
                note: "",
                paymentPlan: emptyPayment(),
              },
            ]),
          ),
        );
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [token]);
  const field = (id, key, value) =>
    setOffers((prev) => ({ ...prev, [id]: { ...prev[id], [key]: value } }));
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await callable({ action: "submitInvitation", token, offers });
      setSubmitted(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main id="main-content" className="pm pm-public-quote">
      <h1>Cotação · {data?.companyName || "Comunica"}</h1>
      {error && (
        <p className="pm-error" role="alert">
          {error}
        </p>
      )}
      {!data && !error && <p>Carregando cotação...</p>}
      {data && (
        <>
          <p>
            Fornecedor: <strong>{data.supplier}</strong> · Responder até{" "}
            {new Date(data.expiresAt).toLocaleString("pt-BR")}
          </p>
          {submitted ? (
            <p className="pm-notice" role="status">
              Proposta recebida. Para corrigir uma resposta, solicite um novo
              link ao comprador.
            </p>
          ) : (
            <form onSubmit={submit}>
              <p>
                Informe os preços e condições de cada item. Distribua o frete
                entre os itens para que não seja contado várias vezes. Este link
                permite uma resposta e deve ser mantido com o fornecedor
                destinatário.
              </p>
              {data.items.map((p) => {
                const v = offers[p.id];
                return (
                  <section className="pm-section" key={p.id}>
                    <h2>
                      {p.item} · {p.quantity} {p.unit}
                    </h2>
                    <p>{p.specification}</p>
                    <label>
                      <input
                        type="checkbox"
                        checked={!v.available}
                        onChange={(e) =>
                          field(p.id, "available", !e.target.checked)
                        }
                      />{" "}
                      Não posso fornecer este item
                    </label>
                    {v.available && (
                      <>
                        <div className="pm-fields">
                          {[
                            ["unitPrice", "Preço unitário (R$)"],
                            ["availableQuantity", "Quantidade disponível"],
                            ["freight", "Frete atribuído a este item (R$)"],
                            ["discount", "Desconto deste item (R$)"],
                          ].map(([k, label]) => (
                            <label key={k}>
                              {label}
                              <input
                                required
                                type="number"
                                min="0"
                                step="0.01"
                                value={v[k]}
                                onChange={(e) => field(p.id, k, e.target.value)}
                              />
                            </label>
                          ))}
                          <label>
                            Entrega prevista
                            <input
                              required
                              type="date"
                              value={v.expectedDate}
                              onChange={(e) =>
                                field(p.id, "expectedDate", e.target.value)
                              }
                            />
                          </label>
                          <label>
                            Produto alternativo, se houver
                            <input
                              value={v.alternative}
                              maxLength={500}
                              onChange={(e) =>
                                field(p.id, "alternative", e.target.value)
                              }
                            />
                          </label>
                        </div>
                        <PaymentEditor
                          value={v.paymentPlan}
                          onChange={(value) =>
                            field(p.id, "paymentPlan", value)
                          }
                        />
                      </>
                    )}
                    <label>
                      Observações
                      <textarea
                        value={v.note}
                        maxLength={1000}
                        onChange={(e) => field(p.id, "note", e.target.value)}
                      />
                    </label>
                  </section>
                );
              })}
              <button type="submit" disabled={busy}>
                {busy ? "Enviando..." : "Enviar proposta ao comprador"}
              </button>
            </form>
          )}
        </>
      )}
    </main>
  );
}
