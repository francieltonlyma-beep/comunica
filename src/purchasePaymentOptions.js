export const PAYMENT_METHODS = {
  boleto: "Boleto",
  pix: "Pix",
  transferencia: "Transferência",
  cartao: "Cartão",
  dinheiro: "Dinheiro",
  outro: "Outra forma",
};
export const PAYMENT_BASES = {
  datas: "Datas definidas",
  nota: "Dias após emissão da NF",
  recebimento: "Dias após recebimento",
  pedido: "Dias após o pedido",
};
export const emptyPayment = () => ({
  method: "boleto",
  basis: "datas",
  installments: [{ amount: "", dueDate: "", days: 0 }],
  note: "",
});
