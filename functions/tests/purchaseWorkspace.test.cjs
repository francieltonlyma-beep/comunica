const { test, after } = require("node:test");
const assert = require("node:assert/strict");
const { initializeApp, deleteApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { purchaseWorkspaceAction: run } = require("../lib/purchaseWorkspace.js");
if (!process.env.FIRESTORE_EMULATOR_HOST) throw Error("Emulador obrigatório");
const app = initializeApp({ projectId: "demo-comunica-procurement" });
const db = getFirestore(app);
const company = "procurement-fixture";
const base = db.doc(
  `artifacts/comunica-salvador/public/data/companies/${company}`,
);
const auth = { uid: "buyer", token: { companyId: company } };
const call = (action, data = {}, actor = auth) =>
  run(db, { action, companyId: company, ...data }, actor);
const valid = {
  unitPrice: 10,
  freight: 2,
  discount: 0,
  availableQuantity: 2,
  expectedDate: "2026-12-01",
  paymentPlan: {
    method: "boleto",
    basis: "datas",
    installments: [{ amount: 22, dueDate: "2026-12-15" }],
  },
};
const request = (key) => base.collection("purchaseRequests").doc(key);
async function seed(key) {
  await request(key).set({
    item: "Caixas",
    specification: "Papelão",
    unit: "un",
    quantity: 2,
    buyerId: "buyer",
    requesterId: "requester",
    participantIds: ["buyer", "finance"],
    financeId: "finance",
    status: "requested",
    updatedAt: 1,
    history: [],
  });
}

test("fluxo: convites isolados, propostas concorrentes, escolha congelada e conferência financeira", async () => {
  await base.set({ name: "Empresa fictícia", codeBlocked: false });
  await base
    .collection("settings")
    .doc("integra-access")
    .set({ enabled: true });
  await base.collection("users").doc("buyer").set({ name: "Comprador" });
  await base.collection("users").doc("finance").set({ name: "Financeiro" });
  for (const id of ["supplier-a", "supplier-b"])
    await base.collection("purchaseSuppliers").doc(id).set({ name: id });
  await seed("r1");
  await seed("r2");
  await assert.rejects(
    call(
      "saveOffer",
      { requestId: "r1", supplierId: "supplier-a", offer: valid },
      { uid: "outsider", token: { companyId: company } },
    ),
    /acesso/,
  );
  await assert.rejects(
    call(
      "saveOffer",
      { requestId: "r1", supplierId: "supplier-a", offer: valid },
      { uid: "buyer", token: { companyId: "another" } },
    ),
    /autorizada/,
  );
  const first = await call("createInvitation", {
    requestIds: ["r1"],
    supplierId: "supplier-a",
  });
  const view = await call("readInvitation", { token: first.token }, undefined);
  assert.equal(view.supplier, "supplier-a");
  assert.equal(view.items.length, 1);
  assert.equal(JSON.stringify(view).includes("quotedPrice"), false);
  assert.equal(JSON.stringify(view).includes("supplier-b"), false);
  await call(
    "submitInvitation",
    { token: first.token, offers: { r1: valid } },
    undefined,
  );
  await call(
    "submitInvitation",
    { token: first.token, offers: { r1: { unitPrice: 99 } } },
    undefined,
  );
  assert.equal((await request("r1").collection("offers").get()).size, 1);
  await call("saveOffer", {
    requestId: "r1",
    supplierId: "supplier-b",
    offer: {
      ...valid,
      unitPrice: 12,
      paymentPlan: {
        ...valid.paymentPlan,
        installments: [{ amount: 26, dueDate: "2026-12-15" }],
      },
    },
  });
  const higher = (
    await request("r1").collection("offers").doc("supplier-b").get()
  ).data();
  await assert.rejects(
    call("awardOffer", {
      requestId: "r1",
      offerId: "supplier-b",
      offerUpdatedAt: higher.updatedAt,
      expectedUpdatedAt: 1,
    }),
    /Justifique/,
  );
  const chosen = (
    await request("r1").collection("offers").doc("supplier-a").get()
  ).data();
  await call("awardOffer", {
    requestId: "r1",
    offerId: "supplier-a",
    offerUpdatedAt: chosen.updatedAt,
    expectedUpdatedAt: 1,
  });
  let p = (await request("r1").get()).data();
  assert.equal(p.supplier, "supplier-a");
  assert.equal(p.quotedPrice * 2, 22);
  assert.equal(p.procurement.offer.paymentPlan.installments[0].amount, 22);
  assert.match(p.orderNumber, /^PC-/);
  const snap = p.procurement;
  await call("saveOffer", {
    requestId: "r1",
    supplierId: "supplier-a",
    offer: {
      ...valid,
      unitPrice: 20,
      paymentPlan: {
        ...valid.paymentPlan,
        installments: [{ amount: 42, dueDate: "2026-12-15" }],
      },
    },
  });
  p = (await request("r1").get()).data();
  assert.deepEqual(p.procurement, snap);
  await assert.rejects(
    call("awardOffer", {
      requestId: "r1",
      offerId: "supplier-a",
      offerUpdatedAt: chosen.updatedAt,
      expectedUpdatedAt: p.updatedAt,
    }),
    /proposta mudou/,
  );
  await request("r1").update({ status: "delivered", approvedAt: 123 });
  const finance = { uid: "finance", token: { companyId: company } };
  await assert.rejects(
    call(
      "confirmPayment",
      {
        requestId: "r1",
        version: snap.version,
        payment: {
          method: "boleto",
          installments: [{ amount: 23, dueDate: "2026-12-15" }],
        },
      },
      finance,
    ),
    /divergentes/,
  );
  await assert.rejects(
    call("confirmPayment", {
      requestId: "r1",
      version: snap.version,
      payment: snap.offer.paymentPlan,
    }),
    /financeiro/,
  );
  await call(
    "confirmPayment",
    { requestId: "r1", version: snap.version, payment: snap.offer.paymentPlan },
    finance,
  );
  assert.equal(
    (await request("r1").get()).data().paymentReview.version,
    snap.version,
  );
  await assert.rejects(
    call("saveOffer", {
      requestId: "r1",
      supplierId: "supplier-b",
      offer: valid,
    }),
    /comprador/,
  );
  // Revocation and changed requests invalidate only the corresponding capability.
  const revoked = await call("createInvitation", {
    requestIds: ["r2"],
    supplierId: "supplier-b",
  });
  const { createHash } = require("node:crypto");
  const hash = createHash("sha256").update(revoked.token).digest("hex");
  await call("revokeInvitation", { requestId: "r2", invitationId: hash });
  await assert.rejects(
    call("readInvitation", { token: revoked.token }, undefined),
    /encerrado/,
  );
  const changed = await call("createInvitation", {
    requestIds: ["r2"],
    supplierId: "supplier-a",
  });
  await request("r2").update({ quantity: 3 });
  await assert.rejects(
    call(
      "submitInvitation",
      { token: changed.token, offers: { r2: valid } },
      undefined,
    ),
    /alterada/,
  );
  const product = await call("saveProduct", {
    code: "CX-1",
    name: "Caixa",
    unit: "un",
    category: "Embalagens",
  });
  assert.ok(product.id);
  await base.update({ codeBlocked: true });
  await assert.rejects(
    call("saveProduct", { name: "X", unit: "un" }),
    /acesso/,
  );
});
after(async () => {
  await db.terminate();
  await deleteApp(app);
});

test("numeração sequencial por empresa, concorrência, reserva idempotente e autorização", async () => {
  const companyId = "numbering-fixture";
  const companyRef = db.doc(`artifacts/comunica-salvador/public/data/companies/${companyId}`);
  await companyRef.set({name:"Empresa de teste"});
  await companyRef.collection("settings").doc("integra-access").set({enabled:true});
  await companyRef.collection("settings").doc("purchase-approval").set({requesterIds:["requester"]});
  await companyRef.collection("users").doc("requester").set({name:"Solicitante"});
  await companyRef.collection("users").doc("other").set({name:"Outro"});
  const actor = {uid:"requester",token:{companyId}};
  const reserve = (requestId, auth = actor) => run(db,{action:"reserveQuoteNumber",companyId,requestId},auth);
  const results = await Promise.all(["one","two","three"].map(key => reserve(key)));
  assert.equal(new Set(results.map(r => r.quoteNumber)).size,3);
  assert.deepEqual(results.map(r => r.quoteNumber).sort(),["COT-000001","COT-000002","COT-000003"]);
  assert.equal((await reserve("one")).quoteNumber,results[0].quoteNumber);
  await assert.rejects(reserve("four",{uid:"other",token:{companyId}}),/permissão/);
  assert.equal((await companyRef.collection("purchaseQuoteNumbers").doc("counter").get()).data().sequence,3);
});

test('importação de produtos preserva marca e vínculos, valida fornecedores da empresa e restringe acesso',async()=>{
 const companyId='catalog-fixture';const companyRef=db.doc(`artifacts/comunica-salvador/public/data/companies/${companyId}`);
 await companyRef.set({name:'Catálogo de teste'});await companyRef.collection('settings').doc('integra-access').set({enabled:true});
 await companyRef.collection('users').doc('admin').set({isAdmin:true});await companyRef.collection('users').doc('buyer').set({name:'Comprador'});
 await companyRef.collection('purchaseSuppliers').doc('supplier').set({name:'Fornecedor'});
 const admin={uid:'admin',token:{companyId}},buyer={uid:'buyer',token:{companyId}};
 const action=(action,data={},actor=admin)=>run(db,{action,companyId,...data},actor);
 const {id}=await action('saveProduct',{code:'0001',name:'Leite',brand:'Marca A',unit:'un',suggestedSupplierIds:['supplier']});
 await action('importProducts',{products:[{code:'0001',name:'Leite atualizado'},{code:'0002',name:'Tomate Kg'}]});
 const product=(await companyRef.collection('purchaseProducts').doc(id).get()).data();
 assert.equal(product.name,'Leite atualizado');assert.equal(product.brand,'Marca A');assert.deepEqual(product.suggestedSupplierIds,['supplier']);
 assert.equal((await companyRef.collection('purchaseProducts').get()).size,2);
 await action('importProducts',{products:[{code:'0002',name:'Tomate Kg'}]});assert.equal((await companyRef.collection('purchaseProducts').get()).size,2);
 await assert.rejects(action('importProducts',{products:[{code:'3',name:'X'}]},buyer),/permissão/);
 await assert.rejects(action('saveProduct',{name:'X',suggestedSupplierIds:['foreign-supplier']}),/empresa/);
 await assert.rejects(action('importProducts',{products:[{code:'1',name:'A'},{code:'1',name:'B'}]}),/repetidos/);
});
