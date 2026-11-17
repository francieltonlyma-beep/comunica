import test from "node:test";
import assert from "node:assert/strict";
import {
  validateOffer,
  offerTotal,
  checkPayment,
  resolveInstallments,
  normalizeSearch,
} from "../functions/src/procurement.mjs";
import { filterPurchases, PURCHASE_FILTERS } from "../src/purchaseFlow.js";
const offer = {
  unitPrice: 10,
  freight: 10,
  discount: 5,
  availableQuantity: 2,
  expectedDate: "2026-12-01",
  paymentPlan: {
    method: "boleto",
    basis: "nota",
    installments: [
      { amount: 10, days: 30 },
      { amount: 15, days: 60 },
    ],
    note: "Condição negociada",
  },
};
test("custo inclui frete e desconto e valida parcelas em centavos", () => {
  assert.equal(offerTotal(offer, 2), 2500);
  assert.equal(validateOffer(offer, 2).totalCents, 2500);
  assert.throws(
    () =>
      validateOffer(
        {
          ...offer,
          paymentPlan: {
            ...offer.paymentPlan,
            installments: [{ amount: 24.99, days: 30 }],
          },
        },
        2,
      ),
    /soma/,
  );
});
test("recusa NaN, preços negativos, datas inexistentes, excesso e pagamento sem referência", () => {
  for (const change of [
    { unitPrice: "abc" },
    { unitPrice: -1 },
    { expectedDate: "2026-02-31" },
    { availableQuantity: 0 },
    { paymentPlan: {} },
    { paymentPlan: { ...offer.paymentPlan, basis: "desconhecido" } },
    { paymentPlan: { ...offer.paymentPlan, installments: [] } },
  ])
    assert.throws(() => validateOffer({ ...offer, ...change }, 2));
});
test("indisponibilidade pode ser respondida sem preço e sem plano de pagamento", () =>
  assert.equal(validateOffer({ available: false }, 2).available, false));
test("financeiro compara forma, valores e vencimentos com 30/60 dias atravessando o ano", () => {
  const plan = validateOffer(offer, 2).paymentPlan;
  const parts = resolveInstallments(plan, "2026-12-15");
  assert.equal(parts[0].dueDate, "2027-01-14");
  assert.equal(parts[1].dueDate, "2027-02-13");
  assert.equal(
    checkPayment(plan, { method: "boleto", installments: parts }, "2026-12-15"),
    true,
  );
  assert.equal(
    checkPayment(plan, { method: "pix", installments: parts }, "2026-12-15"),
    false,
  );
  assert.equal(
    checkPayment(
      plan,
      {
        method: "boleto",
        installments: [{ ...parts[0], amount: 11 }, parts[1]],
      },
      "2026-12-15",
    ),
    false,
  );
  assert.equal(
    checkPayment(
      plan,
      {
        method: "boleto",
        installments: [{ ...parts[0], dueDate: "2027-01-15" }, parts[1]],
      },
      "2026-12-15",
    ),
    false,
  );
  assert.throws(() => resolveInstallments(plan, ""), /base/);
});
test("busca tolera acentos e documentos formatados; filtros incluem fornecedor e valor", () => {
  assert.equal(normalizeSearch("AÇÚCAR 12.345/0001-00"), "acucar 12345000100");
  const records = [
    { id: "a", supplier: "A", quotedPrice: 5, quantity: 2 },
    { id: "b", supplier: "B", quotedPrice: 15, quantity: 2 },
  ];
  assert.deepEqual(
    filterPurchases(records, { ...PURCHASE_FILTERS, supplier: "A" }).map(
      (x) => x.id,
    ),
    ["a"],
  );
  assert.deepEqual(
    filterPurchases(records, {
      ...PURCHASE_FILTERS,
      minValue: 20,
      maxValue: 40,
    }).map((x) => x.id),
    ["b"],
  );
});
