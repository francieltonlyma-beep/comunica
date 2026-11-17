import {
  Firestore,
  DocumentSnapshot,
  Transaction,
} from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { createHash, randomBytes } from "node:crypto";
import {
  validateOffer,
  normalizeSearch,
  checkPayment,
} from "./procurement.mjs";

type Data = Record<string, any>;
const id = (value: unknown) => {
  const v = String(value || "");
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(v))
    throw new HttpsError("invalid-argument", "Identificação inválida.");
  return v;
};
const clean = (v: unknown, max = 160) =>
  String(v || "")
    .trim()
    .slice(0, max);
const editable = (p: Data) =>
  !p.approvedAt && ["requested", "quotation"].includes(p.status);
const tick = (p: Data) => Math.max(Date.now(), Number(p.updatedAt || 0) + 1);
const event = (p: Data, uid: string, detail: string, at: number) =>
  [...(p.history || []), { stage: p.status, by: uid, at, detail }].slice(-50);
const digest = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export async function purchaseWorkspaceAction(
  db: Firestore,
  data: Data,
  auth?: { uid: string; token: Data },
) {
  const action = clean(data.action, 40);
  if (["readInvitation", "submitInvitation"].includes(action))
    return publicInvitation(db, data, action);
  if (!auth)
    throw new HttpsError("unauthenticated", "Entre novamente no Comunica.");
  const companyId = id(data.companyId);
  if (auth.token.companyId !== companyId || auth.token.isDeveloper === true)
    throw new HttpsError(
      "permission-denied",
      "Selecione a empresa autorizada.",
    );
  const base = db.doc(
    `artifacts/comunica-salvador/public/data/companies/${companyId}`,
  );
  const uid = auth.uid;
  if (action === "createInvitation") {
    const token = randomBytes(32).toString("base64url");
    const tokenRef = db
      .collection("purchaseInvitationTokens")
      .doc(digest(token));
    const result = await db.runTransaction(async (tx) => {
      const { profile, policy } = await access(tx, base, uid);
      const ids = [
        ...new Set(
          (Array.isArray(data.requestIds) ? data.requestIds : []).map(id),
        ),
      ] as string[];
      if (!ids.length || ids.length > 10)
        throw new HttpsError("invalid-argument", "Selecione até 10 itens.");
      const supplier = await tx.get(
        base.collection("purchaseSuppliers").doc(id(data.supplierId)),
      );
      const docs = await Promise.all(
        ids.map((key) => tx.get(base.collection("purchaseRequests").doc(key))),
      );
      if (!supplier.exists)
        throw new HttpsError("not-found", "Fornecedor não cadastrado.");
      docs.forEach((p) => buyer(p, uid, policy));
      if (new Set(docs.map((p) => p.data()!.bundleId || p.id)).size !== 1)
        throw new HttpsError(
          "failed-precondition",
          "Selecione itens da mesma cotação.",
        );
      const expiresAt =
        Date.now() +
        Math.min(30, Math.max(1, Number(data.validDays) || 7)) * 86400000;
      const snapshots = Object.fromEntries(
        docs.map((p) => [
          p.id,
          {
            item: p.data()!.item,
            specification: p.data()!.specification,
            quantity: p.data()!.quantity,
            unit: p.data()!.unit,
          },
        ]),
      );
      tx.create(tokenRef, {
        companyId,
        requestIds: ids,
        supplierId: supplier.id,
        supplier: clean(supplier.data()!.name),
        expiresAt,
        createdBy: uid,
        createdAt: Date.now(),
        submittedAt: 0,
        revoked: false,
        items: snapshots,
        companyName: clean((await tx.get(base)).data()?.name),
      });
      for (const p of docs)
        tx.create(p.ref.collection("invitations").doc(tokenRef.id), {
          supplierId: supplier.id,
          supplier: clean(supplier.data()!.name),
          expiresAt,
          status: "pending",
          createdBy: uid,
          createdAt: Date.now(),
        });
      return {
        expiresAt,
        supplier: clean(supplier.data()!.name),
        buyer: clean(profile.name),
      };
    });
    return { ...result, token };
  }
  return db.runTransaction(async (tx) => {
    const { profile, policy } = await access(tx, base, uid);
    if (action === "saveProduct") {
      if (
        profile.isAdmin !== true &&
        policy.buyerIds?.length &&
        !policy.buyerIds.includes(uid)
      )
        throw new HttpsError(
          "permission-denied",
          "Sem permissão para cadastrar produtos.",
        );
      const product = {
        name: clean(data.name),
        code: clean(data.code, 80),
        specification: clean(data.specification, 1000),
        unit: clean(data.unit, 30),
        category: clean(data.category, 80),
        updatedAt: Date.now(),
        updatedBy: uid,
      };
      if (!product.name || !product.unit)
        throw new HttpsError("invalid-argument", "Informe produto e unidade.");
      const key = createHash("sha256")
        .update(
          normalizeSearch(product.code || `${product.name} ${product.unit}`),
        )
        .digest("hex")
        .slice(0, 32);
      tx.set(base.collection("purchaseProducts").doc(key), product);
      return { id: key };
    }
    const ref = base.collection("purchaseRequests").doc(id(data.requestId));
    const p = await tx.get(ref);
    if (!p.exists)
      throw new HttpsError("not-found", "Solicitação não encontrada.");
    const current = p.data()!;
    if (action === "confirmPayment") {
      if (current.financeId !== uid || current.status !== "delivered")
        throw new HttpsError(
          "permission-denied",
          "A conferência pertence ao financeiro designado.",
        );
      if (
        !current.procurement ||
        current.procurement.version !== Number(data.version)
      )
        throw new HttpsError(
          "failed-precondition",
          "A negociação mudou. Reabra o pedido.",
        );
      if (
        !checkPayment(
          current.procurement.offer.paymentPlan,
          data.payment || {},
          String(data.referenceDate || ""),
        )
      )
        throw new HttpsError(
          "failed-precondition",
          "Forma, parcelas, valores ou vencimentos divergentes. Registre a divergência e solicite correção.",
        );
      const now = tick(current);
      tx.update(ref, {
        paymentReview: {
          version: current.procurement.version,
          by: uid,
          at: now,
          referenceDate: clean(data.referenceDate, 10),
          payment: {method:data.payment.method, installments:data.payment.installments.map((p:Data)=>({amount:Number(p.amount),dueDate:String(p.dueDate)}))},
        },
        updatedAt: now,
        updatedBy: uid,
        history: event(
          current,
          uid,
          "Conferência do pagamento negociado registrada pelo financeiro.",
          now,
        ),
      });
      return { confirmed: true };
    }
    if (action === "revokeInvitation") {
      buyer(p, uid, policy);
      const hash = id(data.invitationId);
      const invite = await tx.get(
        db.collection("purchaseInvitationTokens").doc(hash),
      );
      if (
        !invite.exists ||
        invite.data()!.companyId !== companyId ||
        invite.data()!.createdBy !== uid ||
        !invite.data()!.requestIds.includes(p.id)
      )
        throw new HttpsError("permission-denied", "Convite não autorizado.");
      tx.update(invite.ref, { revoked: true });
      for (const key of invite.data()!.requestIds)
        tx.update(
          base
            .collection("purchaseRequests")
            .doc(key)
            .collection("invitations")
            .doc(hash),
          { status: "revoked" },
        );
      return { revoked: true };
    }
    buyer(p, uid, policy);
    if (action === "saveOffer") {
      const supplier = await tx.get(
        base.collection("purchaseSuppliers").doc(id(data.supplierId)),
      );
      if (!supplier.exists)
        throw new HttpsError(
          "not-found",
          "Selecione um fornecedor cadastrado.",
        );
      const offer = validateOffer(data.offer || {}, current.quantity);
      const offerRef = ref.collection("offers").doc(supplier.id);
      const before = await tx.get(offerRef);
      tx.set(offerRef, {
        ...offer,
        supplierId: supplier.id,
        supplier: clean(supplier.data()!.name),
        updatedAt: Math.max(
          Date.now(),
          Number(before.data()?.updatedAt || 0) + 1,
        ),
        updatedBy: uid,
        source: "buyer",
      });
      return { saved: true };
    }
    if (action === "awardOffer") {
      if (Number(data.expectedUpdatedAt) !== current.updatedAt)
        throw new HttpsError(
          "failed-precondition",
          "A solicitação mudou. Reabra a cotação.",
        );
      const offerDoc = await tx.get(
        ref.collection("offers").doc(id(data.offerId)),
      );
      const offers = await tx.get(ref.collection("offers"));
      if (
        !offerDoc.exists ||
        Number(data.offerUpdatedAt) !== offerDoc.data()!.updatedAt
      )
        throw new HttpsError(
          "failed-precondition",
          "A proposta mudou. Revise os preços.",
        );
      const selected = validateOffer(offerDoc.data(), current.quantity);
      if (!selected.available || selected.availableQuantity < current.quantity)
        throw new HttpsError(
          "failed-precondition",
          "O fornecedor não atende toda a quantidade deste item.",
        );
      const comparable = offers.docs.filter(
        (d) =>
          d.data().available &&
          d.data().availableQuantity >= current.quantity &&
          !d.data().alternative,
      );
      const min = Math.min(
        ...comparable.map((d) => Number(d.data().totalCents)),
      );
      const reason = clean(data.reason, 1000);
      if (
        (selected.totalCents > min || selected.alternative) &&
        reason.length < 5
      )
        throw new HttpsError(
          "invalid-argument",
          "Justifique a escolha com custo maior ou produto alternativo.",
        );
      // Freeze the commercial agreement; later proposal edits cannot change the awarded order.
      const procurement = {
        version: tick(current),
        offerId: offerDoc.id,
        offer: { ...offerDoc.data(), ...selected },
        reason,
        awardedBy: uid,
        awardedAt: Date.now(),
      };
      const group = current.bundleId
        ? await tx.get(
            base
              .collection("purchaseRequests")
              .where("bundleId", "==", current.bundleId),
          )
        : null;
      if (
        group?.docs.some(
          (d) =>
            d.data().approvedAt ||
            !["requested", "quotation"].includes(d.data().status),
        )
      )
        throw new HttpsError("failed-precondition", "A cotação já avançou.");
      const cost = selected.totalCents / 100;
      const total = group
        ? group.docs.reduce(
            (sum, d) =>
              sum +
              (d.id === p.id
                ? cost
                : Number(d.data().quotedPrice || 0) *
                  Number(d.data().quantity)),
            0,
          )
        : cost;
      const now = tick(current);
      tx.update(ref, {
        orderNumber:
          current.orderNumber ||
          `PC-${clean(current.quoteNumber || p.id, 80)}`.slice(0, 80),
        supplier: offerDoc.data()!.supplier,
        quotedPrice: cost / current.quantity,
        expectedDate: selected.expectedDate,
        quoteTotal: Math.round(total * 100) / 100,
        status: "quotation",
        procurement,
        updatedAt: now,
        updatedBy: uid,
        history: [
          ...(current.history || []),
          {
            stage: "quotation",
            by: uid,
            at: now,
            detail: `Proposta escolhida: ${offerDoc.data()!.supplier}. Custo total R$ ${cost.toFixed(2)}. ${reason}`,
          },
        ].slice(-50),
      });
      for (const other of group?.docs || [])
        if (other.id !== p.id && Number(other.data().quotedPrice) > 0)
          tx.update(other.ref, {
            quoteTotal: Math.round(total * 100) / 100,
            updatedAt: tick(other.data()),
            updatedBy: uid,
          });
      return { awarded: true };
    }
    throw new HttpsError("invalid-argument", "Operação não reconhecida.");
  });
}
async function access(
  tx: Transaction,
  base: FirebaseFirestore.DocumentReference,
  uid: string,
) {
  const [company, profile, enabled, policy] = await Promise.all([
    tx.get(base),
    tx.get(base.collection("users").doc(uid)),
    tx.get(base.collection("settings").doc("integra-access")),
    tx.get(base.collection("settings").doc("purchase-approval")),
  ]);
  if (
    !company.exists ||
    company.data()?.codeBlocked ||
    !profile.exists ||
    enabled.data()?.enabled !== true
  )
    throw new HttpsError(
      "permission-denied",
      "Sem acesso à gestão de compras.",
    );
  return { profile: profile.data()!, policy: policy.data() || {} };
}
function buyer(p: DocumentSnapshot, uid: string, policy: Data) {
  if (
    !p.exists ||
    p.data()!.buyerId !== uid ||
    !editable(p.data()!) ||
    (policy.buyerIds?.length && !policy.buyerIds.includes(uid))
  )
    throw new HttpsError(
      "permission-denied",
      "Somente o comprador designado pode alterar uma cotação em aberto.",
    );
}
async function publicInvitation(db: Firestore, data: Data, action: string) {
  const token = String(data.token || "");
  if (!/^[a-zA-Z0-9_-]{43}$/.test(token))
    throw new HttpsError("not-found", "Link inválido ou encerrado.");
  return db.runTransaction(async (tx) => {
    const link = await tx.get(
      db.collection("purchaseInvitationTokens").doc(digest(token)),
    );
    const v = link.data();
    if (!v || v.revoked || v.expiresAt < Date.now())
      throw new HttpsError("not-found", "Link inválido ou encerrado.");
    const base = db.doc(
      `artifacts/comunica-salvador/public/data/companies/${v.companyId}`,
    );
    const company = await tx.get(base);
    const [enabled, creator, policy] = await Promise.all([
      tx.get(base.collection("settings").doc("integra-access")),
      tx.get(base.collection("users").doc(v.createdBy)),
      tx.get(base.collection("settings").doc("purchase-approval")),
    ]);
    if (
      !company.exists ||
      company.data()?.codeBlocked || !creator.exists ||
      (policy.data()?.buyerIds?.length && !policy.data()!.buyerIds.includes(v.createdBy)) ||
      enabled.data()?.enabled !== true
    )
      throw new HttpsError("not-found", "Cotação indisponível.");
    const docs = await Promise.all(
      v.requestIds.map((key: string) =>
        tx.get(base.collection("purchaseRequests").doc(key)),
      ),
    );
    if (
      docs.some(
        (p: DocumentSnapshot) =>
          !p.exists ||
          !editable(p.data()!) ||
          p.data()!.buyerId !== v.createdBy ||
          ["item", "specification", "quantity", "unit"].some(
            (k) => p.data()![k] !== v.items[p.id][k],
          ),
      )
    )
      throw new HttpsError(
        "failed-precondition",
        "A cotação foi alterada ou encerrada. Solicite um novo link.",
      );
    if (action === "readInvitation")
      return {
        companyName: v.companyName,
        supplier: v.supplier,
        expiresAt: v.expiresAt,
        submitted: Boolean(v.submittedAt),
        items: Object.entries(v.items).map(([key, value]) => ({
          id: key,
          ...(value as Data),
        })),
      };
    if (v.submittedAt) return { submitted: true }; // A retry never duplicates the response.
    if (!data.offers || Object.keys(data.offers).length !== docs.length)
      throw new HttpsError(
        "invalid-argument",
        "Responda a todos os itens, indicando indisponibilidade quando necessário.",
      );
    const offers = docs.map((p: DocumentSnapshot) =>
      validateOffer(data.offers[p.id] || {}, p.data()!.quantity),
    );
    const old = await Promise.all(
      docs.map((p: DocumentSnapshot) =>
        tx.get(p.ref.collection("offers").doc(v.supplierId)),
      ),
    );
    const now = Date.now();
    docs.forEach((p: DocumentSnapshot, index: number) => {
      tx.set(p.ref.collection("offers").doc(v.supplierId), {
        ...offers[index],
        supplierId: v.supplierId,
        supplier: v.supplier,
        updatedAt: Math.max(now, Number(old[index].data()?.updatedAt || 0) + 1),
        source: "supplier",
        invitationId: link.id,
      });
      tx.update(p.ref.collection("invitations").doc(link.id), {
        status: "responded",
        respondedAt: now,
      });
    });
    tx.update(link.ref, { submittedAt: now });
    return { submitted: true };
  });
}
