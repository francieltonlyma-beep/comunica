import {createHash} from 'node:crypto';
import {DocumentReference, FieldPath, FieldValue, Firestore} from 'firebase-admin/firestore';
import {HttpsError} from 'firebase-functions/v2/https';
import {SUPPORT_UID} from './platformSupport';

const APP_ID = 'comunica-salvador';
const RECOVERY_MS = 7 * 24 * 60 * 60 * 1000;
const collections = new Set([
  'announcements', 'posts', 'departments', 'roles', 'events', 'activities',
  'activityTemplates', 'purchaseProducts',
]);
const idPattern = /^(?!__.*__$)[a-zA-Z0-9_-]{1,250}$/;

function parseFields(value: unknown): Record<string, unknown> {
  if (typeof value !== 'string' || Buffer.byteLength(value) > 200_000) {
    throw new HttpsError('invalid-argument', 'Informe os campos em JSON com até 200 KB.');
  }
  try {
    const fields = JSON.parse(value, (key, item: unknown) => {
      if (/^__.*__$/.test(key) || key === 'constructor' || key === 'prototype') throw new Error();
      if (typeof item === 'number' && !Number.isFinite(item)) throw new Error();
      return item;
    });
    if (fields && typeof fields === 'object' && !Array.isArray(fields) && Object.keys(fields).length) {
      return fields;
    }
  } catch {
    throw new HttpsError('invalid-argument', 'Verifique os campos e a sintaxe do JSON.');
  }
  throw new HttpsError('invalid-argument', 'Informe um objeto JSON com pelo menos um campo.');
}

export async function maintainPlatformRecord(
  db: Firestore,
  auth: {uid: string; token: Record<string, unknown>} | undefined,
  input: Record<string, unknown>,
) {
  if (auth?.uid !== SUPPORT_UID || auth.token.isDeveloper !== true) {
    throw new HttpsError('permission-denied', 'Operação disponível somente para o suporte.');
  }
  const {companyId, collection, recordId, action, revision, version} = input;
  if (typeof companyId !== 'string' || !idPattern.test(companyId) ||
      typeof collection !== 'string' || !collections.has(collection) ||
      typeof recordId !== 'string' || !idPattern.test(recordId) ||
      typeof action !== 'string' || !['list', 'read', 'create', 'update', 'delete', 'restore'].includes(action)) {
    throw new HttpsError('invalid-argument', 'Selecione a empresa, o tipo e o ID do registro.');
  }

  const company = db.doc(`artifacts/${APP_ID}/public/data/companies/${companyId}`);
  const records = company.collection(collection);
  const record = records.doc(recordId);
  const key = createHash('sha256').update(record.path).digest('hex');
  const history = db.collection(`_platformRecordHistory/${key}/revisions`);
  const recent = history.orderBy('recordedAt', 'desc').limit(15);
  const access = db.doc(`_platformSupport/${SUPPORT_UID}`);
  const change = history.doc();
  const fields = action === 'create' || action === 'update' ? parseFields(input.fields) : null;
  const reason = typeof input.reason === 'string' ? input.reason.trim() : '';

  return db.runTransaction(async tx => {
    const [accessSnapshot, companySnapshot] = await tx.getAll(access, company);
    if (accessSnapshot.get('enabled') !== true || accessSnapshot.get('appId') !== APP_ID) {
      throw new HttpsError('permission-denied', 'Acesso de suporte desativado.');
    }
    if (!companySnapshot.exists) throw new HttpsError('not-found', 'Empresa não encontrada.');

    if (action === 'list') {
      const found = await tx.get(records.limit(50));
      return {records: found.docs.map(item => {
        const title = item.get('title') ?? item.get('name') ?? item.get('description');
        return {id: item.id, title: typeof title === 'string' ? title.slice(0, 100) : ''};
      })};
    }

    const current = await tx.get(record);
    const currentVersion = current.updateTime ?
      `${current.updateTime.seconds}:${current.updateTime.nanoseconds}` : '';
    const entries = await tx.get(recent);
    const latest = entries.docs[0];
    const now = Date.now();
    const canRestore = Boolean(latest && latest.get('expiresAt') > now &&
      (latest.get('existsAfter') ? current.updateTime?.isEqual(latest.createTime!) : !current.exists));

    if (action === 'read') {
      return {
        version: currentVersion,
        exists: current.exists,
        data: JSON.stringify(current.data() ?? {}, (_key, value) =>
          value instanceof DocumentReference ? value.path : value, 2),
        history: entries.docs.map(entry => ({
          id: entry.id,
          action: entry.get('action'),
          reason: entry.get('reason'),
          actor: entry.get('actor'),
          recordedAt: entry.get('recordedAt').toMillis(),
          expiresAt: entry.get('expiresAt'),
          canRestore: entry.id === latest?.id && canRestore,
        })),
      };
    }

    if (!reason || reason.length > 300) {
      throw new HttpsError('invalid-argument', 'Informe o motivo com até 300 caracteres.');
    }
    if (version !== currentVersion || revision !== (latest?.id ?? '')) {
      throw new HttpsError('aborted', 'O registro mudou. Consulte novamente antes de continuar.');
    }
    if (action === 'create' ? current.exists : !current.exists && action !== 'restore') {
      throw new HttpsError('failed-precondition', 'A ação escolhida não corresponde ao estado do registro.');
    }

    let previous: FirebaseFirestore.DocumentData | undefined;
    if (action === 'restore') {
      if (!latest || !canRestore) {
        throw new HttpsError('failed-precondition', 'A versão anterior expirou ou o registro mudou.');
      }
      const snapshot = await tx.get(latest.ref.collection('copy').doc('before'));
      if (latest.get('existedBefore') && !snapshot.exists) {
        throw new HttpsError('failed-precondition', 'A cópia anterior está indisponível.');
      }
      previous = snapshot.data();
    }

    const existsAfter = action !== 'delete' && (action !== 'restore' || Boolean(previous));
    if (current.exists) tx.create(change.collection('copy').doc('before'), current.data()!);
    tx.create(change, {
      path: record.path,
      action,
      actor: auth.uid,
      reason,
      existedBefore: current.exists,
      existsAfter,
      recordedAt: FieldValue.serverTimestamp(),
      expiresAt: now + RECOVERY_MS,
      restoredRevision: action === 'restore' ? latest?.id : null,
    });

    if (!existsAfter) tx.delete(record);
    else if (action === 'restore') tx.set(record, previous!);
    else if (action === 'create') tx.create(record, fields!);
    else tx.set(record, fields!, {mergeFields: Object.keys(fields!).map(field => new FieldPath(field))});

    return {ok: true};
  });
}
