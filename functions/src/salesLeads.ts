import {createHash, randomUUID} from 'node:crypto';
import {FieldValue, Firestore} from 'firebase-admin/firestore';
import {HttpsError} from 'firebase-functions/v2/https';

const APP_ID = 'comunica-salvador';
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT = 3;

const digits = (value: unknown) => String(value || '').replace(/\D/g, '');
const clean = (value: unknown, length: number) => String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, length);

export const isValidCnpj = (value: unknown) => {
  const cnpj = digits(value);
  if (!/^\d{14}$/.test(cnpj) || /^(\d)\1{13}$/.test(cnpj)) return false;
  const check = (size: number) => {
    const weights = size === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const total = cnpj.slice(0, size).split('').reduce((sum, digit, index) => sum + Number(digit) * weights[index], 0);
    const remainder = total % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  return check(12) === Number(cnpj[12]) && check(13) === Number(cnpj[13]);
};

export async function submitSalesLead(database: Firestore, input: Record<string, unknown>, ip = '') {
  // Campo invisível preenchido apenas por robôs. Responde sem armazenar dados.
  if (clean(input.website, 200)) return {accepted: true};
  const companyName = clean(input.companyName, 160);
  const contactName = clean(input.contactName, 120);
  const cnpj = digits(input.cnpj);
  const phone = digits(input.phone);
  const email = clean(input.email, 200).toLocaleLowerCase('pt-BR');
  const interest = clean(input.interest, 120);
  const message = clean(input.message, 1200);
  if (companyName.length < 2 || !isValidCnpj(cnpj) || phone.length < 10 || phone.length > 13 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    throw new HttpsError('invalid-argument', 'Confira empresa, CNPJ, telefone e e-mail.');
  }

  const now = Date.now();
  const rateKey = createHash('sha256').update(`${String(ip || 'unknown').slice(0, 120)}|${email}`).digest('hex');
  const rateRef = database.doc(`_platformSalesRateLimits/${rateKey}`);
  await database.runTransaction(async transaction => {
    const snapshot = await transaction.get(rateRef);
    const previous = snapshot.data() || {};
    const windowStart = Number(previous.windowStart || 0);
    const count = windowStart > now - RATE_WINDOW_MS ? Number(previous.count || 0) : 0;
    if (count >= RATE_LIMIT) throw new HttpsError('resource-exhausted', 'Recebemos seus dados. Aguarde antes de enviar novamente.');
    transaction.set(rateRef, {windowStart: count ? windowStart : now, count: count + 1, expiresAt: now + RATE_WINDOW_MS}, {merge: true});
  });

  const leadId = `lead-${randomUUID()}`;
  await database.doc(`_platformSalesLeads/${leadId}`).set({
    id: leadId,
    appId: APP_ID,
    companyName,
    contactName,
    cnpj,
    phone,
    email,
    interest,
    message,
    source: 'login',
    status: 'new',
    createdAt: now,
    serverCreatedAt: FieldValue.serverTimestamp(),
  });
  return {accepted: true, leadId};
}
