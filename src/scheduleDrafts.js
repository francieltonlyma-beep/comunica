export const SCHEDULE_DRAFT_INTERVAL = 5 * 60 * 1000;
const CHUNK_SIZE = 180000;

export function startScheduleDraftAutosave(readState, save, clock = globalThis) {
  const timer = clock.setInterval(() => {
    const state = readState();
    if (state?.enabled && state.dirty && !state.busy) void save();
  }, SCHEDULE_DRAFT_INTERVAL);
  return () => clock.clearInterval(timer);
}

export async function scheduleDraftHash(value) {
  const bytes = new TextEncoder().encode(value);
  const result = new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', bytes));
  return Array.from(result, byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function packScheduleDraft(snapshot) {
  const { proposalInput = '', ...content } = snapshot;
  const text = JSON.stringify({ ...content, schemaVersion: 1, inputHash: await scheduleDraftHash(proposalInput) });
  let payload = text, encoding = 'json';
  if (typeof CompressionStream !== 'undefined') {
    const bytes = new Uint8Array(await new Response(new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 8192) binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
    payload = btoa(binary); encoding = 'gzip-base64';
  }
  const parts = [];
  for (let offset = 0; offset < payload.length; offset += CHUNK_SIZE) parts.push(payload.slice(offset, offset + CHUNK_SIZE));
  if (!parts.length || parts.length > 100) throw new Error('Este rascunho é muito grande. Reduza o período ou a equipe.');
  return { parts, encoding };
}

export async function unpackScheduleDraft(metadata, parts) {
  if (parts.length !== metadata.partCount || parts.some(part => typeof part?.payload !== 'string' || part.revision !== metadata.revision)) throw new Error('Rascunho incompleto. Atualize a lista e tente novamente.');
  let text = parts.map(part => part.payload).join('');
  if (metadata.encoding === 'gzip-base64') {
    if (typeof DecompressionStream === 'undefined') throw new Error('Atualize o navegador para reabrir este rascunho.');
    const bytes = Uint8Array.from(atob(text), character => character.charCodeAt(0));
    text = await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
  } else if (metadata.encoding !== 'json') throw new Error('Formato de rascunho não reconhecido.');
  const result = JSON.parse(text);
  if (result.schemaVersion !== 1 || !Array.isArray(result.rows) || !Array.isArray(result.bulk?.userIds)) throw new Error('Conteúdo do rascunho inválido.');
  return result;
}

export function validateScheduleDraftScope(snapshot, scope) {
  const allowed = new Set(scope.employeeIds.map(String));
  if (snapshot.bulk.userIds.some(id => !allowed.has(String(id))) || snapshot.rows.some(row => !allowed.has(String(row.userId)) || (!scope.allDepartments && !scope.departmentIds.includes(String(row.dept))))) throw new Error('Este rascunho contém colaboradores ou setores fora do seu acesso atual.');
  if (!snapshot.rows.length && (!snapshot.bulk.startDate || !snapshot.bulk.endDate)) return;
  const first = Date.parse(`${snapshot.bulk.startDate}T00:00:00Z`), last = Date.parse(`${snapshot.bulk.endDate}T00:00:00Z`);
  if (!Number.isFinite(first) || !Number.isFinite(last) || last < first || last - first >= 31 * 86400000 || snapshot.rows.some(row => row.date < snapshot.bulk.startDate || row.date > snapshot.bulk.endDate)) throw new Error('O período do rascunho é inválido ou ultrapassa 31 dias.');
}

// Metadata is listed separately; the private payload is split below Firestore's
// document limit. A revision check prevents autosave overwriting another session.
export function createScheduleDraftStore(api, { appId, companyId, ownerId }) {
  const { db, collection, doc, getDoc, getDocs, runTransaction } = api;
  const root = collection(db, 'artifacts', appId, 'public', 'data', 'companies', companyId, 'users', ownerId, 'scheduleDrafts');
  return {
    async list() {
      const snapshot = await getDocs(root);
      return snapshot.docs.map(item => ({ id: item.id, ...item.data() })).sort((a, b) => b.updatedAt - a.updatedAt);
    },
    async load(id) {
      const reference = doc(root, id), header = await getDoc(reference);
      if (!header.exists()) throw new Error('Rascunho não encontrado.');
      const metadata = header.data();
      if (!Number.isInteger(metadata.partCount) || metadata.partCount < 1 || metadata.partCount > 100) throw new Error('Rascunho incompleto.');
      const parts = await Promise.all(Array.from({ length: metadata.partCount }, (_, index) => getDoc(doc(reference, 'parts', `${metadata.revision}-${index}`))));
      if (parts.some(part => !part.exists())) throw new Error('Rascunho incompleto. Atualize a lista.');
      return { metadata, snapshot: await unpackScheduleDraft(metadata, parts.map(part => part.data())) };
    },
    async save(id, expectedRevision, snapshot, departmentIds) {
      const packed = await packScheduleDraft(snapshot);
      const revision = globalThis.crypto.randomUUID(), updatedAt = Date.now();
      const metadata = { revision, updatedAt, startDate: snapshot.bulk.startDate, endDate: snapshot.bulk.endDate, partCount: packed.parts.length, encoding: packed.encoding, departmentIds: [...new Set(departmentIds.filter(Boolean).map(String))] };
      const reference = doc(root, id);
      await runTransaction(db, async transaction => {
        const previous = await transaction.get(reference);
        const old = previous.exists() ? previous.data() : null;
        if ((old?.revision || null) !== expectedRevision) throw new Error('Este rascunho foi salvo em outra sessão. Reabra-o ou salve uma nova cópia.');
        transaction.set(reference, metadata);
        packed.parts.forEach((payload, index) => transaction.set(doc(reference, 'parts', `${revision}-${index}`), { revision, payload }));
        if (old) for (let index = 0; index < old.partCount; index++) transaction.delete(doc(reference, 'parts', `${old.revision}-${index}`));
      });
      return metadata;
    },
  };
}
