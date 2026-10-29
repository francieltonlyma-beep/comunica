// Firestore removed the write-count limit for Commit/transactions in March 2023.
// The 10 MiB API request limit still applies. Leave room for document paths,
// serialization, preconditions and deleted records instead of limiting headcount.
// https://cloud.google.com/firestore/docs/release-notes#March_29_2023
export const SCHEDULE_PUBLICATION_BUDGET_BYTES = 6 * 1024 * 1024;

export function assertSchedulePublicationSize(records, replaced = []) {
  const encode = new TextEncoder();
  const bytes = encode.encode(JSON.stringify(records)).byteLength
    + encode.encode(JSON.stringify(replaced)).byteLength
    + records.length * 1024;
  if (bytes > SCHEDULE_PUBLICATION_BUDGET_BYTES) {
    throw Object.assign(new Error('Esta publicação contém um volume de dados muito grande. Salve o rascunho e publique por setor ou por um período menor; nenhuma alteração foi salva.'), { code: 'schedule-publication-size' });
  }
  return bytes;
}
