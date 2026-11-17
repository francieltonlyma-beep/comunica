export const normalizeSearch = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
export const moneyCents = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 1e10)
    throw new Error("Informe valores positivos e válidos.");
  return Math.round(n * 100);
};
export const validDate = (value) =>
  /^\d{4}-\d{2}-\d{2}$/.test(String(value)) &&
  new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
export function offerTotal(offer, quantity) {
  const total =
    Math.round(moneyCents(offer.unitPrice) * Number(quantity)) +
    moneyCents(offer.freight || 0) -
    moneyCents(offer.discount || 0);
  if (!Number.isSafeInteger(total) || total <= 0 || !(Number(quantity) > 0))
    throw new Error("O custo total precisa ser maior que zero.");
  return total;
}
export function validateOffer(input, quantity) {
  const available = input.available !== false;
  const result = {
    available,
    unitPrice: Number(input.unitPrice || 0),
    freight: Number(input.freight || 0),
    discount: Number(input.discount || 0),
    availableQuantity: Number(input.availableQuantity ?? quantity),
    expectedDate: String(input.expectedDate || ""),
    alternative: String(input.alternative || "")
      .trim()
      .slice(0, 500),
    note: String(input.note || "")
      .trim()
      .slice(0, 1000),
  };
  if (!available) return { ...result, totalCents: 0, paymentPlan: null };
  if (
    !(result.unitPrice > 0) ||
    !validDate(result.expectedDate) ||
    !(result.availableQuantity > 0) ||
    !Number.isFinite(result.availableQuantity)
  )
    throw new Error(
      "Informe preço, quantidade disponível e data de entrega válidos.",
    );
  const totalCents = offerTotal(result, quantity);
  const source = input.paymentPlan || {};
  if (
    !["boleto", "pix", "transferencia", "cartao", "dinheiro", "outro"].includes(
      source.method,
    )
  )
    throw new Error("Informe a forma de pagamento negociada.");
  if (!["datas", "nota", "recebimento", "pedido"].includes(source.basis))
    throw new Error("Informe a referência dos prazos de pagamento.");
  if (
    !Array.isArray(source.installments) ||
    !source.installments.length ||
    source.installments.length > 36
  )
    throw new Error(
      "Informe de 1 a 36 parcelas, incluindo a entrada quando houver.",
    );
  const installments = source.installments.map((part, index) => {
    const amountCents = moneyCents(part.amount);
    const days = Number(part.days || 0);
    const dueDate = String(part.dueDate || "");
    if (
      !amountCents ||
      (source.basis === "datas"
        ? !validDate(dueDate)
        : !Number.isInteger(days) || days < 0 || days > 3650)
    )
      throw new Error(`Confira valor e prazo da parcela ${index + 1}.`);
    return {
      amount: amountCents / 100,
      days,
      dueDate: source.basis === "datas" ? dueDate : "",
    };
  });
  if (
    installments.reduce((sum, p) => sum + moneyCents(p.amount), 0) !==
    totalCents
  )
    throw new Error(
      "A soma das parcelas deve corresponder ao custo total deste item, com frete e desconto.",
    );
  return {
    ...result,
    totalCents,
    paymentPlan: {
      method: source.method,
      basis: source.basis,
      installments,
      note: String(source.note || "")
        .trim()
        .slice(0, 1000),
    },
  };
}
export function resolveInstallments(plan, referenceDate) {
  return plan.installments.map((part) => {
    if (plan.basis === "datas") return part;
    if (!validDate(referenceDate))
      throw new Error(
        "Informe a data base negociada para conferir os vencimentos.",
      );
    const day = new Date(`${referenceDate}T12:00:00Z`);
    day.setUTCDate(day.getUTCDate() + part.days);
    return { ...part, dueDate: day.toISOString().slice(0, 10) };
  });
}
export function checkPayment(plan, submitted, referenceDate) {
  const expected = resolveInstallments(plan, referenceDate);
  if (
    submitted.method !== plan.method ||
    !Array.isArray(submitted.installments) ||
    submitted.installments.length !== expected.length
  )
    return false;
  return expected.every(
    (part, index) =>
      moneyCents(part.amount) ===
        moneyCents(submitted.installments[index].amount) &&
      part.dueDate === submitted.installments[index].dueDate,
  );
}
